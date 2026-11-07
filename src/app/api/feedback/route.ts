import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

// nodemailer 需要 Node 运行时，禁用 edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 诊断：线上是否读到 MAIL_* 环境变量（只返回有无，不返回值）。GET /api/feedback 查看 */
export async function GET() {
  const status = {
    MAIL_HOST: Boolean(process.env.MAIL_HOST),
    MAIL_PORT: Boolean(process.env.MAIL_PORT),
    MAIL_USER: Boolean(process.env.MAIL_USER),
    MAIL_PASS: Boolean(process.env.MAIL_PASS),
    MAIL_TO: Boolean(process.env.MAIL_TO),
  };
  return Response.json({
    configured: status.MAIL_HOST && status.MAIL_USER && status.MAIL_PASS,
    status,
  });
}

/** 简单内存限流：同一 IP 每 60 秒最多 2 条（重启清零，个人项目够用） */
const rateMap = new Map<string, number[]>();
const RATE_WINDOW = 60_000;
const RATE_MAX = 2;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (rateMap.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW);
  if (arr.length >= RATE_MAX) {
    rateMap.set(ip, arr);
    return true;
  }
  arr.push(now);
  rateMap.set(ip, arr);
  return false;
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  return (xff.split(',')[0] || '').trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  let body: { content?: string; contact?: string; website?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 });
  }

  // honeypot：正常用户看不到这个字段，只有机器人会填 → 静默当作成功，不发送
  if (body.website && body.website.trim()) {
    return Response.json({ ok: true });
  }

  const content = (body.content ?? '').trim();
  const contact = (body.contact ?? '').trim().slice(0, 200);

  if (!content) {
    return Response.json({ error: '请填写反馈内容' }, { status: 400 });
  }
  if (content.length > 2000) {
    return Response.json({ error: '内容太长了，请精简到 2000 字以内' }, { status: 400 });
  }

  // SMTP 配置缺失 → 明确告知，避免前端干等
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const to = process.env.MAIL_TO || user;
  if (!host || !user || !pass || !to) {
    return Response.json({ error: '反馈通道尚未配置，暂时无法发送' }, { status: 503 });
  }

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return Response.json({ error: '提交太频繁了，请稍后再试' }, { status: 429 });
  }

  const port = Number(process.env.MAIL_PORT) || 465;
  const secure = (process.env.MAIL_SECURE ?? 'true') !== 'false';

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    await transporter.sendMail({
      from: `"LYJY导航 留言反馈" <${user}>`,
      to,
      replyTo: isEmail ? contact : undefined,
      subject: `[LYJY反馈] ${content.slice(0, 24)}`,
      text:
        `时间：${time}\n` +
        `IP：${ip}\n` +
        `联系方式：${contact || '（未留）'}\n\n` +
        `—— 反馈内容 ——\n${content}\n`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('feedback mail error:', err);
    return Response.json({ error: '发送失败，请稍后重试' }, { status: 500 });
  }
}

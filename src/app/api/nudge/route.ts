import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

// nodemailer 需要 Node 运行时，禁用 edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 每 IP 只能催更一次（内存去重，重启清零；前端另有 localStorage 兜底） */
const nudgedIps = new Set<string>();

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  return (xff.split(',')[0] || '').trim() || 'unknown';
}

/** 诊断：邮件通道是否已配置（不发送任何邮件） */
export async function GET() {
  const configured = Boolean(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS);
  return Response.json({ configured });
}

export async function POST(request: NextRequest) {
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const to = process.env.MAIL_TO || user;
  if (!host || !user || !pass || !to) {
    return Response.json({ error: '催更通道尚未配置，暂时无法发送' }, { status: 503 });
  }

  const ip = clientIp(request);
  // 已经催过 → 幂等返回成功，不再重复发信
  if (nudgedIps.has(ip)) {
    return Response.json({ ok: true, already: true });
  }
  // 先占位，避免并发请求重复发信
  nudgedIps.add(ip);

  const port = Number(process.env.MAIL_PORT) || 465;
  const secure = (process.env.MAIL_SECURE ?? 'true') !== 'false';

  try {
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    await transporter.sendMail({
      from: `"LYJY导航 催更" <${user}>`,
      to,
      subject: '[LYJY催更] 有人点了「催更 V7.0」',
      text:
        `时间：${time}\n` +
        `IP：${ip}\n\n` +
        `有用户在导航首页「下一代更新预告」弹窗里点了一次「催更」，期待 V7.0 早日上线。\n`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('nudge mail error:', err);
    // 发送失败则释放占位，允许用户重试
    nudgedIps.delete(ip);
    return Response.json({ error: '发送失败，请稍后重试' }, { status: 500 });
  }
}

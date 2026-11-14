import { NextRequest } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 2025-08-04 起的第 730 天；本地可用 CAPSULE_UNLOCK_AT 覆盖，方便验证「到期」效果 */
const UNLOCK_AT = process.env.CAPSULE_UNLOCK_AT?.trim() || '2027-08-04';
const MAX_LEN = 20000;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 未配置');
  return neon(url);
}

/** 用户名就是取信凭证：2–20 位，中英文 / 数字 / 下划线 / 短横线 */
function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  if (name.length < 2 || name.length > 20) return null;
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/.test(name)) return null;
  return name;
}

function shanghaiToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

/** 把数据库里的 DATE 统一成 YYYY-MM-DD（按东八区） */
function toDateString(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

/** 两个 YYYY-MM-DD 之间差几天（只看日期，不掺具体时刻） */
function daysBetween(from: string, to: string) {
  const a = new Date(`${from}T00:00:00+08:00`).getTime();
  const b = new Date(`${to}T00:00:00+08:00`).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}


/** 查信：到期前只告诉「有没有、还有几天」，绝不返回正文 */
export async function GET(request: NextRequest) {
  const username = normalizeUsername(request.nextUrl.searchParams.get('username'));
  if (!username) {
    return Response.json({ error: '用户名需 2–20 位，只支持中英文、数字、下划线和短横线' }, { status: 400 });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT username, content, unlock_at, created_at, updated_at
      FROM anniversary_capsules
      WHERE username = ${username}
      LIMIT 1
    `;

    if (!rows.length) return Response.json({ exists: false });

    // 每封信按自己写入时的 unlock_at 判断，不再用全局常量
    const rowUnlock = toDateString(rows[0].unlock_at) ?? UNLOCK_AT;
    const today = shanghaiToday();
    const unlocked = today >= rowUnlock;
    return Response.json({
      exists: true,
      unlocked,
      unlockAt: rowUnlock,
      daysLeft: daysBetween(today, rowUnlock),
      createdAt: rows[0].created_at,
      ...(unlocked ? { content: rows[0].content as string } : {}),
    });
  } catch (err) {
    console.error('capsule GET error:', err);
    return Response.json({ error: '读取失败，请稍后再试' }, { status: 500 });
  }
}

/** 存信：同一个用户名重复提交就是覆盖（未到期前可以改） */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 });
  }

  const { username: rawName, content } = (body ?? {}) as { username?: unknown; content?: unknown };
  const username = normalizeUsername(rawName);
  if (!username) {
    return Response.json({ error: '用户名需 2–20 位，只支持中英文、数字、下划线和短横线' }, { status: 400 });
  }
  if (typeof content !== 'string' || !content.trim()) {
    return Response.json({ error: '信不能是空的' }, { status: 400 });
  }
  if (content.length > MAX_LEN) {
    return Response.json({ error: `最多 ${MAX_LEN} 字` }, { status: 400 });
  }

  try {
    const sql = getSql();
    await sql`
      INSERT INTO anniversary_capsules (username, content, unlock_at, updated_at)
      VALUES (${username}, ${content}, ${UNLOCK_AT}, NOW())
      ON CONFLICT (username) DO UPDATE
        SET content = EXCLUDED.content, updated_at = NOW()
    `;
    return Response.json({ ok: true, username, unlockAt: UNLOCK_AT, daysLeft: daysBetween(shanghaiToday(), UNLOCK_AT) });
  } catch (err) {
    console.error('capsule POST error:', err);
    return Response.json({ error: '保存失败，请稍后再试' }, { status: 500 });
  }
}

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * 作业系统鉴权（双头兼容）。
 *
 * - 原版 /homework 继续只发 `X-User-Id`，这里保持原行为，一个字都不改。
 * - Pro 版登录后拿到 `homeworkToken`，改用 `Authorization: Bearer`，服务端验签取 uid，
 *   从此无法靠改一个数字伪造别人身份。
 * - 两种头并存，所以新旧两版可以共用同一套 API 与同一份数据。
 */

const TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 天

function secret(): string | null {
  // 生产应显式配置 HOMEWORK_TOKEN_SECRET；未配置时退回服务端已有的 DATABASE_URL，
  // 它同样是永不发给客户端的机密，保证开箱可用且不会出现「无 token」的降级窗口。
  return process.env.HOMEWORK_TOKEN_SECRET || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || null;
}

/** 原版行为：从 X-User-Id 读取 uid（保留给 5 个旧路由，语义不变） */
export function getUserIdFromHeader(request: NextRequest): number | null {
  const raw = request.headers.get('X-User-Id');
  if (!raw) return null;
  const uid = parseInt(raw, 10);
  return Number.isFinite(uid) && uid > 0 ? uid : null;
}

/** 签发 Pro token。没有可用密钥时返回空串，前端会回退到 X-User-Id。 */
export function signHomeworkToken(userId: number, ttlSec = TOKEN_TTL_SEC): string {
  const key = secret();
  if (!key) return '';
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${userId}.${exp}`;
  const sig = createHmac('sha256', key).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): number | null {
  const key = secret();
  if (!key) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [uidStr, expStr, sig] = parts;
  const uid = parseInt(uidStr, 10);
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(uid) || uid <= 0 || !Number.isFinite(exp)) return null;
  if (exp * 1000 <= Date.now()) return null;

  const expected = createHmac('sha256', key).update(`${uidStr}.${expStr}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return uid;
}

/**
 * 通用校验：优先验 Bearer，失败则回退 X-User-Id（原版兼容）。
 * 用于现有 API，包括 grade / ocr —— 至少挡住未带任何身份的匿名刷 Key。
 */
export function requireHomeworkUser(request: NextRequest): number | null {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) {
    const uid = verifyToken(auth.slice(7).trim());
    // 带了 Bearer 但验签失败：不回退，避免「伪造 token + 真 X-User-Id」绕过
    return uid;
  }
  return getUserIdFromHeader(request);
}

/**
 * Pro 专用：**只接受验签通过的 Bearer**。
 * /api/homework/pro/** 一律走这里，彻底消除 Pro 侧 IDOR。
 */
export function requireProUser(request: NextRequest): number | null {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7).trim());
}

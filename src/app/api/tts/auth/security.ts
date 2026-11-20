import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// 登录安全工具：加盐 SHA-256 密码存储 + 旧明文兼容 + 内存级失败速率限制。
// 不依赖数据库表结构变更：users.password 为 TEXT，可直接存 "sha256$salt$hex"。

const PREFIX = 'sha256$';
const HASH_RE = /^[0-9a-f]{64}$/;

/** 生成带随机 salt 的密码哈希：sha256$salt$hex */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const digest = createHash('sha256').update(salt + password, 'utf8').digest('hex');
  return `${PREFIX}${salt}$${digest}`;
}

/** 恒定时间字符串比较：先各自 SHA-256 成定长摘要，避免长度与逐字符比较的时序泄漏。 */
function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}

export interface VerifyResult {
  ok: boolean;
  needsUpgrade: boolean; // 旧明文账号首次成功登录，需要静默升级
}

export function verifyPassword(stored: unknown, password: string): VerifyResult {
  if (typeof stored !== 'string') return { ok: false, needsUpgrade: false };

  if (stored.startsWith(PREFIX)) {
    const parts = stored.split('$');
    // 格式: sha256 / salt / hex —— 盐和摘要都有效时才按哈希校验
    if (parts.length === 3 && parts[1] && HASH_RE.test(parts[2])) {
      const expected = createHash('sha256').update(parts[1] + password, 'utf8').digest('hex');
      return { ok: constantTimeEqual(expected, parts[2]), needsUpgrade: false };
    }
    // 格式损坏的历史数据：回退为明文比较，避免把用户锁死
  }

  const ok = constantTimeEqual(stored, password);
  return { ok, needsUpgrade: ok };
}

// ---------------- 内存级速率限制 ----------------

interface AttemptState {
  count: number;
  first: number;
  blockedUntil: number;
}

const WINDOW_MS = 15 * 60 * 1000; // 15 分钟窗口
const MAX_FAILURES = 10;          // 窗口内失败 10 次
const BLOCK_MS = 60 * 1000;       // 短暂拒绝 60 秒

const attempts = new Map<string, AttemptState>();

export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return ip.slice(0, 128); // 避免异常长的 header 作为键
}

export function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  // 偶发大量不同 IP 时避免 Map 无限增长
  if (attempts.size > 1000) {
    for (const [k, v] of attempts) {
      if (now - v.first > WINDOW_MS && v.blockedUntil <= now) attempts.delete(k);
    }
  }
  const state = attempts.get(key);
  if (!state) return { allowed: true, retryAfter: 0 };
  if (state.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((state.blockedUntil - now) / 1000) };
  }
  if (now - state.first > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true, retryAfter: 0 };
  }
  return { allowed: true, retryAfter: 0 };
}

export function recordFailure(key: string): void {
  const now = Date.now();
  let state = attempts.get(key);
  if (!state || now - state.first > WINDOW_MS || state.blockedUntil <= now) {
    state = { count: 0, first: now, blockedUntil: 0 };
  }
  state.count += 1;
  if (state.count >= MAX_FAILURES) {
    // 触发短暂封禁后清空计数：窗口内正常操作不会长时间卡住
    state.blockedUntil = now + BLOCK_MS;
    state.count = 0;
    state.first = now;
  }
  attempts.set(key, state);
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}

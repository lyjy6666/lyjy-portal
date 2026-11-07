import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

const PREFIX = 'scrypt$';
const KEY_LEN = 64;

/** 是否为新格式哈希 */
export function isHashed(stored: string): boolean {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const hash = (await scrypt(password, salt, KEY_LEN)).toString('base64url');
  return `${PREFIX}${salt}$${hash}`;
}

/**
 * 兼容两种存储：新哈希走 scrypt 常量时间比对，旧明文直接比对。
 * 登录成功且发现是明文时，由 login 路由透明升级为哈希，老用户无感、原版零改动。
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!isHashed(stored)) return stored === password;

  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  try {
    const actual = await scrypt(password, salt, KEY_LEN);
    const expected = Buffer.from(hash, 'base64url');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

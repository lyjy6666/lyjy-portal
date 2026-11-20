import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  getClientIp,
  checkRateLimit,
  recordFailure,
  clearFailures,
  verifyPassword,
  hashPassword,
} from '../security';

interface LoginRequest {
  username: string;
  password: string;
}

// 计算用户当前 VIP 状态：以 vip_expires_at 为准
function calcVip(vipExpiresAt: string | null): { isVip: boolean; vipExpiresAt: string | null } {
  if (!vipExpiresAt) return { isVip: false, vipExpiresAt: null };
  const exp = new Date(vipExpiresAt).getTime();
  if (Number.isNaN(exp)) return { isVip: false, vipExpiresAt: null };
  return { isVip: exp > Date.now(), vipExpiresAt };
}

// 登录
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: `尝试过于频繁，请 ${limit.retryAfter} 秒后再试` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body as LoginRequest;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '请填写用户名和密码' },
        { status: 400 }
      );
    }

    // 查找用户（含 VIP 字段）
    const rows = await sql`
      SELECT id, username, password, is_vip, vip_trial_used, vip_expires_at
      FROM users WHERE username = ${username}
    `;

    if (rows.length === 0) {
      // 用户名不存在也计入失败次数，避免攻击者借此探测账号
      recordFailure(ip);
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // 验证密码：兼容加盐哈希与历史明文，均为恒定时间比较
    const { ok, needsUpgrade } = verifyPassword(user.password, password);
    if (!ok) {
      recordFailure(ip);
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }
    clearFailures(ip);

    // 旧明文账号首次登录成功：静默升级为哈希存储。
    // password 列本身是 TEXT，无需改表结构；升级失败也不影响本次登录。
    if (needsUpgrade) {
      try {
        await sql`UPDATE users SET password = ${hashPassword(password)} WHERE id = ${user.id}`;
      } catch (e) {
        console.warn('密码静默升级失败:', e instanceof Error ? e.message : e);
      }
    }

    const { isVip, vipExpiresAt } = calcVip(user.vip_expires_at);

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        isVip,
        vipExpiresAt,
        trialUsed: user.vip_trial_used || false,
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, message: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}

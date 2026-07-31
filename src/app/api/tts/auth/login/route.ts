import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // 验证密码
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
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
      { success: false, message: error instanceof Error ? error.message : '登录失败' },
      { status: 500 }
    );
  }
}

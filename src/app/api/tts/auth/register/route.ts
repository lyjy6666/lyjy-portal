import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  getClientIp,
  checkRateLimit,
  recordFailure,
  clearFailures,
  hashPassword,
} from '../security';

interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

// 注册
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
    const { username, password, confirmPassword } = body as RegisterRequest;

    if (!username || !password || !confirmPassword) {
      recordFailure(ip);
      return NextResponse.json(
        { success: false, message: '请填写所有字段' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      recordFailure(ip);
      return NextResponse.json(
        { success: false, message: '用户名长度需在3-20个字符之间' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      recordFailure(ip);
      return NextResponse.json(
        { success: false, message: '密码长度至少6个字符' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      recordFailure(ip);
      return NextResponse.json(
        { success: false, message: '两次密码输入不一致' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existing.length > 0) {
      recordFailure(ip);
      return NextResponse.json(
        { success: false, message: '用户名已被注册' },
        { status: 400 }
      );
    }

    // 创建用户：密码以加盐 SHA-256 存储，绝不落明文
    const rows = await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${hashPassword(password)})
      RETURNING id, username
    `;

    clearFailures(ip);
    const newUser = rows[0];

    // 注册成功即返回登录态（新用户默认非 VIP、未试用）
    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        isVip: false,
        vipExpiresAt: null,
        trialUsed: false,
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { success: false, message: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}

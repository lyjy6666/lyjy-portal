import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

// 注册
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, confirmPassword } = body as RegisterRequest;

    if (!username || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: '请填写所有字段' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { success: false, message: '用户名长度需在3-20个字符之间' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: '密码长度至少6个字符' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
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
      return NextResponse.json(
        { success: false, message: '用户名已被注册' },
        { status: 400 }
      );
    }

    // 创建用户
    const rows = await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${password})
      RETURNING id, username
    `;

    const newUser = rows[0];

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: { id: newUser.id, username: newUser.username }
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '注册失败' },
      { status: 500 }
    );
  }
}

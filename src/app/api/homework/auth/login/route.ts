import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const users = await sql`
      SELECT id, username, password FROM users WHERE username = ${username}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      );
    }

    const user = users[0];

    if (user.password !== password) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请重试' },
      { status: 500 }
    );
  }
}

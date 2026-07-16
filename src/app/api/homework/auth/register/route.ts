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

    if (username.length < 2) {
      return NextResponse.json(
        { error: '用户名至少需要2个字符' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: '密码至少需要4个字符' },
        { status: 400 }
      );
    }

    const existingUsers = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 409 }
      );
    }

    const newUsers = await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${password})
      RETURNING id, username
    `;

    const newUser = newUsers[0];

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { error: '注册失败，请重试' },
      { status: 500 }
    );
  }
}

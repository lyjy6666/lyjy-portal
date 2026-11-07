import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { signHomeworkToken } from '@/lib/homeworkAuth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
    }

    if (username.length < 2) {
      return NextResponse.json({ error: '用户名至少需要2个字符' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: '密码至少需要4个字符' }, { status: 400 });
    }

    const existingUsers = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
    }

    // 新账号一律写哈希；旧明文账号在下次登录时由 login 路由透明升级
    const hashed = await hashPassword(password);
    const newUsers = await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${hashed})
      RETURNING id, username
    `;

    const newUser = newUsers[0];
    const id = Number(newUser.id);
    return NextResponse.json({
      success: true,
      user: { id, username: newUser.username },
      token: signHomeworkToken(id),
    });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}

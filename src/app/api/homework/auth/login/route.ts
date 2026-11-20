import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyPassword, hashPassword, isHashed } from '@/lib/password';
import { signHomeworkToken } from '@/lib/homeworkAuth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
    }

    const users = await sql`
      SELECT id, username, password FROM users WHERE username = ${username}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    const user = users[0];
    const stored = String(user.password);

    if (!(await verifyPassword(password, stored))) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    // 老账号仍是明文：登录成功时透明升级为 scrypt 哈希。
    // WHERE password = 明文 防止并发重复升级；原版前端不读 token，零感知。
    if (!isHashed(stored)) {
      try {
        const hashed = await hashPassword(password);
        await sql`UPDATE users SET password = ${hashed} WHERE id = ${user.id} AND password = ${stored}`;
      } catch (err) {
        console.error('密码升级失败（不影响本次登录）:', err);
      }
    }

    const id = Number(user.id);
    return NextResponse.json({
      success: true,
      user: { id, username: user.username },
      token: signHomeworkToken(id),
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 });
  }
}

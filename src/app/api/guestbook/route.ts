import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// 初始化留言板表（首次调用时自动创建）
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS guestbook (
      id BIGSERIAL PRIMARY KEY,
      nickname TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  try {
    await ensureTable();

    const entries = await sql`
      SELECT id, nickname, content, created_at
      FROM guestbook
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json(entries);
  } catch (error) {
    console.error('获取留言失败:', error);
    return NextResponse.json(
      { error: '获取留言失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable();

    const body = await request.json();
    const { nickname, content } = body;

    if (!nickname || !nickname.trim()) {
      return NextResponse.json(
        { error: '请输入昵称' },
        { status: 400 }
      );
    }
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '请输入留言内容' },
        { status: 400 }
      );
    }

    // 限制长度，防止滥用
    const safeNickname = nickname.trim().slice(0, 50);
    const safeContent = content.trim().slice(0, 1000);

    const result = await sql`
      INSERT INTO guestbook (nickname, content)
      VALUES (${safeNickname}, ${safeContent})
      RETURNING id, nickname, content, created_at
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('发送留言失败:', error);
    return NextResponse.json(
      { error: '发送留言失败' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { parseHomeworkText, splitHomeworkInput } from '@/lib/homeworkParse';
// 收敛到统一鉴权：Pro 用验签 Bearer，原版继续 X-User-Id，行为向后兼容
import { requireHomeworkUser as getUserIdFromHeader } from '@/lib/homeworkAuth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromHeader(request);
    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const tasks = await sql`
      SELECT * FROM tasks
      WHERE user_id = ${userId}
      ORDER BY is_pinned DESC, id DESC
    `;

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at),
      updatedAt: task.updated_at ? new Date(task.updated_at) : undefined,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: '获取任务列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromHeader(request);
    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { text, dueDate, mode } = await request.json();
    const raw = typeof text === 'string' ? text.trim() : '';
    if (!raw) return NextResponse.json({ error: '请输入作业内容' }, { status: 400 });

    // local（默认）：本地克制拆分 —— 换行 / 分号 / 并列科目才拆，原文不做任何改写。
    // ai：旧版 AI 智能分点，会改写文字并加科目前缀，只给结构化预览入口用。
    // single：强制合成一条。
    const taskItems = mode === 'ai'
      ? (await parseHomeworkText(raw)).items
      : mode === 'single' ? [raw] : splitHomeworkInput(raw);

    const createdTasks: Record<string, unknown>[] = [];
    for (const item of taskItems) {
      const result = await sql`
        INSERT INTO tasks (text, completed, due_date, is_pinned, user_id, updated_at)
        VALUES (${item}, false, ${dueDate ? new Date(dueDate).toISOString() : null}, false, ${userId}, NOW())
        RETURNING *
      `;
      createdTasks.push(result[0]);
    }

    const formattedTasks = createdTasks.map((task) => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date as string) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at as string),
      updatedAt: task.updated_at ? new Date(task.updated_at as string) : undefined,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error processing tasks:', error);
    const message = error instanceof Error ? error.message : '处理作业时出错，请重试';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

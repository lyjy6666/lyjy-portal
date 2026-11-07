import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { parseHomeworkText } from '@/lib/homeworkParse';
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

    const { text, dueDate } = await request.json();
    if (!text) return NextResponse.json({ error: '请输入作业内容' }, { status: 400 });

    // AI 智能分点（失败自动回退本地规则）；与原版行为一致，一次输入可能插入多条
    const { items: taskItems } = await parseHomeworkText(text);

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

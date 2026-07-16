import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function getUserIdFromHeader(request: NextRequest): number | null {
  const userIdStr = request.headers.get('X-User-Id');
  if (!userIdStr) return null;
  const userId = parseInt(userIdStr);
  return isNaN(userId) ? null : userId;
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromHeader(request);
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { lines, dueDate } = await request.json();

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: '没有可导入的任务' },
        { status: 400 }
      );
    }

    console.log(`批量导入 ${lines.length} 条任务`);

    const createdTasks: any[] = [];
    let failCount = 0;

    for (const line of lines) {
      try {
        const result = await sql`
          INSERT INTO tasks (text, completed, due_date, is_pinned, user_id, updated_at)
          VALUES (${line}, false, ${dueDate ? new Date(dueDate).toISOString() : null}, false, ${userId}, NOW())
          RETURNING *
        `;
        createdTasks.push(result[0]);
      } catch (err) {
        console.error('创建任务失败:', line, err);
        failCount++;
      }
    }

    const formattedTasks = createdTasks.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at),
      updatedAt: task.updated_at ? new Date(task.updated_at) : undefined
    }));

    return NextResponse.json({
      tasks: formattedTasks,
      failCount
    });
  } catch (error) {
    console.error('批量导入失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '批量导入失败' },
      { status: 500 }
    );
  }
}

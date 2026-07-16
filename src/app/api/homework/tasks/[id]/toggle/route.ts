import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function getUserIdFromHeader(request: NextRequest): number | null {
  const userIdStr = request.headers.get('X-User-Id');
  if (!userIdStr) return null;
  const userId = parseInt(userIdStr);
  return isNaN(userId) ? null : userId;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromHeader(request);
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的任务ID' },
        { status: 400 }
      );
    }

    const existingTasks = await sql`
      SELECT * FROM tasks WHERE id = ${id} AND user_id = ${userId}
    `;

    if (existingTasks.length === 0) {
      return NextResponse.json(
        { error: '任务不存在或无权限' },
        { status: 404 }
      );
    }

    const result = await sql`
      UPDATE tasks
      SET completed = NOT completed, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;

    const task = result[0];

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在或无权限' },
        { status: 404 }
      );
    }

    const formattedTask = {
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at),
      updatedAt: task.updated_at ? new Date(task.updated_at) : undefined
    };

    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error('Error toggling task:', error);
    return NextResponse.json(
      { error: '切换任务状态失败' },
      { status: 500 }
    );
  }
}

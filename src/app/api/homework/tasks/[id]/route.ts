import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function getUserIdFromHeader(request: NextRequest): number | null {
  const userIdStr = request.headers.get('X-User-Id');
  if (!userIdStr) return null;
  const userId = parseInt(userIdStr);
  return isNaN(userId) ? null : userId;
}

export async function PUT(
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

    const data = await request.json();

    const sets: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.text !== undefined) { sets.push(`text = $${paramIndex++}`); values.push(data.text); }
    if (data.completed !== undefined) { sets.push(`completed = $${paramIndex++}`); values.push(data.completed); }
    if (data.dueDate !== undefined) { sets.push(`due_date = $${paramIndex++}`); values.push(data.dueDate ? new Date(data.dueDate).toISOString() : null); }
    if (data.isPinned !== undefined) { sets.push(`is_pinned = $${paramIndex++}`); values.push(data.isPinned); }

    sets.push(`updated_at = NOW()`);

    if (sets.length === 1) {
      return NextResponse.json({ task: existingTasks[0] });
    }

    values.push(id);
    values.push(userId);
    const setClause = sets.join(', ');

    const rows = await sql.query(
      `UPDATE tasks SET ${setClause} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    const task = rows[0];

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
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: '更新任务失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await sql`DELETE FROM tasks WHERE id = ${id} AND user_id = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: '删除任务失败' },
      { status: 500 }
    );
  }
}

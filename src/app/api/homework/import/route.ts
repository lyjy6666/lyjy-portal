import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { requireHomeworkUser as getUserIdFromHeader } from '@/lib/homeworkAuth';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromHeader(request);
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { lines, dueDate, items } = await request.json();

    // 新格式：每项自带截止时间（Pro 版 AI 记作业的结构化预览确认后用）
    const hasItems = Array.isArray(items) && items.length > 0;
    if (!hasItems && (!Array.isArray(lines) || lines.length === 0)) {
      return NextResponse.json({ error: '没有可导入的任务' }, { status: 400 });
    }

    const rows: { text: string; due: string | null }[] = hasItems
      ? items.slice(0, 100).map((i: { text?: unknown; dueDate?: unknown }) => ({
          text: String(i.text ?? '').trim(),
          due: i.dueDate ? new Date(String(i.dueDate)).toISOString() : null,
        })).filter((i: { text: string }) => i.text.length > 0)
      : lines.slice(0, 200).map((line: string) => ({
          text: String(line).trim(),
          due: dueDate ? new Date(dueDate).toISOString() : null,
        })).filter((i: { text: string }) => i.text.length > 0);

    if (!rows.length) return NextResponse.json({ error: '没有可导入的任务' }, { status: 400 });

    // 单条 INSERT ... SELECT 一次性写入，天然原子：
    // 旧版逐行 INSERT 无事务，中途失败会产生「部分成功」，前端却仍把成功项追加到列表。
    const inserted = await sql`
      INSERT INTO tasks (text, completed, due_date, is_pinned, user_id, updated_at)
      SELECT x.text, false, x.due::timestamptz, false, ${userId}, NOW()
      FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS x(text text, due text)
      RETURNING *
    `;

    const formattedTasks = inserted.map((task: Record<string, unknown>) => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date as string) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at as string),
      updatedAt: task.updated_at ? new Date(task.updated_at as string) : undefined,
    }));

    return NextResponse.json({ tasks: formattedTasks, failCount: 0 });
  } catch (error) {
    console.error('批量导入失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '批量导入失败' },
      { status: 500 }
    );
  }
}

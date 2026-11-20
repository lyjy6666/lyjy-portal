import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureProMetaTable } from '@/lib/db';
import { requireProUser } from '@/lib/homeworkAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MetaRow = { task_id: number | string; user_id: number | string; meta: unknown; version: number };

/**
 * Pro 版专属字段（子任务 / 优先级 / 标签 / 耗时 / 重复规则 …）全部存在这张旁路表。
 * 现有 tasks 表零 DDL、原版 SQL 与响应完全不变 —— 两版共用同一份作业数据。
 *
 * 鉴权：只接受验签通过的 Authorization: Bearer（Pro 侧无 IDOR）。
 * 归属：所有读写都 JOIN / 过滤 tasks.user_id，不凭 task_id 单独信任。
 */

type EnsureResult =
  | { ok: true; uid: number }
  | { ok: false; res: NextResponse };

async function ensureUser(request: NextRequest): Promise<EnsureResult> {
  const uid = requireProUser(request);
  if (!uid) return { ok: false, res: NextResponse.json({ error: '未登录或凭证无效' }, { status: 401 }) };
  try {
    await ensureProMetaTable();
  } catch (err) {
    console.error('ensureProMetaTable failed:', err);
    return { ok: false, res: NextResponse.json({ error: 'Pro 数据表初始化失败' }, { status: 500 }) };
  }
  return { ok: true, uid };
}

/** GET：批量取当前用户全部 meta（JOIN tasks 自动过滤已删任务的孤儿行） */
export async function GET(request: NextRequest) {
  const ensured = await ensureUser(request);
  if (!ensured.ok) return ensured.res;
  const { uid } = ensured;

  try {
    const rows = (await sql`
      SELECT m.task_id, m.meta, m.version
      FROM homework_pro_meta m
      JOIN tasks t ON t.id = m.task_id AND t.user_id = ${uid}
      WHERE m.user_id = ${uid}
    `) as unknown as MetaRow[];

    const meta: Record<string, Record<string, unknown> & { rev: number }> = {};
    for (const row of rows) {
      const value = (row.meta && typeof row.meta === 'object' ? row.meta : {}) as Record<string, unknown>;
      meta[String(row.task_id)] = { ...value, rev: Number(row.version) || 1 };
    }
    return NextResponse.json({ meta });
  } catch (err) {
    console.error('读取 Pro meta 失败:', err);
    return NextResponse.json({ error: '读取失败' }, { status: 500 });
  }
}

/**
 * PUT：局部 patch + CAS 乐观锁。
 * body: { taskId: number, baseRev: number, patch: object }
 * 返回 { taskId, meta, rev }；409 表示版本冲突，前端重拉后重试。
 */
export async function PUT(request: NextRequest) {
  const ensured = await ensureUser(request);
  if (!ensured.ok) return ensured.res;
  const { uid } = ensured;

  let body: { taskId?: unknown; baseRev?: unknown; patch?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  const taskId = Number(body.taskId);
  const baseRev = Number(body.baseRev ?? 0);
  if (!Number.isInteger(taskId) || taskId <= 0 || !Number.isFinite(baseRev)) {
    return NextResponse.json({ error: '参数无效' }, { status: 400 });
  }
  const patch = (body.patch && typeof body.patch === 'object' ? body.patch : {}) as Record<string, unknown>;
  delete patch.rev; // rev 是服务端版本号，不允许客户端写
  const json = JSON.stringify(patch);

  try {
    // 归属校验：任务必须真的属于当前用户
    const owned = await sql`SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${uid}`;
    if (owned.length === 0) {
      return NextResponse.json({ error: '任务不存在或无权限' }, { status: 404 });
    }

    const current = (await sql`
      SELECT user_id, version FROM homework_pro_meta WHERE task_id = ${taskId}
    `) as unknown as MetaRow[];

    let rows: MetaRow[];
    if (current.length === 0) {
      if (baseRev !== 0) {
        return NextResponse.json({ error: '版本冲突，请刷新后重试' }, { status: 409 });
      }
      rows = (await sql`
        INSERT INTO homework_pro_meta (task_id, user_id, meta, version, updated_at)
        VALUES (${taskId}, ${uid}, ${json}::jsonb, 1, NOW())
        RETURNING meta, version
      `) as unknown as MetaRow[];
    } else {
      if (Number(current[0].user_id) !== uid) {
        return NextResponse.json({ error: '无权限' }, { status: 403 });
      }
      if (Number(current[0].version) !== baseRev) {
        return NextResponse.json({ error: '版本冲突，请刷新后重试' }, { status: 409 });
      }
      // JSONB || 做字段级合并，避免两个设备改不同字段时互相覆盖
      rows = (await sql`
        UPDATE homework_pro_meta
        SET meta = homework_pro_meta.meta || ${json}::jsonb,
            version = homework_pro_meta.version + 1,
            updated_at = NOW()
        WHERE task_id = ${taskId} AND user_id = ${uid} AND version = ${baseRev}
        RETURNING meta, version
      `) as unknown as MetaRow[];
      if (rows.length === 0) {
        return NextResponse.json({ error: '版本冲突，请刷新后重试' }, { status: 409 });
      }
    }

    const value = (rows[0].meta && typeof rows[0].meta === 'object' ? rows[0].meta : {}) as Record<string, unknown>;
    return NextResponse.json({
      taskId,
      meta: { ...value, rev: Number(rows[0].version) || 1 },
      rev: Number(rows[0].version) || 1,
    });
  } catch (err) {
    console.error('写入 Pro meta 失败:', err);
    return NextResponse.json({ error: '写入失败' }, { status: 500 });
  }
}

/** DELETE：删除某条任务的 meta（任务本身由 /api/homework/tasks/[id] 删除） */
export async function DELETE(request: NextRequest) {
  const ensured = await ensureUser(request);
  if (!ensured.ok) return ensured.res;
  const { uid } = ensured;

  const raw = new URL(request.url).searchParams.get('taskId');
  const taskId = Number(raw);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: '参数无效' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM homework_pro_meta WHERE task_id = ${taskId} AND user_id = ${uid}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('删除 Pro meta 失败:', err);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

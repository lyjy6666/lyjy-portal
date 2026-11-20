import type { BaseTask, ProMeta, ProTask } from './types';
import { makeMeta } from './types';

export type MetaMap = Record<string, ProMeta>;

/**
 * 后端响应归一化：旧版 GET 返回 `dueDate` 可能是 undefined / ISO 字符串，
 * PUT 又会把 ISO 字符串直接塞进 Date 类型字段。这里一律收口成 string|null。
 */
export function normalizeBaseTask(raw: Record<string, unknown>): BaseTask {
  const due = raw.dueDate ?? raw.due_date;
  let dueDate: string | null = null;
  if (due instanceof Date) dueDate = due.toISOString();
  else if (typeof due === 'string' && due) dueDate = new Date(due).toISOString();

  const toIso = (v: unknown): string | null => {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'string' && v) {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    return null;
  };

  return {
    id: Number(raw.id),
    text: String(raw.text ?? ''),
    completed: Boolean(raw.completed),
    dueDate,
    isPinned: Boolean(raw.isPinned ?? raw.is_pinned),
    createdAt: toIso(raw.createdAt ?? raw.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

/** 合并云端 tasks 与旁路 meta；没有 meta 的任务用空 meta（rev=0） */
export function mergeProTasks(base: BaseTask[], metaMap: MetaMap): ProTask[] {
  return base.map((task) => ({
    ...task,
    meta: { ...makeMeta(metaMap[String(task.id)] ?? {}) },
  }));
}

/**
 * 云端权威合并：以服务端 updated_at 为准（LWW）。
 * Pro 侧只保留本地的临时 id 项（尚未提交到云端的新建任务）。
 */
export function mergeBaseTasks(local: BaseTask[], remote: BaseTask[]): BaseTask[] {
  const remoteIds = new Set(remote.map((t) => t.id));
  const pending = local.filter((t) => !Number.isFinite(t.id) || !remoteIds.has(t.id));
  return [...remote, ...pending];
}

/** 生成写往 /pro/meta 的 patch：剥掉 rev，空值也保留（用于清除字段） */
export function metaPatch(meta: ProMeta): Omit<ProMeta, 'rev'> {
  const { rev: _rev, ...patch } = meta;
  return patch;
}

/** metaMap 更新（CAS 成功后替换 rev） */
export function withMeta(map: MetaMap, taskId: number, meta: ProMeta): MetaMap {
  return { ...map, [String(taskId)]: { ...meta } };
}

/** 删除任务后清理 metaMap 里的孤儿 */
export function dropMeta(map: MetaMap, taskId: number): MetaMap {
  const next = { ...map };
  delete next[String(taskId)];
  return next;
}

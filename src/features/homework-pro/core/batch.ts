/**
 * 批量操作编排。
 *
 * 旧版用 Promise.all(fetch(...)) 但完全不检查 response.ok，失败仍无条件更新本地，
 * 造成云端与本地永久不一致；且一次性并发 N 个请求可能打满连接池。
 * 这里统一：并发上限、逐条结果聚合、失败项回显。
 */

export type BatchResult<T, R> = {
  ok: { item: T; result: R }[];
  failed: { item: T; error: string }[];
};

export async function runBatch<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency = 4,
  /** 每完成一条回调一次，用于「写入中 3/10」这类进度提示 */
  onProgress?: (done: number, total: number) => void,
): Promise<BatchResult<T, R>> {
  const ok: BatchResult<T, R>['ok'] = [];
  const failed: BatchResult<T, R>['failed'] = [];
  let cursor = 0;
  let done = 0;
  const limit = Math.max(1, Math.min(16, Math.floor(concurrency)));

  const runner = async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      const item = items[index];
      try {
        const result = await worker(item);
        ok.push({ item, result });
      } catch (err) {
        failed.push({ item, error: err instanceof Error ? err.message : String(err) });
      }
      done += 1;
      // 进度回调本身出错不能影响批量任务
      try { onProgress?.(done, items.length); } catch { /* 忽略 */ }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return { ok, failed };
}

/** 统一把非 2xx 响应转成异常，供 worker 使用 */
export function assertOk(response: Response, fallback = '请求失败'): void {
  if (!response.ok) {
    throw new Error(`${fallback}（HTTP ${response.status}）`);
  }
}

/** 批量改期：三种模式逐条计算，返回可提交的更新与应跳过的项 */
export function buildBatchDateUpdates<T extends { id: number; dueDate: string | null }>(
  tasks: T[],
  value: string,
  mode: 'full' | 'dateOnly' | 'timeOnly',
  combine: (original: string | null, value: string, mode: 'full' | 'dateOnly' | 'timeOnly') => string | null,
): { updates: { id: number; dueDate: string }[]; skipped: number } {
  const updates: { id: number; dueDate: string }[] = [];
  let skipped = 0;
  for (const task of tasks) {
    const next = combine(task.dueDate, value, mode);
    if (next === null) {
      skipped += 1;
      continue;
    }
    updates.push({ id: task.id, dueDate: next });
  }
  return { updates, skipped };
}

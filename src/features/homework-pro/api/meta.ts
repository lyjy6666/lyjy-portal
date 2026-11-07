import { apiFetch } from './client';
import type { ProMeta } from '../core/types';

type MetaResponse = { meta: Record<string, ProMeta> };
type PutResponse = { meta: ProMeta; rev: number };

const path = '/api/homework/pro/meta';

/** 旁路表客户端：Pro 专属字段全部走这里，现有 tasks 表零改动 */
export const metaApi = {
  list: () => apiFetch<MetaResponse>(path).then((r) => r.meta ?? {}),

  /** 局部 patch + CAS；409 表示版本冲突，调用方重拉后重试 */
  put: (taskId: number, baseRev: number, patch: Record<string, unknown>) =>
    apiFetch<PutResponse>(path, {
      method: 'PUT',
      body: JSON.stringify({ taskId, baseRev, patch }),
    }),

  remove: (taskId: number) =>
    apiFetch<{ success: boolean }>(`${path}?taskId=${taskId}`, { method: 'DELETE' }),
};

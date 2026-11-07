import { apiFetch } from './client';
import type { DateMode } from '../core/types';

type RawTask = Record<string, unknown>;
type TasksResponse = { tasks?: RawTask[] };
type TaskResponse = { task?: RawTask };

const base = '/api/homework/tasks';

export const tasksApi = {
  list: () => apiFetch<TasksResponse>(base).then((r) => r.tasks ?? []),

  /** 保留 Coze 智能分点：一次输入可能返回多条任务 */
  create: (text: string, dueDate: string | null) =>
    apiFetch<TasksResponse>(base, {
      method: 'POST',
      body: JSON.stringify({ text, dueDate }),
    }).then((r) => r.tasks ?? []),

  update: (id: number, patch: { text?: string; completed?: boolean; dueDate?: string | null; isPinned?: boolean }) =>
    apiFetch<TaskResponse>(`${base}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }).then((r) => r.task ?? {}),

  remove: (id: number) =>
    apiFetch<{ success: boolean }>(`${base}/${id}`, { method: 'DELETE' }),

  toggle: (id: number) =>
    apiFetch<TaskResponse>(`${base}/${id}/toggle`, { method: 'POST' }).then((r) => r.task ?? {}),

  pin: (id: number) =>
    apiFetch<TaskResponse>(`${base}/${id}/pin`, { method: 'POST' }).then((r) => r.task ?? {}),

  importLines: (lines: string[], dueDate: string | null = null) =>
    apiFetch<TasksResponse>('/api/homework/import', {
      method: 'POST',
      body: JSON.stringify({ lines, dueDate }),
    }, 30_000).then((r) => r.tasks ?? []),

  /** Pro 版结构化预览确认后批量写入：每项自带截止时间，不走 AI 二次分点 */
  createMany: (items: { text: string; dueDate: string | null }[]) =>
    apiFetch<TasksResponse>('/api/homework/import', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }, 30_000).then((r) => r.tasks ?? []),

  /** 只解析不入库（AI 一句话 / 拍照记作业的结构化预览） */
  parse: (text: string) =>
    apiFetch<{ items: string[]; source: 'ai' | 'local' }>('/api/homework/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }, 30_000),
};

/** 供批量改期使用：三种模式都在前端算好 ISO，再逐条 PUT */
export type DatePatch = { id: number; dueDate: string; mode: DateMode };

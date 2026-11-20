import { describe, it, expect } from 'vitest';
import { normalizeBaseTask, mergeProTasks, mergeBaseTasks, metaPatch, withMeta, dropMeta } from './merge';
import type { BaseTask } from './types';

describe('normalizeBaseTask', () => {
  it('把 undefined / Date / ISO 统一成 ISO 字符串或 null', () => {
    const a = normalizeBaseTask({ id: 1, text: 'x', completed: false });
    expect(a.dueDate).toBeNull();

    const b = normalizeBaseTask({ id: 2, text: 'y', dueDate: '2026-11-06T20:00:00.000Z' });
    expect(b.dueDate).toBe('2026-11-06T20:00:00.000Z');

    const c = normalizeBaseTask({ id: 3, text: 'z', dueDate: new Date('2026-11-06T20:00:00.000Z') });
    expect(c.dueDate).toBe('2026-11-06T20:00:00.000Z');
  });

  it('兼容 snake_case（数据库直出）', () => {
    const t = normalizeBaseTask({ id: 4, text: 'q', is_pinned: true, due_date: null, created_at: new Date(0) });
    expect(t.isPinned).toBe(true);
    expect(t.dueDate).toBeNull();
  });
});

describe('mergeProTasks', () => {
  const base: BaseTask = {
    id: 7, text: '数学', completed: false, dueDate: null,
    isPinned: false, createdAt: '2026-11-01T00:00:00.000Z', updatedAt: null,
  };

  it('无 meta 时补空 meta（rev=0），有 meta 时合并', () => {
    expect(mergeProTasks([base], {})[0].meta).toEqual({ rev: 0 });
    const merged = mergeProTasks([base], { '7': { priority: 'high', rev: 3 } });
    expect(merged[0].meta.priority).toBe('high');
    expect(merged[0].meta.rev).toBe(3);
  });

  it('云端权威：远程为准，本地只留未提交的临时项', () => {
    const local = [base, { ...base, id: -1, text: '临时' }];
    const remote = [{ ...base, text: '云端改过的' }];
    const result = mergeBaseTasks(local, remote);
    expect(result[0].text).toBe('云端改过的');
    expect(result.some((t) => t.text === '临时')).toBe(true);
  });
});

describe('meta patch / map', () => {
  it('patch 剥掉 rev', () => {
    const patch = metaPatch({ priority: 'low', rev: 5 });
    expect('rev' in patch).toBe(false);
    expect(patch.priority).toBe('low');
  });

  it('withMeta / dropMeta 不修改原对象', () => {
    const map = { '1': { rev: 1 } };
    const next = withMeta(map, 2, { rev: 2 });
    expect(Object.keys(map)).toEqual(['1']);
    expect(next['2'].rev).toBe(2);
    expect(Object.keys(dropMeta(next, 1))).toEqual(['2']);
  });
});

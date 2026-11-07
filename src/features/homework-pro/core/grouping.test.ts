import { describe, it, expect } from 'vitest';
import type { ProTask } from './types';
import { sortTasks, groupBySubject, groupByTime, groupByPriority, tasksOnDay } from './grouping';
import { filterTasks, collectFacets, isFilterActive } from './filters';
import { DEFAULT_FILTER } from './types';
import { toUtcIso } from './date';

function task(partial: Partial<ProTask> & { id: number }): ProTask {
  return {
    text: '作业', completed: false, dueDate: null, isPinned: false,
    createdAt: '2026-11-01T00:00:00.000Z', updatedAt: null,
    meta: { rev: 1 }, ...partial,
  } as ProTask;
}

const now = new Date(2026, 10, 6, 12, 0);

describe('排序与分组', () => {
  it('置顶 > 未完成 > 优先级 > 截止时间', () => {
    const list = [
      task({ id: 1, text: '普通', completed: true }),
      task({ id: 2, text: '紧急', meta: { priority: 'urgent', rev: 1 } }),
      task({ id: 3, text: '置顶', isPinned: true }),
      task({ id: 4, text: '普通2' }),
    ];
    expect(sortTasks(list).map((t) => t.id)).toEqual([3, 2, 4, 1]);
  });

  it('按科目分组，其他排最后', () => {
    const groups = groupBySubject([
      task({ id: 1, text: '数学试卷' }),
      task({ id: 2, text: '语文背诵' }),
      task({ id: 3, text: '随便写' }),
    ]);
    expect(groups[groups.length - 1].id).toBe('其他');
    expect(groups.find((g) => g.id === '数学')?.tasks).toHaveLength(1);
  });

  it('按时间分桶过滤空组', () => {
    const groups = groupByTime([
      task({ id: 1, dueDate: toUtcIso('2026-11-06T20:00') }),
      task({ id: 2, dueDate: null }),
    ], now);
    expect(groups.map((g) => g.id)).toEqual(['today', 'none']);
  });

  it('按优先级分组', () => {
    const groups = groupByPriority([
      task({ id: 1, meta: { priority: 'high', rev: 1 } }),
      task({ id: 2 }),
    ]);
    expect(groups.map((g) => g.id)).toEqual(['high', 'normal']);
  });

  it('tasksOnDay 按本地日历日匹配', () => {
    const list = [task({ id: 1, dueDate: toUtcIso('2026-11-06T23:00') })];
    expect(tasksOnDay(list, '2026-11-06')).toHaveLength(1);
    expect(tasksOnDay(list, '2026-11-07')).toHaveLength(0);
  });
});

describe('筛选', () => {
  const list = [
    task({ id: 1, text: '数学试卷', dueDate: toUtcIso('2026-11-05T20:00'), meta: { tags: ['考试'], subject: '数学', rev: 1 } }),
    task({ id: 2, text: '英语单词抄写', completed: true, meta: { tags: ['日常'], rev: 1 } }),
  ];

  it('文本 / 科目 / 标签 / 状态组合', () => {
    expect(filterTasks(list, { ...DEFAULT_FILTER, query: '试卷' }, now).map((t) => t.id)).toEqual([1]);
    expect(filterTasks(list, { ...DEFAULT_FILTER, subjects: ['数学'] }, now).map((t) => t.id)).toEqual([1]);
    expect(filterTasks(list, { ...DEFAULT_FILTER, tags: ['日常'] }, now).map((t) => t.id)).toEqual([2]);
    expect(filterTasks(list, { ...DEFAULT_FILTER, status: 'active' }, now).map((t) => t.id)).toEqual([1]);
    expect(filterTasks(list, { ...DEFAULT_FILTER, status: 'overdue' }, now).map((t) => t.id)).toEqual([1]);
  });

  it('facet 收集与是否激活', () => {
    expect(collectFacets(list).tags).toEqual(['考试', '日常']);
    expect(isFilterActive(DEFAULT_FILTER)).toBe(false);
    expect(isFilterActive({ ...DEFAULT_FILTER, query: 'x' })).toBe(true);
  });
});

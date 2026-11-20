import { describe, it, expect } from 'vitest';
import type { ProTask } from './types';
import { summary, completionTrend, heatmap, streak, dailyLoad, reviewGroups, lateLabel } from './stats';
import { toUtcIso } from './date';

function task(partial: Partial<ProTask> & { id: number }): ProTask {
  return {
    text: '作业', completed: false, dueDate: null, isPinned: false,
    createdAt: '2026-11-01T00:00:00.000Z', updatedAt: null,
    meta: { rev: 1 }, ...partial,
  } as ProTask;
}

const now = new Date(2026, 10, 6, 12, 0);

const sample = [
  task({ id: 1, dueDate: toUtcIso('2026-11-06T20:00'), meta: { estimateMin: 60, rev: 1 } }),
  task({ id: 2, dueDate: toUtcIso('2026-11-06T21:00'), meta: { estimateMin: 90, reviewList: true, rev: 1 } }),
  task({ id: 3, completed: true, dueDate: toUtcIso('2026-11-05T20:00'), meta: { completedAt: toUtcIso('2026-11-06T09:00'), rev: 1 } }),
  task({ id: 4, completed: true, dueDate: null, meta: { completedAt: toUtcIso('2026-11-05T09:00'), rev: 1 } }),
];

describe('统计', () => {
  it('summary 数字正确（含迟交与逾期）', () => {
    const s = summary(sample, now);
    expect(s.total).toBe(4);
    expect(s.active).toBe(2);
    expect(s.completed).toBe(2);
    expect(s.dueToday).toBe(2);
    expect(s.late).toBe(1);
    expect(s.noDue).toBe(0);
    expect(s.completionRate).toBe(0.5);
  });

  it('趋势与热力图长度稳定', () => {
    expect(completionTrend(sample, 30, now)).toHaveLength(30);
    expect(heatmap(sample, 12, now).length % 7).toBe(0);
  });

  it('连续打卡：11-06 与 11-05 都有完成记录', () => {
    expect(streak(sample, now)).toBe(2);
  });

  it('每日负担条：超阈值标记', () => {
    const load = dailyLoad(sample, '2026-11-06', 120);
    expect(load.minutes).toBe(150);
    expect(load.over).toBe(true);
    expect(load.count).toBe(2);
  });

  it('考前复习清单只收勾选项', () => {
    const groups = reviewGroups(sample);
    expect(groups.reduce((s, g) => s + g.tasks.length, 0)).toBe(1);
  });

  it('迟交 / 逾期文案', () => {
    expect(lateLabel(sample[2], now)).toBe('迟交');
    expect(lateLabel(task({ id: 9, dueDate: toUtcIso('2026-11-04T20:00') }), now)).toContain('逾期');
  });
});

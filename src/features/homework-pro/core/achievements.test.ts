import { describe, it, expect } from 'vitest';
import {
  computeMilestones, streakDays, subjectDistribution, weeklyCompletion, weeklyNarrative,
} from './achievements';
import type { ProTask } from './types';

const now = new Date(2026, 10, 6, 12, 0);

function task(partial: Partial<ProTask> & { id: number }): ProTask {
  return {
    text: '数学作业', completed: false, dueDate: null, isPinned: false,
    createdAt: '2026-11-01T00:00:00.000Z', updatedAt: null, meta: { rev: 1 },
    ...partial,
  } as ProTask;
}

const sample: ProTask[] = [
  task({ id: 1, text: '数学试卷', completed: true, meta: { completedAt: '2026-11-06T09:00:00.000Z', rev: 1 } }),
  task({ id: 2, text: '英语听写', completed: true, meta: { completedAt: '2026-11-05T09:00:00.000Z', rev: 1 } }),
  task({ id: 3, text: '语文背诵' }),
  task({ id: 4, text: '物理实验报告' }),
];

describe('成就与进度', () => {
  it('连续打卡天数', () => {
    expect(streakDays(sample, now)).toBe(2); // 11-06 与 11-05
    expect(streakDays([], now)).toBe(0);
  });

  it('近 7 天完成曲线固定 7 个点', () => {
    const week = weeklyCompletion(sample, now);
    expect(week).toHaveLength(7);
    expect(week.reduce((s, d) => s + d.count, 0)).toBe(2);
  });

  it('学科分布按数量排序', () => {
    const dist = subjectDistribution(sample);
    expect(dist).toHaveLength(4);
    expect(dist[0].total).toBeGreaterThanOrEqual(1);
    expect(dist[0].done).toBe(1);
  });

  it('里程碑基于真实数据，不虚报', () => {
    const list = computeMilestones(sample, now);
    expect(list).toHaveLength(8);
    expect(list.find((m) => m.id === 'first')?.reached).toBe(true);
    expect(list.find((m) => m.id === 'done50')?.reached).toBe(false);
    expect(list.every((m) => m.progress >= 0 && m.progress <= 1)).toBe(true);
  });

  it('空数据叙事引导用户开始，而不是虚假鼓励', () => {
    expect(weeklyNarrative([], now)).toContain('还没有完成记录');
    expect(weeklyNarrative(sample, now)).toContain('完成了 2 项');
  });
});

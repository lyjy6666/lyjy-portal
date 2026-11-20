import { describe, it, expect } from 'vitest';
import { distribute, planToTaskInputs, formatPlanText, DEFAULT_DAY_CAPACITY } from './planner';
import { localDayKey, fromUtcIso } from './date';
import type { PlannerItem } from './types';

const items: PlannerItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `i${i}`, name: `作业${i}`, difficulty: i % 3 === 0 ? 3 : 1,
}));

describe('distribute', () => {
  it('3 天 6 项均匀分配，每天都有作业', () => {
    const plan = distribute(items, 3, '2026-11-06', [3, 3, 3], () => 0.37);
    expect(plan).toHaveLength(3);
    expect(plan.reduce((s, d) => s + d.items.length, 0)).toBe(6);
    expect(plan.every((d) => d.items.length > 0)).toBe(true);
    expect(plan[0].date).toBe('2026-11-06');
    expect(plan[2].date).toBe('2026-11-08');
  });

  it('capacity=0 的天完全不排', () => {
    const plan = distribute(items, 3, '2026-11-06', [0, 3, 3], () => 0.37);
    expect(plan[0].items).toHaveLength(0);
    expect(plan[0].load).toBe(0);
    expect(plan[1].items.length + plan[2].items.length).toBe(6);
  });

  it('默认容量与负载重算一致', () => {
    const plan = distribute(items, 2, '2026-11-06', [], () => 0.37);
    expect(plan.every((d) => d.capacity === DEFAULT_DAY_CAPACITY)).toBe(true);
    for (const d of plan) {
      expect(d.load).toBeCloseTo(d.items.reduce((s, i) => s + Math.max(0.5, i.difficulty), 0), 6);
    }
  });

  it('局部搜索不丢项、不产生负负载', () => {
    const plan = distribute(items, 4, '2026-11-06', [3, 3, 3, 3], () => 0.42);
    expect(plan.reduce((s, d) => s + d.items.length, 0)).toBe(6);
    expect(plan.every((d) => d.load >= 0)).toBe(true);
  });
});

describe('排期结果写入', () => {
  it('截止时间是当天本地 23:59，不会被当 UTC 00:00 落到前一天', () => {
    const plan = distribute(items, 2, '2026-11-06', [3, 3], () => 0.37);
    const days = new Set(plan.map((d) => d.date));
    for (const input of planToTaskInputs(plan)) {
      expect(input.dueDate).not.toBeNull();
      expect(fromUtcIso(input.dueDate)).toMatch(/T23:59$/);
      expect(days.has(localDayKey(input.dueDate!))).toBe(true);
    }
  });

  it('复制文本包含日期与作业名', () => {
    const plan = distribute(items, 2, '2026-11-06', [3, 3], () => 0.37);
    const text = formatPlanText(plan);
    expect(text).toContain('2026-11-06');
    expect(text).toContain('作业0');
  });
});

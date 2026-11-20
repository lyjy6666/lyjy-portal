import { describe, it, expect } from 'vitest';
import { runBatch, assertOk, buildBatchDateUpdates } from './batch';
import { combineDateMode, toUtcIso, fromUtcIso } from './date';

describe('runBatch', () => {
  it('全部成功时聚合结果', async () => {
    const result = await runBatch([1, 2, 3, 4, 5], async (n) => n * 2, 2);
    expect(result.ok).toHaveLength(5);
    expect(result.failed).toHaveLength(0);
    expect(result.ok.reduce((s, x) => s + x.result, 0)).toBe(30);
  });

  it('单条失败不阻断其它项，失败项带原因', async () => {
    const result = await runBatch([1, 2, 3], async (n) => {
      if (n === 2) throw new Error('HTTP 500');
      return n;
    }, 2);
    expect(result.ok.map((x) => x.item)).toEqual([1, 3]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toContain('HTTP 500');
  });

  it('并发不超过设定值', async () => {
    let active = 0;
    let peak = 0;
    await runBatch(Array.from({ length: 12 }, (_, i) => i), async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 2));
      active -= 1;
      return true;
    }, 3);
    expect(peak).toBeLessThanOrEqual(3);
  });
});

describe('assertOk', () => {
  it('非 2xx 抛异常，2xx 通过', () => {
    expect(() => assertOk({ ok: false, status: 401 } as Response, '删除失败')).toThrow(/401/);
    expect(() => assertOk({ ok: true, status: 200 } as Response)).not.toThrow();
  });
});

describe('buildBatchDateUpdates', () => {
  const tasks = [
    { id: 1, dueDate: toUtcIso('2026-11-06T20:00') },
    { id: 2, dueDate: null },
  ];

  it('dateOnly 两条都能改，无截止时间的补 00:00', () => {
    const { updates, skipped } = buildBatchDateUpdates(tasks, '2026-11-10', 'dateOnly', combineDateMode);
    expect(skipped).toBe(0);
    expect(fromUtcIso(updates[0].dueDate)).toBe('2026-11-10T20:00');
    expect(fromUtcIso(updates[1].dueDate)).toBe('2026-11-10T00:00');
  });

  it('timeOnly 跳过无截止时间的任务', () => {
    const { updates, skipped } = buildBatchDateUpdates(tasks, '08:00', 'timeOnly', combineDateMode);
    expect(skipped).toBe(1);
    expect(updates).toHaveLength(1);
    expect(fromUtcIso(updates[0].dueDate)).toBe('2026-11-06T08:00');
  });
});

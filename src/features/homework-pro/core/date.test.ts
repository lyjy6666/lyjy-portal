import { describe, it, expect } from 'vitest';
import {
  toUtcIso, fromUtcIso, localDayKey, dayDiff, bucketByDue, dayEndIso,
  combineDateMode, monthGrid, expandRepeat, formatRelative, isLate, overdueDays,
} from './date';

describe('toUtcIso / fromUtcIso', () => {
  it('datetime-local 往返不丢本地时刻（旧版 8 小时偏移的根因）', () => {
    const iso = toUtcIso('2026-11-06T20:00');
    expect(iso).not.toBeNull();
    expect(fromUtcIso(iso)).toBe('2026-11-06T20:00');
  });

  it('按浏览器本地时区解析，不依赖服务器时区', () => {
    expect(toUtcIso('2026-11-06T20:00')).toBe(new Date(2026, 10, 6, 20, 0).toISOString());
  });

  it('空值 / 非法值安全返回', () => {
    expect(toUtcIso(null)).toBeNull();
    expect(toUtcIso('')).toBeNull();
    expect(fromUtcIso(null)).toBe('');
  });

  it('纯日期写为本地当天 23:59，不会被当 UTC 00:00 落到前一天', () => {
    const iso = dayEndIso('2026-11-06')!;
    expect(localDayKey(iso)).toBe('2026-11-06');
    expect(fromUtcIso(iso)).toBe('2026-11-06T23:59');
  });
});

describe('日历日', () => {
  it('dayDiff 只看本地日历日，不受时刻影响', () => {
    const base = new Date(2026, 10, 6, 23, 30);
    expect(dayDiff(new Date(2026, 10, 7, 0, 1), base)).toBe(1);
    expect(dayDiff(new Date(2026, 10, 5, 23, 59), base)).toBe(-1);
  });

  it('monthGrid 固定 42 格，跨月补位标记正确', () => {
    const nov = monthGrid(2026, 11);
    expect(nov).toHaveLength(42);
    expect(nov.filter((g) => g.inMonth)).toHaveLength(30);
    expect(nov[0].dayKey).toBe('2026-11-01'); // 2026-11-01 恰好是周日，首格就在当月

    const oct = monthGrid(2026, 10); // 10-01 是周四，需要从 9 月补位
    expect(oct).toHaveLength(42);
    expect(oct[0].inMonth).toBe(false);
    expect(oct.filter((g) => g.inMonth)).toHaveLength(31);
  });
});

describe('bucketByDue', () => {
  const now = new Date(2026, 10, 6, 12, 0);
  const iso = (s: string) => toUtcIso(s)!;

  it('七桶判定', () => {
    expect(bucketByDue(null, now)).toBe('none');
    expect(bucketByDue(iso('2026-11-05T20:00'), now)).toBe('overdue');
    expect(bucketByDue(iso('2026-11-06T08:00'), now)).toBe('overdue'); // 今天但已过时刻
    expect(bucketByDue(iso('2026-11-06T20:00'), now)).toBe('today');
    expect(bucketByDue(iso('2026-11-07T20:00'), now)).toBe('tomorrow');
    expect(bucketByDue(iso('2026-11-09T20:00'), now)).toBe('d3');
    expect(bucketByDue(iso('2026-11-13T20:00'), now)).toBe('week');
    expect(bucketByDue(iso('2026-11-20T20:00'), now)).toBe('later');
  });
});

describe('combineDateMode（批量改期三模式）', () => {
  const original = toUtcIso('2026-11-06T20:00')!;

  it('full 整条替换', () => {
    const next = combineDateMode(original, '2026-11-10T09:30', 'full')!;
    expect(fromUtcIso(next)).toBe('2026-11-10T09:30');
  });

  it('dateOnly 只换日期，保留各自时刻', () => {
    const next = combineDateMode(original, '2026-11-10', 'dateOnly')!;
    expect(fromUtcIso(next)).toBe('2026-11-10T20:00');
  });

  it('dateOnly 对无截止时间的任务补 00:00', () => {
    const next = combineDateMode(null, '2026-11-10', 'dateOnly')!;
    expect(fromUtcIso(next)).toBe('2026-11-10T00:00');
  });

  it('timeOnly 保留各自日期', () => {
    const next = combineDateMode(original, '08:15', 'timeOnly')!;
    expect(fromUtcIso(next)).toBe('2026-11-06T08:15');
  });

  it('timeOnly 遇到无截止时间应跳过（返回 null）', () => {
    expect(combineDateMode(null, '08:15', 'timeOnly')).toBeNull();
  });
});

describe('重复与提醒', () => {
  it('daily 展开连续 7 天', () => {
    const days = expandRepeat({ rule: 'daily' }, '2026-11-06', 7);
    expect(days).toEqual([
      '2026-11-07', '2026-11-08', '2026-11-09',
      '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13',
    ]);
  });

  it('custom 只落在指定星期几', () => {
    const days = expandRepeat({ rule: 'custom', weekdays: [1, 3] }, '2026-11-06', 4);
    expect(days).toHaveLength(4);
    expect(days.every((d) => [1, 3].includes(new Date(`${d}T12:00:00`).getDay()))).toBe(true);
  });

  it('迟到 / 逾期判定', () => {
    const due = toUtcIso('2026-11-06T20:00')!;
    expect(isLate(toUtcIso('2026-11-06T21:00'), due)).toBe(true);
    expect(isLate(toUtcIso('2026-11-06T19:00'), due)).toBe(false);
    expect(isLate(null, due)).toBe(false);
    expect(overdueDays(toUtcIso('2026-11-04T20:00'), new Date(2026, 10, 6, 12, 0))).toBeGreaterThan(0);
  });

  it('formatRelative 输出紧急标记', () => {
    const now = new Date(2026, 10, 6, 12, 0);
    expect(formatRelative(toUtcIso('2026-11-06T20:00'), now).text).toContain('小时');
    expect(formatRelative(toUtcIso('2026-11-05T20:00'), now).overdue).toBe(true);
    expect(formatRelative(null, now).text).toBe('未设截止时间');
  });
});

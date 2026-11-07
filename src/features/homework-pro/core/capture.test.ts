import { describe, it, expect } from 'vitest';
import { inferDueDate, localSplit, toCaptureItems } from './capture';
import { fromUtcIso, localDayKey } from './date';

const now = new Date(2026, 10, 6, 12, 0); // 2026-11-06 周五

describe('inferDueDate', () => {
  it('相对日期', () => {
    expect(fromUtcIso(inferDueDate('明天交数学卷子', now).iso)).toBe('2026-11-07T20:00');
    expect(fromUtcIso(inferDueDate('后天语文背诵', now).iso)).toBe('2026-11-08T20:00');
    expect(inferDueDate('今天交', now).label).toBe('今天');
  });

  it('周几与下周', () => {
    expect(localDayKey(inferDueDate('下周一前交物理报告', now).iso!)).toBe('2026-11-09');
    expect(localDayKey(inferDueDate('周日交英语', now).iso!)).toBe('2026-11-08');
  });

  it('绝对日期', () => {
    expect(localDayKey(inferDueDate('11月10日交化学', now).iso!)).toBe('2026-11-10');
    expect(inferDueDate('12/25 前完成', now).label).toContain('12月25日');
  });

  it('识别不到时返回 null 而不是乱猜', () => {
    expect(inferDueDate('数学练习册', now).iso).toBeNull();
    expect(inferDueDate('数学练习册', now).label).toBe('未识别到时间');
  });
});

describe('本地分点降级', () => {
  it('按行拆分并补科目前缀', () => {
    const items = localSplit('数学试卷\n英语听写\n语文背诵');
    expect(items).toHaveLength(3);
    expect(items[0]).toContain('数学');
  });

  it('单行按作业关键词切分', () => {
    const items = localSplit('语文一张试卷，三个练习册，数学完成习题1-10');
    expect(items.length).toBeGreaterThan(1);
  });

  it('空内容返回空数组', () => {
    expect(localSplit('   ')).toEqual([]);
  });
});

describe('toCaptureItems', () => {
  it('生成带科目与截止的可勾选预览项', () => {
    const items = toCaptureItems(['明天交数学卷子', '英语听写'], now);
    expect(items).toHaveLength(2);
    expect(items[0].subject).toBe('数学');
    expect(items[0].checked).toBe(true);
    expect(items[0].dueDate).not.toBeNull();
    expect(items[1].dueDate).toBeNull();
  });

  it('过滤空行', () => {
    expect(toCaptureItems(['', '  ', '数学练习'], now)).toHaveLength(1);
  });
});

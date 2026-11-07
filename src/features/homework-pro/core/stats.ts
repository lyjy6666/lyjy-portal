import type { ProTask } from './types';
import { localDayKey, dayDiff, isLate, bucketByDue } from './date';
import { subjectOf } from './grouping';

export type TrendPoint = { day: string; completed: number; created: number };
export type HeatCell = { day: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

function dayAt(now: Date, offset: number): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() + offset);
  return localDayKey(d);
}

/**
 * 完成时间的唯一口径：优先 Pro 专属 completedAt，缺失时回退 updatedAt。
 * 旧版趋势/热力图/连续天数用回退，但「迟交」统计与筛选只看 completedAt，
 * 导致同一条作业在统计页既算完成又不算迟交。
 */
export function completionTimeOf(t: ProTask): string | null {
  return t.meta.completedAt || (t.completed ? t.updatedAt : null);
}

/** 近 N 天完成 / 新建趋势（recharts 用） */
export function completionTrend(tasks: ProTask[], days = 30, now = new Date()): TrendPoint[] {
  const completed = new Map<string, number>();
  const created = new Map<string, number>();
  for (const t of tasks) {
    const c = completionTimeOf(t);
    if (c) {
      const k = localDayKey(c);
      completed.set(k, (completed.get(k) ?? 0) + 1);
    }
    created.set(localDayKey(t.createdAt), (created.get(localDayKey(t.createdAt)) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, i) => {
    const day = dayAt(now, -(days - 1 - i));
    return { day, completed: completed.get(day) ?? 0, created: created.get(day) ?? 0 };
  });
}

/** GitHub 式热力图（按周对齐，从周日开始） */
export function heatmap(tasks: ProTask[], weeks = 12, now = new Date()): HeatCell[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    const c = completionTimeOf(t);
    if (!c) continue;
    const k = localDayKey(c);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = weeks * 7;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  // 从「本周日往前 12 周」的那个周日起算，保证每列 7 格的星期不错位
  start.setDate(start.getDate() - total - end.getDay());
  return Array.from({ length: ((total + end.getDay() + 6) / 7 | 0) * 7 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const day = localDayKey(d);
    const count = counts.get(day) ?? 0;
    const level: HeatCell['level'] = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4;
    return { day, count, level };
  });
}

/** 连续完成打卡天数（今天没完成则从昨天起算，避免白天显示断签） */
export function streak(tasks: ProTask[], now = new Date()): number {
  const days = new Set<string>();
  for (const t of tasks) {
    const c = completionTimeOf(t);
    if (c) days.add(localDayKey(c));
  }
  let offset = days.has(localDayKey(now)) ? 0 : -1;
  let count = 0;
  while (days.has(dayAt(now, offset)) && count < 400) {
    count += 1;
    offset -= 1;
  }
  return count;
}

/** 某天预计总耗时（分钟）+ 是否超过阈值 */
export function dailyLoad(
  tasks: ProTask[],
  day: string,
  thresholdMin = 180,
): { minutes: number; ratio: number; over: boolean; count: number } {
  const list = tasks.filter((t) => !t.completed && t.dueDate && localDayKey(t.dueDate) === day);
  const minutes = list.reduce((s, t) => s + (t.meta.estimateMin ?? 0), 0);
  return {
    minutes,
    ratio: thresholdMin > 0 ? minutes / thresholdMin : 0,
    over: minutes > thresholdMin,
    count: list.length,
  };
}

/** 汇总数字（今日聚焦 / 统计页共用） */
export function summary(tasks: ProTask[], now = new Date()) {
  const active = tasks.filter((t) => !t.completed);
  const today = localDayKey(now);
  return {
    total: tasks.length,
    active: active.length,
    completed: tasks.length - active.length,
    overdue: active.filter((t) => bucketByDue(t.dueDate, now) === 'overdue').length,
    dueToday: active.filter((t) => t.dueDate && localDayKey(t.dueDate) === today).length,
    late: tasks.filter((t) => t.completed && isLate(completionTimeOf(t), t.dueDate)).length,
    noDue: active.filter((t) => !t.dueDate).length,
    completionRate: tasks.length ? (tasks.length - active.length) / tasks.length : 0,
    streak: streak(tasks, now),
  };
}

/** 考前复习清单：勾了 reviewList 的作业，按科目聚合，纯派生视图 */
export function reviewGroups(tasks: ProTask[]): { subject: string; tasks: ProTask[] }[] {
  const map = new Map<string, ProTask[]>();
  for (const t of tasks.filter((x) => x.meta.reviewList)) {
    const key = subjectOf(t);
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'zh-CN'))
    .map(([subject, list]) => ({ subject, tasks: list }));
}

/** 逾期天数标记（用于行内「逾期 N 天」） */
export function lateLabel(tasks: ProTask, now = new Date()): string | null {
  if (tasks.completed) {
    return isLate(completionTimeOf(tasks), tasks.dueDate) ? '迟交' : null;
  }
  const days = tasks.dueDate ? Math.max(0, -dayDiff(tasks.dueDate, now)) : 0;
  return days > 0 ? `逾期 ${days} 天` : null;
}

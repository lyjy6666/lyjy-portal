import type { ProTask } from './types';
import { localDayKey, dayDiff } from './date';
import { subjectOf } from './grouping';

export type Milestone = {
  id: string;
  title: string;
  desc: string;
  reached: boolean;
  progress: number; // 0..1
  icon: 'flag' | 'flame' | 'star' | 'trophy' | 'book' | 'sun';
};

/** 连续完成天数（含今天或从昨天起算） */
export function streakDays(tasks: ProTask[], now = new Date()): number {
  const days = new Set<string>();
  for (const t of tasks) {
    const c = t.meta.completedAt || (t.completed ? t.updatedAt : null);
    if (c) days.add(localDayKey(c));
  }
  let offset = days.has(localDayKey(now)) ? 0 : -1;
  let count = 0;
  while (count < 400) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (!days.has(localDayKey(d))) break;
    count += 1;
    offset -= 1;
  }
  return count;
}

/** 学科分布（按未完成 + 已完成全量统计） */
export function subjectDistribution(tasks: ProTask[]): { subject: string; total: number; done: number }[] {
  const map = new Map<string, { total: number; done: number }>();
  for (const t of tasks) {
    const key = subjectOf(t);
    const item = map.get(key) ?? { total: 0, done: 0 };
    item.total += 1;
    if (t.completed) item.done += 1;
    map.set(key, item);
  }
  return [...map.entries()]
    .map(([subject, v]) => ({ subject, ...v }))
    .sort((a, b) => b.total - a.total);
}

/** 近 7 天完成数（进度叙事用） */
export function weeklyCompletion(tasks: ProTask[], now = new Date()): { day: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    const c = t.meta.completedAt || (t.completed ? t.updatedAt : null);
    if (c) counts.set(localDayKey(c), (counts.get(localDayKey(c)) ?? 0) + 1);
  }
  const labels = ['日', '一', '二', '三', '四', '五', '六'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const day = localDayKey(d);
    return { day, label: labels[d.getDay()], count: counts.get(day) ?? 0 };
  });
}

/** 里程碑：只做真实数据，不做虚假的大数字装饰 */
export function computeMilestones(tasks: ProTask[], now = new Date()): Milestone[] {
  const done = tasks.filter((t) => t.completed).length;
  const streak = streakDays(tasks, now);
  const todayDone = tasks.filter((t) => {
    const c = t.meta.completedAt || (t.completed ? t.updatedAt : null);
    return c && localDayKey(c) === localDayKey(now);
  }).length;
  const subjects = new Set(tasks.map(subjectOf)).size;
  const firstDay = tasks.length ? tasks.reduce((min, t) => t.createdAt < min ? t.createdAt : min, tasks[0].createdAt) : null;
  const daysSinceStart = firstDay ? Math.max(0, -dayDiff(firstDay, now)) : 0;

  const make = (id: string, title: string, desc: string, current: number, target: number, icon: Milestone['icon']): Milestone => ({
    id, title, desc, reached: current >= target,
    progress: Math.min(1, current / target), icon,
  });

  return [
    make('first', '开始记录', '添加第一条作业', tasks.length, 1, 'flag'),
    make('done10', '小有成就', '累计完成 10 项作业', done, 10, 'star'),
    make('done50', '稳步前进', '累计完成 50 项作业', done, 50, 'trophy'),
    make('streak3', '连续三天', '连续 3 天有完成记录', streak, 3, 'flame'),
    make('streak7', '一周不断', '连续 7 天有完成记录', streak, 7, 'flame'),
    make('day5', '高效一天', '单日完成 5 项作业', todayDone, 5, 'sun'),
    make('subjects', '全面开花', '记录过 5 个科目的作业', subjects, 5, 'book'),
    make('month', '陪伴一个月', '使用满 30 天', daysSinceStart, 30, 'flag'),
  ];
}

/** 本周进度叙事文案（避免空泛鼓励） */
export function weeklyNarrative(tasks: ProTask[], now = new Date()): string {
  const week = weeklyCompletion(tasks, now);
  const total = week.reduce((s, d) => s + d.count, 0);
  const best = week.reduce((a, b) => (b.count > a.count ? b : a), week[0]);
  if (total === 0) return '这一周还没有完成记录。从最上面那条作业开始就好。';
  if (best.count >= 3) return `这一周完成了 ${total} 项，周${best.label}最集中（${best.count} 项）——那天状态不错。`;
  return `这一周完成了 ${total} 项，节奏比较平均。`;
}

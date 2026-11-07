import type { PlannerDay, PlannerDraft, PlannerItem } from './types';
import { localDayKey, dayEndIso } from './date';

/** 「份」：3 = 正常一天；与旧版容量语义一致 */
export const DEFAULT_DAY_CAPACITY = 3;
const LOCAL_SEARCH_ROUNDS = 400;

const weight = (item: PlannerItem) => Math.max(0.5, item.difficulty);

function dateOf(startDate: string, index: number): string {
  const [y, m, d] = startDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + index);
  return localDayKey(dt);
}

function spreadOf(days: PlannerDay[]): number {
  const ratios = days.filter((d) => d.capacity > 0).map((d) => d.load / d.capacity);
  if (!ratios.length) return 0;
  return Math.max(...ratios) - Math.min(...ratios);
}

function recalcLoads(days: PlannerDay[]): void {
  for (const day of days) day.load = day.items.reduce((s, i) => s + weight(i), 0);
}

/**
 * 智能排期（从旧版 HomeworkPlanner.tsx 抽出的纯逻辑，算法行为一致）。
 * 1) LPT 贪心：难度降序，放入负载率最低的一天（并列随机打破）。
 * 2) 400 次随机局部搜索（移动 / 交换），**带快照回滚**，仅当极差严格变小时接受。
 * capacity<=0 的天完全不排。传入 random 便于单测确定性复现。
 */
export function distribute(
  items: PlannerItem[],
  dayCount: number,
  startDate: string,
  dayCapacity: number[],
  random: () => number = Math.random,
): PlannerDay[] {
  const n = Math.max(1, Math.min(60, Math.floor(dayCount)));
  const caps = Array.from({ length: n }, (_, i) => Math.max(0, dayCapacity[i] ?? DEFAULT_DAY_CAPACITY));
  const days: PlannerDay[] = caps.map((capacity, index) => ({
    index,
    date: dateOf(startDate, index),
    items: [],
    load: 0,
    capacity,
  }));
  // 保持对象引用不变，回滚时只替换 items/load
  const usable = days.filter((d) => d.capacity > 0);
  if (!usable.length) return days;

  const sorted = [...items].sort((a, b) => b.difficulty - a.difficulty);
  for (const item of sorted) {
    let target = usable[0];
    let bestRatio = target.load / target.capacity;
    for (const day of usable) {
      const ratio = day.load / day.capacity;
      if (ratio < bestRatio - 1e-9 || (Math.abs(ratio - bestRatio) < 1e-9 && random() < 0.5)) {
        target = day;
        bestRatio = ratio;
      }
    }
    target.items.push(item);
    target.load += weight(item);
  }

  if (usable.length < 2) return days;

  let best = spreadOf(days);
  for (let round = 0; round < LOCAL_SEARCH_ROUNDS && best > 1e-9; round++) {
    const from = usable[Math.floor(random() * usable.length)];
    const to = usable[Math.floor(random() * usable.length)];
    if (from === to || !from.items.length) continue;

    const idx = Math.floor(random() * from.items.length);
    const moved = from.items[idx];
    const snapshot = days.map((d) => ({ items: [...d.items], load: d.load }));
    const before = best;

    if (random() < 0.5) {
      from.items.splice(idx, 1);
      to.items.push(moved);
    } else {
      if (!to.items.length) continue;
      const j = Math.floor(random() * to.items.length);
      from.items[idx] = to.items[j];
      to.items[j] = moved;
    }

    recalcLoads(days);
    const after = spreadOf(days);
    if (after < before) {
      best = after;
    } else {
      days.forEach((d, i) => {
        d.items = snapshot[i].items;
        d.load = snapshot[i].load;
      });
      best = before;
    }
  }

  return days;
}

/** 排期结果 → 新建任务输入（截止时间取当天本地 23:59，不再被当 UTC 00:00） */
export function planToTaskInputs(plan: PlannerDay[]): { text: string; dueDate: string | null }[] {
  return plan.flatMap((day) =>
    day.items.map((item) => ({ text: item.name, dueDate: dayEndIso(day.date) })),
  );
}

/** 复制方案为可读文本 */
export function formatPlanText(plan: PlannerDay[]): string {
  const lines = plan.map((day) => {
    const names = day.items.map((i) => i.name).join('、') || '（休息）';
    return `${day.date}（负载 ${day.load.toFixed(1)}/${day.capacity}）：${names}`;
  });
  return `作业排期方案\n${lines.join('\n')}`;
}

export function emptyDraft(startDate: string): PlannerDraft {
  return { items: [], dayCount: 7, startDate, dayCapacity: [] };
}

/** 旧版容量迁移换算 */
export function migrateCapacity(legacy: number[]): number[] {
  return legacy.map((v) => Math.round(v * 3 * 2) / 2);
}

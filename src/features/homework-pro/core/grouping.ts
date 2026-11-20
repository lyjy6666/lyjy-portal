import type { ProTask } from './types';
import { TIME_BUCKETS } from './types';
import { OTHER_SUBJECT, extractSubject, subjectColorIndex } from './subject';
import { bucketByDue, localDayKey } from './date';

export type TaskGroup<T = ProTask> = {
  id: string;
  label: string;
  tone?: string;
  colorIndex?: number;
  tasks: T[];
};

const PRIORITY_WEIGHT: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

/** 统一排序：置顶 > 未完成 > 手动顺序 > 优先级 > 截止时间 */
export function sortTasks(tasks: ProTask[]): ProTask[] {
  return [...tasks].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    // 拖拽写入的 order 必须优先于自动的优先级/截止时间，否则拖完立刻被复原
    const oa = a.meta.order;
    const ob = b.meta.order;
    if (oa !== undefined && ob !== undefined && oa !== ob) return oa - ob;
    if (oa !== undefined && ob === undefined) return -1;
    if (oa === undefined && ob !== undefined) return 1;
    const pa = PRIORITY_WEIGHT[a.meta.priority ?? 'normal'] ?? 2;
    const pb = PRIORITY_WEIGHT[b.meta.priority ?? 'normal'] ?? 2;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1;
    return 0;
  });
}

export function subjectOf(task: ProTask): string {
  return task.meta.subject || extractSubject(task.text);
}

export function groupBySubject(tasks: ProTask[]): TaskGroup[] {
  const map = new Map<string, ProTask[]>();
  for (const task of tasks) {
    const key = subjectOf(task);
    const list = map.get(key) ?? [];
    list.push(task);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => {
      if (a[0] === OTHER_SUBJECT) return 1;
      if (b[0] === OTHER_SUBJECT) return -1;
      return b[1].length - a[1].length || a[0].localeCompare(b[0], 'zh-CN');
    })
    .map(([id, list]) => ({
      id,
      label: id,
      colorIndex: subjectColorIndex(id),
      tasks: sortTasks(list),
    }));
}

export function groupByTime(tasks: ProTask[], now: Date = new Date()): TaskGroup[] {
  const map = new Map<string, ProTask[]>();
  for (const task of tasks) {
    const key = bucketByDue(task.dueDate, now);
    const list = map.get(key) ?? [];
    list.push(task);
    map.set(key, list);
  }
  return TIME_BUCKETS
    .filter((bucket) => (map.get(bucket.id)?.length ?? 0) > 0)
    .map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      tone: bucket.tone,
      tasks: sortTasks(map.get(bucket.id) ?? []),
    }));
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: '紧急', high: '高', normal: '普通', low: '低',
};

export function groupByPriority(tasks: ProTask[]): TaskGroup[] {
  const order = ['urgent', 'high', 'normal', 'low'];
  return order
    .map((id) => ({
      id,
      label: PRIORITY_LABELS[id],
      tasks: sortTasks(tasks.filter((t) => (t.meta.priority ?? 'normal') === id)),
    }))
    .filter((g) => g.tasks.length > 0);
}

export function groupByStatus(tasks: ProTask[]): TaskGroup[] {
  // 只列真实存在的两种状态。旧版硬编码一个永远为空的「进行中」列，
  // 拖进去会被 onDrop 当成 completed:false，任务跳回待完成列。
  return [
    { id: 'todo', label: '待完成', tasks: sortTasks(tasks.filter((t) => !t.completed)) },
    { id: 'done', label: '已完成', tasks: sortTasks(tasks.filter((t) => t.completed)) },
  ];
}

/** 看板列：按状态 / 科目 / 优先级 */
export function boardGroups(tasks: ProTask[], by: 'status' | 'subject' | 'priority'): TaskGroup[] {
  if (by === 'subject') return groupBySubject(tasks);
  if (by === 'priority') return groupByPriority(tasks);
  return groupByStatus(tasks);
}

/** 日历：某一天的作业（按本地日历日匹配，排除已完成可选） */
export function tasksOnDay(tasks: ProTask[], day: string, includeCompleted = true): ProTask[] {
  return sortTasks(
    tasks.filter((t) => t.dueDate && localDayKey(t.dueDate) === day && (includeCompleted || !t.completed)),
  );
}

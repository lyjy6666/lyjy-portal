import type { FilterState, ProTask } from './types';
import { subjectOf } from './grouping';
import { bucketByDue, localDayKey } from './date';
import { completionTimeOf } from './stats';

/** 全局搜索 / 组合筛选，纯函数 */
export function filterTasks(tasks: ProTask[], filter: FilterState, now: Date = new Date()): ProTask[] {
  const query = filter.query.trim().toLowerCase();

  return tasks.filter((task) => {
    if (query) {
      const haystack = [
        task.text,
        task.meta.note ?? '',
        subjectOf(task),
        ...(task.meta.tags ?? []),
        ...(task.meta.subtasks ?? []).map((s) => s.text),
      ].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filter.subjects.length && !filter.subjects.includes(subjectOf(task))) return false;
    if (filter.tags.length && !(task.meta.tags ?? []).some((t) => filter.tags.includes(t))) return false;
    if (filter.priorities.length && !filter.priorities.includes(task.meta.priority ?? 'normal')) return false;
    if (filter.reviewOnly && !task.meta.reviewList) return false;

    switch (filter.status) {
      case 'active': if (task.completed) return false; break;
      case 'completed': if (!task.completed) return false; break;
      case 'overdue': if (task.completed || bucketByDue(task.dueDate, now) !== 'overdue') return false; break;
      case 'late': {
        // 与统计页同一完成时间口径，离线补传/旧数据没有 completedAt 时也要能筛出来
        const c = completionTimeOf(task);
        if (!task.dueDate || !c) return false;
        if (new Date(c).getTime() <= new Date(task.dueDate).getTime()) return false;
        break;
      }
      default: break;
    }

    if (filter.from && (!task.dueDate || localDayKey(task.dueDate) < filter.from)) return false;
    if (filter.to && (!task.dueDate || localDayKey(task.dueDate) > filter.to)) return false;

    return true;
  });
}

export function collectFacets(tasks: ProTask[]): { subjects: string[]; tags: string[] } {
  const subjects = new Set<string>();
  const tags = new Set<string>();
  for (const t of tasks) {
    subjects.add(subjectOf(t));
    (t.meta.tags ?? []).forEach((tag) => tags.add(tag));
  }
  return {
    subjects: [...subjects].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    tags: [...tags].sort((a, b) => a.localeCompare(b, 'zh-CN')),
  };
}

export function isFilterActive(filter: FilterState): boolean {
  return Boolean(
    filter.query || filter.subjects.length || filter.tags.length || filter.priorities.length ||
    filter.status !== 'all' || filter.reviewOnly || filter.from || filter.to,
  );
}

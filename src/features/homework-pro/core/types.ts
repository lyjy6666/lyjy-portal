/**
 * 作业系统 Pro 版——唯一类型真源。
 *
 * 旧版在 page.tsx / CalendarDialog.tsx 各写了一份 Task，且 dueDate 在
 * Date 与 string 之间混用，导致 6 处 `instanceof Date ? d : new Date(d)` 兜底。
 * 这里统一：云端往返一律 ISO UTC 字符串，UI 显示时才转本地。
 */

export type Priority = 'urgent' | 'high' | 'normal' | 'low';
/** 3 套供用户自选的美学方向。编号见 skins/theme.ts */
export type SkinId = 'journal' | 'playful' | 'clarity';
export type ViewMode = 'list' | 'board' | 'calendar' | 'stats' | 'today' | 'review' | 'week' | 'achievements';
export type ListGroupBy = 'subject' | 'time' | 'priority';
export type BoardGroupBy = 'status' | 'subject' | 'priority';
export type DateMode = 'full' | 'dateOnly' | 'timeOnly';

/** 与 GET /api/homework/tasks 的 7 字段白名单逐字段对齐 */
export type BaseTask = {
  id: number;
  text: string;
  completed: boolean;
  dueDate: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type Subtask = { id: string; text: string; done: boolean };
export type RepeatRule = {
  rule: 'daily' | 'weekly' | 'custom';
  weekdays?: number[]; // 0=周日
  until?: string;      // YYYY-MM-DD
};
export type GradeRecord = { score?: number; full?: number; corrected?: boolean };
export type TaskLink = { label: string; url: string };

/**
 * Pro 专属字段，整块存 homework_pro_meta.meta (JSONB)。
 * 铁律：绝不写进 tasks.text —— 否则原版 extractSubject 按科目分组会被打乱。
 */
export type ProMeta = {
  order?: number;
  priority?: Priority;
  subject?: string;            // 覆盖自动推断的科目
  tags?: string[];
  note?: string;
  links?: TaskLink[];
  subtasks?: Subtask[];
  estimateMin?: number;
  actualMin?: number;
  completedAt?: string | null;
  repeat?: RepeatRule;
  notifyLeadMin?: number;
  grade?: GradeRecord;
  reviewList?: boolean;
  /** 服务端 CAS 版本号；客户端只读取，不写入 patch */
  rev?: number;
};

export type ProTask = BaseTask & { meta: ProMeta };

export type UserInfo = { id: number; username: string; token?: string };

export const EMPTY_META: ProMeta = { rev: 0 };

export function makeMeta(patch: Partial<ProMeta> = {}): ProMeta {
  const { rev = 0, ...rest } = patch;
  return { ...rest, rev };
}

/** 新建任务时的临时 id（乐观更新用），不是真实数据库 id */
export type TempId = `tmp:${string}`;
export function isTempId(id: number | string): boolean {
  return typeof id === 'string' && id.startsWith('tmp:');
}

export type TimeBucketId = 'overdue' | 'today' | 'tomorrow' | 'd3' | 'week' | 'later' | 'none';
export const TIME_BUCKETS: { id: TimeBucketId; label: string; tone: string }[] = [
  { id: 'overdue', label: '已逾期', tone: 'red' },
  { id: 'today', label: '今天', tone: 'orange' },
  { id: 'tomorrow', label: '明天', tone: 'amber' },
  { id: 'd3', label: '3 天内', tone: 'yellow' },
  { id: 'week', label: '本周内', tone: 'blue' },
  { id: 'later', label: '更晚', tone: 'slate' },
  { id: 'none', label: '未设截止时间', tone: 'slate' },
];

export type FilterState = {
  query: string;
  subjects: string[];
  tags: string[];
  priorities: Priority[];
  status: 'all' | 'active' | 'completed' | 'overdue' | 'late';
  from?: string;  // YYYY-MM-DD
  to?: string;
  reviewOnly?: boolean;
};

export const DEFAULT_FILTER: FilterState = {
  query: '',
  subjects: [],
  tags: [],
  priorities: [],
  status: 'all',
  reviewOnly: false,
};

export type SyncOp = {
  id: string;
  kind: 'create' | 'update' | 'delete' | 'meta';
  tempId?: string;
  taskId?: number;
  payload?: unknown;
  createdAt: number;
  retries: number;
};

/** 智能排期：沿用旧版 PlannerItem / PlannerDay 契约 */
export type PlannerItem = { id: string; name: string; difficulty: number };
export type PlannerDay = {
  index: number;
  date: string;   // YYYY-MM-DD
  items: PlannerItem[];
  load: number;
  capacity: number;
};
export type PlannerDraft = {
  items: PlannerItem[];
  dayCount: number;
  startDate: string;
  dayCapacity: number[];
};

export type Template = { id: string; name: string; text: string; subject?: string; estimateMin?: number };

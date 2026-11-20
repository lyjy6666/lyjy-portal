/**
 * 日期与时间——全 Pro 版唯一的序列化入口。
 *
 * 旧版有三条互不兼容的写入路径：
 *  · 新建发原始 `datetime-local` 字符串，后端 `new Date(str).toISOString()` 在服务器时区解析
 *    → 北京用户 20:00 变成次日 04:00；
 *  · 编辑把后端 ISO 字符串直接塞进 Date 类型字段 → Date|string 混用；
 *  · 智能排期发 `'YYYY-MM-DD'`，被当 UTC 00:00 → 落在前一天。
 *
 * 这里统一：所有写入都先转 ISO UTC 字符串；所有显示/分组都按浏览器本地日历日。
 * 不引入 date-fns：需求全是本地日历日运算，`Intl` + 这些纯函数足够且可单测。
 */

import type { DateMode, RepeatRule, TimeBucketId } from './types';

type Parts = { y: number; m: number; d: number; h: number; mi: number };

const pad = (n: number) => String(n).padStart(2, '0');

function partsOf(value: string | Date | null | undefined): Parts | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    mi: date.getMinutes(),
  };
}

/** 本地年月日时分 → Date（显式构造，绝不依赖字符串解析的时区歧义） */
function partsToDate(p: Parts): Date {
  return new Date(p.y, p.m - 1, p.d, p.h, p.mi, 0, 0);
}

/**
 * `datetime-local` 值（YYYY-MM-DDTHH:mm）→ ISO UTC 字符串。
 * 按**浏览器本地时区**解析，这是修掉 8 小时偏移的根因。
 */
export function toUtcIso(local: string | null | undefined): string | null {
  if (!local) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!match) {
    // 已是 ISO 或其它可解析格式：交给 Date 兜底
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const p: Parts = {
    y: Number(match[1]), m: Number(match[2]), d: Number(match[3]),
    h: Number(match[4]), mi: Number(match[5]),
  };
  const d = partsToDate(p);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO UTC → `datetime-local` 本地值（回填输入框用） */
export function fromUtcIso(iso: string | null | undefined): string {
  const p = partsOf(iso);
  if (!p) return '';
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}

/** 本地日历日 YYYY-MM-DD */
export function localDayKey(value: string | Date): string {
  const p = partsOf(value) ?? { y: 1970, m: 1, d: 1, h: 0, mi: 0 };
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

export function todayKey(now: Date = new Date()): string {
  return localDayKey(now);
}

/** 某个日历日的本地 23:59 → ISO UTC（智能排期写入用，避免被当 UTC 00:00） */
export function dayEndIso(day: string): string | null {
  return toUtcIso(`${day}T23:59`);
}

/** 本地日历日差：目标日 − 基准日，不受时刻/DST 影响 */
export function dayDiff(target: string | Date, base: string | Date = new Date()): number {
  const a = partsOf(target);
  const b = partsOf(base);
  if (!a || !b) return 0;
  const utcA = Date.UTC(a.y, a.m - 1, a.d);
  const utcB = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((utcA - utcB) / 86_400_000);
}

/** 7 个时间桶；今天但已过时刻也算逾期 */
export function bucketByDue(iso: string | null, now: Date = new Date()): TimeBucketId {
  if (!iso) return 'none';
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return 'none';
  const diff = dayDiff(due, now);
  if (diff < 0) return 'overdue';
  if (diff === 0) return due.getTime() < now.getTime() ? 'overdue' : 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 3) return 'd3';
  if (diff <= 7) return 'week';
  return 'later';
}

export function formatDateTime(iso: string | null | undefined): string {
  const p = partsOf(iso);
  if (!p) return '';
  return `${p.y}/${pad(p.m)}/${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}`;
}

export function formatDay(iso: string | null | undefined): string {
  const p = partsOf(iso);
  if (!p) return '';
  return `${pad(p.m)}月${pad(p.d)}日`;
}

/** 倒计时文案 + 是否紧急（原版 getTimeUntilDue 的纯函数版） */
export function formatRelative(
  iso: string | null,
  now: Date = new Date(),
): { text: string; urgent: boolean; overdue: boolean } {
  if (!iso) return { text: '未设截止时间', urgent: false, overdue: false };
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return { text: '', urgent: false, overdue: false };

  const ms = due.getTime() - now.getTime();
  if (ms < 0) {
    const days = Math.abs(dayDiff(due, now));
    return { text: days > 0 ? `已逾期 ${days} 天` : '已过期', urgent: true, overdue: true };
  }
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return { text: '即将到期', urgent: true, overdue: false };
  if (minutes < 60) return { text: `${minutes} 分钟后到期`, urgent: minutes <= 30, overdue: false };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { text: `${hours} 小时后到期`, urgent: hours <= 6, overdue: false };
  return { text: `${dayDiff(due, now)} 天后到期`, urgent: false, overdue: false };
}

/** 提前量：到期时间 − leadMin 分钟（毫秒时间戳），用于页内提醒调度 */
export function applyLeadTime(iso: string, leadMin: number): number {
  return new Date(iso).getTime() - Math.max(0, leadMin) * 60_000;
}

/** 完成时是否迟交 */
export function isLate(completedAt: string | null | undefined, dueDate: string | null): boolean {
  if (!completedAt || !dueDate) return false;
  const a = new Date(completedAt).getTime();
  const b = new Date(dueDate).getTime();
  return Number.isFinite(a) && Number.isFinite(b) && a > b;
}

/** 逾期天数（未完成时不看 completedAt） */
export function overdueDays(iso: string | null, now: Date = new Date()): number {
  if (!iso) return 0;
  const diff = dayDiff(iso, now);
  if (diff < 0) return -diff;
  if (diff === 0 && new Date(iso).getTime() < now.getTime()) return 1;
  return 0;
}

/**
 * 批量改期三种模式（纯函数，旧版边界逻辑的集中实现）。
 * 返回 null 表示该条应跳过（timeOnly 且原本无截止时间）。
 */
export function combineDateMode(
  originalIso: string | null,
  value: string,
  mode: DateMode,
): string | null {
  if (!value) return null;

  if (mode === 'full') {
    return toUtcIso(value);
  }

  if (mode === 'dateOnly') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const orig = partsOf(originalIso);
    const p: Parts = {
      y: Number(match[1]), m: Number(match[2]), d: Number(match[3]),
      h: orig?.h ?? 0, mi: orig?.mi ?? 0,
    };
    return partsToDate(p).toISOString();
  }

  // timeOnly：必须保留各自日期，原本无截止时间的跳过
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const orig = partsOf(originalIso);
  if (!orig) return null;
  const p: Parts = { y: orig.y, m: orig.m, d: orig.d, h: Number(match[1]), mi: Number(match[2]) };
  return partsToDate(p).toISOString();
}

/** 月历网格：固定 6 行 × 7 列，含上下月补位 */
export function monthGrid(year: number, month: number): { date: Date; dayKey: string; inMonth: boolean }[] {
  const first = new Date(year, month - 1, 1);
  const offset = first.getDay();
  const start = new Date(year, month - 1, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date: d, dayKey: localDayKey(d), inMonth: d.getMonth() === month - 1 };
  });
}

/** 重复规则展开为接下来的若干日期（不写服务端，仅本地生成草稿） */
export function expandRepeat(rule: RepeatRule, fromDay: string, count = 7): string[] {
  const [y, m, d] = fromDay.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const until = rule.until ? new Date(`${rule.until}T23:59:59`) : null;
  const out: string[] = [];
  const cursor = new Date(start);

  for (let guard = 0; guard < 400 && out.length < count; guard++) {
    cursor.setDate(cursor.getDate() + 1);
    if (until && cursor > until) break;
    const wd = cursor.getDay();
    const hit =
      rule.rule === 'daily' ||
      (rule.rule === 'weekly' && wd === start.getDay()) ||
      (rule.rule === 'custom' && (rule.weekdays ?? []).includes(wd));
    if (hit) out.push(localDayKey(cursor));
  }
  return out;
}

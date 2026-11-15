import type { ReactNode } from 'react';
import { SITE_RELEASES } from '@/components/home/VersionDialog';
import { RELEASES as SEARCH_RELEASES } from '@/components/search-b/ChangelogModal';
import { HOMEWORK_PRO_RELEASES } from '@/features/homework-pro/ui/dialogs/releases';

/**
 * 全站更新记录聚合（第一版）。
 *
 * 现在只是把三个模块已有的数据读进来做统一视图，不改各模块自己的记录。
 * 第二步再把这些数据从组件里抽到 data/ 下，避免组件与数据耦合。
 */

export type ChangelogSource = 'portal' | 'homework' | 'search';

export const SOURCE_META: Record<ChangelogSource, { name: string; color: string; href: string; hint: string }> = {
  portal: { name: '门户', color: '#38bdf8', href: '/', hint: '导航系统与整体版本' },
  homework: { name: '作业 Pro', color: '#fbbf24', href: '/homework/pro/updates', hint: '作业管理系统 Pro 版' },
  search: { name: '搜索 Pro', color: '#a78bfa', href: '/search/pro', hint: '搜索起始页 Pro 版' },
};

export type UnifiedEntry = {
  id: string;
  /** YYYY-MM-DD，用于排序与按天分组 */
  date: string;
  source: ChangelogSource;
  version: string;
  tag?: string;
  items: ReactNode[];
  latest?: boolean;
};

const toIsoDate = (raw: string) => raw.replace(/\./g, '-');

const build = (
  source: ChangelogSource,
  rows: { version: string; date: string; tag?: string; items: ReactNode[]; latest?: boolean }[],
): UnifiedEntry[] =>
  rows.map((r) => ({
    id: `${source}-${r.version}-${r.date}`,
    date: toIsoDate(r.date),
    source,
    version: r.version,
    tag: r.tag,
    items: r.items,
    latest: r.latest,
  }));

/** 按日期倒序；同一天保持「门户 → 作业 → 搜索」的顺序 */
export const UNIFIED_CHANGELOG: UnifiedEntry[] = [
  ...build('portal', SITE_RELEASES),
  ...build('homework', HOMEWORK_PRO_RELEASES),
  ...build('search', SEARCH_RELEASES),
].sort((a, b) => b.date.localeCompare(a.date));

/** 按天分组后的结构，供时间轴渲染 */
export function groupByDay(entries: UnifiedEntry[]): { date: string; items: UnifiedEntry[] }[] {
  const map = new Map<string, UnifiedEntry[]>();
  for (const e of entries) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return Array.from(map, ([date, items]) => ({ date, items }));
}

const SEEN_KEY = 'lyjy_changelog_seen';

export function latestChangelogDate(): string {
  return UNIFIED_CHANGELOG[0]?.date ?? '';
}

export function hasUnreadChangelog(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const seen = localStorage.getItem(SEEN_KEY) ?? '';
    return latestChangelogDate() > seen;
  } catch {
    return false;
  }
}

export function markChangelogSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SEEN_KEY, latestChangelogDate());
  } catch {
    /* 忽略 */
  }
}

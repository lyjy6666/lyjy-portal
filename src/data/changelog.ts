import type { ReactNode } from 'react';
import { SITE_RELEASES } from '@/components/home/VersionDialog';
import { RELEASES as SEARCH_PRO_RELEASES } from '@/components/search-b/ChangelogModal';
import { HOMEWORK_PRO_RELEASES } from '@/features/homework-pro/ui/dialogs/releases';
import { buildHomeReleases } from '@/app/home/page';
import { HOMEWORK_RELEASES } from '@/app/homework/page';
import { SEARCH_RELEASES as SEARCH_ORIGINAL_RELEASES } from '@/app/search/page';
import { MOVIE_RELEASES } from '@/app/movie/page';
import { TOOLBOX_RELEASES } from '@/app/toolbox/page';

/**
 * 全站更新记录聚合（第二版：补全所有来源 + 正确排序）。
 *
 * 各模块自己的数据没有搬走，这里只读它们的常量；
 * 下一步再把这些数据从页面里抽到 data/ 下，避免页面与数据耦合。
 */

export type ChangelogSource = 'portal' | 'home' | 'homework' | 'search' | 'movie' | 'toolbox';

export const SOURCE_META: Record<ChangelogSource, { name: string; color: string; href: string }> = {
  portal: { name: '门户', color: '#38bdf8', href: '/' },
  home: { name: '主页', color: '#34d399', href: '/home' },
  homework: { name: '作业', color: '#fbbf24', href: '/homework/pro/updates' },
  search: { name: '搜索', color: '#a78bfa', href: '/search/pro' },
  movie: { name: '影视', color: '#f472b6', href: '/movie' },
  toolbox: { name: '工具箱', color: '#22d3ee', href: '/toolbox' },
};

export type UnifiedEntry = {
  id: string;
  /** 统一成 YYYY-MM-DD，用于按天分组 */
  date: string;
  /** 排序用的时间戳 */
  ts: number;
  source: ChangelogSource;
  version: string;
  tag?: string;
  items: ReactNode[];
  latest?: boolean;
};

/** 日期格式很杂：2026.11.7 / 2026-11-13 / 2026.10-11 —— 统一解析成时间戳 */
function parseDate(raw: string): { iso: string; ts: number } {
  const m = raw.match(/(\d{4})\D+(\d{1,2})(?:\D+(\d{1,2}))?/);
  if (!m) return { iso: raw, ts: 0 };
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3] ?? 1);
  const ts = Date.UTC(y, mo - 1, d);
  const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { iso, ts };
}

const build = (
  source: ChangelogSource,
  rows: { version: string; date: string; tag?: string; items: ReactNode[]; latest?: boolean }[],
): UnifiedEntry[] =>
  rows.map((r) => {
    const { iso, ts } = parseDate(r.date);
    return {
      id: `${source}-${r.version}-${iso}`,
      date: iso,
      ts,
      source,
      version: r.version,
      tag: r.tag,
      items: r.items,
      latest: r.latest,
    };
  });

/** 按时间倒序；同一时刻按来源稳定排列 */
export const UNIFIED_CHANGELOG: UnifiedEntry[] = [
  ...build('portal', SITE_RELEASES),
  ...build('home', buildHomeReleases(() => {})),
  ...build('homework', HOMEWORK_PRO_RELEASES),
  ...build('homework', HOMEWORK_RELEASES),
  ...build('search', SEARCH_PRO_RELEASES),
  ...build('search', SEARCH_ORIGINAL_RELEASES),
  ...build('movie', MOVIE_RELEASES),
  ...build('toolbox', TOOLBOX_RELEASES),
].sort((a, b) => b.ts - a.ts);

/** 按天分组，保持传入顺序（已按时间倒序） */
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
    return latestChangelogDate() > (localStorage.getItem(SEEN_KEY) ?? '');
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

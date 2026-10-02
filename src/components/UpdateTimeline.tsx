'use client';

import type { ReactNode } from 'react';

/**
 * 全站统一的「版本历史」时间轴。
 *
 * 各页面的更新记录弹窗外壳（遮罩 / 标题 / 关闭按钮）仍由各自页面负责，
 * 这里只负责版本列表本身，保证全站观感一致。
 */

export type Release = {
  version: string;
  date: string;
  /** 版本标签，如「重磅更新」 */
  tag?: string;
  /** 是否为最新版本（高亮显示） */
  latest?: boolean;
  /** 条目内容。纯文本或 ReactNode（需要内嵌链接/按钮时用） */
  items: ReactNode[];
};

type Tone = 'dark' | 'light';

const palette: Record<
  Tone,
  {
    line: string;
    dotLatest: string;
    dotNormal: string;
    cardLatest: string;
    cardNormal: string;
    versionLatest: string;
    versionNormal: string;
    latestChip: string;
    tagChip: string;
    date: string;
    itemText: string;
    itemDotLatest: string;
    itemDotNormal: string;
  }
> = {
  dark: {
    line: 'border-white/10',
    dotLatest: 'bg-sky-400 ring-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.85)]',
    dotNormal: 'bg-slate-600 ring-slate-800/60',
    cardLatest:
      'border-sky-400/30 bg-gradient-to-br from-sky-500/[0.10] to-purple-500/[0.05] shadow-[0_0_28px_-10px_rgba(56,189,248,0.65)]',
    cardNormal: 'border-white/[0.06] bg-white/[0.02]',
    versionLatest: 'text-white',
    versionNormal: 'text-slate-300',
    latestChip: 'bg-sky-400/15 text-sky-300',
    tagChip: 'bg-purple-500/20 text-purple-200',
    date: 'text-slate-500',
    itemText: 'text-slate-400',
    itemDotLatest: 'bg-sky-400/80',
    itemDotNormal: 'bg-slate-600',
  },
  light: {
    line: 'border-gray-200 dark:border-gray-700',
    dotLatest: 'bg-blue-500 ring-blue-500/15 shadow-[0_0_12px_rgba(59,130,246,0.55)]',
    dotNormal: 'bg-gray-300 ring-gray-100 dark:bg-slate-600 dark:ring-slate-800',
    cardLatest:
      'border-blue-400/40 bg-gradient-to-br from-blue-50 to-purple-50 shadow-[0_0_28px_-12px_rgba(59,130,246,0.5)] dark:border-blue-500/30 dark:from-blue-950/40 dark:to-purple-950/30',
    cardNormal: 'border-gray-200 bg-gray-50/60 dark:border-white/[0.06] dark:bg-white/[0.02]',
    versionLatest: 'text-gray-900 dark:text-white',
    versionNormal: 'text-gray-700 dark:text-slate-300',
    latestChip: 'bg-blue-500/10 text-blue-600 dark:bg-sky-400/15 dark:text-sky-300',
    tagChip: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-200',
    date: 'text-gray-400 dark:text-slate-500',
    itemText: 'text-gray-600 dark:text-slate-400',
    itemDotLatest: 'bg-blue-500/80 dark:bg-sky-400/80',
    itemDotNormal: 'bg-gray-300 dark:bg-slate-600',
  },
};

export default function UpdateTimeline({
  releases,
  tone = 'dark',
  className = '',
}: {
  releases: Release[];
  tone?: Tone;
  className?: string;
}) {
  const p = palette[tone];

  return (
    <ol className={`relative ml-1 space-y-3 border-l pl-5 ${p.line} ${className}`}>
      {releases.map((release) => (
        <li key={`${release.version}-${release.date}`} className="relative">
          {/* 时间轴圆点 */}
          <span
            className={`absolute -left-[26px] top-[18px] h-2.5 w-2.5 rounded-full ring-4 ${
              release.latest ? p.dotLatest : p.dotNormal
            }`}
          />

          <div className={`rounded-xl border px-4 py-3 ${release.latest ? p.cardLatest : p.cardNormal}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm font-semibold ${release.latest ? p.versionLatest : p.versionNormal}`}>
                {release.version}
              </span>
              {release.latest && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.latestChip}`}>最新</span>
              )}
              {release.tag && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.tagChip}`}>
                  {release.tag}
                </span>
              )}
              <span className={`ml-auto font-mono text-[11px] tracking-wide ${p.date}`}>{release.date}</span>
            </div>

            <ul className="mt-2 space-y-1.5">
              {release.items.map((item, i) => (
                <li key={i} className={`flex gap-2 text-xs leading-relaxed ${p.itemText}`}>
                  <span
                    className={`mt-[6px] h-1 w-1 shrink-0 rounded-full ${
                      release.latest ? p.itemDotLatest : p.itemDotNormal
                    }`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}

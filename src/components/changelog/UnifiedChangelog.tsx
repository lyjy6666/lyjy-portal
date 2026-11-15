'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  UNIFIED_CHANGELOG,
  SOURCE_META,
  groupByDay,
  markChangelogSeen,
  hasUnreadChangelog,
  type ChangelogSource,
} from '@/data/changelog';

type Filter = 'all' | ChangelogSource;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'portal', label: '门户' },
  { key: 'homework', label: '作业 Pro' },
  { key: 'search', label: '搜索 Pro' },
];

/**
 * 全站更新记录统一视图（第一版）。
 * 只做「索引 + 最近变化」，详情仍回各模块；不改各模块自己的记录。
 */
export default function UnifiedChangelog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (open) markChangelogSeen();
  }, [open]);

  const entries = useMemo(
    () => (filter === 'all' ? UNIFIED_CHANGELOG : UNIFIED_CHANGELOG.filter((e) => e.source === filter)),
    [filter],
  );
  const groups = useMemo(() => groupByDay(entries), [entries]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: UNIFIED_CHANGELOG.length };
    for (const e of UNIFIED_CHANGELOG) c[e.source] = (c[e.source] ?? 0) + 1;
    return c;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[82vh] overflow-y-auto border-white/10 bg-slate-950/95 text-white sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="text-base">更新记录</DialogTitle>
          <DialogDescription className="text-slate-400">
            全站所有模块合并在这里，按时间倒序。这里只是索引，各模块的完整记录仍在自己那边。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition ${
                  active
                    ? 'border-white/30 bg-white text-slate-900'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                }`}
              >
                {f.label}
                <span className={active ? 'text-slate-500' : 'text-slate-500'}>{counts[f.key] ?? 0}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.date}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] tracking-wide text-slate-500">
                  {g.date.replace(/-/g, '.')}
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <div className="mt-2 space-y-2.5">
                {g.items.map((e) => {
                  const meta = SOURCE_META[e.source];
                  return (
                    <article key={e.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px]"
                          style={{
                            color: meta.color,
                            background: `${meta.color}1a`,
                            border: `1px solid ${meta.color}33`,
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                          {meta.name}
                        </span>
                        <span className="text-sm font-semibold">{e.version}</span>
                        {e.latest ? (
                          <span className="rounded-full bg-sky-400/15 px-1.5 py-0.5 text-[10px] text-sky-300">最新</span>
                        ) : null}
                        {e.tag ? (
                          <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-200">
                            {e.tag}
                          </span>
                        ) : null}
                      </div>

                      <ul className="mt-2 space-y-1">
                        {e.items.map((item, i) => (
                          <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[11px] text-slate-500">想看某个模块的完整记录：</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <Link href="/homework/pro/updates" className="text-xs text-amber-300 hover:text-amber-200">
              作业 Pro ↗
            </Link>
            <Link href="/search/pro" className="text-xs text-violet-300 hover:text-violet-200">
              搜索 Pro ↗
            </Link>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs text-sky-300 hover:text-sky-200"
            >
              关闭
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** 入口上的未读小红点：有比上次访问更新的记录时显示 */
export function ChangelogUnreadDot() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(hasUnreadChangelog());
  }, []);
  if (!on) return null;
  return (
    <span
      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-slate-950"
      aria-hidden="true"
    />
  );
}

'use client';

import { useState } from 'react';
import { Clapperboard, MessageCircle, Code2, ShoppingBag, Music, Newspaper, ChevronDown, Search } from 'lucide-react';
import { APP_CATEGORIES, initialOf, type AppCategory } from '@/data/searchB';
import AppIcon from './AppIcon';

const ICONS = {
  video: Clapperboard,
  chat: MessageCircle,
  code: Code2,
  bag: ShoppingBag,
  music: Music,
  news: Newspaper,
} as const;

/**
 * 应用 / 书签网格。
 *
 * 修复 A 版 bug：A 版 filteredFolders 匹配了「分类名」，渲染时却又只按「应用名」
 * 二次过滤，导致搜「购物」「游戏」这类分类词时结果空白。这里匹配分类名即展示该分类全部应用。
 */
export default function AppGrid() {
  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const q = filter.trim().toLowerCase();
  const filtered: AppCategory[] = APP_CATEGORIES.map((cat) => {
    const catMatch = !q || cat.name.toLowerCase().includes(q);
    const apps = catMatch ? cat.apps : cat.apps.filter((a) => a.name.toLowerCase().includes(q));
    return { ...cat, apps };
  }).filter((cat) => cat.apps.length > 0);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">网址导航</h2>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="找网站 / 分类"
            className="w-44 rounded-full border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:w-56"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.map((cat) => {
          const Icon = ICONS[cat.icon];
          const isCollapsed = collapsed.has(cat.id);
          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 backdrop-blur-sm"
            >
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                className="flex w-full items-center gap-2 text-left"
              >
                <span
                  className="grid h-6 w-6 place-items-center rounded-lg"
                  style={{ backgroundColor: `${cat.accent}22`, color: cat.accent }}
                >
                  <Icon size={14} />
                </span>
                <span className="text-sm font-medium text-white/85">{cat.name}</span>
                <span className="text-[11px] text-white/35">{cat.apps.length}</span>
                <ChevronDown
                  size={15}
                  className={`ml-auto text-white/35 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                />
              </button>

              {!isCollapsed && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
                  {cat.apps.map((app) => (
                    <a
                      key={app.name}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex w-16 flex-col items-center gap-1.5 transition hover:-translate-y-0.5"
                    >
                      <AppIcon initial={initialOf(app.name)} accent={app.accent} size={38} />
                      <span className="w-full truncate text-center text-[10px] text-white/50 group-hover:text-white/80">
                        {app.name}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-white/35">没有匹配的网站或分类</p>
        )}
      </div>
    </section>
  );
}

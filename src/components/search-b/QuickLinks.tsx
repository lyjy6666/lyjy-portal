'use client';

import { useState } from 'react';
import { Plus, X, Pencil, Check } from 'lucide-react';
import type { QuickLink } from '@/data/searchB';
import { initialOf } from '@/data/searchB';
import AppIcon from './AppIcon';

const PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#ef4444', '#eab308'];
const pickAccent = (s: string) =>
  PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

const normalizeUrl = (u: string) => {
  u = u.trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
};

/**
 * 快速访问：可自定义增删，存 localStorage（由父组件负责持久化）。
 */
export default function QuickLinks({
  links,
  onChange,
}: {
  links: QuickLink[];
  onChange: (links: QuickLink[]) => void;
}) {
  const [managing, setManaging] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const add = () => {
    const n = name.trim();
    const u = normalizeUrl(url);
    if (!n || !u) return;
    onChange([...links, { id: `ql-${Date.now()}`, name: n, url: u, accent: pickAccent(n) }]);
    setName('');
    setUrl('');
  };

  const remove = (id: string) => onChange(links.filter((l) => l.id !== id));

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">快速访问</h2>
        <button
          type="button"
          onClick={() => setManaging((v) => !v)}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-white/50 transition hover:bg-white/10 hover:text-white/80"
        >
          {managing ? <Check size={13} /> : <Pencil size={12} />}
          {managing ? '完成' : '管理'}
        </button>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-4">
        {links.map((link) => (
          <div key={link.id} className="group relative flex flex-col items-center gap-1.5">
            {managing ? (
              <button
                type="button"
                onClick={() => remove(link.id)}
                className="relative"
                aria-label={`删除 ${link.name}`}
              >
                <AppIcon initial={initialOf(link.name)} accent={link.accent} size={44} />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white shadow-lg ring-2 ring-black/40">
                  <X size={12} />
                </span>
              </button>
            ) : (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:-translate-y-0.5"
              >
                <AppIcon initial={initialOf(link.name)} accent={link.accent} size={44} />
              </a>
            )}
            <span className="max-w-[4.5rem] truncate text-[11px] text-white/55">{link.name}</span>
          </div>
        ))}

        {managing && (
          <div className="flex w-full flex-col gap-2 rounded-2xl border border-dashed border-white/15 p-3 sm:flex-row sm:items-center">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名称"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 sm:w-32"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="网址，如 bilibili.com"
              className="w-full flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/25"
            />
            <button
              type="button"
              onClick={add}
              disabled={!name.trim() || !url.trim()}
              className="flex items-center justify-center gap-1 rounded-lg bg-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={15} /> 添加
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

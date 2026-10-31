'use client';

import { ExternalLink } from 'lucide-react';
import { SEARCH_ENGINES, type SearchEngineB } from '@/data/searchB';
import AppIcon from './AppIcon';

/**
 * 搜索引擎选择面板：分组网格，AI 助手单独归类。
 * AI 助手点击后「直接打开」对应网站，不会设为搜索框的引擎，避免用户在搜索框白输。
 */
export default function EnginePicker({
  currentId,
  onSelect,
}: {
  currentId: string;
  onSelect: (id: string) => void;
}) {
  const normal = SEARCH_ENGINES.filter((e) => !e.ai);
  const ai = SEARCH_ENGINES.filter((e) => e.ai);

  const openAi = (e: SearchEngineB) => window.open(e.buildUrl(''), '_blank', 'noopener,noreferrer');

  const renderBtn = (e: SearchEngineB) => (
    <button
      key={e.id}
      type="button"
      onClick={() => (e.ai ? openAi(e) : onSelect(e.id))}
      title={e.ai ? `打开 ${e.name}` : undefined}
      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/10 ${
        !e.ai && e.id === currentId ? 'bg-white/15 ring-1 ring-white/20' : ''
      }`}
    >
      <AppIcon initial={e.initial} accent={e.accent} size={30} />
      <span className="truncate text-sm text-white/90">{e.name}</span>
      {e.ai && <ExternalLink size={13} className="ml-auto shrink-0 text-white/40" />}
    </button>
  );

  return (
    <div
      className="absolute left-0 top-full z-30 mt-2 w-[min(92vw,27rem)] rounded-2xl border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-xl"
      role="listbox"
      aria-label="选择搜索引擎"
    >
      <div className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
        常用引擎
      </div>
      <div className="grid max-h-[42vh] grid-cols-2 gap-1 overflow-y-auto">{normal.map(renderBtn)}</div>
      <div className="mb-1 mt-3 px-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
        AI 助手 · 点击直接打开
      </div>
      <div className="grid grid-cols-2 gap-1">{ai.map(renderBtn)}</div>
    </div>
  );
}

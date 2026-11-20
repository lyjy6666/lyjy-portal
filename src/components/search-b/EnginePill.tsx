'use client';

import { memo } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { getEngine } from '@/data/searchB';

/**
 * 引擎快捷标签。
 * 从 page.tsx 提到模块级，避免每敲一个字就被 React 当成新组件类型全部卸载重建。
 * 同时把 searchB.ts 里一直没接线的 note（如「国内需特殊网络」）显示出来。
 */
function EnginePill({
  id,
  engineId,
  onSelect,
  onOpenAi,
}: {
  id: string;
  engineId: string;
  onSelect: (id: string) => void;
  onOpenAi: (id: string) => void;
}) {
  const e = getEngine(id);
  const active = e.id === engineId;

  return (
    <button
      type="button"
      onClick={() => (e.ai ? onOpenAi(e.id) : onSelect(e.id))}
      title={e.ai ? `打开 ${e.name}` : e.note ?? `切换到 ${e.name}`}
      aria-pressed={e.ai ? undefined : active}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
        active
          ? 'border-white/25 bg-white/15 text-white'
          : 'border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/10 hover:text-white/85'
      }`}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.accent }} />
      {e.name}
      {e.note ? <AlertTriangle size={11} className="text-amber-300/80" aria-hidden="true" /> : null}
      {e.ai ? <ExternalLink size={11} className="opacity-50" /> : null}
    </button>
  );
}

export default memo(EnginePill);

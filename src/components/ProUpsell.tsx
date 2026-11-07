import Link from 'next/link';
import { Sparkles, ArrowUpRight } from 'lucide-react';

/**
 * 原版作业管理系统里的「前往 PRO 版」引导条。
 *
 * 原版是深色主题（slate-900 / slate-800），所以这里不复用 Pro 版的浅色 hw-* 样式，
 * 单独用一套深色配色；所有 AI 功能入口共用这一个组件，文案与按钮保持统一。
 */
export default function ProUpsell({
  hint = 'PRO 版有独立整页、AI 按年级与薄弱项估时、多通道自动降级',
  compact = false,
}: {
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-600/15 via-violet-600/10 to-blue-600/10 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[11px] font-bold text-fuchsia-200">
          <Sparkles className="h-3 w-3" /> PRO 版体验更好
        </span>
        {!compact && <span className="min-w-0 flex-1 text-xs leading-relaxed text-slate-300">{hint}</span>}
        <Link
          href="/homework/pro"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:from-fuchsia-500 hover:to-violet-500 hover:scale-105"
        >
          前往 PRO 版 <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {compact && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{hint}</p>}
    </div>
  );
}

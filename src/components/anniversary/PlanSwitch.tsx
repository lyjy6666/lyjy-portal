'use client';

import Link from 'next/link';

/**
 * 两套方案的对比切换条。
 * 只做比较用；站主选定一套后，把另一套和这个组件一起删掉即可。
 */
const PLANS = [
  { key: 'a', href: '/anniversary', label: '时光机', hint: '走进旧版' },
  { key: 'c', href: '/anniversary/star', label: '星图', hint: '俯瞰 500 天' },
] as const;

export default function PlanSwitch({ current }: { current: 'a' | 'c' }) {
  return (
    <nav
      aria-label="500 天回忆方案切换"
      className="fixed bottom-3 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-slate-950/85 px-1.5 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      <span className="hidden pl-2 pr-1 text-[10px] font-medium tracking-wider text-slate-500 sm:block">方案</span>
      {PLANS.map((plan) => {
        const active = plan.key === current;
        return (
          <Link
            key={plan.key}
            href={plan.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-baseline gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-[10px] text-slate-500">{plan.key.toUpperCase()}</span>
            {plan.label}
            <span className="hidden text-[10px] font-normal text-slate-500 sm:inline">{plan.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}

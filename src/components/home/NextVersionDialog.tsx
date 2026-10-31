'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioLines, Bell, CalendarHeart, Clapperboard, GraduationCap, Rocket, Sparkles, Timer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** 主打栏目（确定上线）——最醒目的大卡片 */
const FEATURED = {
  icon: GraduationCap,
  title: '作业管理系统 Pro 版',
  desc: '全新重构，新旧两版并存，请放心使用',
  tag: '确定上线',
};

/** 3 个次级栏目（有望升级/更新）——更小、浅蓝色 */
const SECONDARY = [
  { icon: AudioLines, title: '语音朗读升级', desc: '更多音色与更强能力', tag: '有望升级' },
  { icon: Timer, title: '番茄钟更新', desc: '功能与体验优化', tag: '有望更新' },
  { icon: Clapperboard, title: '影视资源更新', desc: '播放线路与体验优化', tag: '有望更新' },
];

const NUDGE_KEY = 'nudgeSentV7';
const PAGES = ['7.0 更新', '远期规划'];

export default function NextVersionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // 催更状态：idle 未点 / sending 发送中 / sent 已催更 / error 失败可重试
  const [nudge, setNudge] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  // 当前滑到第几页
  const [page, setPage] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // 每次打开弹窗时读取本地「已催更」记录（每个浏览器只能点一次）
  useEffect(() => {
    if (!open) return;
    setPage(0); // 重新打开时回到第一页（内容会重新挂载，滚动位置自动归零）
    try {
      if (localStorage.getItem(NUDGE_KEY) === '1') setNudge('sent');
    } catch {
      /* localStorage 不可用时忽略 */
    }
  }, [open]);

  // 点击分段 → 平滑滑到对应页
  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  // 滑动后同步当前页（高亮分段）
  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setPage(Math.max(0, Math.min(PAGES.length - 1, i)));
  };

  const handleNudge = async () => {
    if (nudge === 'sending' || nudge === 'sent') return;
    setNudge('sending');
    try {
      const res = await fetch('/api/nudge', { method: 'POST' });
      if (res.ok) {
        try {
          localStorage.setItem(NUDGE_KEY, '1');
        } catch {
          /* 忽略 */
        }
        setNudge('sent');
      } else {
        setNudge('error');
      }
    } catch {
      setNudge('error');
    }
  };

  const nudgeLabel =
    nudge === 'sent'
      ? '已催更，谢谢你的支持！'
      : nudge === 'sending'
        ? '发送中…'
        : nudge === 'error'
          ? '催更失败，点击重试'
          : '催更一下 · 让 V7.0 早点来';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cs-dialog-pop sm:max-w-[600px] bg-slate-900/95 text-white border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* 顶部高光条 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />

        <DialogHeader className="cs-reveal cs-reveal-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Rocket size={17} className="text-sky-400" />
            更新预告
          </DialogTitle>
        </DialogHeader>

        {/* 分段切换：7.0 更新 / 远期规划 */}
        <div className="cs-reveal cs-reveal-1 justify-self-start inline-flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs">
          {PAGES.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => goTo(i)}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                page === i ? 'bg-sky-500/25 text-sky-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 可左右滑动的两页 */}
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex min-w-0 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* 第一页：7.0 更新 */}
          <div className="w-full shrink-0 snap-start space-y-3 py-1">
            <p className="text-[11px] tracking-wide text-slate-500">V7.0 · 预计 11 月中后旬 · 敬请期待</p>

            {/* 主打栏目：确定上线（大卡片） */}
            <div className="relative overflow-hidden rounded-2xl border border-sky-400/40 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-transparent p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-400/25 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-lg shadow-sky-500/40">
                  <FEATURED.icon size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold text-white">{FEATURED.title}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-sky-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      {FEATURED.tag}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-200">{FEATURED.desc}</p>
                </div>
              </div>
            </div>

            {/* 3 个次级栏目 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SECONDARY.map((p) => (
                <div key={p.title} className="rounded-xl border border-sky-400/25 bg-sky-500/[0.09] p-4">
                  <div className="flex items-center gap-2 text-sky-100">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-200">
                      <p.icon size={17} />
                    </span>
                    <span className="min-w-0 truncate text-[13px] font-semibold">{p.title}</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-sky-200/60">{p.desc}</p>
                  <span className="mt-2.5 inline-block rounded-full border border-sky-400/25 px-2 py-0.5 text-[10px] text-sky-300/80">
                    {p.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 第二页：远期规划 */}
          <div className="w-full shrink-0 snap-start space-y-3 py-1">
            <p className="text-[11px] tracking-wide text-slate-500">远期规划 · 里程碑</p>

            <div className="relative overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/20 via-amber-500/[0.08] to-transparent p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/40">
                  <CalendarHeart size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold text-white">网站成立 500 天</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      12 月中旬
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                    届时将会有特殊回忆展示，一起回顾这一路走来的点点滴滴。
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500">
              更多远期计划还在酝酿中，敬请期待。
            </p>
          </div>
        </div>

        <p className="cs-reveal cs-reveal-4 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Sparkles size={12} />
          以上为开发计划，具体内容与时间以实际上线为准。
        </p>

        {/* 催更按钮：每人一次，点击发邮件到站长邮箱 */}
        <button
          type="button"
          onClick={handleNudge}
          disabled={nudge === 'sending' || nudge === 'sent'}
          className={`cs-reveal cs-reveal-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
            nudge === 'sent'
              ? 'border-white/10 bg-white/5 text-slate-400'
              : nudge === 'error'
                ? 'border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
                : 'border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25'
          }`}
        >
          <Bell size={15} className={nudge === 'sent' ? '' : 'text-sky-300'} />
          {nudgeLabel}
        </button>
      </DialogContent>
    </Dialog>
  );
}

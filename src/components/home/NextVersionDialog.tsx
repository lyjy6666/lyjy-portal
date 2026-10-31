'use client';

import { AudioLines, Clapperboard, GraduationCap, Rocket, Sparkles, Timer } from 'lucide-react';
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

export default function NextVersionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cs-dialog-pop sm:max-w-[600px] bg-slate-900/95 text-white border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* 顶部高光条 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />

        <DialogHeader className="cs-reveal cs-reveal-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Rocket size={17} className="text-sky-400" />
            下一代更新预告
          </DialogTitle>
          <p className="text-[11px] tracking-wide text-slate-500">V7.0 · 预计 11 月中后旬 · 敬请期待</p>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 主打栏目：确定上线（大卡片，最突出） */}
          <div className="cs-reveal cs-reveal-2 relative overflow-hidden rounded-2xl border border-sky-400/40 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-transparent p-5">
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

          {/* 3 个次级栏目：浅蓝色系 */}
          <div className="cs-reveal cs-reveal-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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

        <p className="cs-reveal cs-reveal-4 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Sparkles size={12} />
          以上为开发计划，具体内容与时间以实际上线为准。
        </p>
      </DialogContent>
    </Dialog>
  );
}

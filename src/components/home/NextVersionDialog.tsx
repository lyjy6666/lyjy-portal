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

/** 3 个次级栏目（有望升级/更新）——更小、颜色更浅 */
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
      <DialogContent className="sm:max-w-[560px] bg-slate-900/95 text-white border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* 顶部高光条 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Rocket size={17} className="text-sky-400" />
            下一代更新预告
          </DialogTitle>
          <p className="text-[11px] tracking-wide text-slate-500">V7.0 · 筹备中，敬请期待</p>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 主打栏目：确定上线（大卡片，最突出） */}
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

          {/* 3 个次级栏目：更小、颜色更浅 */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {SECONDARY.map((p) => (
              <div key={p.title} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <p.icon size={14} className="shrink-0" />
                  <span className="truncate text-[11px] font-medium">{p.title}</span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{p.desc}</p>
                <span className="mt-2 inline-block rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-slate-500">
                  {p.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Sparkles size={12} />
          以上为开发计划，具体内容与时间以实际上线为准。
        </p>
      </DialogContent>
    </Dialog>
  );
}

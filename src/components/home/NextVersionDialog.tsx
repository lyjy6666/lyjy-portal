'use client';

import { AudioLines, Clapperboard, GraduationCap, Rocket, Sparkles, Timer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** V7.0 下一代更新预告（原 V6.5 更新记录里的「彩蛋预告」搬到这里） */
const PREVIEWS = [
  {
    icon: GraduationCap,
    title: '作业管理系统 Pro 版',
    desc: '全新重构，新旧两版并存，请放心使用',
    tag: '确定上线',
    confirmed: true,
  },
  {
    icon: AudioLines,
    title: '语音朗读系统升级',
    desc: '更多音色与更强能力，正在筹备中',
    tag: '有望升级',
    confirmed: false,
  },
  {
    icon: Timer,
    title: '番茄钟更新',
    desc: '功能与体验优化，正在计划中',
    tag: '有望更新',
    confirmed: false,
  },
  {
    icon: Clapperboard,
    title: '影视资源更新',
    desc: '播放线路与体验优化，正在计划中',
    tag: '有望更新',
    confirmed: false,
  },
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
      <DialogContent className="sm:max-w-[520px] bg-slate-900/95 text-white border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* 顶部高光条 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Rocket size={17} className="text-sky-400" />
            下一代更新预告
          </DialogTitle>
          <p className="text-[11px] tracking-wide text-slate-500">V7.0 · 筹备中，敬请期待</p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {PREVIEWS.map((p) => {
            const confirmed = p.confirmed;
            return (
              <div
                key={p.title}
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  confirmed
                    ? 'border-sky-500/45 bg-sky-500/[0.08]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    confirmed ? 'bg-sky-500/25 text-sky-200' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <p.icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{p.title}</span>
                    {confirmed ? (
                      // 确定上线：实心渐变高亮，最醒目
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm shadow-sky-500/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        {p.tag}
                      </span>
                    ) : (
                      // 有望升级 / 有望更新：低调描边，弱化
                      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-slate-400">
                        {p.tag}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-xs leading-relaxed ${
                      confirmed ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Sparkles size={12} />
          以上为开发计划，具体内容与时间以实际上线为准。
        </p>
      </DialogContent>
    </Dialog>
  );
}

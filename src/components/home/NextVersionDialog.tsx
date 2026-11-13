'use client';

import { useEffect, useState } from 'react';
import { Bell, CalendarHeart, Newspaper, Rocket, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * 更新预告：V7.0 已正式上线，这一页只讲「下一代（版本号未定）」。
 * 两个方向：500 天纪念日、AI 资讯。
 */

/** AI 资讯方向的同义 / 邻近表述，让板块意图更具体 */
const AI_SYNONYMS = [
  'AI 资讯速递',
  '大模型动态',
  '行业观察',
  '新模型速览',
  '技术前沿',
  'AI 工具速览',
  '模型发布追踪',
];

const NUDGE_KEY = 'nudgeSentNext';

export default function NextVersionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // 催更状态：idle 未点 / sending 发送中 / sent 已催更 / error 失败可重试
  const [nudge, setNudge] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // 每次打开弹窗时读取本地「已催更」记录（每个浏览器只能点一次）
  useEffect(() => {
    if (!open) return;
    try {
      if (localStorage.getItem(NUDGE_KEY) === '1') setNudge('sent');
    } catch {
      /* localStorage 不可用时忽略 */
    }
  }, [open]);

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
          : '催更一下 · 让新功能早点来';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cs-dialog-pop max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[600px] bg-slate-900/95 text-white border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* 顶部高光条 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />

        <DialogHeader className="cs-reveal cs-reveal-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Rocket size={17} className="text-sky-400" />
            更新预告
          </DialogTitle>
        </DialogHeader>

        <p className="cs-reveal cs-reveal-1 text-[11px] tracking-wide text-slate-500">
          下一代（版本号未定）· 计划中
        </p>

        <div className="cs-reveal cs-reveal-2 space-y-3 py-1">
          {/* 方向一：500 天纪念日 */}
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
                    12 月 18 日
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                  2026 年 12 月 18 日是网站成立 500 天，届时将会有特殊回忆展示，一起回顾这一路走来的点点滴滴。
                </p>
              </div>
            </div>
          </div>

          {/* 方向二：AI 资讯 */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-400/35 bg-gradient-to-br from-sky-500/20 via-sky-500/[0.08] to-transparent p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-400/20 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-lg shadow-sky-500/40">
                <Newspaper size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold text-white">AI 资讯</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 px-2 py-0.5 text-[10px] font-bold text-sky-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    计划中
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                  主要内容是了解 AI 资讯：聚合人工智能新闻、大模型发布与工具上新，
                  不用到处翻就能跟上最新进展。也会覆盖下面这些相近方向：
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {AI_SYNONYMS.map((word) => (
                    <span key={word}
                      className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-200/85">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
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

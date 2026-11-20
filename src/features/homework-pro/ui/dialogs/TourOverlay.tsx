'use client';

import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { TOUR_STEPS } from '../../hooks/useTour';

type Step = { target: string; title: string; desc: string };
type Rect = { top: number; left: number; width: number; height: number };

/**
 * 8 步聚光灯引导。
 * 旧版把 TOUR_STEPS 定义在组件内导致进度被父组件重渲染重置，且三个锚点
 * 位于 tasks.length>0 分支、新用户只剩 5 步；这里 steps 是模块级常量，
 * UI 侧也保证了空清单时锚点仍存在。
 */
export function TourOverlay({ open, onFinish }: { open: boolean; onFinish: (completed: boolean) => void }) {
  const steps = useMemo<Step[]>(
    () => TOUR_STEPS.filter((s) => typeof document === 'undefined' || document.querySelector(s.target))
      .map((s) => ({ target: s.target, title: s.title, desc: s.desc })),
    // 只在打开时计算一次，避免父组件重渲染重置进度
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // 组件常驻不卸载：每次重新打开都要从第 1 步开始
  useEffect(() => {
    if (open) { setIndex(0); setRect(null); }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !steps.length) return;
    let el = document.querySelector(steps[Math.min(index, steps.length - 1)]?.target ?? '');
    if (!el) { setRect(null); return; }
    const r0 = el.getBoundingClientRect();
    if (r0.width < 8 || r0.height < 8) {
      // 命中的是 sr-only 占位锚点：回退到最近的可见容器，别框出 0×0 的小方块
      const fallback = el.parentElement?.closest('.hw-btn, .hw-panel, .hw-topbar, .hw-nav') ?? el.parentElement;
      if (fallback) el = fallback;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    const timer = window.setTimeout(update, 320);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, index, steps]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFinish(false);
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(steps.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'Enter') {
        if (index >= steps.length - 1) onFinish(true);
        else setIndex((i) => i + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, steps.length, onFinish]);

  if (!open || !steps.length) return null;
  const step = steps[Math.min(index, steps.length - 1)];
  const below = rect ? rect.top + rect.height + 170 < window.innerHeight : true;
  const bubbleTop = rect ? (below ? rect.top + rect.height + 14 : Math.max(12, rect.top - 170)) : 120;
  const bubbleLeft = rect
    ? Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - 340))
    : 24;

  return (
    <div className="fixed inset-0 z-[80]" data-tour-overlay="" role="dialog" aria-modal="true" aria-label="使用教程">
      {rect && (
        <div
          className="pointer-events-none absolute rounded-lg transition-all duration-200"
          style={{
            top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.78)',
            border: '2px solid var(--primary)',
          }}
        />
      )}
      <div
        className="hw-panel absolute w-[min(90vw,320px)] p-4"
        style={{ top: bubbleTop, left: bubbleLeft }}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="hw-title text-sm">{step.title}</p>
            <p className="hw-label mt-1">{step.desc}</p>
          </div>
          <button type="button" className="hw-btn" data-variant="ghost" onClick={() => onFinish(false)} aria-label="跳过教程"><X size={14} /></button>
        </div>

        <div className="mt-3 flex items-center gap-1">
          {steps.map((_, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full"
              style={{ background: i <= index ? 'var(--primary)' : 'var(--muted)' }} />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="hw-label hw-num">{index + 1} / {steps.length}</span>
          <button type="button" className="hw-btn ml-auto" disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}><ArrowLeft size={13} /> 上一步</button>
          <button
            type="button" className="hw-btn" data-variant="primary"
            onClick={() => index >= steps.length - 1 ? onFinish(true) : setIndex((i) => i + 1)}
          >
            {index >= steps.length - 1 ? <><Check size={13} /> 开始使用</> : <>下一步 <ArrowRight size={13} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

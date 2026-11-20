'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export type TourStep = {
  /** CSS 选择器，指向要高亮的元素 */
  target: string;
  title: string;
  desc: string;
  /** 提示框相对目标的位置，auto 会自动挑一个放得下的方向 */
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
};

interface HomeworkTourProps {
  isOpen: boolean;
  steps: TourStep[];
  onClose: (completed: boolean) => void;
}

const PAD = 8; // 高亮圈比目标外扩的像素
const GAP = 16; // 提示框与目标之间的间距
const TIP_W = 320; // 提示框宽度
const MARGIN = 12; // 与视口边缘的安全距离

type Rect = { x: number; y: number; w: number; h: number };

export default function HomeworkTour({ isOpen, steps, onClose }: HomeworkTourProps) {
  const [list, setList] = useState<TourStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tipSize, setTipSize] = useState({ w: TIP_W, h: 180 });
  const tipRef = useRef<HTMLDivElement>(null);

  const step = list[idx];

  // 打开时过滤掉当前页面不存在的目标（例如还没登录/还没有作业）
  useEffect(() => {
    if (!isOpen) return;
    const available = steps.filter((s) => {
      try {
        return !!document.querySelector(s.target);
      } catch {
        return false;
      }
    });
    setList(available);
    setIdx(0);
  }, [isOpen, steps]);

  // 定位当前目标：先滚动到中间，再量位置
  useLayoutEffect(() => {
    if (!isOpen || !step) return;
    let cancelled = false;
    let timer = 0;

    const measure = () => {
      const el = document.querySelector(step.target);
      if (!el || cancelled) return;
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    };

    const el = document.querySelector(step.target);
    if (el) {
      const r = el.getBoundingClientRect();
      const offscreen = r.top < 80 || r.bottom > window.innerHeight - 80;
      if (offscreen) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        timer = window.setTimeout(measure, 320);
      } else {
        measure();
      }
    }

    const onChange = () => measure();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [isOpen, step]);

  // 量提示框真实高度，用于决定放上还是放下
  useLayoutEffect(() => {
    if (!isOpen || !tipRef.current) return;
    const h = tipRef.current.offsetHeight;
    if (h && Math.abs(h - tipSize.h) > 2) setTipSize({ w: TIP_W, h });
  }, [isOpen, idx, tipSize.h]);

  const finish = useCallback(
    (completed: boolean) => {
      onClose(completed);
    },
    [onClose]
  );

  const next = useCallback(() => {
    setIdx((i) => {
      if (i >= list.length - 1) {
        finish(true);
        return i;
      }
      return i + 1;
    });
  }, [list.length, finish]);

  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  // 键盘操作
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, finish, next, prev]);

  if (!isOpen || !step) return null;

  // 目标缺失时先给个全屏兜底，避免闪烁
  const box = rect ?? { x: window.innerWidth / 2 - 60, y: window.innerHeight / 2 - 30, w: 120, h: 60 };
  const hl = {
    left: box.x - PAD,
    top: box.y - PAD,
    width: box.w + PAD * 2,
    height: box.h + PAD * 2,
  };

  // 计算提示框位置
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - (hl.top + hl.height);
  const spaceAbove = hl.top;
  const spaceRight = vw - (hl.left + hl.width);
  const spaceLeft = hl.left;

  let placement = step.placement && step.placement !== 'auto' ? step.placement : '';
  if (!placement) {
    if (spaceBelow >= tipSize.h + GAP) placement = 'bottom';
    else if (spaceAbove >= tipSize.h + GAP) placement = 'top';
    else if (spaceRight >= tipSize.w + GAP) placement = 'right';
    else if (spaceLeft >= tipSize.w + GAP) placement = 'left';
    else placement = 'bottom';
  }

  let tipLeft = hl.left + hl.width / 2 - tipSize.w / 2;
  let tipTop = hl.top + hl.height + GAP;
  if (placement === 'top') tipTop = hl.top - GAP - tipSize.h;
  else if (placement === 'bottom') tipTop = hl.top + hl.height + GAP;
  else if (placement === 'left') {
    tipLeft = hl.left - GAP - tipSize.w;
    tipTop = hl.top + hl.height / 2 - tipSize.h / 2;
  } else if (placement === 'right') {
    tipLeft = hl.left + hl.width + GAP;
    tipTop = hl.top + hl.height / 2 - tipSize.h / 2;
  }

  tipLeft = Math.min(Math.max(MARGIN, tipLeft), Math.max(MARGIN, vw - tipSize.w - MARGIN));
  tipTop = Math.min(Math.max(MARGIN, tipTop), Math.max(MARGIN, vh - tipSize.h - MARGIN));

  // 指示线：从提示框边缘连到高亮框边缘
  const tipCenter = { x: tipLeft + tipSize.w / 2, y: tipTop + tipSize.h / 2 };
  const hlCenter = { x: hl.left + hl.width / 2, y: hl.top + hl.height / 2 };
  const lineFrom = { x: tipCenter.x, y: tipCenter.y };
  const lineTo = { x: hlCenter.x, y: hlCenter.y };
  if (placement === 'bottom') lineFrom.y = tipTop;
  else if (placement === 'top') lineFrom.y = tipTop + tipSize.h;
  else if (placement === 'left') lineFrom.x = tipLeft + tipSize.w;
  else lineFrom.x = tipLeft;
  if (placement === 'bottom') lineTo.y = hl.top;
  else if (placement === 'top') lineTo.y = hl.top + hl.height;
  else if (placement === 'left') lineTo.x = hl.left + hl.width;
  else lineTo.x = hl.left;

  const isLast = idx === list.length - 1;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="使用教程">
      {/* 聚光灯：一个透明方块 + 超大 box-shadow 把其余区域压暗，中间留出目标 */}
      <div
        className="pointer-events-auto absolute rounded-xl transition-all duration-300 ease-out"
        style={{
          left: hl.left,
          top: hl.top,
          width: hl.width,
          height: hl.height,
          boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.78)',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* 高亮圈 */}
      <div
        className="tour-ring pointer-events-none absolute rounded-xl transition-all duration-300 ease-out"
        style={{ left: hl.left, top: hl.top, width: hl.width, height: hl.height }}
      />

      {/* 指示线 */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <line
          x1={lineFrom.x}
          y1={lineFrom.y}
          x2={lineTo.x}
          y2={lineTo.y}
          stroke="rgba(125,211,252,0.85)"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        <circle cx={lineTo.x} cy={lineTo.y} r="5" fill="rgba(125,211,252,0.95)" />
      </svg>

      {/* 提示框 */}
      <div
        ref={tipRef}
        className="absolute rounded-2xl border border-sky-400/40 bg-slate-900/95 p-4 shadow-2xl shadow-sky-500/20 backdrop-blur-xl transition-all duration-300"
        style={{ left: tipLeft, top: tipTop, width: tipSize.w }}
      >
        <button
          type="button"
          onClick={() => finish(false)}
          className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
          aria-label="跳过教程"
        >
          跳过
          <X className="h-3 w-3" />
        </button>

        <div className="mb-1.5 flex items-center gap-2 pr-12">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-semibold text-sky-300">
            {idx + 1}
          </span>
          <span className="text-sm font-semibold text-white">{step.title}</span>
        </div>

        <p className="text-xs leading-relaxed text-slate-300">{step.desc}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {list.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-4 bg-sky-400' : 'w-1.5 bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={prev}
                className="flex items-center gap-1 rounded-lg border border-slate-600/60 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                上一步
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-700"
            >
              {isLast ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  开始使用
                </>
              ) : (
                <>
                  下一步
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

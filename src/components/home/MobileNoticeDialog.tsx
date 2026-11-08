'use client';

import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

/** 手机版通用提示弹窗（圆环切换警告、作业 Pro 版建议等共用） */
export default function MobileNoticeDialog({
  open,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onClose?: () => void;
}) {
  // portal 到 body：调用方可能在有 transform 的圆环面板 / motion.div 里，
  // 直接渲染 fixed 会相对那个祖先定位而跑偏
  if (!open || typeof document === 'undefined') return null;

  const close = onClose ?? onSecondary ?? (() => undefined);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-sm rounded-2xl border border-amber-400/40 bg-slate-900 p-5 text-white shadow-2xl shadow-black/60">
        <div className="flex items-start gap-2">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-400" />
          <h2 className="min-w-0 flex-1 text-sm font-bold leading-relaxed">{title}</h2>
          <button
            type="button"
            onClick={close}
            aria-label="关闭提示"
            className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-slate-200">{message}</p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPrimary}
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-bold text-slate-900 transition hover:brightness-110"
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="w-full rounded-xl border border-white/15 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

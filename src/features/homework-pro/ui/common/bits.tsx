'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { usePortalContainer } from '../../skins/skin';
import type { Priority } from '../../core/types';
import { subjectColorIndex } from '../../core/subject';

/** 统一弹层：把 Radix Portal 指向带 data-skin 的 ProPortalHost，皮肤变量不丢 */
export function ProDialog({
  open, onOpenChange, title, desc, children, className = '',
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  desc?: string;
  children: ReactNode;
  className?: string;
}) {
  const container = usePortalContainer();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent portalContainer={container} className={`max-h-[85vh] overflow-y-auto hw-scroll ${className}`}>
        <DialogHeader>
          <DialogTitle className="hw-title">{title}</DialogTitle>
          {desc && <DialogDescription>{desc}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function subjectStyle(subject: string): CSSProperties {
  return { '--hw-subject': `var(--hw-subject-${subjectColorIndex(subject)})` } as CSSProperties;
}

export function SubjectChip({ subject }: { subject: string }) {
  return (
    <span className="hw-chip" style={subjectStyle(subject)}>
      <span className="hw-subject-bar" style={{ width: 3, height: 10 }} />
      {subject}
    </span>
  );
}

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: '紧急', high: '高', normal: '普通', low: '低',
};

export function PriorityBadge({ priority }: { priority?: Priority }) {
  const p = priority ?? 'normal';
  if (p === 'normal') return null;
  return <span className="hw-prio" data-p={p}>{PRIORITY_LABEL[p]}</span>;
}

export function TagChip({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="hw-chip">
      #{tag}
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100" aria-label={`移除标签 ${tag}`}>×</button>
      )}
    </span>
  );
}

export function LoadBar({ minutes, limit }: { minutes: number; limit: number }) {
  const ratio = limit > 0 ? minutes / limit : 0;
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="hw-label">今日预计负担</span>
        <span className={`hw-num ${ratio > 1 ? 'hw-overdue' : ''}`}>{minutes} / {limit} 分钟</span>
      </div>
      <div className="hw-load-track">
        <div className="hw-load-fill" data-over={ratio > 1} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
      {ratio > 1 && <p className="mt-1 text-xs hw-overdue">今天可能写不完，考虑用智能排期分摊到后面几天</p>}
    </div>
  );
}

export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="hw-panel p-4" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="h-4 w-4 rounded bg-[var(--muted)]" />
          <div className="h-3 flex-1 rounded bg-[var(--muted)]" style={{ opacity: 1 - i * 0.12 }} />
          <div className="h-3 w-16 rounded bg-[var(--muted)]" />
        </div>
      ))}
    </div>
  );
}

/** 完成作业时的轻量粒子动画（替代旧版 120 行 requestAnimationFrame 组件） */
export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-sm"
            style={{ background: i % 2 ? 'var(--primary)' : 'var(--hw-due-soon)' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * 160, y: Math.sin(angle) * 160 - 40,
              opacity: 0, scale: 0.4,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="hw-panel flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="hw-title text-base">{title}</p>
      {hint && <p className="hw-label max-w-sm">{hint}</p>}
      {action}
    </div>
  );
}

export function GroupHeader({
  label, count, collapsed, onToggle, colorIndex,
}: {
  label: string; count: number; collapsed: boolean; onToggle: () => void;
  colorIndex?: number;
}) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-2 py-2 text-left">
      {colorIndex !== undefined && (
        <span
          className="h-4 w-1 rounded-full"
          style={{ background: `var(--hw-subject-${colorIndex})` }}
        />
      )}
      <span className="hw-title text-sm">{label}</span>
      <span className="hw-label hw-num">{count}</span>
      <span className="ml-auto hw-label">{collapsed ? '展开' : '收起'}</span>
    </button>
  );
}

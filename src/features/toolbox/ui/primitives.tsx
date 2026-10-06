'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { formatBytes, sizeDelta } from '../core/tasks';
import type { TaskState } from './useTask';

/* ============================ 面板 ============================ */

export function ToolPanel({
  title,
  subtitle,
  icon,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`tb-panel p-5 ${className}`}>
      {title && (
        <header className="mb-4">
          <h3 className="tb-title flex items-center gap-2 text-sm font-semibold">
            {icon && <i className={`fa-solid ${icon}`} style={{ color: 'var(--primary)' }} />}
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {subtitle}
            </p>
          )}
          <hr className="tb-hr mt-3" />
        </header>
      )}
      {children}
    </section>
  );
}

/* ============================ 提示条 ============================ */

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'error' | 'success';
  children: ReactNode;
}) {
  const map = {
    info: { icon: 'fa-circle-info', color: 'var(--primary)' },
    warn: { icon: 'fa-triangle-exclamation', color: '#f59e0b' },
    error: { icon: 'fa-circle-xmark', color: 'var(--destructive)' },
    success: { icon: 'fa-circle-check', color: '#22c55e' },
  }[tone];

  return (
    <div
      className="flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-xs leading-relaxed"
      style={{ borderColor: 'var(--border)', background: 'var(--tb-panel)' }}
    >
      <i className={`fa-solid ${map.icon} mt-0.5 shrink-0`} style={{ color: map.color }} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ============================ 进度 + 取消 ============================ */

export function ToolProgress({
  state,
  onCancel,
}: {
  state: TaskState;
  onCancel: () => void;
}) {
  if (state.status === 'idle') return null;

  const pct = Math.round(state.progress * 100);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--muted-foreground)' }}>
          {state.status === 'running' && (state.note || '处理中…')}
          {state.status === 'done' && '完成'}
          {state.status === 'cancelled' && '已取消'}
          {state.status === 'error' && state.error}
        </span>
        {state.status === 'running' && (
          <span className="tabular-nums" style={{ color: 'var(--primary)' }}>
            {pct}%
          </span>
        )}
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--muted)' }}
      >
        <div
          className="h-full transition-[width] duration-200"
          style={{
            width: `${state.status === 'error' ? 100 : pct}%`,
            background:
              state.status === 'error'
                ? 'var(--destructive)'
                : 'linear-gradient(90deg, var(--primary), var(--tb-accent-2))',
            boxShadow: state.status === 'running' ? 'var(--tb-glow)' : 'none',
          }}
        />
      </div>

      {state.status === 'running' && (
        <button
          type="button"
          onClick={onCancel}
          className="text-xs underline underline-offset-2"
          style={{ color: 'var(--muted-foreground)' }}
        >
          取消
        </button>
      )}
    </div>
  );
}

/* ============================ 拖拽上传 ============================ */

export function DropZone({
  accept,
  multiple = false,
  onFiles,
  hint,
  icon = 'fa-cloud-arrow-up',
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  hint?: string;
  icon?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const acceptList = accept.split(',').map((s) => s.trim().toLowerCase());

  /** 真正校验类型，不只是依赖 input 的 accept（拖拽会绕过它） */
  const matches = (f: File) => {
    if (!acceptList.length || acceptList.includes('*')) return true;
    const name = f.name.toLowerCase();
    const type = (f.type || '').toLowerCase();
    return acceptList.some((a) => {
      if (a.startsWith('.')) return name.endsWith(a);
      if (a.endsWith('/*')) return type.startsWith(a.slice(0, -1));
      return type === a;
    });
  };

  const handle = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const all = Array.from(list);
      const ok = all.filter(matches);
      if (ok.length) onFiles(multiple ? ok : [ok[0]]);
      if (ok.length < all.length) {
        // 不静默丢弃：让调用方知道有文件被挡了
        const rejected = all.length - ok.length;
        console.warn(`[工具箱] ${rejected} 个文件类型不匹配，已忽略`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [multiple, onFiles, accept]
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors"
      style={{
        borderColor: over ? 'var(--primary)' : 'var(--border)',
        background: over ? 'var(--accent)' : 'transparent',
        boxShadow: over ? 'var(--tb-glow)' : 'none',
      }}
    >
      <i className={`fa-solid ${icon} text-2xl`} style={{ color: 'var(--primary)' }} />
      <p className="text-sm">点击选择，或把文件拖到这里</p>
      {hint && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {hint}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          // 清空 value，否则同名文件再选不会触发 onChange
          e.target.value = '';
        }}
      />
    </div>
  );
}

/* ============================ 复制按钮（带反馈） ============================ */

export function CopyButton({ text, label = '复制' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // 剪贴板可能被权限拦截，退回到选中提示
      setCopied(false);
      return;
    }
  };

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors"
      style={{
        borderColor: copied ? '#22c55e' : 'var(--border)',
        color: copied ? '#22c55e' : 'var(--foreground)',
      }}
    >
      <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`} />
      {copied ? '已复制' : label}
    </button>
  );
}

/* ============================ 结果卡（下载 + 真实体积对比） ============================ */

export function ResultCard({
  url,
  filename,
  mime,
  beforeBytes,
  afterBytes,
  extra,
}: {
  url: string;
  filename: string;
  mime: string;
  beforeBytes?: number;
  afterBytes: number;
  extra?: ReactNode;
}) {
  const delta =
    beforeBytes !== undefined && beforeBytes > 0 ? sizeDelta(beforeBytes, afterBytes) : null;

  return (
    <div
      className="mt-4 rounded-md border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--tb-panel)' }}
    >
      <div className="flex items-center gap-3">
        <i className="fa-solid fa-file-arrow-down text-xl" style={{ color: 'var(--primary)' }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{filename}</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {formatBytes(afterBytes)} · {mime}
            {delta && (
              <>
                {' · '}
                <span style={{ color: delta.grew ? '#f59e0b' : '#22c55e' }}>
                  {delta.label}（{delta.percent >= 0 ? '-' : '+'}
                  {Math.abs(delta.percent).toFixed(1)}%）
                </span>
              </>
            )}
          </p>
        </div>
        <a
          href={url}
          download={filename}
          className="shrink-0 rounded-md px-4 py-2 text-sm font-medium"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            boxShadow: 'var(--tb-glow)',
          }}
        >
          下载
        </a>
      </div>
      {extra && <div className="mt-3">{extra}</div>}
    </div>
  );
}

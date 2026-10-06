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
    <section className={`tb-panel ${className}`}>
      {title && (
        <header className="mb-4">
          <h3 className="tb-title flex items-center gap-2 text-[13px]">
            {icon && <i className={`fa-solid ${icon} text-[11px]`} style={{ color: 'var(--primary)' }} />}
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
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
    warn: { icon: 'fa-triangle-exclamation', color: '#c98a12' },
    error: { icon: 'fa-circle-xmark', color: 'var(--destructive)' },
    success: { icon: 'fa-circle-check', color: '#3f8f5a' },
  }[tone];

  return (
    <div
      className="flex items-start gap-2.5 text-[11px] leading-relaxed"
      style={{
        border: 'var(--tb-border-w) solid var(--border)',
        borderRadius: 'var(--tb-panel-radius)',
        padding: '0.6rem 0.75rem',
      }}
    >
      <i className={`fa-solid ${map.icon} mt-0.5 shrink-0`} style={{ color: map.color }} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ============================ 进度 + 取消 ============================ */

export function ToolProgress({ state, onCancel }: { state: TaskState; onCancel: () => void }) {
  if (state.status === 'idle') return null;

  const pct = Math.round(state.progress * 100);
  const failed = state.status === 'error';

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span style={{ color: failed ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
          {state.status === 'running' && (state.note || '处理中…')}
          {state.status === 'done' && '完成'}
          {state.status === 'cancelled' && '已取消'}
          {failed && state.error}
        </span>
        {state.status === 'running' && (
          <span className="tabular-nums" style={{ color: 'var(--primary)' }}>
            {pct}%
          </span>
        )}
      </div>

      <div className="h-1 w-full overflow-hidden" style={{ background: 'var(--muted)' }}>
        <div
          className="h-full transition-[width] duration-200"
          style={{
            width: `${failed ? 100 : pct}%`,
            background: failed ? 'var(--destructive)' : 'var(--primary)',
          }}
        />
      </div>

      {state.status === 'running' && (
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] underline underline-offset-2"
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
  const [rejected, setRejected] = useState(0);

  const acceptList = accept.split(',').map((s) => s.trim().toLowerCase());

  /** 真正校验类型（拖拽会绕过 input 的 accept） */
  const matches = useCallback(
    (f: File) => {
      if (!acceptList.length || acceptList.includes('*')) return true;
      const name = f.name.toLowerCase();
      const type = (f.type || '').toLowerCase();
      return acceptList.some((a) => {
        if (a.startsWith('.')) return name.endsWith(a);
        if (a.endsWith('/*')) return type.startsWith(a.slice(0, -1));
        return type === a;
      });
    },
    [acceptList]
  );

  const handle = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const all = Array.from(list);
      const ok = all.filter(matches);
      setRejected(all.length - ok.length);
      if (ok.length) onFiles(multiple ? ok : [ok[0]]);
    },
    [matches, multiple, onFiles]
  );

  return (
    <div>
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
        className="flex cursor-pointer flex-col items-center justify-center gap-2 px-6 py-12 text-center transition-colors"
        style={{
          border: `var(--tb-border-w) dashed ${over ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--tb-panel-radius)',
          background: over ? 'var(--accent)' : 'transparent',
        }}
      >
        <i className={`fa-solid ${icon} text-2xl`} style={{ color: 'var(--primary)' }} />
        <p className="text-[13px]">点击选择，或把文件拖到这里</p>
        {hint && (
          <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
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
      {rejected > 0 && (
        <p className="mt-2 text-[11px]" style={{ color: 'var(--destructive)' }}>
          有 {rejected} 个文件类型不匹配，已跳过
        </p>
      )}
    </div>
  );
}

/* ============================ 复制按钮（带反馈） ============================ */

export function CopyButton({ text, label = '复制' }: { text: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('ok');
    } catch {
      setState('fail');
    }
  };

  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), 1800);
    return () => clearTimeout(t);
  }, [state]);

  const map = {
    idle: { icon: 'fa-copy', text: label, color: 'var(--foreground)' },
    ok: { icon: 'fa-check', text: '已复制', color: '#3f8f5a' },
    fail: { icon: 'fa-triangle-exclamation', text: '复制失败', color: 'var(--destructive)' },
  }[state];

  return (
    <button type="button" onClick={copy} className="tb-btn" style={{ color: map.color }}>
      <i className={`fa-solid ${map.icon} text-[11px]`} />
      {map.text}
    </button>
  );
}

/* ============================ 结果卡 ============================ */

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
  const delta = beforeBytes !== undefined && beforeBytes > 0 ? sizeDelta(beforeBytes, afterBytes) : null;

  return (
    <div
      className="mt-4 p-4"
      style={{
        border: 'var(--tb-border-w) solid var(--border)',
        borderRadius: 'var(--tb-panel-radius)',
        background: 'var(--card)',
        boxShadow: 'var(--tb-shadow)',
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <i className="fa-solid fa-file-arrow-down text-xl" style={{ color: 'var(--primary)' }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px]">{filename}</p>
          <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {formatBytes(afterBytes)} · {mime}
            {delta && (
              <>
                {' · '}
                {/* 如实显示增减，变大也不美化 */}
                <span style={{ color: delta.grew ? '#c98a12' : '#3f8f5a' }}>{delta.label}</span>
              </>
            )}
          </p>
        </div>
        <a href={url} download={filename} className="tb-btn tb-btn-primary shrink-0">
          <i className="fa-solid fa-download text-[11px]" />
          下载
        </a>
      </div>
      {extra && <div className="mt-3">{extra}</div>}
    </div>
  );
}

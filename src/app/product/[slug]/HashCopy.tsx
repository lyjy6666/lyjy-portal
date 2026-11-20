'use client';

import { useState } from 'react';

/**
 * SHA-256 校验值展示 + 复制。
 *
 * 颜色全部走主题变量（--pt-*），这样在液态玻璃 / 暮色渐变这类深色主题下
 * 也看得清 —— 之前硬编码 slate 色，深色底上几乎不可见。
 */
export default function HashCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
      <code className="min-w-0 break-all font-mono text-[0.75rem] leading-relaxed">{value}</code>
      <button
        type="button"
        onClick={copy}
        aria-label="复制 SHA-256 校验值"
        className="shrink-0 self-start rounded-md px-2.5 py-1 text-[0.75rem] transition-opacity hover:opacity-70"
        style={{
          border: '1px solid var(--pt-line)',
          color: copied ? 'var(--pt-ink)' : 'var(--pt-ink-dim)',
          background: copied ? 'var(--pt-chip-bg)' : 'transparent',
        }}
      >
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  );
}

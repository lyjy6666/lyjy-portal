'use client';

import { useState } from 'react';

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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <code className="min-w-0 break-all font-mono text-xs leading-relaxed text-slate-700">{value}</code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 self-start rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
        aria-label="复制 SHA-256 校验值"
      >
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  );
}

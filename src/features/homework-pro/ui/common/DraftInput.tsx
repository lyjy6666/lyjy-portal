'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { isComposing } from './interaction';

type Props = {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'datetime-local' | 'url';
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  ariaLabel?: string;
};

/**
 * 受控草稿输入：打字期间只改本地 state，失焦或回车才提交。
 *
 * 解决三类老问题：
 * 1) 每按一键发一个 PUT，服务端响应把正在输入的内容顶回去（跳字/回退）；
 * 2) 并发请求带同一 baseRev 触发 409，反复弹「数据已更新」；
 * 3) 切换任务后 defaultValue 不更新，显示上一条作业的旧值。
 * 输入期间即使外部 refresh 也不会覆盖草稿。
 */
export function DraftInput({
  value, onCommit, className, placeholder, type = 'text', min, max, step, rows, ariaLabel,
}: Props) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  const commit = () => { if (draft !== value) onCommit(draft); };
  const common = {
    value: draft,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onFocus: () => { focused.current = true; },
    onBlur: () => { focused.current = false; commit(); },
    className,
    placeholder,
    'aria-label': ariaLabel,
  };

  if (rows) {
    return (
      <textarea
        {...common}
        rows={rows}
        onKeyDown={(e) => {
          if (isComposing(e)) return;
          if (e.key === 'Escape') setDraft(value);
        }}
      />
    );
  }

  return (
    <input
      {...common}
      type={type}
      min={min}
      max={max}
      step={step}
      onKeyDown={(e) => {
        if (isComposing(e)) return;
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') setDraft(value);
      }}
    />
  );
}

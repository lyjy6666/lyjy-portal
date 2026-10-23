'use client';

import { useEffect, useState } from 'react';

/**
 * 搜索页 B 版时钟。
 *
 * 关键点：这是一个「自更新」组件 —— 只有它自己每秒 setState。
 * 父页面不会因此每秒重渲染（修复了 A 版整棵树每秒重绘的性能问题）。
 *
 * 为避免 SSR / 客户端 hydration 时间不一致，首次渲染用 null 占位，
 * 挂载后立刻填充真实时间（useEffect 在挂载后同步执行，用户几乎无感）。
 */

function greeting(h: number): string {
  if (h < 5) return '夜深了，注意休息';
  if (h < 9) return '早上好';
  if (h < 12) return '上午好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  if (h < 23) return '晚上好';
  return '夜深了，注意休息';
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const pad = (n: number) => String(n).padStart(2, '0');

export default function SearchBClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const time = now
    ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    : '--:--:--';

  const dateLine = now
    ? `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 · 星期${
        WEEKDAYS[now.getDay()]
      }`
    : '　';

  return (
    <div className="flex flex-col items-center select-none">
      {/* 问候语 */}
      <p className="mb-1 text-sm font-medium tracking-[0.2em] text-white/70 md:text-base">
        {now ? greeting(now.getHours()) : '欢迎回来'}
      </p>

      {/* 大时钟：响应式字号，纯 className，不用内联 fontSize 覆盖 */}
      <h1
        className="font-mono text-[clamp(3rem,11vw,6rem)] font-bold leading-none tabular-nums text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
        aria-label="当前时间"
      >
        {time}
      </h1>

      {/* 日期 */}
      <p className="mt-2 text-xs text-white/55 md:text-sm">{dateLine}</p>
    </div>
  );
}

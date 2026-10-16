'use client';

/**
 * 应用界面预览（纯 CSS/SVG 绘制，不用任何图片素材）
 *
 * 说明：这是**示意图**，不是软件截图 —— 页面下方有明确标注，
 * 不用假截图冒充真实界面。
 *
 * 目前只有强力锁用到（锁屏倒计时）。以后别的产品要加预览，
 * 在 products.ts 里给 preview 字段指定类型即可。
 */

import { useEffect, useState } from 'react';

/** 锁屏界面示意 */
function LockPreview() {
  const [remain, setRemain] = useState(28 * 60 + 45);

  // 倒计时真的在走，让示意有生命感（不是一张死图）
  useEffect(() => {
    const t = setInterval(() => setRemain((v) => (v <= 1 ? 28 * 60 + 45 : v - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(remain / 60)).padStart(2, '0');
  const ss = String(remain % 60).padStart(2, '0');

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: '1rem',
        border: '1px solid var(--pt-line)',
        background: 'linear-gradient(168deg, #131a2b 0%, #0b1120 55%, #070c16 100%)',
        boxShadow: '0 24px 60px -28px rgba(20, 16, 60, 0.55)',
      }}
    >
      {/* 窗口标题栏 */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)', background: 'rgba(255,255,255,0.03)' }}
      >
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f57' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#febc2e' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#28c840' }} />
        </span>
        <span className="ml-2 font-mono text-[0.6875rem] tracking-wide text-white/35">强力锁 · 锁屏中</span>
      </div>

      {/* 锁屏主体 */}
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth="1.7" strokeLinecap="round">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>

        {/* 倒计时 */}
        <div
          className="font-mono text-[3.25rem] leading-none tabular-nums text-white/92"
          style={{ letterSpacing: '0.02em' }}
        >
          {mm}:{ss}
        </div>

        <p className="mt-4 text-[0.8125rem] text-white/45">已锁定 · 时间到自动解锁</p>

        {/* 临时操作次数 */}
        <div
          className="mt-8 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#34d399' }} />
          <span className="text-[0.75rem] text-white/60">临时操作机会 · 剩余 3 次</span>
        </div>

        <p className="mt-6 text-[0.6875rem] text-white/25">Win+Tab / Alt+Tab / Alt+F4 已禁用</p>
      </div>
    </div>
  );
}

export default function AppPreview({ kind }: { kind: string }) {
  if (kind !== 'lock') return null;
  return <LockPreview />;
}

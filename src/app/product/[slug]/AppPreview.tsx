'use client';

/**
 * 应用界面演示（纯 CSS/SVG 绘制，不用任何图片素材）
 *
 * 三种形态：
 *   lock     —— 强力锁的锁屏界面（倒计时实时运行）
 *   wpf      —— Windows Toolbox 应用程序版（原生窗口 + 侧边栏 + 工具面板）
 *   browser  —— Windows 工具网页版（浏览器窗口 + 本地服务地址）
 *
 * 都是**示意图**，页面上有明确标注，不拿假截图冒充真实界面。
 * 用画的理由：清晰、能随主题变色、体积为零、不会过期失真。
 */

import { useEffect, useState } from 'react';

/* ============================================================
   共用：窗口外壳
   ============================================================ */

function WindowChrome({
  title,
  variant = 'mac',
  children,
}: {
  title: string;
  variant?: 'mac' | 'win';
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: '0.875rem',
        border: '1px solid var(--pt-line)',
        background: 'rgba(255,255,255,0.86)',
        boxShadow: '0 26px 60px -30px rgba(40, 30, 90, 0.5)',
      }}
    >
      {/* 标题栏 */}
      <div
        className="flex items-center gap-2 px-3.5 py-2.5"
        style={{ borderBottom: '1px solid var(--pt-line)', background: 'rgba(255,255,255,0.6)' }}
      >
        {variant === 'mac' ? (
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#febc2e' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#28c840' }} />
          </span>
        ) : (
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--pt-accent)', opacity: 0.75 }} />
          </span>
        )}
        <span className="ml-1.5 truncate text-[0.6875rem] font-medium" style={{ color: 'var(--pt-ink-dim)' }}>
          {title}
        </span>
        {variant === 'win' && (
          <span className="ml-auto flex items-center gap-3 font-mono text-[0.625rem]" style={{ color: 'var(--pt-ink-faint)' }}>
            <span>—</span>
            <span>□</span>
            <span>×</span>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   lock · 强力锁的锁屏界面
   ============================================================ */

function LockPreview() {
  const [remain, setRemain] = useState(28 * 60 + 45);

  useEffect(() => {
    const t = setInterval(() => setRemain((v) => (v <= 1 ? 28 * 60 + 45 : v - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(remain / 60)).padStart(2, '0');
  const ss = String(remain % 60).padStart(2, '0');

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: '0.875rem',
        border: '1px solid var(--pt-line)',
        background: 'linear-gradient(168deg, #131a2b 0%, #0b1120 55%, #070c16 100%)',
        boxShadow: '0 26px 60px -30px rgba(20, 16, 60, 0.6)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3.5 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
      >
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f57' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#febc2e' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#28c840' }} />
        </span>
        <span className="ml-1.5 font-mono text-[0.6875rem] text-white/35">强力锁 · 锁屏中</span>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div
          className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth="1.7" strokeLinecap="round">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>

        <div className="font-mono text-[3rem] leading-none tabular-nums text-white/92">
          {mm}:{ss}
        </div>

        <p className="mt-3.5 text-[0.8125rem] text-white/45">已锁定 · 时间到自动解锁</p>

        <div
          className="mt-7 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#34d399' }} />
          <span className="text-[0.75rem] text-white/60">临时操作机会 · 剩余 3 次</span>
        </div>

        <p className="mt-5 text-[0.6875rem] text-white/25">Win+Tab / Alt+Tab / Alt+F4 已禁用</p>
      </div>
    </div>
  );
}

/* ============================================================
   wpf · Windows Toolbox 应用程序版
   ============================================================ */

/**
 * 真实的板块名 —— 从 WindowsToolbox.dll 里提取的界面文字。
 * 之前我按「格式转换」的方向编了一组（图片转换/文档处理…），完全是错的。
 */
const WPF_TOOLS = ['性能优化', '隐私防护', '界面定制', '网络优化', '磁盘清理', '游戏模式', '系统修复', '高级工具'];

/** 磁盘清理页里的真实清理项 */
const CLEAN_ITEMS = ['系统临时文件', '更新缓存', '缩略图缓存', '事件日志', '回收站'];

function WpfPreview() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  // 侧边栏自动轮播 + 进度条循环，让示意有「在跑」的感觉
  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setActive((a) => (a + 1) % WPF_TOOLS.length);
          return 0;
        }
        return p + 4;
      });
    }, 90);
    return () => clearInterval(t);
  }, []);

  return (
    <WindowChrome title={`调校工具箱 — ${WPF_TOOLS[active]}`} variant="win">
      <div className="flex" style={{ minHeight: 268 }}>
        {/* 侧边栏 */}
        <nav
          className="w-[38%] shrink-0 py-3 sm:w-[34%]"
          style={{ borderRight: '1px solid var(--pt-line)', background: 'rgba(248,247,252,0.7)' }}
        >
          {WPF_TOOLS.map((t, i) => (
            <div
              key={t}
              className="flex items-center gap-2 px-3.5 py-2 text-[0.75rem] transition-colors"
              style={{
                background: i === active ? 'color-mix(in oklab, var(--pt-accent) 12%, transparent)' : 'transparent',
                color: i === active ? 'var(--pt-accent)' : 'var(--pt-ink-dim)',
                borderLeft: i === active ? '2px solid var(--pt-accent)' : '2px solid transparent',
                fontWeight: i === active ? 600 : 400,
              }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: i === active ? 'var(--pt-accent)' : 'var(--pt-ink-faint)', opacity: i === active ? 1 : 0.4 }}
              />
              {t}
            </div>
          ))}
        </nav>

        {/* 主区域 */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="text-[0.8125rem] font-semibold">{WPF_TOOLS[active]}</div>

          {/* 清理项勾选（真实界面里的样式） */}
          <div className="flex flex-col gap-1.5">
            {CLEAN_ITEMS.map((t, i) => (
              <label key={t} className="flex items-center gap-2 text-[0.6875rem]" style={{ color: 'var(--pt-ink-dim)' }}>
                <span
                  className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px]"
                  style={{
                    background: i < 3 ? 'var(--pt-accent)' : 'transparent',
                    border: '1px solid ' + (i < 3 ? 'var(--pt-accent)' : 'var(--pt-line)'),
                  }}
                >
                  {i < 3 && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--pt-accent-ink)" strokeWidth="4" strokeLinecap="round">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </span>
                {t}
              </label>
            ))}
          </div>

          {/* 开始清理按钮 */}
          <div
            className="mt-1 rounded-md py-1.5 text-center text-[0.6875rem] font-semibold"
            style={{ background: 'var(--pt-accent)', color: 'var(--pt-accent-ink)' }}
          >
            开始清理
          </div>

          {/* 进度条 */}
          <div className="mt-auto">
            <div className="mb-1.5 flex justify-between font-mono text-[0.625rem]" style={{ color: 'var(--pt-ink-faint)' }}>
              <span>{progress >= 100 ? '清理完成' : '清理中…'}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <div
                className="h-full rounded-full transition-[width] duration-100"
                style={{ width: `${progress}%`, background: 'var(--pt-accent)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </WindowChrome>
  );
}

/* ============================================================
   browser · Windows 工具网页版
   ============================================================ */

const WEB_TABS = ['图片', '文档', '编码', '哈希', '时间'];

function BrowserPreview() {
  const [tab, setTab] = useState(0);
  const [port, setPort] = useState(8848);

  // 端口号轻微跳动 + 标签轮播，模拟「本地服务已启动」
  useEffect(() => {
    const t1 = setInterval(() => setTab((v) => (v + 1) % WEB_TABS.length), 2600);
    const t2 = setInterval(() => setPort(8848 + Math.floor(Math.random() * 3)), 1800);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  return (
    <WindowChrome title="Windows 工具 — 本地服务">
      {/* 地址栏 */}
      <div className="flex items-center gap-2 px-3.5 py-2" style={{ borderBottom: '1px solid var(--pt-line)' }}>
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--pt-ink-faint)', opacity: 0.4 }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--pt-ink-faint)', opacity: 0.4 }} />
        </span>
        <div
          className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: 'rgba(248,247,252,0.95)', border: '1px solid var(--pt-line)' }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#34d399' }} />
          <span className="truncate font-mono text-[0.625rem]" style={{ color: 'var(--pt-ink-dim)' }}>
            http://127.0.0.1:{port}
          </span>
        </div>
      </div>

      {/* 页面内容 */}
      <div className="p-4" style={{ minHeight: 236 }}>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[0.8125rem] font-semibold">Windows 工具</span>
          <span className="font-mono text-[0.625rem]" style={{ color: 'var(--pt-ink-faint)' }}>
            无需安装 · 单文件
          </span>
        </div>

        {/* 标签 */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {WEB_TABS.map((t, i) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-1 text-[0.6875rem] transition-colors"
              style={{
                background: i === tab ? 'var(--pt-accent)' : 'rgba(248,247,252,0.9)',
                color: i === tab ? 'var(--pt-accent-ink)' : 'var(--pt-ink-dim)',
                border: '1px solid ' + (i === tab ? 'var(--pt-accent)' : 'var(--pt-line)'),
                fontWeight: i === tab ? 600 : 400,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* 工具面板 */}
        <div
          className="flex flex-col items-center justify-center gap-2 py-7"
          style={{ border: '1px dashed var(--pt-line)', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.5)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pt-accent)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M3 15l5-5 4 4 3-3 6 6" />
            <circle cx="8.5" cy="8.5" r="1.5" />
          </svg>
          <span className="text-[0.6875rem]" style={{ color: 'var(--pt-ink-faint)' }}>
            拖入图片，或点击选择文件
          </span>
        </div>
      </div>
    </WindowChrome>
  );
}

/* ============================================================
   导出
   ============================================================ */

export default function AppPreview({ kind }: { kind: string }) {
  if (kind === 'lock') return <LockPreview />;
  if (kind === 'wpf') return <WpfPreview />;
  if (kind === 'browser') return <BrowserPreview />;
  return null;
}

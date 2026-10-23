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
  // 真实默认是「剩余时间：30:00」，这里就从 30 分钟开始倒数
  const [remain, setRemain] = useState(30 * 60);
  const [clock, setClock] = useState('00:00');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    };
    tick();
    const t1 = setInterval(tick, 1000);
    // 倒计时走快一点（每 40ms 减 1 秒），不然示意看不出来在动
    const t2 = setInterval(() => setRemain((v) => (v <= 1 ? 30 * 60 : v - 1)), 40);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
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
      {/*
       * 真实锁屏界面（LockScreenWindow.xaml）：无边框全屏、隐藏任务栏，
       * 所以这里不画窗口标题栏，直接铺满一块深色屏。
       */}
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[1.75rem] font-bold leading-tight text-white/95">🔒 屏幕已锁定</p>

        <p className="mt-6 font-mono text-[1.5rem] leading-none tabular-nums text-white/62">
          剩余时间：{mm}:{ss}
        </p>

        <p className="mt-3.5 font-mono text-[1rem] leading-none tabular-nums text-white/40">
          当前时间：{clock}
        </p>

        {/* 「操纵屏幕」按钮：真实颜色 #F59E0B，悬停转 #DC2626 */}
        <div
          className="mt-8 inline-flex items-center justify-center px-8 py-3 text-[0.9375rem] font-bold text-white"
          style={{ background: '#F59E0B', borderRadius: '0.375rem' }}
        >
          操纵屏幕（剩余 3 次）
        </div>

        <p className="mt-7 text-[0.75rem]" style={{ color: '#606070' }}>
          按 ESC 可隐藏/显示信息
        </p>
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
const WPF_TOOLS = ['主页总览', '性能优化', '隐私防护', '界面定制', '网络优化', '磁盘清理', '游戏模式', '系统修复', '高级工具', '软件设置'];

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

const WEB_TABS = ['主页总览', '性能优化', '隐私防护', '界面定制', '网络优化', '磁盘清理', '游戏模式', '系统修复', '高级工具', '开发者模式', '快捷工具箱', '软件设置'];

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
    <WindowChrome title="lyjy Windows 调校工具箱 — 本地服务">
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
          <span className="text-[0.8125rem] font-semibold">lyjy Windows 调校工具箱</span>
          <span className="font-mono text-[0.625rem]" style={{ color: 'var(--pt-ink-faint)' }}>
            单文件 · 本地服务
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

        {/*
         * 真实界面是「功能卡片列表」，每张卡片带风险等级徽标与开关，
         * 不是文件拖放区 —— 之前那版是错的。
         */}
        <div className="flex flex-col gap-1.5">
          {[
            { name: '视觉效果→最佳性能', risk: '安全', level: 'safe' },
            { name: '电源：高性能', risk: '安全', level: 'safe' },
            { name: '关闭微软诊断遥测', risk: '谨慎', level: 'caution' },
            { name: '停用遥测诊断服务', risk: '谨慎', level: 'caution' },
            { name: '激活 Windows', risk: '高危', level: 'high' },
          ].map((f) => {
            const tone =
              f.level === 'safe'
                ? { bg: 'rgba(16,185,129,0.12)', fg: '#0f766e', bd: 'rgba(16,185,129,0.35)' }
                : f.level === 'caution'
                  ? { bg: 'rgba(245,158,11,0.14)', fg: '#b45309', bd: 'rgba(245,158,11,0.4)' }
                  : { bg: 'rgba(220,38,38,0.12)', fg: '#b91c1c', bd: 'rgba(220,38,38,0.35)' };
            return (
              <div
                key={f.name}
                className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5"
                style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid var(--pt-line)' }}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="shrink-0 rounded px-1 py-0.5 text-[0.5625rem] font-semibold"
                    style={{ background: tone.bg, color: tone.fg, border: '1px solid ' + tone.bd }}
                  >
                    {f.risk}
                  </span>
                  <span className="truncate text-[0.6875rem]" style={{ color: 'var(--pt-ink-dim)' }}>
                    {f.name}
                  </span>
                </span>
                {/* 开关 */}
                <span
                  className="relative h-3 w-6 shrink-0 rounded-full"
                  style={{ background: f.level === 'safe' ? 'var(--pt-accent)' : 'rgba(0,0,0,0.12)' }}
                >
                  <span
                    className="absolute top-0.5 h-2 w-2 rounded-full bg-white"
                    style={{ left: f.level === 'safe' ? '0.875rem' : '0.125rem' }}
                  />
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-2.5 text-[0.5625rem]" style={{ color: 'var(--pt-ink-faint)' }}>
          共 144 项 · 每项都带还原命令
        </p>
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

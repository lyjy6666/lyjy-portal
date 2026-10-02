import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { type WebsiteStats } from '@/lib/utils';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WebsiteStats[];
}

type CatId = 'core' | 'tools' | 'entertainment' | 'fun';

type ServiceMeta = {
  key: keyof WebsiteStats;
  name: string;   // 完整名（用于榜单）
  short: string;  // 环上的短标签
  category: CatId;
  color: string;
  glow: string;
};

const CATEGORIES: { id: CatId; name: string; color: string; arc: string }[] = [
  { id: 'core',          name: '核心入口', color: '#60a5fa', arc: 'rgba(96,165,250,0.30)' },
  { id: 'tools',         name: '效率工具', color: '#22d3ee', arc: 'rgba(34,211,238,0.30)' },
  { id: 'entertainment', name: '娱乐休闲', color: '#f87171', arc: 'rgba(248,113,113,0.30)' },
  { id: 'fun',           name: '趣味应用', color: '#facc15', arc: 'rgba(250,204,21,0.30)' },
];

const SERVICES: ServiceMeta[] = [
  { key: 'homepage',        name: '主页',           short: '主页',     category: 'core',          color: '#60a5fa', glow: 'rgba(96,165,250,0.55)' },
  { key: 'search',          name: '搜索页',         short: '搜索',     category: 'core',          color: '#a78bfa', glow: 'rgba(167,139,250,0.55)' },
  { key: 'toolbox',         name: '格式转换工具箱', short: '工具箱',   category: 'tools',         color: '#22d3ee', glow: 'rgba(34,211,238,0.55)' },
  { key: 'homeworkSystem',  name: '作业管理系统',   short: '作业',     category: 'tools',         color: '#34d399', glow: 'rgba(52,211,153,0.55)' },
  { key: 'pomodoro',        name: '番茄钟',         short: '番茄钟',   category: 'tools',         color: '#fb923c', glow: 'rgba(251,146,60,0.55)' },
  { key: 'tts',             name: '语音朗读',       short: '朗读',     category: 'tools',         color: '#f472b6', glow: 'rgba(244,114,182,0.55)' },
  { key: 'movie',           name: '影视资源',       short: '影视',     category: 'entertainment', color: '#f87171', glow: 'rgba(248,113,113,0.55)' },
  { key: 'video',           name: '视频播放器',     short: '视频',     category: 'entertainment', color: '#fbbf24', glow: 'rgba(251,191,36,0.55)' },
  { key: 'fruitGame',       name: '水果游戏',       short: '水果',     category: 'fun',           color: '#fb923c', glow: 'rgba(251,146,60,0.55)' },
  { key: 'monopoly',        name: '大富翁计分器',   short: '大富翁',   category: 'fun',           color: '#facc15', glow: 'rgba(250,204,21,0.55)' },
  { key: 'grandmaTraining', name: '老人训练题',     short: '老人题',   category: 'fun',           color: '#f472b6', glow: 'rgba(244,114,182,0.55)' },
];

const StatIcon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/** 每日趋势：30 天总面积的折线 + 悬停十字线 */
function TrendChart({ daily, dates }: { daily: number[]; dates: string[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 900, H = 132, PAD = { l: 8, r: 8, t: 14, b: 22 };
  const max = Math.max(...daily, 1);
  const pts = daily.map((v, i) => ({
    x: PAD.l + (daily.length > 1 ? i / (daily.length - 1) : 0) * (W - PAD.l - PAD.r),
    y: H - PAD.b - (v / max) * (H - PAD.t - PAD.b),
    v,
  }));
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PAD.b} L ${pts[0].x.toFixed(1)} ${H - PAD.b} Z`;
  const fmt = (s: string) => (s || '').slice(5).replace('-', '/');

  const move = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - r.left) / r.width;
    const idx = Math.round(ratio * (daily.length - 1));
    setHover(Math.min(daily.length - 1, Math.max(0, idx)));
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={move}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="最近 30 天每日访问量趋势"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(56,189,248,0.45)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trendFill)" />
        <path d={line} fill="none" stroke="#7dd3fc" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && (
          <g>
            <line x1={pts[hover].x} y1={PAD.t - 6} x2={pts[hover].x} y2={H - PAD.b} stroke="rgba(125,211,252,0.6)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={pts[hover].x} cy={pts[hover].y} r="4.5" fill="#0b1220" stroke="#7dd3fc" strokeWidth="2" />
          </g>
        )}
        <text x={PAD.l} y={12} fontSize="9" fill="rgba(148,180,210,0.7)" fontFamily="ui-monospace, monospace">峰值 {max.toLocaleString()}</text>
        <text x={PAD.l} y={H - 6} fontSize="9" fill="rgba(148,180,210,0.6)" fontFamily="ui-monospace, monospace">{fmt(dates[0] ?? '')}</text>
        <text x={W - PAD.r} y={H - 6} textAnchor="end" fontSize="9" fill="rgba(148,180,210,0.6)" fontFamily="ui-monospace, monospace">{fmt(dates[dates.length - 1] ?? '')}</text>
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute -top-1 right-0 rounded-md border border-sky-400/40 bg-slate-950/90 px-2.5 py-1 text-[11px] text-sky-100 backdrop-blur-sm">
          <span className="font-mono text-sky-300/80">{fmt(dates[hover] ?? '')}</span>
          <span className="mx-1.5 text-slate-500">·</span>
          <span className="font-semibold">{daily[hover].toLocaleString()}</span>
          <span className="ml-1 text-slate-400">次</span>
        </div>
      )}
    </div>
  );
}

export default function StatisticsModal({ isOpen, onClose, data }: StatisticsModalProps) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totals = SERVICES.map((svc) => ({
      ...svc,
      total: data.reduce((sum, day) => sum + (day[svc.key] as number), 0),
    }));
    const grand = totals.reduce((s, x) => s + x.total, 0);
    const daily = data.map((d) => SERVICES.reduce((s, x) => s + (d[x.key] as number), 0));
    const dates = data.map((d) => d.date);
    const maxDay = Math.max(...daily, 0);
    const avgDay = Math.round(grand / Math.max(1, data.length));
    const ranked = [...totals].sort((a, b) => b.total - a.total);
    return { totals, grand, daily, dates, maxDay, avgDay, ranked };
  }, [data]);

  if (!isOpen) return null;
  const { totals, grand, daily, dates, maxDay, avgDay, ranked } = stats;
  const topName = ranked[0]?.name ?? '—';

  // 环上布局
  const CX = 230, CY = 196, R = 138;
  const N = totals.length;
  const placed = totals.map((s, i) => {
    const a = -90 + (i * 360) / N;
    const rad = (a * Math.PI) / 180;
    return { ...s, angle: a, x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
  });
  const maxTotal = Math.max(1, ...totals.map((t) => t.total));
  const hovered = placed.find((p) => p.key === hoverKey) ?? null;

  // 分类弧：把同分类的连续节点并成一段
  const arcs = CATEGORIES.map((cat) => {
    const idxs = placed.map((p, i) => (p.category === cat.id ? i : -1)).filter((i) => i >= 0);
    if (!idxs.length) return null;
    const a0 = ((placed[idxs[0]].angle - 90) * Math.PI) / 180 - 0.05;
    const a1 = ((placed[idxs[idxs.length - 1]].angle - 90) * Math.PI) / 180 + 0.05;
    const r0 = R - 20, r1 = R + 20;
    const x0 = CX + r1 * Math.cos(a0), y0 = CY + r1 * Math.sin(a0);
    const x1 = CX + r1 * Math.cos(a1), y1 = CY + r1 * Math.sin(a1);
    const x2 = CX + r0 * Math.cos(a1), y2 = CY + r0 * Math.sin(a1);
    const x3 = CX + r0 * Math.cos(a0), y3 = CY + r0 * Math.sin(a0);
    const large = idxs.length > 1 ? 1 : 0;
    return { id: cat.id, color: cat.arc, d: `M ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z` };
  }).filter(Boolean) as { id: string; color: string; d: string }[];

  return (
    <div
      className="stats-scrim fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="网站访问统计"
    >
      <motion.div
        className="stats-panel relative w-full max-w-5xl overflow-hidden rounded-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stats-bg" aria-hidden="true">
          <div className="stats-bg-glow stats-bg-glow--a" />
          <div className="stats-bg-glow stats-bg-glow--b" />
          <div className="stats-bg-orbit" />
        </div>

        <header className="relative flex items-center justify-between gap-4 border-b border-sky-400/15 bg-slate-950/60 px-6 py-5 backdrop-blur-md">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-sky-300/70">Telemetry · last 30 days</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
              <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                网站访问统计 · 最近 30 天
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:border-sky-300/60 hover:bg-sky-400/10 hover:text-white"
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="relative max-h-[78vh] overflow-y-auto px-6 py-6">
          {/* 数据卡片 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { title: '总访问量', value: grand.toLocaleString(), icon: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z M12 3v.01 M21 12h.01', color: 'text-sky-300' },
              { title: '日均访问', value: avgDay.toLocaleString(), icon: 'M3 3v18h18 M7 17l4-4 3 3 5-7', color: 'text-cyan-300' },
              { title: '峰值日访问', value: maxDay.toLocaleString(), icon: 'M3 17l6-6 4 4 8-9 M14 6h7v7', color: 'text-emerald-300' },
              { title: '最热门服务', value: topName, icon: 'M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4 2.3-7.4-6-4.6h7.6z', color: 'text-amber-300' },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                className="stats-card relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.06, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300/80">{c.title}</span>
                  <span className={c.color}><StatIcon d={c.icon} /></span>
                </div>
                <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-white">{c.value}</p>
              </motion.div>
            ))}
          </div>

          {/* 服务热度星环（可悬停） + 右侧榜单 */}
          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
            <div className="stats-ring-wrap relative overflow-hidden rounded-2xl border border-sky-400/15 bg-slate-950/50 p-2">
              <div className="flex items-baseline justify-between px-2 pt-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-sky-300/70">Service Heatmap</p>
                <p className="text-[10px] text-slate-500">悬停圆环查看单项数据</p>
              </div>
              <svg viewBox="0 0 460 400" className="mx-auto block w-full max-w-[520px]" role="img" aria-label="服务热度星环">
                <defs>
                  <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(125,211,252,0.45)" />
                    <stop offset="60%" stopColor="rgba(59,130,246,0.10)" />
                    <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                  </radialGradient>
                </defs>

                <circle cx={CX} cy={CY} r="76" fill="url(#coreGlow)" className="stats-core-pulse" />

                {arcs.map((a) => (
                  <path key={a.id} d={a.d} fill={a.color} className={hovered && hovered.category !== a.id ? 'opacity-40' : ''} />
                ))}

                <g className="stats-orbit-rotate" style={{ transformOrigin: `${CX}px ${CY}px` }}>
                  <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(125,211,252,0.35)" strokeWidth="0.6" strokeDasharray="2 4" />
                  <circle cx={CX} cy={CY} r={R - 28} fill="none" stroke="rgba(125,211,252,0.15)" strokeWidth="0.4" strokeDasharray="1 6" />
                  <circle cx={CX} cy={CY} r={R + 28} fill="none" stroke="rgba(125,211,252,0.15)" strokeWidth="0.4" strokeDasharray="1 6" />
                </g>

                {placed.map((s) => {
                  const ratio = s.total / maxTotal;
                  const r = 6 + ratio * 15;
                  const glowR = r + 8 + ratio * 8;
                  const on = hoverKey === s.key;
                  const off = hoverKey !== null && !on;
                  const lx = CX + (R + 30) * Math.cos((s.angle * Math.PI) / 180);
                  const ly = CY + (R + 30) * Math.sin((s.angle * Math.PI) / 180) + 3;
                  const anchor = Math.cos((s.angle * Math.PI) / 180) > 0.15 ? 'start' : Math.cos((s.angle * Math.PI) / 180) < -0.15 ? 'end' : 'middle';
                  return (
                    <g
                      key={s.key}
                      className="stats-node"
                      opacity={off ? 0.4 : 1}
                      onMouseEnter={() => setHoverKey(s.key)}
                      onMouseLeave={() => setHoverKey(null)}
                    >
                      {/* 放大命中区域，鼠标好悬停 */}
                      <circle cx={s.x} cy={s.y} r="20" fill="transparent" />
                      <circle cx={s.x} cy={s.y} r={on ? glowR + 6 : glowR} fill={s.glow} opacity={on ? 0.9 : 0.55} />
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={on ? r + 2 : r}
                        fill={s.color}
                        stroke="rgba(255,255,255,0.85)"
                        strokeWidth={on ? 1.6 : 1}
                      />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor={anchor}
                        fontSize={on ? 11 : 10}
                        fontWeight={on ? 700 : 500}
                        fill={on ? '#ffffff' : 'rgba(203,225,245,0.75)'}
                        fontFamily="ui-sans-serif, system-ui"
                      >
                        {s.short}
                      </text>
                    </g>
                  );
                })}

                {/* 中心读数：默认 TOTAL，悬停时切换为该服务 */}
                {hovered ? (
                  <>
                    <text x={CX} y={CY - 14} textAnchor="middle" fontSize="10" fill={hovered.color} fontFamily="ui-monospace, monospace" letterSpacing="2">
                      {hovered.category === 'core' ? '核心入口' : hovered.category === 'tools' ? '效率工具' : hovered.category === 'entertainment' ? '娱乐休闲' : '趣味应用'}
                    </text>
                    <text x={CX} y={CY + 6} textAnchor="middle" fontSize="13" fill="#ffffff" fontWeight="600">{hovered.name}</text>
                    <text x={CX} y={CY + 32} textAnchor="middle" fontSize="26" fill="#ffffff" fontWeight="700">{hovered.total.toLocaleString()}</text>
                    <text x={CX} y={CY + 50} textAnchor="middle" fontSize="10" fill="rgba(148,180,210,0.8)">
                      占比 {((hovered.total / Math.max(1, grand)) * 100).toFixed(1)}%
                    </text>
                  </>
                ) : (
                  <>
                    <text x={CX} y={CY - 6} textAnchor="middle" fontSize="11" fill="rgba(203,225,245,0.7)" fontFamily="ui-monospace, monospace" letterSpacing="3">
                      TOTAL
                    </text>
                    <text x={CX} y={CY + 22} textAnchor="middle" fontSize="28" fill="#ffffff" fontWeight="700">{grand.toLocaleString()}</text>
                    <text x={CX} y={CY + 42} textAnchor="middle" fontSize="10" fill="rgba(125,211,252,0.8)">30 天累计访问</text>
                  </>
                )}
              </svg>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-sky-300/70">Categories</p>
                <ul className="mt-3 space-y-2">
                  {CATEGORIES.map((c) => {
                    const sum = totals.filter((t) => t.category === c.id).reduce((s, x) => s + x.total, 0);
                    return (
                      <li key={c.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-200">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                          {c.name}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{sum.toLocaleString()}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-sky-300/70">Top Services</p>
                <ul className="mt-3 space-y-2.5">
                  {ranked.slice(0, 6).map((s, i) => {
                    const w = Math.max(8, (s.total / maxTotal) * 100);
                    const on = hoverKey === s.key;
                    return (
                      <li
                        key={s.key}
                        className="text-xs"
                        onMouseEnter={() => setHoverKey(s.key)}
                        onMouseLeave={() => setHoverKey(null)}
                      >
                        <div className={`mb-1 flex items-center justify-between ${on ? 'text-white' : 'text-slate-300'}`}>
                          <span className="flex items-center gap-2">
                            <span className="w-4 text-right font-mono text-slate-500">{i + 1}</span>
                            <span>{s.name}</span>
                          </span>
                          <span className="font-mono text-slate-400">{s.total.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${s.color}, ${s.glow})` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${w}%` }}
                            transition={{ delay: 0.3 + i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>

          {/* 每日趋势 */}
          <section className="mt-6 rounded-2xl border border-sky-400/15 bg-slate-950/50 p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-sky-300/70">Daily Trend</p>
              <p className="text-[10px] text-slate-500">最近 30 天每日总访问量</p>
            </div>
            <TrendChart daily={daily} dates={dates} />
          </section>

          <div className="mt-6 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            系统状态正常 · 数据采样 {data.length} 天 · 更新于 {new Date().toLocaleDateString('zh-CN')}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

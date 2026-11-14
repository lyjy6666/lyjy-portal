'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PlanSwitch from './PlanSwitch';
import {
  ARCHIVE_STATS,
  LINES,
  MILESTONES,
  SERVICE_GROWTH,
  SNAPSHOTS,
  dayOffset,
  formatDate,
  type Snapshot,
} from '@/data/anniversaryPlans';
import styles from './StarLog.module.css';

const W = 1200;
const PAD = 76;
const SPAN = 501;
const LANE: Record<Snapshot['category'], number> = { 主页: 96, 导航: 158, 搜索: 220, 工具: 282 };

const PORTAL_NODES = [
  { date: '2026-06-29', label: 'V4.0 统一门户', note: '多站整合到一个域名' },
  { date: '2026-09-24', label: 'V6.0 银河圆环', note: '17 个节点' },
  { date: '2026-11-13', label: 'V7.0', note: '22 个入口' },
];

const xOf = (date: string) => PAD + (Math.min(dayOffset(date), SPAN) / SPAN) * (W - PAD * 2);

export default function StarLog() {
  const [hover, setHover] = useState<{ x: number; y: number; label: string; date: string } | null>(null);

  const points = useMemo(() => {
    const seen = new Map<string, number>();
    return SNAPSHOTS.map((s) => {
      const key = `${s.date}-${s.category}`;
      const i = seen.get(key) ?? 0;
      seen.set(key, i + 1);
      return { ...s, x: xOf(s.date), y: LANE[s.category] + i * 11 };
    });
  }, []);

  const mergeX = xOf('2026-06-29');
  const maxCount = Math.max(...SERVICE_GROWTH.map((g) => g.count));

  return (
    <main className={styles.page}>
      <div className={styles.stars} aria-hidden="true" />

      <header className={styles.bar}>
        <Link href="/" className={styles.back}>← 回到门户</Link>
        <span className={styles.barTitle}>500 · 星图</span>
        <span className={styles.barMeta}>36 个存档 · 4 条线 · 1 座门户</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>2025.08.04 — 2026.12.18</p>
        <h1 className={styles.heroTitle}>
          <span className={styles.big}>500</span>
          <span className={styles.heroUnit}>天</span>
        </h1>
        <p className={styles.heroLine}>
          500 天前，这里只有一个 <code>index.html</code>。<br />
          现在是 22 个入口、一座门户，和 36 份没舍得删的存档。
        </p>
        <div className={styles.heroStats}>
          <div><strong>{ARCHIVE_STATS.snapshots}</strong><span>旧存档</span></div>
          <div><strong>{ARCHIVE_STATS.playable}</strong><span>还能跑</span></div>
          <div><strong>{ARCHIVE_STATS.services}</strong><span>个入口</span></div>
        </div>
      </section>

      <section id="orbit" className={styles.orbitSection} aria-labelledby="orbit-title">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionNo}>01 / 轨道</span>
            <h2 id="orbit-title">四条线，最后并成一条。</h2>
          </div>
          <p>横轴是日期，纵轴是产品线。左边的点都还能点开——去时光机。</p>
        </div>

        <div className={styles.orbitScroll}>
          <svg
            viewBox={`0 0 ${W} 360`}
            className={styles.orbit}
            role="img"
            aria-label="2025 年 8 月至 2026 年 11 月，四条产品线共 36 个存档的时间分布，2026 年 6 月 29 日合并为统一门户"
          >
            <defs>
              <linearGradient id="laneFade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#94a3b8" stopOpacity="0.35" />
                <stop offset="0.55" stopColor="#94a3b8" stopOpacity="0.2" />
                <stop offset="1" stopColor="#fbbf24" stopOpacity="0.5" />
              </linearGradient>
              <radialGradient id="portalGlow">
                <stop offset="0" stopColor="#fbbf24" stopOpacity="0.5" />
                <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
              </radialGradient>
            </defs>

            {LINES.map((line) => (
              <g key={line.id}>
                <line x1={PAD} y1={LANE[line.id]} x2={W - PAD} y2={LANE[line.id]} stroke="url(#laneFade)" strokeWidth="1" strokeDasharray="2 6" />
                <text x={PAD - 14} y={LANE[line.id] + 4} textAnchor="end" className={styles.laneLabel} fill={line.color}>
                  {line.id}
                </text>
              </g>
            ))}

            {/* 竖线在节点区域断开，避免压在「V4.0 统一门户」等标签上 */}
            <line x1={mergeX} y1={54} x2={mergeX} y2={122} stroke="#fbbf24" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="4 5" />
            <line x1={mergeX} y1={252} x2={mergeX} y2={316} stroke="#fbbf24" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="4 5" />
            <text x={mergeX + 8} y={66} className={styles.mergeLabel} fill="#fcd34d">2026.06.29 合并</text>

            {points.map((p) => (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={p.id === 'v8.4' ? 6 : 4}
                fill={LINES.find((l) => l.id === p.category)?.color ?? '#94a3b8'}
                fillOpacity={0.9}
                onMouseEnter={() => setHover({ x: p.x, y: p.y, label: p.label, date: p.date })}
                onMouseLeave={() => setHover(null)}
                className={styles.dot}
              />
            ))}

            {PORTAL_NODES.map((node) => (
              <g key={node.date}>
                <circle cx={xOf(node.date)} cy={186} r="26" fill="url(#portalGlow)" />
                <circle cx={xOf(node.date)} cy={186} r="6" fill="#0b0f16" stroke="#fbbf24" strokeWidth="2" />
                <text x={xOf(node.date)} y={148} textAnchor="middle" className={styles.portalLabel} fill="#fcd34d">
                  {node.label}
                </text>
              </g>
            ))}

            <line x1={PAD} y1={316} x2={W - PAD} y2={316} stroke="#1e293b" strokeWidth="1" />
            <text x={PAD} y={336} className={styles.axisLabel}>2025.08.04</text>
            <text x={W - PAD} y={336} textAnchor="end" className={styles.axisLabel}>2026.12.18</text>
          </svg>

          {hover ? (
            <div className={styles.tip} style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / 360) * 100}%` }}>
              <strong>{hover.label}</strong>
              <span>{formatDate(hover.date)}</span>
            </div>
          ) : null}
        </div>

        <ul className={styles.legend}>
          {LINES.map((line) => (
            <li key={line.id}>
              <span style={{ background: line.color }} />
              {line.id}
              <em>{line.desc}</em>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.growthSection} aria-labelledby="growth-title">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionNo}>02 / 生长</span>
            <h2 id="growth-title">从 1 个页面，到 22 个入口。</h2>
          </div>
          <p>只数入口，不数文件——旧存档里 99.8% 是依赖包。</p>
        </div>

        <div className={styles.growth}>
          <svg viewBox="0 0 720 220" className={styles.spark} role="img" aria-label="服务数量从 1 增长到 22">
            <polyline
              points={SERVICE_GROWTH.map((g, i) => `${40 + (i / (SERVICE_GROWTH.length - 1)) * 640},${190 - (g.count / maxCount) * 150}`).join(' ')}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {SERVICE_GROWTH.map((g, i) => {
              const x = 40 + (i / (SERVICE_GROWTH.length - 1)) * 640;
              const y = 190 - (g.count / maxCount) * 150;
              return (
                <g key={g.date}>
                  <circle cx={x} cy={y} r="4" fill="#0b0f16" stroke="#fbbf24" strokeWidth="2" />
                  <text x={x} y={y - 14} textAnchor="middle" className={styles.sparkValue} fill="#fcd34d">{g.count}</text>
                  <text x={x} y={210} textAnchor="middle" className={styles.sparkDate}>{formatDate(g.date)}</text>
                </g>
              );
            })}
          </svg>

          <ul className={styles.growthList}>
            {SERVICE_GROWTH.map((g) => (
              <li key={g.date}><span>{formatDate(g.date)}</span><strong>{g.count}</strong><em>{g.label}</em></li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.mileSection} aria-labelledby="mile-title">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionNo}>03 / 节点</span>
            <h2 id="mile-title">十个日子，够讲完这 500 天。</h2>
          </div>
        </div>
        <ol className={styles.miles}>
          {MILESTONES.map((m, i) => (
            <li key={m.date} className={m.tag === '合并' || m.tag === '现在' ? styles.mileKey : ''}>
              <span className={styles.mileNo}>{String(i + 1).padStart(2, '0')}</span>
              <time dateTime={m.date}>{formatDate(m.date)}</time>
              <div>
                <h3>{m.title}<span className={styles.tag}>{m.tag}</span></h3>
                <p>{m.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className={styles.footer}>
        <p>这不是一条增长曲线，是一个小站慢慢成为家的过程。</p>
        <div className={styles.footerLinks}>
          <Link href="/anniversary">去时光机，亲手打开 2025.08.04 ↗</Link>
          <Link href="/anniversary">去相册，一页页翻 ↗</Link>
        </div>
      </footer>

      <PlanSwitch current="c" />
    </main>
  );
}

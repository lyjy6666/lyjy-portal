'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import PlanSwitch from './PlanSwitch';
import { useSectionPager } from './useSectionPager';
import {
  ARCHIVE_STATS,
  LINES,
  MILESTONES,
  SERVICE_GROWTH,
  PORTAL_VERSIONS,
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
  { date: '2026-06-29', label: 'V4.0 统一门户' },
  { date: '2026-09-24', label: 'V6.0 银河圆环' },
  { date: '2026-11-13', label: 'V7.0' },
];

const xOf = (date: string) => PAD + (Math.min(dayOffset(date), SPAN) / SPAN) * (W - PAD * 2);


export default function StarLog() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useSectionPager(scrollerRef);

  // 滚动停住之后，才把「当前这一屏」点亮：滚的过程中下一屏是空的，停在哪屏，哪屏才弹出来
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const screens = Array.from(el.querySelectorAll<HTMLElement>(':scope > section'));
    if (!screens.length) return;

    const itemsOf = (node: HTMLElement | undefined) =>
      node ? Array.from(node.querySelectorAll<HTMLElement>('[data-reveal]')) : [];
    const light = (node: HTMLElement | undefined) => {
      itemsOf(node).forEach((item) => item.classList.add('is-in'));
    };

    // 只把「非首屏」先藏起来：JS 万一没跑，页面仍然是完整可读的。
    // 首屏不加动画，进站就是完整的，不做无意义的闪烁。
    screens.slice(1).forEach((s) => itemsOf(s).forEach((item) => item.classList.add('is-armed')));

    let timer = 0;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // 找与当前滚动位置最接近的那一屏
        let best = 0;
        screens.forEach((s, i) => {
          if (Math.abs(s.offsetTop - el.scrollTop) < Math.abs(screens[best].offsetTop - el.scrollTop)) best = i;
        });
        light(screens[best]);
      }, 110);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, []);


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

      <div ref={scrollerRef} className={styles.scroller} id="star-scroller">
        {/* 01 首屏 */}
        <section id="screen-1" className={styles.screen}>
          <div className={styles.heroInner} data-reveal>
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
            <p className={styles.scrollHint}>往下滑 <span aria-hidden="true">↓</span></p>
          </div>
        </section>

        {/* 02 轨道 */}
        <section id="screen-2" className={styles.screen} aria-labelledby="orbit-title">
          <div className={styles.block} data-reveal>
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
                    <text x={PAD - 14} y={LANE[line.id] + 4} textAnchor="end" className={styles.laneLabel} fill={line.color}>{line.id}</text>
                  </g>
                ))}

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
                    <text x={xOf(node.date)} y={148} textAnchor="middle" className={styles.portalLabel} fill="#fcd34d">{node.label}</text>
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

            <div className={styles.portalStrip}>
              <span className={styles.portalStripLabel}>合并之后的六代</span>
              <div className={styles.portalChips}>
                {PORTAL_VERSIONS.map((v) => (
                  <span key={v.id} className={styles.portalChip}>
                    <span className={styles.portalChipDot} aria-hidden="true" />
                    <strong>{v.label}</strong>
                    <em>{v.date.length === 4 ? v.date : formatDate(v.date)}</em>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 03 生长 */}
        <section id="screen-3" className={styles.screen} aria-labelledby="growth-title">
          <div className={styles.block} data-reveal>
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
                  fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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
          </div>
        </section>

        {/* 04 里程碑 */}
        <section id="screen-4" className={styles.screen} aria-labelledby="mile-title">
          <div className={styles.block} data-reveal>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.sectionNo}>03 / 节点</span>
                <h2 id="mile-title">十个日子，够讲完这 500 天。</h2>
              </div>
              <p>没有存档的五个月，也是这 500 天的一部分。</p>
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
          </div>
        </section>

        {/* 05 结尾 */}
        <section id="screen-5" className={`${styles.screen} ${styles.endScreen}`}>
          <div className={styles.endInner} data-reveal>
            <p className={styles.endLine}>这不是一条增长曲线，<br />是一个小站慢慢成为家的过程。</p>
            <div className={styles.footerLinks}>
              <Link href="/anniversary">去时光机，亲手打开 2025.08.04 ↗</Link>
            </div>
            <p className={styles.endSmall}>2026.12.18 · 建站 500 天</p>
          </div>
        </section>
      </div>

      <PlanSwitch current="c" />
    </main>
  );
}

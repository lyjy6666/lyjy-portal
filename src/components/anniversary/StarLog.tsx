'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ScrollReveal, CountUp, Typewriter, TiltCard } from '@/components/fx/Fx';
import { useSectionPager } from './useSectionPager';
import {
  ARCHIVE_STATS,
  LINES,
  MILESTONES,
  SERVICE_GROWTH,
  PORTAL_VERSIONS,
  SNAPSHOTS,
  TRACE_WALL,
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

/** 折线绘制总时长：线、点、光点三者共用，保证同步往右上走 */
const SPARK_DUR = 2.4;

/** 四条产品线的人话说明（LINES.desc 是技术栈，放在这里给普通访客看） */
const LINE_STORIES: Record<Snapshot['category'], { tag: string; what: string; story: string }> = {
  主页: {
    tag: '起点',
    what: '最先有的那一页：一句名言、一首歌、几个入口。',
    story: '从雪山背景的第一版开始，换过粒子、时钟和头像，最后才把名字写上标签页。',
  },
  导航: {
    tag: '中枢',
    what: '把所有去处的按钮排成一圈，想去哪儿点一下。',
    story: '从列表到银河圆环，17 个节点慢慢长到 22 个，也把散落的小站收进了一个域名。',
  },
  搜索: {
    tag: '入口',
    what: '一个输入框，输什么就替你去哪儿搜。',
    story: '修过搜不出来的参数、换过深色皮肤，后来又加了历史和语音输入。',
  },
  工具: {
    tag: '日常',
    what: '作业、番茄钟、格式转换这些真要干活的东西。',
    story: '从单页小工具长成带账号和云端数据的作业系统，也是改得最勤的一条线。',
  },
};

/** 痕迹墙每张卡的「后来呢」，字数刻意对齐，卡片才不会高低不齐 */
const TRACE_AFTER: Record<string, { tag: string; after: string }> = {
  '天气没有来': { tag: '主页', after: '现在点开旧主页，那行提示还挂在右上角，像一枚没撕掉的标签。' },
  '背景图已经加载不出来': { tag: '搜索', after: '骨架和文字都还在，只是当年那张铺满屏幕的图，没能跟着一起搬过来。' },
  '当年的热闹是算出来的': { tag: '导航', after: '这次 500 天用的 36 个存档，才是第一次敢放进页面的真数字。' },
  '后端已经睡了': { tag: '工具', after: '页面还打得开，提交按钮不会再有回应，像一间关了灯仍亮着招牌的店。' },
  '一颗埋了 500 天的时间胶囊': { tag: '主页', after: '如今真的做了一个 730 天胶囊，这次点下去，是能写信的。' },
  '标签页还叫 project_template_react': { tag: '主页', after: '模板名一直挂了大半年，直到 5.30 才换成「lyjy 的小站」。' },
};

export default function StarLog() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useSectionPager(scrollerRef);

  const [hover, setHover] = useState<{ x: number; y: number; label: string; date: string } | null>(null);
  const [countStart, setCountStart] = useState(false);
  const [sparkStart, setSparkStart] = useState(false);
  const [typeStart, setTypeStart] = useState(false);

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

  const sparkPoints = useMemo(
    () =>
      SERVICE_GROWTH.map((g, i) => ({
        ...g,
        x: 40 + (i / (SERVICE_GROWTH.length - 1)) * 640,
        y: 190 - (g.count / maxCount) * 150,
      })),
    [maxCount],
  );

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
          <ScrollReveal root={scrollerRef} className={styles.heroInner} onEnter={() => setCountStart(true)}>
            <p className={styles.kicker}>2025.08.04 — 2026.12.18</p>
            <h1 className={styles.heroTitle}>
              <span className={styles.big}><CountUp value={500} start={countStart} duration={4800} power={8} /></span>
              <span className={styles.heroUnit}>天</span>
            </h1>
            <p className={styles.heroLine}>
              500 天前，这里只有一个 <code>index.html</code>。<br />
              现在是 22 个入口、一座门户，和 36 份没舍得删的存档。
            </p>
            <div className={styles.heroStats}>
              <div><strong><CountUp value={ARCHIVE_STATS.snapshots} start={countStart} /></strong><span>旧存档</span></div>
              <div><strong><CountUp value={ARCHIVE_STATS.playable} start={countStart} /></strong><span>还能跑</span></div>
              <div><strong><CountUp value={ARCHIVE_STATS.services} start={countStart} /></strong><span>个入口</span></div>
            </div>
            <p className={styles.scrollHint}>往下滑 <span aria-hidden="true">↓</span></p>
          </ScrollReveal>
        </section>

        {/* 02 轨道 */}
        <section id="screen-2" className={styles.screen} aria-labelledby="orbit-title">
          <ScrollReveal root={scrollerRef} className={styles.block}>
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
          </ScrollReveal>
        </section>

        {/* 03 生长：折线从左往右画出，节点依次亮起，亮点沿折线向右上平移 */}
        <section id="screen-3" className={styles.screen} aria-labelledby="growth-title">
          <ScrollReveal root={scrollerRef} className={styles.block} onEnter={() => setSparkStart(true)}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.sectionNo}>02 / 生长</span>
                <h2 id="growth-title">从 1 个页面，到 22 个入口。</h2>
              </div>
              <p>只数入口，不数文件——旧存档里 99.8% 是依赖包。</p>
            </div>

            <div className={styles.growth}>
              <svg viewBox="0 0 720 220" className={styles.spark} data-run={sparkStart} role="img" aria-label="服务数量从 1 增长到 22">
                <polyline
                  className={styles.sparkLine}
                  points={sparkPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                {sparkPoints.map((p, i) => (
                  <g key={p.date} className={styles.sparkPoint} style={{ animationDelay: `${0.3 + i * (SPARK_DUR / (sparkPoints.length - 1))}s` }}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#0b0f16" stroke="#fbbf24" strokeWidth="2" />
                    <text x={p.x} y={p.y - 14} textAnchor="middle" className={styles.sparkValue} fill="#fcd34d">{p.count}</text>
                  </g>
                ))}
                {sparkPoints.map((p) => (
                  <text key={`d-${p.date}`} x={p.x} y={210} textAnchor="middle" className={styles.sparkDate}>{formatDate(p.date)}</text>
                ))}
                <motion.circle
                  r={5}
                  fill="#fff7d6"
                  className={styles.sparkRunner}
                  initial={{ cx: sparkPoints[0].x, cy: sparkPoints[0].y, opacity: 0 }}
                  animate={sparkStart ? {
                    cx: sparkPoints.map((p) => p.x),
                    cy: sparkPoints.map((p) => p.y),
                    opacity: [0, 1, 1, 0],
                  } : {}}
                  transition={{ duration: SPARK_DUR, ease: 'linear' }}
                />
              </svg>

              <ul className={styles.growthList}>
                {SERVICE_GROWTH.map((g) => (
                  <li key={g.date}><span>{formatDate(g.date)}</span><strong>{g.count}</strong><em>{g.label}</em></li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </section>

        {/* 04 四条线：错峰出现 + 3D 倾斜 */}
        <section className={styles.screen} aria-labelledby="lines-title">
          <div className={styles.block}>
            <ScrollReveal root={scrollerRef}>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.sectionNo}>03 / 四条线</span>
                  <h2 id="lines-title">四个房间，各自长过一段时间。</h2>
                </div>
                <p>主页、导航、搜索、工具——合并之前，它们谁也不认识谁。</p>
              </div>
            </ScrollReveal>
            <ul className={styles.lineCards}>
              {LINES.map((line, i) => {
                const items = SNAPSHOTS.filter((s) => s.category === line.id);
                const first = items[0];
                const last = items[items.length - 1];
                return (
                  <li key={line.id}>
                    <ScrollReveal root={scrollerRef} delay={i * 110} y={26}>
                      <TiltCard className={styles.lineCardInner}>
                        <span className={styles.lineBadge} style={{ background: line.color }} />
                        <div className={styles.lineTop}>
                          <strong>{line.id}</strong>
                          <em>{LINE_STORIES[line.id].tag}</em>
                        </div>
                        <p className={styles.lineWhat}>{LINE_STORIES[line.id].what}</p>
                        <p className={styles.lineStory}>{LINE_STORIES[line.id].story}</p>
                        <div className={styles.lineFacts}>
                          <span>{items.length} 个存档</span>
                          <span>{first ? formatDate(first.date) : '—'} → {last ? formatDate(last.date) : '—'}</span>
                        </div>
                        <small>最有代表性：{items.length ? items.reduce((a, b) => (b.files ?? 0) > (a.files ?? 0) ? b : a).label : '—'}</small>
                      </TiltCard>
                    </ScrollReveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* 05 痕迹墙：错峰出现 + 3D 倾斜 */}
        <section className={styles.screen} aria-labelledby="traces-title">
          <div className={styles.block}>
            <ScrollReveal root={scrollerRef}>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.sectionNo}>04 / 痕迹</span>
                  <h2 id="traces-title">有些东西，没能一起搬过来。</h2>
                </div>
                <p>失效的接口、编造的统计、埋了 500 天的死链——它们也是这 500 天的一部分。</p>
              </div>
            </ScrollReveal>
            <ul className={styles.traceWall}>
              {TRACE_WALL.map((trace, i) => (
                <li key={trace.title}>
                  <ScrollReveal root={scrollerRef} delay={i * 90} y={26}>
                    <TiltCard className={styles.traceCardInner}>
                      <span className={styles.traceTag}>{TRACE_AFTER[trace.title]?.tag ?? '痕迹'}</span>
                      <strong>{trace.title}</strong>
                      <p>{trace.text}</p>
                      <p className={styles.traceAfter}>{TRACE_AFTER[trace.title]?.after ?? ''}</p>
                    </TiltCard>
                  </ScrollReveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 06 里程碑 */}
        <section id="screen-4" className={styles.screen} aria-labelledby="mile-title">
          <ScrollReveal root={scrollerRef} className={styles.block}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.sectionNo}>05 / 节点</span>
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
          </ScrollReveal>
        </section>

        {/* 07 结尾：打字机 */}
        <section id="screen-5" className={`${styles.screen} ${styles.endScreen}`}>
          <ScrollReveal root={scrollerRef} className={styles.endInner} onEnter={() => setTypeStart(true)}>
            <p className={styles.endLine}>
              <Typewriter
                text={'这不是一条增长曲线，\n是一个小站慢慢成为家的过程。'}
                start={typeStart}
                speed={95}
                className={styles.typeLine}
              />
            </p>
            <div className={styles.footerLinks}>
              <Link href="/anniversary/machine">去时光机，亲手打开 2025.08.04 ↗</Link>
              <Link href="/anniversary/capsule">
                去写 730 天的专属回忆
                <em>2027.08.04 才会打开</em>
              </Link>
            </div>
            <p className={styles.endSmall}>2026.12.18 · 建站 500 天</p>
          </ScrollReveal>
        </section>
      </div>
    </main>
  );
}

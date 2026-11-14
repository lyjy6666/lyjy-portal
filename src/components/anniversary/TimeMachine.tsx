'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  LINES,
  PLAYABLE,
  PORTAL_VERSIONS,
  formatDate,
  tracesFor,
  type SnapshotCategory,
} from '@/data/anniversaryPlans';
import styles from './TimeMachine.module.css';

const lineColor = (name?: SnapshotCategory) =>
  (name && LINES.find((l) => l.id === name)?.color) || '#94a3b8';

type Entry = {
  id: string;
  label: string;
  date: string;
  kind: 'local' | 'portal';
  category?: SnapshotCategory;
  note?: string;
  src?: string;
  url?: string;
  shot?: string;
  files?: number;
};

const LOCAL: Entry[] = PLAYABLE.map((v) => ({
  id: v.id,
  label: v.label,
  date: v.date,
  kind: 'local',
  category: v.category,
  note: v.note,
  src: v.dist,
  files: v.files,
}));

const PORTAL: Entry[] = PORTAL_VERSIONS.map((v) => ({
  id: v.id,
  label: v.label,
  date: v.date,
  kind: 'portal',
  note: v.note,
  url: v.url,
  shot: v.shot,
}));

export default function TimeMachine() {
  // 左侧一次只展开一组：旧存档 / 线上门户，保证所有内容收在一屏里
  const [group, setGroup] = useState<'local' | 'portal'>('local');
  const [i, setI] = useState(0);
  // 旧版是 SPA，首帧偶尔白屏；检测到就自动重载，两次还不行才让用户手动点
  const [blank, setBlank] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const retryRef = useRef(0);

  const list = group === 'local' ? LOCAL : PORTAL;
  const current = list[Math.min(i, list.length - 1)];
  const traces = current.kind === 'local' ? tracesFor({ id: current.id, category: current.category }) : [];
  const target = current.src ?? current.url ?? '/';

  const switchGroup = (next: 'local' | 'portal') => {
    if (next === group) return;
    setGroup(next);
    setI(0);
  };
  const go = (next: number) => setI((next + list.length) % list.length);
  const openWindow = () => window.open(target, '_blank', 'noopener,noreferrer');

  // 切换版本时重置白屏状态
  useEffect(() => {
    retryRef.current = 0;
    setBlank(false);
  }, [current.id]);

  const forceReload = () => {
    const frame = frameRef.current;
    if (!frame) return;
    setBlank(false);
    frame.src = `${target}${target.includes('?') ? '&' : '?'}_retry=${Date.now()}`;
  };

  /** iframe 载入后检查有没有真的渲染出东西；空的话自动重载，最多两次 */
  const checkFrame = () => {
    const frame = frameRef.current;
    if (!frame || current.kind !== 'local') return;

    window.setTimeout(() => {
      try {
        const doc = frame.contentDocument;
        if (!doc || !doc.body) return;
        const text = (doc.body.innerText || '').replace(/\s+/g, '');
        const root = doc.getElementById('root');
        const empty = text.length < 6 && (!root || root.childElementCount === 0);
        if (!empty) {
          setBlank(false);
          return;
        }
        if (retryRef.current < 2) {
          retryRef.current += 1;
          frame.src = `${target}${target.includes('?') ? '&' : '?'}_retry=${Date.now()}`;
          return;
        }
        setBlank(true);
      } catch {
        // 拿不到文档就当正常，不误报
      }
    }, 520);
  };

  return (
    <main className={styles.page}>
      <header className={styles.bar}>
        <Link href="/" className={styles.back}>← 回到门户</Link>
        <div className={styles.barTitle}>
          <span className={styles.kicker}>500 · 时光机</span>
          <span className={styles.barSub}>十三个旧存档，六代线上门户</span>
        </div>
        <Link href="/anniversary" className={styles.starLink}>去星图 →</Link>
        <span className={styles.counter}>
          {String(i + 1).padStart(2, '0')} / {list.length}
        </span>
      </header>

      <section className={styles.stage}>
        <aside className={styles.rail} aria-label="选择历史版本">
          <div className={styles.groups} role="tablist" aria-label="版本分组">
            <button
              type="button"
              role="tab"
              aria-selected={group === 'local'}
              onClick={() => switchGroup('local')}
              className={`${styles.groupTab} ${group === 'local' ? styles.groupTabOn : ''}`}
            >
              旧存档
              <span>{LOCAL.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={group === 'portal'}
              onClick={() => switchGroup('portal')}
              className={`${styles.groupTab} ${group === 'portal' ? styles.groupTabOn : ''}`}
            >
              线上门户
              <span>{PORTAL.length}</span>
            </button>
          </div>

          <ol className={styles.railList}>
            {list.map((entry, idx) => {
              const active = idx === i;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setI(idx)}
                    aria-pressed={active}
                    className={`${styles.railItem} ${active ? styles.railItemOn : ''}`}
                  >
                    <span
                      className={styles.railDot}
                      style={{ background: entry.kind === 'portal' ? '#fbbf24' : lineColor(entry.category) }}
                    />
                    <time dateTime={entry.date}>
                      {entry.date.length === 4 ? entry.date : formatDate(entry.date)}
                    </time>
                    <strong>{entry.label}</strong>
                    {entry.note ? <em>{entry.note}</em> : null}
                  </button>
                </li>
              );
            })}
          </ol>

          <p className={styles.railHint}>
            {group === 'local' ? '十三台还能启动的旧机器' : '合并之后的六代门户'}
          </p>
        </aside>

        <div className={styles.viewport}>
          <div className={styles.viewportHead}>
            <div className={styles.meta}>
              <h1>{current.label}</h1>
              <p>
                {current.kind === 'local'
                  ? `${formatDate(current.date)} · ${current.category}线 · ${(current.files ?? 0).toLocaleString('zh-CN')} 个条目`
                  : `${current.date.length === 4 ? current.date : formatDate(current.date)} · 线上部署快照`}
                {current.note ? ` · ${current.note}` : ''}
              </p>
              {traces.length > 0 ? (
                <span className={styles.traceBadge}>岁月的痕迹 · {traces.length}</span>
              ) : null}
            </div>
            <div className={styles.actions}>
              <button type="button" onClick={() => go(i - 1)} className={styles.ghost}>← 上一个</button>
              <button type="button" onClick={() => go(i + 1)} className={styles.ghost}>下一个 →</button>
              <button type="button" onClick={openWindow} className={styles.accent}>新窗口 ↗</button>
            </div>
          </div>

          <div className={styles.frameWrap}>
            <div className={styles.frameChrome} aria-hidden="true">
              <span /><span /><span />
              <em>{current.kind === 'local' ? `/versions/${current.id}` : target}</em>
            </div>
            {current.kind === 'local' ? (
              <iframe
                key={current.id}
                ref={frameRef}
                onLoad={checkFrame}
                src={target}
                title={`${current.label} · ${current.date} 的历史快照`}
                className={styles.frame}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className={styles.shotWrap}>
                {/* 线上部署是另一套服务，iframe 会被它自己的脚本/鉴权挡住，这里用当时截下的原图 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.shot}
                  alt={`${current.label} · ${current.date} 的线上页面截图`}
                  className={styles.shot}
                />
                <div className={styles.shotBadge}>
                  <strong>{current.label}</strong>
                  <span className={styles.shotDate}>
                    {current.date.length === 4 ? current.date : formatDate(current.date)}
                  </span>
                </div>
              </div>
            )}

            {blank && current.kind === 'local' ? (
              <div className={styles.blankMask}>
                <p>这一版没有自己加载出来</p>
                <span>旧页面偶尔会卡在首帧，重载一下通常就好了。</span>
                <div className={styles.blankActions}>
                  <button type="button" onClick={forceReload} className={styles.accent}>重新加载</button>
                  <button type="button" onClick={openWindow} className={styles.ghost}>新窗口打开</button>
                </div>
              </div>
            ) : null}
          </div>

          {traces.length > 0 ? (
            <div className={styles.traces}>
              {traces.map((trace) => (
                <div className={styles.trace} key={trace.title}>
                  <span className={styles.traceMark}>{trace.title}</span>
                  <p>{trace.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          <p className={styles.disclaimer}>
            {current.kind === 'local'
              ? '这是历史快照，不是现行服务。旧天气、登录、统计等接口可能已经失效；页面在隔离环境里运行，本地存储与主站分开。若显示空白，用「新窗口」打开。'
              : '这是当时截下的页面原图，不是可交互的站点。想回到原站，点「新窗口」——只要那个部署还活着。'}
          </p>
        </div>
      </section>

    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Capsule.module.css';

/** 2025-08-04 起的第 730 天 */
const UNLOCK_AT = '2027-08-04';
const KEY = 'lyjy_capsule_730_v1';

type Saved = { text: string; savedAt: string };

export default function Capsule() {
  const [text, setText] = useState('');
  const [sealed, setSealed] = useState(false);
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
    setUnlocked(today >= UNLOCK_AT);

    const target = new Date(`${UNLOCK_AT}T00:00:00+08:00`).getTime();
    setDaysLeft(Math.max(0, Math.ceil((target - Date.now()) / 86400000)));

    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw) as Saved;
        if (typeof data?.text === 'string') {
          setText(data.text);
          setSealed(true);
        }
      }
    } catch {
      setStatus('本地存储不可用，请下载备份后自行保存。');
    }
    setReady(true);
  }, []);

  const seal = () => {
    if (!text.trim()) {
      setStatus('先写一句想留给未来的话。');
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify({ text, savedAt: new Date().toISOString() } satisfies Saved));
      setSealed(true);
      setStatus('已封存。到 2027.08.04 会自动打开。');
    } catch {
      setStatus('保存失败，请先下载备份。');
    }
  };

  const download = () => {
    const blob = new Blob(
      [JSON.stringify({ unlockAt: UNLOCK_AT, text }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lyjy-写给730天.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reopen = () => {
    if (!window.confirm('重新编辑会解除本浏览器里的封存状态，原文不会删除。确定继续吗？')) return;
    setSealed(false);
  };

  return (
    <main className={styles.page}>
      <div className={styles.stars} aria-hidden="true" />

      <header className={styles.bar}>
        <Link href="/anniversary" className={styles.back}>← 回到星图</Link>
        <span className={styles.barTitle}>730 天 · 时间胶囊</span>
        <span className={styles.barMeta}>2027.08.04 打开</span>
      </header>

      <section className={styles.stage}>
        <article className={styles.letter}>
          <p className={styles.kicker}>第 730 天 · 建站两周年</p>
          <h1 className={styles.title}>写给两年后的自己</h1>
          <p className={styles.lede}>
            2025.08.04 到 2027.08.04，正好 730 天。
            <br />
            这封信现在封上，到那天才会自己打开。
          </p>

          {!ready ? (
            <p className={styles.loading}>正在读取本地信件…</p>
          ) : unlocked ? (
            <>
              <div className={styles.opened}>
                <span className={styles.openedMark}>已到期 · 可以读了</span>
                <p className={styles.letterBody}>{text || '这一封是空的——写的时候大概太忙了。'}</p>
              </div>
              <div className={styles.actions}>
                <button type="button" onClick={download} className={styles.ghost}>下载备份</button>
                <button type="button" onClick={reopen} className={styles.ghost}>重新编辑</button>
              </div>
            </>
          ) : sealed ? (
            <>
              <div className={styles.sealedBox}>
                <span className={styles.lock} aria-hidden="true">✉</span>
                <strong>已封存</strong>
                <p>
                  还有 <b>{daysLeft}</b> 天。到 2027.08.04，这一页会自己把信打开。
                </p>
              </div>
              <div className={styles.actions}>
                <button type="button" onClick={download} className={styles.ghost}>下载备份</button>
                <button type="button" onClick={reopen} className={styles.ghost}>重新编辑</button>
              </div>
            </>
          ) : (
            <>
              <textarea
                className={styles.editor}
                aria-label="写给 730 天的信"
                placeholder="两年后的我，你好……"
                value={text}
                maxLength={20000}
                onChange={(e) => setText(e.target.value)}
              />
              <div className={styles.actions}>
                <button type="button" onClick={seal} className={styles.solid}>封存这封信</button>
                <button type="button" onClick={download} className={styles.ghost} disabled={!text}>下载备份</button>
              </div>
            </>
          )}

          <p className={styles.note}>
            只存在这台设备的浏览器里，不上传服务器。清缓存或换设备会丢，建议同时下载备份。
            封存是仪式感，不是加密保险箱——浏览器时间也可以被改。
          </p>
          {status ? <p className={styles.status} role="status">{status}</p> : null}
        </article>
      </section>
    </main>
  );
}

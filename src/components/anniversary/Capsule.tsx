'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Capsule.module.css';

const FALLBACK_UNLOCK = '2027-08-04';
const USER_KEY = 'lyjy_capsule_user_v1';

type View = 'idle' | 'loading' | 'new' | 'sealed' | 'unlocked';

export default function Capsule() {
  const [username, setUsername] = useState('');
  const [text, setText] = useState('');
  const [content, setContent] = useState('');
  const [view, setView] = useState<View>('idle');
  const [daysLeft, setDaysLeft] = useState(0);
  const [unlockAt, setUnlockAt] = useState(FALLBACK_UNLOCK);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // 记住上次用的用户名，下次自动带出来
  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) setUsername(saved);
    } catch {
      /* 忽略 */
    }
  }, []);

  const lookup = async () => {
    const name = username.trim();
    if (!name) {
      setError('先填一个用户名，它就是取信的凭证。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      // 本地改系统时间时，服务端进程不一定感知得到，这里把浏览器日期一并带上
      const today = new Date().toLocaleDateString('sv-SE');
      const res = await fetch(`/api/capsule?username=${encodeURIComponent(name)}&asOf=${today}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '读取失败');
        return;
      }
      try {
        localStorage.setItem(USER_KEY, name);
      } catch {
        /* 忽略 */
      }
      if (typeof data.unlockAt === 'string') setUnlockAt(data.unlockAt);
      if (!data.exists) {
        setView('new');
        setText('');
        return;
      }
      if (data.unlocked) {
        setContent(data.content || '');
        setView('unlocked');
        return;
      }
      setDaysLeft(data.daysLeft ?? 0);
      setView('sealed');
    } catch {
      setError('网络不太好，再试一次。');
    } finally {
      setBusy(false);
    }
  };

  const seal = async () => {
    const name = username.trim();
    if (!name) {
      setError('先填用户名，不然到期那天找不到这封信。');
      return;
    }
    if (!text.trim()) {
      setError('先写一句想留给未来的话。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const today = new Date().toLocaleDateString('sv-SE');
      const res = await fetch(`/api/capsule?asOf=${today}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, content: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '保存失败');
        return;
      }
      try {
        localStorage.setItem(USER_KEY, name);
      } catch {
        /* 忽略 */
      }
      if (typeof data.unlockAt === 'string') setUnlockAt(data.unlockAt);
      setDaysLeft(data.daysLeft ?? 0);
      setView('sealed');
      setError('');
    } catch {
      setError('网络不太好，再试一次。');
    } finally {
      setBusy(false);
    }
  };

  const rewrite = () => {
    if (!window.confirm('到期前服务端不会返回正文，所以看不到原文。\n重写会覆盖服务器上的那封，确定吗？')) return;
    setText('');
    setView('new');
  };

  const download = () => {
    const body = content || text;
    const blob = new Blob(
      [JSON.stringify({ username, unlockAt, content: body }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lyjy-写给730天-${username || '未命名'}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
            2025.08.04 到 {unlockAt.replaceAll('-', '.')}，正好 730 天。
            <br />
            信存在服务器上，到那天用同一个用户名回来取。
          </p>

          <div className={styles.field}>
            <label htmlFor="capsule-user">取信凭证 · 用户名</label>
            <div className={styles.fieldRow}>
              <input
                id="capsule-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="只有你自己记得的名字"
                maxLength={20}
                autoComplete="off"
                disabled={view === 'sealed' || view === 'unlocked'}
              />
              <button type="button" onClick={lookup} className={styles.solid} disabled={busy || view === 'sealed' || view === 'unlocked'}>
                {busy ? '查询中…' : '查看我的信'}
              </button>
            </div>
            <p className={styles.hint}>
              2–20 位，中英文、数字、下划线、短横线。到期那天用同一个名字来取，忘了就真的取不到了。
            </p>
          </div>

          {error ? <p className={styles.status} role="status">{error}</p> : null}

          {view === 'idle' ? (
            <p className={styles.hint}>
              第一次来？填好用户名点「查看我的信」，没有记录就会让你写。
            </p>
          ) : null}

          {view === 'new' ? (
            <>
              <textarea
                className={styles.editor}
                aria-label="写给 730 天的信"
                placeholder={`${username || '两年后的我'}，你好……`}
                value={text}
                maxLength={20000}
                onChange={(e) => setText(e.target.value)}
              />
              <div className={styles.actions}>
                <button type="button" onClick={seal} className={styles.solid} disabled={busy}>
                  {busy ? '封存中…' : '封存这封信'}
                </button>
                <button type="button" onClick={download} className={styles.ghost} disabled={!text}>
                  下载备份
                </button>
              </div>
            </>
          ) : null}

          {view === 'sealed' ? (
            <>
              <div className={styles.sealedBox}>
                <span className={styles.lock} aria-hidden="true">✉</span>
                <strong>已封存 · {username}</strong>
                <p>
                  还有 <b>{daysLeft}</b> 天。到 {unlockAt.replaceAll('-', '.')}，用这个名字回来，信会自己打开。
                </p>
              </div>
              <div className={styles.actions}>
                <button type="button" onClick={rewrite} className={styles.ghost}>重写并覆盖</button>
                <button type="button" onClick={download} className={styles.ghost}>下载备份</button>
              </div>
              <p className={styles.hint}>到期前服务端不返回正文，所以这里看不到原文——这是故意的。</p>
            </>
          ) : null}

          {view === 'unlocked' ? (
            <>
              <div className={styles.opened}>
                <span className={styles.openedMark}>已到期 · 可以读了</span>
                <p className={styles.letterBody}>{content || '这一封是空的——写的时候大概太忙了。'}</p>
              </div>
              <div className={styles.actions}>
                <button type="button" onClick={download} className={styles.ghost}>下载备份</button>
              </div>
            </>
          ) : null}

          <p className={styles.note}>
            信只存在本站服务器上（Postgres），不进浏览器缓存，也不发邮件。
            用户名是唯一凭证、没有密码，请取一个别人猜不到的；忘记用户名无法找回。
          </p>
        </article>
      </section>
    </main>
  );
}

import Link from 'next/link';
import styles from './Preparation.module.css';

/**
 * 500 天纪念日的筹备占位页。
 * 线上默认显示这一页；本地在 .env.local 里设 NEXT_PUBLIC_ANNIVERSARY_OPEN=1 才能看到完整内容。
 */
export default function Preparation() {
  return (
    <main className={styles.page}>
      <div className={styles.stars} aria-hidden="true" />
      <section className={styles.card}>
        <p className={styles.kicker}>500 · 纪念日</p>
        <h1 className={styles.title}>为什么你会找到这里。</h1>
        <p className={styles.text}>此处正在筹备 500 天纪念日，过几天再来吧。</p>
        <p className={styles.date}>2026.12.18</p>
        <Link href="/" className={styles.back}>← 回到门户</Link>
      </section>
    </main>
  );
}

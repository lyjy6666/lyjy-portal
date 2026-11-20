'use client';

import { Statistics } from '@/lib/types';
import { formatMinutes, getTodayString } from '@/lib/pomodoro-utils';
import styles from '../studyroom.module.css';

interface StatsPanelProps {
  statistics: Statistics;
}

/** 以共享的 getTodayString 为基准生成连续日期，包含没有记录的日子 */
function recentKeys(days: number): string[] {
  const base = new Date(`${getTodayString()}T00:00:00`);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (days - 1 - i));
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  });
}

export function StatsPanel({ statistics }: StatsPanelProps) {
  const averageDays = statistics.dailyData.length;
  const cards = [
    { label: '今日番茄', value: statistics.todayPomodoros, unit: '段', sub: formatMinutes(statistics.todayFocusMinutes) },
    { label: '本周番茄', value: statistics.weekPomodoros, unit: '段', sub: formatMinutes(statistics.weekFocusMinutes) },
    { label: '累计番茄', value: statistics.totalPomodoros, unit: '段', sub: formatMinutes(statistics.totalFocusMinutes) },
    {
      label: '日均番茄',
      value: averageDays > 0 ? Math.round(statistics.totalPomodoros / averageDays) : 0,
      unit: '段',
      sub: averageDays > 0
        ? formatMinutes(Math.round(statistics.totalFocusMinutes / averageDays))
        : '暂无记录',
    },
  ];

  const byDate = new Map(statistics.dailyData.map((d) => [d.date, d]));
  const weekKeys = recentKeys(7);
  const maxPomodoros = Math.max(1, ...weekKeys.map((k) => byDate.get(k)?.pomodoros ?? 0));
  const heatKeys = recentKeys(28);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>专注记录</h2>
        <span className={styles.cardSub}>与原版番茄钟共享数据</span>
      </div>

      <div className={styles.statsGrid}>
        {cards.map((c) => (
          <div key={c.label} className={styles.statCard}>
            <div className={styles.statLabel}>{c.label}</div>
            <div className={styles.statValue}>
              {c.value}
              <span className={styles.statUnit}>{c.unit}</span>
            </div>
            <div className={styles.statSub}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.chartBlock}>
        <div className={styles.chartTitle}>近 7 天</div>
        {weekKeys.map((key) => {
          const count = byDate.get(key)?.pomodoros ?? 0;
          const minutes = byDate.get(key)?.focusMinutes ?? 0;
          const label = key.slice(5).replace('-', '/');
          return (
            <div key={key} className={styles.barRow}>
              <span className={styles.barLabel}>{label}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: count > 0 ? `${(count / maxPomodoros) * 100}%` : '0%' }}
                />
              </div>
              <span className={styles.barValue}>
                {count} 段 · {minutes} 分
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.divider} />

      <div className={styles.chartBlock}>
        <div className={styles.chartTitle}>近 28 天热力</div>
        <div className={styles.heatmap}>
          {heatKeys.map((key) => {
            const count = byDate.get(key)?.pomodoros ?? 0;
            const level = count === 0 ? 0 : Math.min(4, Math.ceil(count / 2));
            return (
              <div
                key={key}
                className={`${styles.heatCell} ${styles[`heat${level}` as keyof typeof styles]}`}
                title={`${key}：${count} 段`}
              />
            );
          })}
        </div>
        <div className={styles.heatLegend}>
          <span className={styles.legendText}>少</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`${styles.legendCell} ${
                styles[`heat${i}` as keyof typeof styles]
              }`}
            />
          ))}
          <span className={styles.legendText}>多</span>
        </div>
      </div>
    </div>
  );
}

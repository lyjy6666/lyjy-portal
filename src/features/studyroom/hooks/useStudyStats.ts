'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DailyData, Statistics } from '@/lib/types';
import { calculateStatistics, getTodayString } from '@/lib/pomodoro-utils';
import { STORAGE_KEYS } from '../lib/constants';
import { normalizeStats, readJSON, writeJSON } from '../lib/storage';

/**
 * 与原版共用 pomodoro-statistics：首次进入按原样读入历史，不做清空；
 * 新记录按「真实模式时长」累加，而不是原版写死的 25 分钟。
 */
export function useStudyStats() {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [ready, setReady] = useState(false);
  const rawRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    const loaded = readJSON<Statistics>(
      STORAGE_KEYS.stats,
      calculateStatistics([]),
      normalizeStats,
    );
    setDailyData(loaded.dailyData);
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(STORAGE_KEYS.stats);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          rawRef.current = parsed as Record<string, unknown>;
        }
      }
    } catch {
      /* 脏数据已由 normalizeStats 兜底 */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const stats = calculateStatistics(dailyData);
    writeJSON(STORAGE_KEYS.stats, { ...rawRef.current, ...stats });
  }, [dailyData, ready]);

  const recordSession = useCallback((minutes: number) => {
    const today = getTodayString();
    const mins = Math.max(0, Math.round(minutes));
    setDailyData((prev) => {
      const next = [...prev];
      const index = next.findIndex((d) => d.date === today);
      if (index >= 0) {
        next[index] = {
          ...next[index],
          pomodoros: next[index].pomodoros + 1,
          focusMinutes: next[index].focusMinutes + mins,
        };
      } else {
        next.push({ date: today, pomodoros: 1, focusMinutes: mins });
      }
      return next;
    });
  }, []);

  const statistics = useMemo(() => calculateStatistics(dailyData), [dailyData]);

  return { statistics, recordSession };
}

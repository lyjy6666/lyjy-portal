'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TimerConfig, TimerMode } from '@/lib/types';
import { getModeDuration } from '@/lib/pomodoro-utils';
import {
  isWorkMode,
  nextModeAfter,
  SessionSnapshot,
  STORAGE_KEYS,
} from '../lib/constants';
import { normalizeSession, readJSON, writeJSON } from '../lib/storage';

export type CompletionPayload = {
  mode: TimerMode;
  /** 真实模式时长（分钟），由配置决定，而不是写死的 25 */
  minutes: number;
  /** 完成后的累计工作段数 */
  pomodoroCount: number;
  isWork: boolean;
  /** 后台期间到点补记的段不响铃 */
  silent: boolean;
};

type Status = 'idle' | 'running' | 'paused';

const EMPTY_SNAPSHOT: SessionSnapshot = {
  mode: 'focus',
  status: 'idle',
  endAt: null,
  remainingSeconds: 0,
  segmentSeconds: 0,
  pomodoroCount: 0,
  updatedAt: 0,
};

/**
 * 计时内核：以绝对结束时间（Date.now）为准，每 250ms 重算剩余秒数，
 * 切后台回来由 visibilitychange / focus 立刻校正，因此不会产生逐秒递减的漂移。
 */
export function useStudyTimer(
  config: TimerConfig,
  onComplete?: (payload: CompletionPayload) => void,
) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [status, setStatus] = useState<Status>('idle');
  const [endAt, setEndAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(() => getModeDuration('focus', config));
  const [segmentSeconds, setSegmentSeconds] = useState(() => getModeDuration('focus', config));
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const completedRef = useRef(false);
  const silentRef = useRef(false);

  // 挂载后还原进行中的计时（含 endAt / mode / remaining / paused）
  useEffect(() => {
    const snapshot = readJSON<SessionSnapshot>(
      STORAGE_KEYS.timer,
      EMPTY_SNAPSHOT,
      normalizeSession,
    );
    setMode(snapshot.mode);
    setPomodoroCount(snapshot.pomodoroCount);
    setSegmentSeconds(
      snapshot.segmentSeconds > 0
        ? snapshot.segmentSeconds
        : getModeDuration(snapshot.mode, config),
    );
    if (snapshot.status === 'running' && snapshot.endAt !== null) {
      setStatus('running');
      setEndAt(snapshot.endAt);
      setRemainingSeconds(Math.max(0, Math.ceil((snapshot.endAt - Date.now()) / 1000)));
      silentRef.current = snapshot.endAt <= Date.now();
    } else if (snapshot.status === 'paused') {
      setStatus('paused');
      setEndAt(null);
      setRemainingSeconds(
        snapshot.remainingSeconds > 0
          ? snapshot.remainingSeconds
          : getModeDuration(snapshot.mode, config),
      );
    } else {
      setStatus('idle');
      setEndAt(null);
      setRemainingSeconds(
        snapshot.remainingSeconds > 0
          ? snapshot.remainingSeconds
          : getModeDuration(snapshot.mode, config),
      );
    }
    setReady(true);
    // config 在挂载时可能尚未从 localStorage 还原，快照里的 remainingSeconds 已是准数
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const begin = useCallback(
    (nextMode: TimerMode, seconds: number, keepSegment: boolean = false) => {
      completedRef.current = false;
      const safeSeconds = Math.max(1, Math.floor(seconds));
      setMode(nextMode);
      setRemainingSeconds(safeSeconds);
      // 暂停后续计保留本段原计划时长，统计仍记完整一段
      if (!keepSegment) setSegmentSeconds(safeSeconds);
      setEndAt(Date.now() + safeSeconds * 1000);
      setStatus('running');
    },
    [],
  );

  const completeSession = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const work = isWorkMode(mode);
    // 按本段开始时的计划时长入账，中途改配置不会改变这一段的历史口径
    const minutes = Math.round(segmentSeconds / 60);
    const newCount = work ? pomodoroCount + 1 : pomodoroCount;

    setStatus('idle');
    setEndAt(null);
    setRemainingSeconds(0);
    if (work) setPomodoroCount(newCount);

    onCompleteRef.current?.({
      mode,
      minutes,
      pomodoroCount: newCount,
      isWork: work,
      silent: silentRef.current,
    });
    silentRef.current = false;

    const next = nextModeAfter(mode, newCount, config);
    const nextDuration = getModeDuration(next, config);
    setMode(next);
    setRemainingSeconds(nextDuration);
    setSegmentSeconds(nextDuration);

    const autoStart = work ? config.autoStartBreaks : config.autoStartPomodoros;
    if (autoStart) begin(next, nextDuration);
  }, [mode, config, pomodoroCount, segmentSeconds, begin]);

  // 唯一的 tick 来源：绝对时间差，不逐秒累加；后台回来立即补算
  useEffect(() => {
    if (!ready || status !== 'running' || endAt === null) return;

    const update = () => {
      const secs = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemainingSeconds((prev) => (prev === secs ? prev : secs));
      if (secs <= 0) completeSession();
    };

    update();
    const timer = window.setInterval(update, 250);
    const onVisible = () => {
      if (!document.hidden) update();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [ready, status, endAt, completeSession]);

  // 空闲状态下改配置，立即同步为新时长；暂停中保留用户剩余时间
  useEffect(() => {
    if (!ready || status !== 'idle') return;
    const expected = getModeDuration(mode, config);
    setRemainingSeconds((prev) => (prev === expected ? prev : expected));
    setSegmentSeconds((prev) => (prev === expected ? prev : expected));
  }, [ready, status, mode, config]);

  useEffect(() => {
    if (!ready) return;
    const snapshot: SessionSnapshot = {
      mode,
      status,
      endAt: status === 'running' ? endAt : null,
      remainingSeconds,
      segmentSeconds,
      pomodoroCount,
      updatedAt: Date.now(),
    };
    writeJSON(STORAGE_KEYS.timer, snapshot);
  }, [ready, mode, status, endAt, remainingSeconds, segmentSeconds, pomodoroCount]);

  const start = useCallback(() => {
    const seconds = remainingSeconds > 0 ? remainingSeconds : getModeDuration(mode, config);
    begin(mode, seconds, status === 'paused');
  }, [begin, mode, remainingSeconds, config, status]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    const secs =
      endAt === null
        ? remainingSeconds
        : Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    setRemainingSeconds(secs);
    setEndAt(null);
    setStatus('paused');
  }, [status, endAt, remainingSeconds]);

  const toggle = useCallback(() => {
    if (status === 'running') pause();
    else start();
  }, [status, pause, start]);

  const reset = useCallback(() => {
    completedRef.current = false;
    silentRef.current = false;
    const duration = getModeDuration(mode, config);
    setStatus('idle');
    setEndAt(null);
    setRemainingSeconds(duration);
    setSegmentSeconds(duration);
  }, [mode, config]);

  const switchMode = useCallback(
    (next: TimerMode) => {
      if (next === mode && status !== 'running') return;
      completedRef.current = false;
      silentRef.current = false;
      const duration = getModeDuration(next, config);
      setStatus('idle');
      setEndAt(null);
      setMode(next);
      setRemainingSeconds(duration);
      setSegmentSeconds(duration);
    },
    [mode, status, config],
  );

  const totalSeconds = segmentSeconds > 0 ? segmentSeconds : getModeDuration(mode, config);
  const progress =
    totalSeconds > 0
      ? Math.min(1, Math.max(0, (totalSeconds - remainingSeconds) / totalSeconds))
      : 0;

  return {
    ready,
    mode,
    status,
    remainingSeconds,
    totalSeconds,
    pomodoroCount,
    progress,
    isRunning: status === 'running',
    isPaused: status === 'paused',
    start,
    pause,
    toggle,
    reset,
    switchMode,
  };
}

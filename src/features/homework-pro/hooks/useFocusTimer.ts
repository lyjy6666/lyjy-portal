'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type FocusState = {
  running: boolean;
  remainingSec: number;
  totalSec: number;
  taskId: number | null;
};

/** completed = 计时自然归零；stopped = 用户主动「结束并记录」 */
export type FocusReason = 'completed' | 'stopped';

const PRESETS = [15, 25, 45, 60, 90] as const;

/**
 * 专注计时：用时间戳而非逐秒自减，避免后台标签页节流导致漂移。
 * 只负责计时与回填实际耗时，是否把作业标记完成由用户决定。
 */
export function useFocusTimer(onComplete: (taskId: number, minutes: number, reason: FocusReason) => void) {
  const [taskId, setTaskId] = useState<number | null>(null);
  const [totalSec, setTotalSec] = useState(25 * 60);
  const [remainingSec, setRemainingSec] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  const start = useCallback((id: number, minutes = 25) => {
    const sec = Math.max(1, Math.round(minutes)) * 60;
    setTaskId(id);
    setTotalSec(sec);
    setRemainingSec(sec);
    endAtRef.current = Date.now() + sec * 1000;
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (!running) return;
    setRunning(false);
    endAtRef.current = null;
  }, [running]);

  const resume = useCallback(() => {
    if (running || taskId === null) return;
    endAtRef.current = Date.now() + remainingSec * 1000;
    setRunning(true);
  }, [running, taskId, remainingSec]);

  /** 放弃：不记录耗时 */
  const stop = useCallback(() => {
    setRunning(false);
    endAtRef.current = null;
    setTaskId(null);
    setRemainingSec(totalSec);
  }, [totalSec]);

  /** 提前结束：按真实已专注时间回填 */
  const finishEarly = useCallback(() => {
    if (taskId === null) return;
    const minutes = Math.max(1, Math.round((totalSec - remainingSec) / 60));
    setRunning(false);
    endAtRef.current = null;
    completeRef.current(taskId, minutes, 'stopped');
    setTaskId(null);
  }, [taskId, totalSec, remainingSec]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const end = endAtRef.current;
      if (end === null) return;
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemainingSec(left);
      if (left <= 0) {
        setRunning(false);
        endAtRef.current = null;
        if (taskId !== null) completeRef.current(taskId, Math.round(totalSec / 60), 'completed');
        setTaskId(null);
        setRemainingSec(totalSec);
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [running, taskId, totalSec]);

  const state: FocusState = { running, remainingSec, totalSec, taskId };
  return { state, start, pause, resume, stop, finishEarly, presets: PRESETS };
}

import { DailyData, SoundConfig, Statistics, Task, TimerConfig, TimerMode } from '@/lib/types';
import { calculateStatistics, defaultTimerConfig } from '@/lib/pomodoro-utils';
import { ALL_MODES, DEFAULT_GOAL, SessionSnapshot } from './constants';

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** SSR 安全 + try/catch：隐私模式、配额超限、脏 JSON 都不会导致白屏 */
export function readRaw(key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  } catch {
    /* 忽略：无痕模式 / 存储配额不足 */
  }
}

export function readJSON<T>(key: string, fallback: T, normalize: (raw: unknown) => T | null): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return normalize(JSON.parse(raw) as unknown) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    if (typeof window !== 'undefined') writeRaw(key, JSON.stringify(value));
  } catch {
    /* 循环引用等异常也不让页面崩 */
  }
}

function boundedInt(value: unknown, fallback: number, min: number, max: number): number {
  if (!isNum(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeConfig(raw: unknown): TimerConfig {
  const o = isObj(raw) ? raw : {};
  const duration = (key: keyof TimerConfig, fallback: number) =>
    boundedInt(o[key], fallback, 1, 180);
  return {
    focusDuration: duration('focusDuration', defaultTimerConfig.focusDuration),
    studyDuration: duration('studyDuration', defaultTimerConfig.studyDuration),
    meditationDuration: duration('meditationDuration', defaultTimerConfig.meditationDuration),
    exerciseDuration: duration('exerciseDuration', defaultTimerConfig.exerciseDuration),
    readingDuration: duration('readingDuration', defaultTimerConfig.readingDuration),
    shortBreakDuration: duration('shortBreakDuration', defaultTimerConfig.shortBreakDuration),
    longBreakDuration: duration('longBreakDuration', defaultTimerConfig.longBreakDuration),
    longBreakInterval: boundedInt(
      o.longBreakInterval,
      defaultTimerConfig.longBreakInterval,
      2,
      12,
    ),
    autoStartBreaks:
      typeof o.autoStartBreaks === 'boolean'
        ? o.autoStartBreaks
        : defaultTimerConfig.autoStartBreaks,
    autoStartPomodoros:
      typeof o.autoStartPomodoros === 'boolean'
        ? o.autoStartPomodoros
        : defaultTimerConfig.autoStartPomodoros,
  };
}

const SOUND_TYPES: SoundConfig['whiteNoise'][] = [
  'none', 'rain', 'forest', 'ocean', 'cafe', 'wind', 'birds',
  'stream', 'fire', 'whitenoise', 'pinknoise', 'brownnoise',
];
const ALARM_TYPES: SoundConfig['alarm'][] = ['bell', 'chime', 'gentle', 'digital'];

export function normalizeSound(raw: unknown): SoundConfig {
  const o = isObj(raw) ? raw : {};
  return {
    whiteNoise: SOUND_TYPES.includes(o.whiteNoise as SoundConfig['whiteNoise'])
      ? (o.whiteNoise as SoundConfig['whiteNoise'])
      : 'none',
    alarm: ALARM_TYPES.includes(o.alarm as SoundConfig['alarm'])
      ? (o.alarm as SoundConfig['alarm'])
      : 'bell',
    volume: boundedInt(o.volume, 50, 0, 100),
    playDuringFocus: o.playDuringFocus === true,
    playDuringBreak: o.playDuringBreak === true,
  };
}

export function normalizeTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isObj).map((o) => {
    const created = isNum(o.createdAt)
      ? o.createdAt
      : typeof o.createdAt === 'string'
        ? Date.parse(o.createdAt)
        : Date.now();
    return {
      id: typeof o.id === 'string' ? o.id : `${Date.now()}-${Math.random()}`,
      title: typeof o.title === 'string' ? o.title : '未命名任务',
      description: typeof o.description === 'string' ? o.description : '',
      completed: o.completed === true,
      pomodoros: boundedInt(o.pomodoros, 0, 0, 9999),
      estimatedPomodoros: boundedInt(o.estimatedPomodoros, 1, 1, 20),
      createdAt: Number.isFinite(created) ? new Date(created) : new Date(),
    };
  });
}

export function normalizeStats(raw: unknown): Statistics {
  const o = isObj(raw) ? raw : {};
  const byDate = new Map<string, DailyData>();
  if (Array.isArray(o.dailyData)) {
    o.dailyData.filter(isObj).forEach((d) => {
      if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return;
      byDate.set(d.date, {
        date: d.date,
        pomodoros: boundedInt(d.pomodoros, 0, 0, 9999),
        focusMinutes: boundedInt(d.focusMinutes, 0, 0, 100000),
      });
    });
  }
  const dailyData = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return calculateStatistics(dailyData);
}

export function normalizeGoal(raw: unknown): number {
  return boundedInt(raw, DEFAULT_GOAL, 1, 30);
}

export function normalizeSession(raw: unknown): SessionSnapshot | null {
  if (!isObj(raw)) return null;
  const mode: TimerMode = ALL_MODES.includes(raw.mode as TimerMode)
    ? (raw.mode as TimerMode)
    : 'focus';
  let status: SessionSnapshot['status'] =
    raw.status === 'running' || raw.status === 'paused' ? raw.status : 'idle';
  const endAt = isNum(raw.endAt) ? raw.endAt : null;
  // 运行中却没有结束时间 = 脏数据，降级为暂停而不是白屏
  if (status === 'running' && endAt === null) status = 'paused';
  return {
    mode,
    status,
    endAt,
    remainingSeconds: boundedInt(raw.remainingSeconds, 0, 0, 24 * 3600),
    segmentSeconds: boundedInt(raw.segmentSeconds, 0, 0, 24 * 3600),
    pomodoroCount: boundedInt(raw.pomodoroCount, 0, 0, 9999),
    updatedAt: isNum(raw.updatedAt) ? raw.updatedAt : Date.now(),
  };
}

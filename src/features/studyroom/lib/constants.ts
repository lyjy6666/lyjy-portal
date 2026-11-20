import { TimerConfig, TimerMode } from '@/lib/types';

/** 会被计入统计、并触发「工作 → 休息」切换的模式 */
export const WORK_MODES: TimerMode[] = ['focus', 'study', 'meditation', 'exercise', 'reading'];
export const BREAK_MODES: TimerMode[] = ['shortBreak', 'longBreak'];
export const ALL_MODES: TimerMode[] = [...WORK_MODES, ...BREAK_MODES];

export type ModeMeta = {
  label: string;
  hint: string;
  tone: 'work' | 'rest';
  color: string;
};

export const MODE_META: Record<TimerMode, ModeMeta> = {
  focus: { label: '专注', hint: '心无旁骛，完成手头的事', tone: 'work', color: '#cf7047' },
  study: { label: '学习', hint: '深度学习，啃下难啃的知识', tone: 'work', color: '#b07a4a' },
  meditation: { label: '冥想', hint: '静坐片刻，让思绪落定', tone: 'work', color: '#a98a5b' },
  exercise: { label: '运动', hint: '活动身体，唤醒能量', tone: 'work', color: '#9c7b57' },
  reading: { label: '阅读', hint: '翻开书页，慢慢读', tone: 'work', color: '#b98250' },
  shortBreak: { label: '短休息', hint: '起身、喝水、看看远处', tone: 'rest', color: '#7f9c6b' },
  longBreak: { label: '长休息', hint: '走开一会儿，真正放松', tone: 'rest', color: '#6f8f8a' },
};

/** 计时与任务复用原版 key，配置/浮窗等新数据使用独立 key */
export const STORAGE_KEYS = {
  config: 'studyroom-config',
  timer: 'studyroom-timer',
  goal: 'studyroom-goal',
  tasks: 'pomodoro-tasks',
  stats: 'pomodoro-statistics',
  sound: 'pomodoro-sound',
} as const;

export const DEFAULT_GOAL = 6;

/** 进行中的计时快照：refresh 后据此还原 */
export type SessionSnapshot = {
  mode: TimerMode;
  status: 'idle' | 'running' | 'paused';
  endAt: number | null;
  remainingSeconds: number;
  /** 本段开始时的计划总秒数，避免中途改配置影响统计口径 */
  segmentSeconds: number;
  pomodoroCount: number;
  updatedAt: number;
};

export const isWorkMode = (mode: TimerMode): boolean => WORK_MODES.includes(mode);
export const isBreakMode = (mode: TimerMode): boolean => BREAK_MODES.includes(mode);

/** 段结束后去哪里：工作完成按间隔进短/长休息，休息完成回到专注 */
export function nextModeAfter(mode: TimerMode, completedPomodoros: number, config: TimerConfig): TimerMode {
  if (!isWorkMode(mode)) return 'focus';
  const interval =
    Number.isFinite(config.longBreakInterval) && config.longBreakInterval > 0
      ? Math.floor(config.longBreakInterval)
      : 4;
  return completedPomodoros % interval === 0 ? 'longBreak' : 'shortBreak';
}

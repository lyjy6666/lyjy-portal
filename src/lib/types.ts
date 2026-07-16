// 计时器模式
export type TimerMode =
  | 'focus'      // 专注工作
  | 'study'      // 学习
  | 'meditation' // 冥想
  | 'exercise'   // 运动
  | 'reading'    // 阅读
  | 'shortBreak' // 短休息
  | 'longBreak'; // 长休息

// 计时器状态
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

// 任务类型
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  pomodoros: number;
  estimatedPomodoros: number;
  createdAt: Date;
}

// 计时器配置
export interface TimerConfig {
  focusDuration: number; // 专注时长（分钟）
  studyDuration: number; // 学习时长（分钟）
  meditationDuration: number; // 冥想时长（分钟）
  exerciseDuration: number; // 运动时长（分钟）
  readingDuration: number; // 阅读时长（分钟）
  shortBreakDuration: number; // 短休息时长（分钟）
  longBreakDuration: number; // 长休息时长（分钟）
  longBreakInterval: number; // 多少个番茄后长休息
  autoStartBreaks: boolean; // 自动开始休息
  autoStartPomodoros: boolean; // 自动开始番茄钟
}

// 音效类型
export type SoundType = 'none' | 'rain' | 'forest' | 'ocean' | 'cafe' | 'wind' | 'birds' | 'stream' | 'fire' | 'whitenoise' | 'pinknoise' | 'brownnoise';

// 提醒铃声类型
export type AlarmType = 'bell' | 'chime' | 'gentle' | 'digital';

// 音效配置
export interface SoundConfig {
  whiteNoise: SoundType;
  alarm: AlarmType;
  volume: number; // 0-100
  playDuringFocus: boolean;
  playDuringBreak: boolean;
}

// 统计数据
export interface Statistics {
  todayPomodoros: number;
  todayFocusMinutes: number;
  weekPomodoros: number;
  weekFocusMinutes: number;
  totalPomodoros: number;
  totalFocusMinutes: number;
  dailyData: DailyData[];
}

// 每日数据
export interface DailyData {
  date: string; // YYYY-MM-DD
  pomodoros: number;
  focusMinutes: number;
}

// 主题配置
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

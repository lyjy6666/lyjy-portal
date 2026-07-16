import { TimerConfig, TimerMode, Task, DailyData, Statistics } from './types';

// 默认计时器配置
export const defaultTimerConfig: TimerConfig = {
  focusDuration: 25,
  studyDuration: 45,
  meditationDuration: 15,
  exerciseDuration: 30,
  readingDuration: 40,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

// 格式化时间（秒 -> MM:SS）
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 格式化分钟（分钟 -> HH:MM）
export const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分钟`;
  return `${hours}小时${mins}分钟`;
};

// 计算进度百分比
export const calculateProgress = (currentTime: number, totalTime: number): number => {
  if (totalTime === 0) return 0;
  return ((totalTime - currentTime) / totalTime) * 100;
};

// 计算圆形进度条的描边偏移
export const calculateStrokeDashoffset = (progress: number, circumference: number): number => {
  return circumference - (progress / 100) * circumference;
};

// 根据模式获取时长（秒）
export const getModeDuration = (mode: TimerMode, config: TimerConfig): number => {
  switch (mode) {
    case 'focus':
      return config.focusDuration * 60;
    case 'study':
      return config.studyDuration * 60;
    case 'meditation':
      return config.meditationDuration * 60;
    case 'exercise':
      return config.exerciseDuration * 60;
    case 'reading':
      return config.readingDuration * 60;
    case 'shortBreak':
      return config.shortBreakDuration * 60;
    case 'longBreak':
      return config.longBreakDuration * 60;
    default:
      return config.focusDuration * 60;
  }
};

// 获取下一个模式
export const getNextMode = (currentMode: TimerMode, completedPomodoros: number, config: TimerConfig): TimerMode => {
  // 工作类模式完成后进入休息
  const workModes: TimerMode[] = ['focus', 'study', 'exercise', 'reading'];
  if (workModes.includes(currentMode)) {
    // 检查是否需要长休息（基于总完成数）
    if ((completedPomodoros + 1) % config.longBreakInterval === 0) {
      return 'longBreak';
    }
    return 'shortBreak';
  }
  // 休息或冥想完成后，回到专注模式
  return 'focus';
};

// 创建新任务
export const createTask = (title: string, estimatedPomodoros: number = 1): Task => {
  return {
    id: Date.now().toString(),
    title,
    description: '',
    completed: false,
    pomodoros: 0,
    estimatedPomodoros,
    createdAt: new Date(),
  };
};

// 获取今日日期字符串（YYYY-MM-DD）
export const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// 获取本周日期范围
export const getWeekRange = (): { start: Date; end: Date } => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { start: startOfWeek, end: endOfWeek };
};

// 计算统计数据
export const calculateStatistics = (dailyData: DailyData[]): Statistics => {
  const today = getTodayString();
  const { start: weekStart, end: weekEnd } = getWeekRange();

  const todayData = dailyData.find((d) => d.date === today) || { pomodoros: 0, focusMinutes: 0 };
  const weekData = dailyData.filter((d) => {
    const date = new Date(d.date);
    return date >= weekStart && date <= weekEnd;
  });

  const weekPomodoros = weekData.reduce((sum, d) => sum + d.pomodoros, 0);
  const weekFocusMinutes = weekData.reduce((sum, d) => sum + d.focusMinutes, 0);
  const totalPomodoros = dailyData.reduce((sum, d) => sum + d.pomodoros, 0);
  const totalFocusMinutes = dailyData.reduce((sum, d) => sum + d.focusMinutes, 0);

  return {
    todayPomodoros: todayData.pomodoros,
    todayFocusMinutes: todayData.focusMinutes,
    weekPomodoros,
    weekFocusMinutes,
    totalPomodoros,
    totalFocusMinutes,
    dailyData: dailyData.slice(-30), // 只保留最近30天
  };
};

// Web Audio API 音频上下文
let audioContext: AudioContext | null = null;

// 初始化音频上下文
export const initAudioContext = (): AudioContext => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
};

// 生成白噪音和各种环境音（优化版本）
export const generateWhiteNoise = (
  type: 'none' | 'rain' | 'forest' | 'ocean' | 'cafe' | 'wind' | 'birds' | 'stream' | 'fire' | 'whitenoise' | 'pinknoise' | 'brownnoise',
  duration: number = 5 // 默认5秒循环
): void => {
  const ctx = initAudioContext();

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // 根据类型生成不同的声音
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;

    switch (type) {
      case 'whitenoise':
        // 白噪音 - 纯随机
        data[i] = Math.random() * 2 - 1;
        break;

      case 'pinknoise':
        // 粉红噪音 - 更柔和
        data[i] = (Math.random() * 2 - 1) * 0.5;
        break;

      case 'brownnoise':
        // 棕色噪音 - 最柔和，深沉
        data[i] = (Math.random() * 2 - 1) * 0.3;
        break;

      case 'rain':
        // 雨声 - 低通滤波白噪音
        data[i] = (Math.random() * 2 - 1) * 0.4;
        break;

      case 'forest':
        // 森林 - 轻柔噪音 + 偶尔鸟鸣（简化版）
        data[i] = (Math.random() * 2 - 1) * 0.3;
        break;

      case 'ocean':
        // 海浪 - 模拟波浪节奏
        const wave = Math.sin(t * 0.5) * 0.5 + 0.5;
        data[i] = (Math.random() * 2 - 1) * 0.3 * wave;
        break;

      case 'cafe':
        // 咖啡厅 - 降低音量，更柔和
        data[i] = (Math.random() * 2 - 1) * 0.15;
        break;

      case 'wind':
        // 风声 - 低频噪音
        data[i] = (Math.random() * 2 - 1) * 0.35;
        break;

      case 'birds':
        // 鸟鸣 - 高频音调（简化版）
        if (Math.random() > 0.995) {
          data[i] = Math.sin(t * 2000 + Math.random() * 1000) * 0.2;
        } else {
          data[i] = (Math.random() * 2 - 1) * 0.1;
        }
        break;

      case 'stream':
        // 溪流 - 持续水流声
        data[i] = (Math.random() * 2 - 1) * 0.35;
        break;

      case 'fire':
        // 篝火 - 劈啪声（简化版）
        if (Math.random() > 0.99) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        } else {
          data[i] = (Math.random() * 2 - 1) * 0.25;
        }
        break;

      default:
        data[i] = 0;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true; // 设置循环播放

  // 应用滤波器
  const filter = ctx.createBiquadFilter();

  switch (type) {
    case 'rain':
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      break;
    case 'forest':
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 1;
      break;
    case 'ocean':
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      break;
    case 'cafe':
      filter.type = 'bandpass';
      filter.frequency.value = 1500;
      filter.Q.value = 0.5;
      break;
    case 'wind':
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      break;
    case 'birds':
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      break;
    case 'stream':
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      break;
    case 'fire':
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      break;
    case 'whitenoise':
    case 'pinknoise':
    case 'brownnoise':
      filter.type = 'allpass';
      break;
    default:
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
  }

  // 音量控制 - 降低默认音量
  const gainNode = ctx.createGain();
  const volumes: Record<string, number> = {
    none: 0,
    rain: 0.15,
    forest: 0.15,
    ocean: 0.2,
    cafe: 0.08, // 大幅降低咖啡厅音量
    wind: 0.12,
    birds: 0.1,
    stream: 0.15,
    fire: 0.15,
    whitenoise: 0.1,
    pinknoise: 0.15,
    brownnoise: 0.2,
  };
  gainNode.gain.value = volumes[type] || 0.1;

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
};

// 播放提示音
export const playAlarm = (type: 'bell' | 'chime' | 'gentle' | 'digital', volume: number = 0.5): void => {
  const ctx = initAudioContext();
  const now = ctx.currentTime;

  if (type === 'bell') {
    // 钟声效果
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(830, now);
    oscillator.frequency.exponentialRampToValueAtTime(415, now + 0.5);
    
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(now);
    oscillator.stop(now + 1.5);
  } else if (type === 'chime') {
    // 风铃效果
    const frequencies = [523, 659, 784, 1047];
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + i * 0.1);
      
      gainNode.gain.setValueAtTime(0, now + i * 0.1);
      gainNode.gain.linearRampToValueAtTime(volume, now + i * 0.1 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 1);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(now + i * 0.1);
      oscillator.stop(now + i * 0.1 + 1);
    });
  } else if (type === 'gentle') {
    // 温柔提示
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, now);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(now);
    oscillator.stop(now + 0.8);
  } else if (type === 'digital') {
    // 数字提示
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(1100, now + 0.1);
    
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }
};

// 停止所有音频
export const stopAllAudio = (): void => {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
};

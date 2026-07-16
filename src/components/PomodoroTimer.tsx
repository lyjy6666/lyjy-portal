import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const TIMER_SETTINGS = {
  work: 25 * 60, // 25分钟
  shortBreak: 5 * 60, // 5分钟
  longBreak: 15 * 60, // 15分钟
};

const MODE_LABELS = {
  work: { label: '专注时间', icon: '🍅', color: 'text-red-400', bg: 'bg-red-500/20' },
  shortBreak: { label: '短休息', icon: '☕', color: 'text-green-400', bg: 'bg-green-500/20' },
  longBreak: { label: '长休息', icon: '🏖️', color: 'text-blue-400', bg: 'bg-blue-500/20' },
};

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // 格式化时间
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 切换模式
  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_SETTINGS[newMode]);
    setIsRunning(false);
  }, []);

  // 计时器逻辑
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          // 播放提示音
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
            audio.play().catch(() => {});
          } catch (e) {
            // 忽略音频播放错误
          }
          
          // 如果是工作模式结束，增加计数
          if (mode === 'work') {
            setPomodoroCount((prev) => prev + 1);
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  // 重置计时器
  const resetTimer = useCallback(() => {
    setTimeLeft(TIMER_SETTINGS[mode]);
    setIsRunning(false);
  }, [mode]);

  // 计算进度
  const progress = ((TIMER_SETTINGS[mode] - timeLeft) / TIMER_SETTINGS[mode]) * 100;

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMode = MODE_LABELS[mode];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* 背景遮罩 */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* 主内容 */}
        <motion.div
          className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 w-full max-w-sm shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-times text-lg"></i>
          </button>

          {/* 标题 */}
          <div className="text-center mb-6">
            <h3 className="text-white text-xl font-semibold flex items-center justify-center gap-2">
              <span className="text-2xl">🍅</span>
              番茄钟
            </h3>
            <p className="text-white/50 text-sm mt-1">专注工作，高效休息</p>
          </div>

          {/* 模式选择 */}
          <div className="flex gap-2 mb-6">
            {(Object.keys(TIMER_SETTINGS) as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? `${MODE_LABELS[m].bg} ${MODE_LABELS[m].color}`
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {MODE_LABELS[m].icon} {MODE_LABELS[m].label}
              </button>
            ))}
          </div>

          {/* 计时器显示 */}
          <div className="relative mb-6">
            {/* 进度环 */}
            <svg className="w-48 h-48 mx-auto transform -rotate-90">
              {/* 背景圆 */}
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="none"
              />
              {/* 进度圆 */}
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke={mode === 'work' ? '#ef4444' : mode === 'shortBreak' ? '#22c55e' : '#3b82f6'}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                initial={false}
                animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - progress / 100) }}
                transition={{ duration: 0.5 }}
              />
            </svg>

            {/* 时间显示 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${currentMode.color}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-white/50 text-sm mt-2">{currentMode.label}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                isRunning
                  ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {isRunning ? (
                <>
                  <i className="fa-solid fa-pause"></i>
                  暂停
                </>
              ) : (
                <>
                  <i className="fa-solid fa-play"></i>
                  开始
                </>
              )}
            </button>
            <button
              onClick={resetTimer}
              className="flex-1 py-3 rounded-xl font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-rotate-right"></i>
              重置
            </button>
          </div>

          {/* 统计 */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">今日完成</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-400">{pomodoroCount}</span>
                <span className="text-white/50 text-sm">个番茄</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PomodoroTimer;

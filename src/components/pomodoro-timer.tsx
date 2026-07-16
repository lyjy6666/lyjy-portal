'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TimerMode
} from '@/lib/types';
import { formatTime, calculateProgress, calculateStrokeDashoffset } from '@/lib/pomodoro-utils';
import { useTimer } from '@/contexts/timer-context';

interface PomodoroTimerProps {
  showSettings?: boolean;
  onToggleSettings?: () => void;
}

export function PomodoroTimer({ 
  showSettings = false,
  onToggleSettings
}: PomodoroTimerProps) {
  const {
    mode,
    setMode,
    isRunning,
    isPaused,
    remainingTime,
    totalDuration,
    config,
    pomodoroCount,
    startTimer,
    pauseTimer,
    resetTimer,
    updateConfig,
    isMinimized,
    setIsMinimized,
  } = useTimer();

  const [tempFocusDuration, setTempFocusDuration] = useState(config.focusDuration);
  const [tempStudyDuration, setTempStudyDuration] = useState(config.studyDuration);
  const [tempMeditationDuration, setTempMeditationDuration] = useState(config.meditationDuration);
  const [tempExerciseDuration, setTempExerciseDuration] = useState(config.exerciseDuration);
  const [tempReadingDuration, setTempReadingDuration] = useState(config.readingDuration);
  const [tempShortBreakDuration, setTempShortBreakDuration] = useState(config.shortBreakDuration);
  const [tempLongBreakDuration, setTempLongBreakDuration] = useState(config.longBreakDuration);

  const circleRef = useRef<SVGCircleElement>(null);
  const circumference = 2 * Math.PI * 135;

  // 当临时时长改变时，实时更新显示
  useEffect(() => {
    if (showSettings && !isRunning) {
      const durations = {
        focus: tempFocusDuration,
        study: tempStudyDuration,
        meditation: tempMeditationDuration,
        exercise: tempExerciseDuration,
        reading: tempReadingDuration,
        shortBreak: tempShortBreakDuration,
        longBreak: tempLongBreakDuration,
      };
      const duration = durations[mode] || tempFocusDuration;
      updateConfig({ [`${mode}Duration`]: duration });
    }
  }, [showSettings, tempFocusDuration, tempStudyDuration, tempMeditationDuration, tempExerciseDuration, tempReadingDuration, tempShortBreakDuration, tempLongBreakDuration, mode, isRunning, updateConfig]);

  const progress = calculateProgress(remainingTime, totalDuration);
  const strokeDashoffset = calculateStrokeDashoffset(progress, circumference);

  const modeColors = {
    focus: '#ef4444',
    study: '#8b5cf6',
    meditation: '#f59e0b',
    exercise: '#06b6d4',
    reading: '#ec4899',
    shortBreak: '#22c55e',
    longBreak: '#3b82f6',
  };

  const modeLabels = {
    focus: '专注',
    study: '学习',
    meditation: '冥想',
    exercise: '运动',
    reading: '阅读',
    shortBreak: '短休息',
    longBreak: '长休息',
  };

  const modeDescriptions = {
    focus: `${config.focusDuration}分钟专注工作`,
    study: `${config.studyDuration}分钟深度学习`,
    meditation: `${config.meditationDuration}分钟静心冥想`,
    exercise: `${config.exerciseDuration}分钟身体锻炼`,
    reading: `${config.readingDuration}分钟沉浸阅读`,
    shortBreak: `${config.shortBreakDuration}分钟短休息（快速恢复）`,
    longBreak: `${config.longBreakDuration}分钟长休息（深放松）`,
  };

  const toggleTimer = () => {
    if (!isRunning || isPaused) {
      startTimer();
    } else {
      pauseTimer();
    }
  };

  // 判断当前是否是休息模式
  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  // 浮窗模式
  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 p-4 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl z-50 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-4">
          {/* 小进度条 */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#334155"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={modeColors[mode]}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - progress)}
                className="transition-all duration-300 ease-in-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {formatTime(remainingTime)}
              </span>
            </div>
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {modeLabels[mode]}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {modeDescriptions[mode]}
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={toggleTimer}
              size="sm"
              className={`h-10 w-10 rounded-full shadow-lg transition-all ${
                mode === 'focus'
                  ? 'bg-red-500 hover:bg-red-600'
                  : mode === 'study'
                  ? 'bg-violet-500 hover:bg-violet-600'
                  : mode === 'meditation'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : mode === 'exercise'
                  ? 'bg-cyan-500 hover:bg-cyan-600'
                  : mode === 'reading'
                  ? 'bg-pink-500 hover:bg-pink-600'
                  : mode === 'shortBreak'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {!isRunning || isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>

            <Button
              onClick={() => setIsMinimized(false)}
              variant="outline"
              size="sm"
              className="h-10 w-10 rounded-full border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // 完整模式
  return (
    <Card className="p-8 w-full max-w-lg mx-auto bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
      <div className="flex flex-col items-center gap-6">
        {/* 模式切换下拉菜单 */}
        <div className="flex items-center gap-2">
          {isBreakMode ? (
            <div className="w-[180px] text-center text-lg font-semibold text-slate-900 dark:text-white">
              {modeLabels[mode]}
            </div>
          ) : (
            <Select value={mode} onValueChange={(value) => setMode(value as TimerMode)}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="focus">专注</SelectItem>
                <SelectItem value="study">学习</SelectItem>
                <SelectItem value="meditation">冥想</SelectItem>
                <SelectItem value="exercise">运动</SelectItem>
                <SelectItem value="reading">阅读</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 圆形进度条 */}
        <div className="relative w-80 h-80">
          {/* 外圈 */}
          <svg className="w-full h-full transform -rotate-90">
            {/* 背景圆 */}
            <circle
              cx="160"
              cy="160"
              r="135"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* 进度圆 */}
            <circle
              ref={circleRef}
              cx="160"
              cy="160"
              r="135"
              fill="none"
              stroke={modeColors[mode]}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-in-out"
              style={{
                filter:
                  mode === 'focus'
                    ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))'
                    : mode === 'study'
                    ? 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))'
                    : mode === 'meditation'
                    ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))'
                    : mode === 'exercise'
                    ? 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))'
                    : mode === 'reading'
                    ? 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.5))'
                    : mode === 'shortBreak'
                    ? 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))'
                    : 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))'
              }}
            />
          </svg>

          {/* 中心内容 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
            <div className="text-7xl font-bold text-slate-900 dark:text-white mb-2 font-mono">
              {formatTime(remainingTime)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              {modeLabels[mode]}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 text-center">
              {modeDescriptions[mode]}
            </div>
            {pomodoroCount > 0 && (mode === 'focus' || mode === 'study' || mode === 'exercise' || mode === 'reading') && (
              <div className="mt-4 flex gap-1">
                {Array.from({ length: pomodoroCount }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-red-500"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-4">
          <Button
            onClick={toggleTimer}
            size="lg"
            className={`h-16 w-16 rounded-full shadow-lg transition-all ${
              mode === 'focus'
                ? 'bg-red-500 hover:bg-red-600'
                : mode === 'study'
                ? 'bg-violet-500 hover:bg-violet-600'
                : mode === 'meditation'
                ? 'bg-amber-500 hover:bg-amber-600'
                : mode === 'exercise'
                ? 'bg-cyan-500 hover:bg-cyan-600'
                : mode === 'reading'
                ? 'bg-pink-500 hover:bg-pink-600'
                : mode === 'shortBreak'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {!isRunning || isPaused ? (
              <Play className="h-8 w-8 ml-1" />
            ) : (
              <Pause className="h-8 w-8" />
            )}
          </Button>

          <Button
            onClick={resetTimer}
            variant="outline"
            size="lg"
            className="h-16 w-16 rounded-full border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-8 w-8" />
          </Button>

          <Button
            onClick={onToggleSettings}
            variant="outline"
            size="lg"
            className="h-16 w-16 rounded-full border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Settings2 className="h-8 w-8" />
          </Button>

          <Button
            onClick={() => setIsMinimized(true)}
            variant="outline"
            size="lg"
            className="h-16 w-16 rounded-full border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ChevronDown className="h-8 w-8" />
          </Button>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div className="w-full mt-4 p-4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-in fade-in slide-in-from-top-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                  专注时长: {tempFocusDuration} 分钟
                </label>
                <Slider
                  value={[tempFocusDuration]}
                  onValueChange={([value]) => setTempFocusDuration(value)}
                  min={1}
                  max={60}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                  学习时长: {tempStudyDuration} 分钟
                </label>
                <Slider
                  value={[tempStudyDuration]}
                  onValueChange={([value]) => setTempStudyDuration(value)}
                  min={15}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                  冥想时长: {tempMeditationDuration} 分钟
                </label>
                <Slider
                  value={[tempMeditationDuration]}
                  onValueChange={([value]) => setTempMeditationDuration(value)}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                  运动时长: {tempExerciseDuration} 分钟
                </label>
                <Slider
                  value={[tempExerciseDuration]}
                  onValueChange={([value]) => setTempExerciseDuration(value)}
                  min={10}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                  阅读时长: {tempReadingDuration} 分钟
                </label>
                <Slider
                  value={[tempReadingDuration]}
                  onValueChange={([value]) => setTempReadingDuration(value)}
                  min={15}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                  短休息时长: {tempShortBreakDuration} 分钟
                </label>
                <Slider
                  value={[tempShortBreakDuration]}
                  onValueChange={([value]) => setTempShortBreakDuration(value)}
                  min={1}
                  max={15}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                  长休息时长: {tempLongBreakDuration} 分钟
                </label>
                <Slider
                  value={[tempLongBreakDuration]}
                  onValueChange={([value]) => setTempLongBreakDuration(value)}
                  min={5}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

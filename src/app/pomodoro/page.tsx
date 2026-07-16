'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeProvider, useTheme } from 'next-themes';
import { TimerProvider } from '@/contexts/timer-context';
import { PomodoroTimer } from '@/components/pomodoro-timer';
import { TaskManager } from '@/components/task-manager';
import { SoundControl } from '@/components/sound-control';
import { Statistics } from '@/components/statistics';
import { UpdateRecords } from '@/components/update-records';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer, CheckSquare2, Music, BarChart3, Moon, Sun } from 'lucide-react';
import { Task, SoundConfig, Statistics as Stats } from '@/lib/types';
import { calculateStatistics, getTodayString } from '@/lib/pomodoro-utils';
import { useTimer } from '@/contexts/timer-context';

function HomeContent() {
  const { theme, setTheme } = useTheme();
  const { setIsMinimized, isRunning, pomodoroCount } = useTimer();
  
  const [activeTab, setActiveTab] = useState('timer');
  const [showSettings, setShowSettings] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [soundConfig, setSoundConfig] = useState<SoundConfig>({
    whiteNoise: 'none',
    alarm: 'bell',
    volume: 50,
    playDuringFocus: false,
    playDuringBreak: false,
  });
  const [statistics, setStatistics] = useState<Stats>({
    todayPomodoros: 0,
    todayFocusMinutes: 0,
    weekPomodoros: 0,
    weekFocusMinutes: 0,
    totalPomodoros: 0,
    totalFocusMinutes: 0,
    dailyData: [],
  });

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedTasks = localStorage.getItem('pomodoro-tasks');
    const savedSoundConfig = localStorage.getItem('pomodoro-sound');
    const savedStatistics = localStorage.getItem('pomodoro-statistics');

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }

    if (savedSoundConfig) {
      setSoundConfig(JSON.parse(savedSoundConfig));
    }

    if (savedStatistics) {
      setStatistics(JSON.parse(savedStatistics));
    }
  }, []);

  // 保存数据到 localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('pomodoro-sound', JSON.stringify(soundConfig));
  }, [soundConfig]);

  useEffect(() => {
    localStorage.setItem('pomodoro-statistics', JSON.stringify(statistics));
  }, [statistics]);

  // 当切换标签时，自动最小化计时器
  useEffect(() => {
    if (activeTab !== 'timer' && isRunning) {
      setIsMinimized(true);
    } else if (activeTab === 'timer') {
      setIsMinimized(false);
    }
  }, [activeTab, isRunning, setIsMinimized]);

  // 处理番茄完成
  const handlePomodoroComplete = () => {
    const today = getTodayString();
    const newDailyData = [...statistics.dailyData];
    const todayIndex = newDailyData.findIndex(d => d.date === today);

    if (todayIndex >= 0) {
      newDailyData[todayIndex] = {
        ...newDailyData[todayIndex],
        pomodoros: newDailyData[todayIndex].pomodoros + 1,
        focusMinutes: newDailyData[todayIndex].focusMinutes + 25,
      };
    } else {
      newDailyData.push({
        date: today,
        pomodoros: 1,
        focusMinutes: 25,
      });
    }

    const updatedStats = calculateStatistics(newDailyData);
    setStatistics(updatedStats);
  };

  // 监听番茄完成，更新统计数据
  useEffect(() => {
    // 只在 pomodoroCount 增加时触发（不是初始化时）
    if (pomodoroCount > 0) {
      handlePomodoroComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* 头部 */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">lyjy番茄钟</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">专注、高效、自律</p>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
              <span className="text-sm text-slate-700 dark:text-slate-300">{theme === 'dark' ? '日间' : '夜间'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="timer" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl p-1.5 shadow-lg">
            <TabsTrigger value="timer" className="data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all duration-300 hover:scale-105 rounded-lg">
              <Timer className="h-4 w-4 mr-2" />
              计时器
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-300 hover:scale-105 rounded-lg">
              <CheckSquare2 className="h-4 w-4 mr-2" />
              任务
            </TabsTrigger>
            <TabsTrigger value="sounds" className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-300 hover:scale-105 rounded-lg">
              <Music className="h-4 w-4 mr-2" />
              音效
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all duration-300 hover:scale-105 rounded-lg">
              <BarChart3 className="h-4 w-4 mr-2" />
              统计
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PomodoroTimer
                  showSettings={showSettings}
                  onToggleSettings={() => setShowSettings(!showSettings)}
                />
              </div>
              <div>
                <TaskManager
                  tasks={tasks}
                  onTasksChange={setTasks}
                  selectedTaskId={selectedTaskId}
                  onTaskSelect={setSelectedTaskId}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <TaskManager
                tasks={tasks}
                onTasksChange={setTasks}
                selectedTaskId={selectedTaskId}
                onTaskSelect={setSelectedTaskId}
              />
            </div>
          </TabsContent>

          <TabsContent value="sounds" className="mt-0">
            <div className="max-w-md mx-auto">
              <SoundControl
                config={soundConfig}
                onConfigChange={setSoundConfig}
              />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <Statistics statistics={statistics} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* 返回首页按钮 */}
      <Link
        href="/"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center"
        title="返回首页"
      >
        <i className="fa-solid fa-house text-white"></i>
      </Link>

      {/* 底部信息 */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-slate-600 dark:text-slate-500">
          <p>番茄钟 - 让专注成为习惯</p>
        </div>
      </footer>

      {/* 更新记录按钮 */}
      <UpdateRecords />
    </div>
  );
}

export default function PomodoroPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TimerProvider>
        <HomeContent />
      </TimerProvider>
    </ThemeProvider>
  );
}

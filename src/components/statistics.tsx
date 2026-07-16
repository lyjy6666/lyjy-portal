'use client';

import { Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Statistics as Stats } from '@/lib/types';
import { formatMinutes } from '@/lib/pomodoro-utils';
import { cn } from '@/lib/utils';

interface StatisticsProps {
  statistics: Stats;
}

export function Statistics({ statistics }: StatisticsProps) {
  const statsCards = [
    {
      icon: <Calendar className="h-5 w-5 text-red-500" />,
      label: '今日番茄',
      value: statistics.todayPomodoros,
      unit: '个',
      subValue: `${formatMinutes(statistics.todayFocusMinutes)}`,
      subLabel: '专注时长',
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      label: '本周番茄',
      value: statistics.weekPomodoros,
      unit: '个',
      subValue: `${formatMinutes(statistics.weekFocusMinutes)}`,
      subLabel: '专注时长',
    },
    {
      icon: <Target className="h-5 w-5 text-green-500" />,
      label: '累计番茄',
      value: statistics.totalPomodoros,
      unit: '个',
      subValue: `${formatMinutes(statistics.totalFocusMinutes)}`,
      subLabel: '总专注时长',
    },
    {
      icon: <Clock className="h-5 w-5 text-purple-500" />,
      label: '平均每日',
      value: statistics.dailyData.length > 0
        ? Math.round(statistics.totalPomodoros / statistics.dailyData.length)
        : 0,
      unit: '个',
      subValue: statistics.dailyData.length > 0
        ? formatMinutes(Math.round(statistics.totalFocusMinutes / statistics.dailyData.length))
        : '0分钟',
      subLabel: '平均专注',
    },
  ];

  // 获取最近7天的数据
  const recent7Days = statistics.dailyData.slice(-7);
  const maxPomodoros = Math.max(...recent7Days.map(d => d.pomodoros), 1);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = dateStr === today.toISOString().split('T')[0];
    
    if (isToday) return '今天';
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  return (
    <Card className="p-6 w-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">数据统计</h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700"
          >
            <div className="flex items-center gap-2 mb-2">
              {stat.icon}
              <span className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
              <span className="text-sm text-slate-500">{stat.unit}</span>
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {stat.subValue}
              <span className="ml-1">{stat.subLabel}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 最近7天图表 */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">最近7天</h3>
        <div className="space-y-2">
          {recent7Days.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              暂无数据，开始专注吧！
            </div>
          ) : (
            recent7Days.map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="w-12 text-sm text-slate-500 text-right">
                  {formatDate(day.date)}
                </span>
                <div className="flex-1 h-8 bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-lg transition-all duration-500"
                    style={{
                      width: `${(day.pomodoros / maxPomodoros) * 100}%`,
                      minWidth: day.pomodoros > 0 ? '24px' : '0',
                    }}
                  />
                </div>
                <span className="w-16 text-sm text-slate-900 dark:text-white font-medium">
                  {day.pomodoros} <span className="text-slate-500">番茄</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 简单的热力图展示 */}
      {statistics.dailyData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">专注热力图</h3>
          <div className="grid grid-cols-7 gap-1">
            {statistics.dailyData.slice(-28).map((day) => {
              const intensity = day.pomodoros > 0
                ? Math.min(Math.ceil(day.pomodoros / 4), 4)
                : 0;

              const bgColor = {
                0: 'bg-slate-200 dark:bg-slate-800',
                1: 'bg-red-500/20',
                2: 'bg-red-500/40',
                3: 'bg-red-500/60',
                4: 'bg-red-500',
              }[intensity];

              return (
                <div
                  key={day.date}
                  className={cn(
                    'w-full aspect-square rounded-sm',
                    bgColor,
                    'transition-all duration-300'
                  )}
                  title={`${day.date}: ${day.pomodoros} 个番茄`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 justify-end">
            <span className="text-xs text-slate-500">少</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-sm',
                    {
                      0: 'bg-slate-200 dark:bg-slate-800',
                      1: 'bg-red-500/20',
                      2: 'bg-red-500/40',
                      3: 'bg-red-500/60',
                      4: 'bg-red-500',
                    }[i]
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">多</span>
          </div>
        </div>
      )}
    </Card>
  );
}

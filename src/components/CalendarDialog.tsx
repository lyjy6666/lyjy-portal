'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Check, AlertTriangle } from 'lucide-react';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  dueDate?: Date;
  isPinned?: boolean;
  recentlyRestored?: boolean;
}

interface CalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

export default function CalendarDialog({ isOpen, onClose, tasks }: CalendarDialogProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 获取当月第一天是星期几
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // 获取当月有多少天
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 生成日历数据
  const calendarDays: Array<{ date: Date; day: number }> = [];

  // 添加空白占位符（上个月的日期）
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ date: new Date(year, month, 1), day: 0 });
  }

  // 添加当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ date: new Date(year, month, day), day });
  }

  // 切换上个月
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 切换下个月
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 获取某一天的任务
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear() &&
        !task.completed
      );
    });
  };

  // 获取某一天的任务数量
  const getTaskCountForDate = (date: Date) => {
    return getTasksForDate(date).length;
  };

  // 判断是否是今天
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 判断是否有紧急任务（到期时间小于等于今天）
  const hasUrgentTasks = (date: Date) => {
    const dateTasks = getTasksForDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return dateTasks.some(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      const taskDateNormalized = new Date(taskDate);
      taskDateNormalized.setHours(0, 0, 0, 0);
      return taskDateNormalized.getTime() <= today.getTime();
    });
  };

  // 格式化日期显示
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 获取星期几名称
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
            日程表
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 月份切换 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">
            {year}年 {monthNames[month]}
          </h2>
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="text-center text-sm font-medium text-slate-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((item, index) => {
            if (item.day === 0) {
              return <div key={index} className="aspect-square" />;
            }

            const taskCount = getTaskCountForDate(item.date);
            const urgent = hasUrgentTasks(item.date);
            const today = isToday(item.date);
            const isSelected = selectedDate && item.date.getTime() === selectedDate.getTime();

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(item.date)}
                className={`relative aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : today
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : urgent
                    ? 'bg-red-950/30 border-red-500/50 text-slate-200 hover:border-red-500 hover:bg-red-950/50'
                    : taskCount > 0
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200 hover:border-blue-500 hover:bg-slate-800'
                    : 'bg-slate-900/30 border-slate-800 text-slate-500 hover:border-slate-600 hover:bg-slate-900/50'
                }`}
              >
                <span className="text-base font-medium">{item.day}</span>
                {taskCount > 0 && (
                  <div
                    className={`absolute bottom-1 right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                      urgent
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-blue-500 text-white'
                        : today
                        ? 'bg-purple-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {taskCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 选中日期的任务列表 */}
        {selectedDate && (
          <div className="mt-6 border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
              {formatDate(selectedDate)} 的作业
            </h3>
            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                这一天没有待完成的作业
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-slate-600 flex items-center justify-center">
                      <Check className="w-4 h-4 text-transparent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-slate-200">{task.text}</p>
                      {task.isPinned && (
                        <span className="mt-1 text-xs text-purple-400">⭐ 置顶</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 统计信息 */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">
                {tasks.filter(t => !t.completed && t.dueDate).length}
              </div>
              <div className="text-sm text-slate-400">已设期的作业</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">
                {new Set(
                  tasks
                    .filter(t => !t.completed && t.dueDate !== undefined && t.dueDate !== null)
                    .map(t => {
                      const d = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate!);
                      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                    })
                ).size}
              </div>
              <div className="text-sm text-slate-400">有作业的天数</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-400">
                {tasks.filter(t => {
                  if (!t.dueDate || t.completed) return false;
                  const d = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const taskDate = new Date(d);
                  taskDate.setHours(0, 0, 0, 0);
                  return taskDate.getTime() <= today.getTime();
                }).length}
              </div>
              <div className="text-sm text-slate-400">即将到期</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

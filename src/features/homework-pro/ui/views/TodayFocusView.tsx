'use client';

import { Flame, AlertTriangle, Star, Sun } from 'lucide-react';
import { usePro } from '../../hooks/ProContext';
import { TaskRow } from '../task/TaskRow';
import { LoadBar, EmptyState } from '../common/bits';
import { bucketByDue, localDayKey, todayKey } from '../../core/date';
import { dailyLoad } from '../../core/stats';

export function TodayFocusView() {
  const { tasks, stats, settings } = usePro();
  const today = todayKey();
  const active = tasks.filter((t) => !t.completed);
  const overdue = active.filter((t) => bucketByDue(t.dueDate) === 'overdue');
  const dueToday = active.filter((t) => t.dueDate && localDayKey(t.dueDate) === today && bucketByDue(t.dueDate) !== 'overdue');
  const urgent = active.filter((t) => t.meta.priority === 'urgent' && !overdue.includes(t) && !dueToday.includes(t));
  const load = dailyLoad(tasks, today, settings.dailyLimitMin);

  return (
    <div className="space-y-4">
      <section className="hw-panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Sun size={18} />
          <span className="hw-title text-lg">今日聚焦</span>
          <span className="hw-chip flex items-center gap-1"><Flame size={12} /> 连续 {stats.streak} 天</span>
          <span className="hw-chip">待办 {stats.active} 项</span>
        </div>
        <div className="mt-3"><LoadBar minutes={load.minutes} limit={settings.dailyLimitMin} /></div>
      </section>

      {[
        { title: '已逾期', icon: <AlertTriangle size={15} />, list: overdue, tone: 'var(--hw-overdue)' },
        { title: '今天到期', icon: <Sun size={15} />, list: dueToday, tone: 'var(--hw-due-soon)' },
        { title: '高优先级', icon: <Star size={15} />, list: urgent, tone: 'var(--primary)' },
      ].map((section) => (
        <section key={section.title} className="hw-panel overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--hw-rule)', color: section.tone }}>
            {section.icon}
            <span className="hw-title text-sm">{section.title}</span>
            <span className="hw-label hw-num">{section.list.length}</span>
          </div>
          {section.list.length === 0
            ? <p className="hw-label p-3">这一组暂时是空的</p>
            : section.list.map((t) => <TaskRow key={t.id} task={t} />)}
        </section>
      ))}

      {active.length === 0 && <EmptyState title="全部完成啦" hint="今天没有待办作业。" />}
    </div>
  );
}

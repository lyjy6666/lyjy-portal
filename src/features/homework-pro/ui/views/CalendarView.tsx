'use client';

import { useState, type DragEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { monthGrid, localDayKey, toUtcIso, dayEndIso, formatDateTime } from '../../core/date';
import { tasksOnDay } from '../../core/grouping';
import { readDragTaskId } from '../common/interaction';

/** 增强月历：本地日历日、每日数量、拖到日期改期 */
export function CalendarView() {
  const { tasks, patchTask, setDetailId } = usePro();
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });
  const [selected, setSelected] = useState(localDayKey(today));

  const grid = monthGrid(cursor.y, cursor.m);
  const shift = (delta: number) => {
    const d = new Date(cursor.y, cursor.m - 1 + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() + 1 });
  };

  const onDrop = (day: string, e: DragEvent) => {
    e.preventDefault();
    // 校验真实 id：拖文本/文件时取到空串，旧代码 Number('') === 0 会假报「改期成功」
    const id = readDragTaskId(e, tasks);
    if (id === null) return;
    const t = tasks.find((x) => x.id === id);
    // 保留原本时刻：把新日期与原时刻组合
    const original = t?.dueDate ? new Date(t.dueDate) : null;
    const hh = original ? String(original.getHours()).padStart(2, '0') : '23';
    const mm = original ? String(original.getMinutes()).padStart(2, '0') : '59';
    const next = toUtcIso(`${day}T${hh}:${mm}`) ?? dayEndIso(day);
    void patchTask(id, { dueDate: next });
    toast.success(`已改期到 ${day}`);
  };

  const dayTasks = tasksOnDay(tasks, selected);
  const withDue = tasks.filter((t) => t.dueDate).length;
  const daysWithTasks = new Set(tasks.filter((t) => t.dueDate).map((t) => localDayKey(t.dueDate!))).size;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="hw-panel p-3">
        <div className="mb-3 flex items-center gap-2">
          <button type="button" className="hw-btn" onClick={() => shift(-1)} aria-label="上个月"><ChevronLeft size={15} /></button>
          <span className="hw-title text-base hw-num">{cursor.y} 年 {cursor.m} 月</span>
          <button type="button" className="hw-btn" onClick={() => shift(1)} aria-label="下个月"><ChevronRight size={15} /></button>
          <button type="button" className="hw-chip ml-auto" onClick={() => { setCursor({ y: today.getFullYear(), m: today.getMonth() + 1 }); setSelected(localDayKey(today)); }}>回到今天</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => <span key={w} className="hw-label py-1">{w}</span>)}
          {grid.map((cell) => {
            const list = tasksOnDay(tasks, cell.dayKey);
            const urgent = list.some((t) => !t.completed && t.dueDate && new Date(t.dueDate).getTime() < Date.now());
            return (
              <button
                key={cell.dayKey}
                type="button"
                onClick={() => setSelected(cell.dayKey)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(cell.dayKey, e)}
                className="hw-panel flex min-h-[54px] flex-col items-center justify-center gap-0.5 p-1 text-xs"
                style={{
                  opacity: cell.inMonth ? 1 : 0.38,
                  borderColor: cell.dayKey === selected ? 'var(--primary)' : undefined,
                  borderWidth: cell.dayKey === selected ? '2px' : undefined,
                }}
              >
                <span className="hw-num">{cell.date.getDate()}</span>
                {list.length > 0 && (
                  <span className={`hw-chip px-1.5 py-0 ${urgent ? 'hw-overdue' : ''}`} style={{ fontSize: '0.62rem' }}>
                    {list.length} 项
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="hw-panel p-3">
        <p className="hw-title text-sm">{selected} 的作业（{dayTasks.length}）</p>
        <p className="hw-label mt-1">把左侧清单里的卡片拖到日期格即可改期</p>
        <div className="mt-2 space-y-1">
          {dayTasks.length === 0 && <p className="hw-label py-4">这一天没有作业</p>}
          {dayTasks.map((t) => (
            <button key={t.id} type="button" className="hw-row flex w-full items-center gap-2 text-left"
              onClick={() => setDetailId(t.id)}>
              <span className="flex-1 truncate text-sm">{t.completed ? '✓ ' : ''}{t.text}</span>
              <span className="hw-label hw-num text-xs">{t.dueDate ? formatDateTime(t.dueDate).slice(-5) : ''}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
          {[
            ['已设期', withDue], ['有作业天数', daysWithTasks],
            // 与统计页 summary().dueToday 同口径：只算未完成的今日到期
            ['今日到期', tasksOnDay(tasks, localDayKey(today)).filter((t) => !t.completed).length],
          ].map(([label, value]) => (
            <div key={String(label)} className="hw-panel p-2 text-center">
              <div className="hw-title hw-num text-lg">{value}</div>
              <div className="hw-label">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

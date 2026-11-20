'use client';

import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { ChevronLeft, ChevronRight, Flame, AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { estimateApi } from '../../api/ai';
import { localDayKey, todayKey, toUtcIso, formatDateTime } from '../../core/date';
import { dailyLoad } from '../../core/stats';
import { subjectOf } from '../../core/grouping';
import { subjectStyle } from '../common/bits';
import { AiFeatureCard } from '../common/AiFeature';
import { readDragTaskId } from '../common/interaction';

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const delta = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - delta);
  return d;
}

/**
 * 周计划时间轴 + 每日负担可视化。
 * 一眼回答「今天写得完吗」；拖动任务卡到别的日期即改期，保留原本时刻。
 */
export function WeekPlan({ compact = false }: { compact?: boolean }) {
  const { tasks, patchTask, patchMeta, setDetailId, settings, setSettings } = usePro();
  const [weekOffset, setWeekOffset] = useState(0);
  const [estimating, setEstimating] = useState(false);
  // 「今天」必须是 state：页面开着跨过午夜/周边界时，日期轴与当天高亮要一起更新
  const [today, setToday] = useState(() => todayKey());
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = todayKey();
      setToday((prev) => (prev === next ? prev : next));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const days = useMemo(() => {
    const [y = 2026, m = 1, d = 1] = today.split('-').map(Number);
    const start = mondayOf(new Date(y, m - 1, d));
    start.setDate(start.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return { day: localDayKey(date), date };
    });
  }, [weekOffset, today]);
  const overloaded = days.filter((d) => dailyLoad(tasks, d.day, settings.dailyLimitMin).over);
  const weekMinutes = days.reduce((s, d) => s + dailyLoad(tasks, d.day, settings.dailyLimitMin).minutes, 0);

  const onDrop = (day: string, e: DragEvent) => {
    e.preventDefault();
    const id = readDragTaskId(e, tasks);
    if (id === null) return;
    const t = tasks.find((x) => x.id === id);
    const original = t?.dueDate ? new Date(t.dueDate) : null;
    const hh = String(original?.getHours() ?? 23).padStart(2, '0');
    const mm = String(original?.getMinutes() ?? 59).padStart(2, '0');
    void patchTask(id, { dueDate: toUtcIso(`${day}T${hh}:${mm}`) });
    toast.success(`已挪到 ${day}`);
  };

  /** AI 用时推测：把本周未完成作业的预计耗时一次写回各自的 meta */
  const runEstimate = async () => {
    const daySet = new Set(days.map((d) => d.day));
    const pending = tasks.filter((t) => !t.completed && t.dueDate && daySet.has(localDayKey(t.dueDate)));
    if (!pending.length) { toast('本周还没有待办作业，先添加几条再推测'); return; }
    setEstimating(true);
    try {
      const res = await estimateApi.estimate(pending.map((t) => t.text), settings.grade || '初中', settings.weakSubjects ?? []);
      if (!res.success || !res.estimates) { toast.error(res.message || '用时推测失败'); return; }
      await Promise.all(pending.map((t, i) => patchMeta(t.id, { estimateMin: res.estimates![i] })));
      toast.success(res.source === 'ai'
        ? `AI 已推测 ${pending.length} 条作业用时，共约 ${res.total} 分钟`
        : `已按年级估算 ${pending.length} 条作业用时，共约 ${res.total} 分钟`);
      if (res.notice) toast(res.notice);
    } finally {
      setEstimating(false);
    }
  };

  return (
    <div>
      {!compact && (
        // 顶部只留一条细状态条：AI 估算要在「作业都摆出来之后」才点，
        // 完整的功能卡放到周计划网格下面，别一进来就挡在最前面。
        <div className="hw-ai-strip mb-3">
          <span className="hw-ai-badge"><Sparkles size={11} /> AI</span>
          <span className="hw-label min-w-0 flex-1 truncate">
            用时推测依据：{settings.grade || '未选年级'}
            {(settings.weakSubjects ?? []).length ? ` · 薄弱 ${(settings.weakSubjects ?? []).join('/')}` : ''}
          </span>
          <button type="button" className="hw-chip shrink-0"
            onClick={() => document.getElementById('hw-ai-estimate')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            ↓ 去估时
          </button>
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className="hw-btn" onClick={() => setWeekOffset((v) => v - 1)} aria-label="上一周"><ChevronLeft size={15} /></button>
        <span className="hw-title hw-num text-sm">
          {days[0].day.slice(5)} — {days[6].day.slice(5)}
        </span>
        <button type="button" className="hw-btn" onClick={() => setWeekOffset((v) => v + 1)} aria-label="下一周"><ChevronRight size={15} /></button>
        <button type="button" className="hw-chip" onClick={() => setWeekOffset(0)}>本周</button>
        <span className="hw-chip hw-num">全周预计 {weekMinutes} 分钟</span>
        {overloaded.length > 0 && (
          <span className="hw-chip hw-overdue flex items-center gap-1">
            <AlertTriangle size={12} /> {overloaded.length} 天超载
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {days.map(({ day, date }, i) => {
          const list = tasks.filter((t) => t.dueDate && localDayKey(t.dueDate) === day);
          const load = dailyLoad(tasks, day, settings.dailyLimitMin);
          const isToday = day === today;
          return (
            <section
              key={day}
              className="hw-panel flex flex-col overflow-hidden"
              style={isToday ? { borderColor: 'var(--primary)', borderWidth: 2 } : undefined}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(day, e)}
            >
              <div className="px-2 py-2 border-b" style={{ borderColor: 'var(--hw-rule)' }}>
                <div className="flex items-center justify-between">
                  <span className="hw-title text-xs">{WEEK_LABELS[i]}</span>
                  <span className="hw-label hw-num text-xs">{date.getMonth() + 1}/{date.getDate()}</span>
                </div>
                <div className="hw-load-track mt-1.5">
                  <div className="hw-load-fill" data-over={load.over}
                    style={{ width: `${Math.min(100, load.ratio * 100)}%` }} />
                </div>
                <div className="hw-label mt-1 flex items-center gap-1">
                  {load.over && <Flame size={11} />}
                  {load.count} 项 · {load.minutes} 分钟
                </div>
              </div>

              <div className={`flex-1 space-y-1 p-1.5 ${compact ? 'max-h-40' : 'min-h-[150px]'} overflow-y-auto hw-scroll`}>
                {list.length === 0 && <p className="hw-label px-1 py-3 text-center">拖到这里</p>}
                {list.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/homework-task', String(t.id))}
                    onClick={() => setDetailId(t.id)}
                    className="hw-chip w-full flex-col items-start gap-0.5 text-left"
                    style={{
                      ...subjectStyle(subjectOf(t)),
                      borderLeft: '3px solid var(--hw-subject)',
                      whiteSpace: 'normal',
                      opacity: t.completed ? 0.55 : 1,
                    }}
                    title={t.dueDate ? formatDateTime(t.dueDate) : undefined}
                  >
                    <span className="w-full text-xs">{t.text}</span>
                    {t.dueDate && <span className="hw-label hw-num text-[10px]">{formatDateTime(t.dueDate).slice(-5)}</span>}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="hw-label mt-2">拖动卡片换天；负担按「预计耗时」累加，超过设定的每日上限会标红。</p>

      {/* 作业都摆出来之后再给 AI 估时：这才是用户真正需要它的时机 */}
      {!compact && (
        <div id="hw-ai-estimate" className="mt-4">
          <AiFeatureCard
            title="本周作业已就位，让 AI 逐条估算用时"
            desc={
              <>
                当前年级：<strong style={{ color: 'var(--primary)' }}>{settings.grade || '未选择'}</strong>
                {' · '}
                薄弱项：
                <strong style={{ color: 'var(--primary)' }}>
                  {(settings.weakSubjects ?? []).length ? (settings.weakSubjects ?? []).join('/') : '未设置'}
                </strong>
                {' · '}结果会写回每条作业的「预计耗时」，并立刻反映到上面的负担条
              </>
            }
            actions={
              <>
                <button type="button" className="hw-btn" data-variant="primary" disabled={estimating}
                  onClick={() => void runEstimate()}>
                  <Sparkles size={15} /> {estimating ? '推测中…' : 'AI 推测本周用时'}
                </button>
                <button type="button" className="hw-chip"
                  onClick={() => setSettings({ ...settings, grade: '' })}>修改年级 / 薄弱项</button>
              </>
            }
          />
        </div>
      )}
    </div>
  );
}

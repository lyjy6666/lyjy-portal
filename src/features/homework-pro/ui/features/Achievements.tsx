'use client';

import { Flame, Trophy, Star, Sun, BookOpen, Flag, CheckCircle2, Circle } from 'lucide-react';
import { usePro } from '../../hooks/ProContext';
import {
  computeMilestones, streakDays, subjectDistribution, weeklyCompletion, weeklyNarrative,
  type Milestone,
} from '../../core/achievements';
import { subjectStyle } from '../common/bits';

const ICONS = {
  flag: Flag, flame: Flame, star: Star, trophy: Trophy, book: BookOpen, sun: Sun,
} as const;

/** 成就 / 里程碑 / 进度叙事。 */
export function Achievements({ compact = false }: { compact?: boolean }) {
  const { tasks } = usePro();
  const milestones = computeMilestones(tasks);
  const streak = streakDays(tasks);
  const week = weeklyCompletion(tasks);
  const narrative = weeklyNarrative(tasks);
  const subjects = subjectDistribution(tasks);
  const reached = milestones.filter((m) => m.reached).length;
  const maxWeek = Math.max(1, ...week.map((d) => d.count));

  return (
    <div className="space-y-4">
      {/* 连续打卡 + 本周叙事：用真实数据，不做装饰性大数字 */}
      <section className="hw-panel p-4">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <p className="hw-eyebrow">连续完成</p>
            <p className="hw-display hw-num">{streak}<span className="ml-1 text-base">天</span></p>
          </div>
          <div className="min-w-[200px] flex-1">
            <p className="hw-eyebrow">这一周</p>
            <p className="mt-1 text-sm">{narrative}</p>
          </div>
          <div className="hw-chip hw-num">{reached} / {milestones.length} 里程碑</div>
        </div>

        <div className="mt-4 flex items-end gap-2" style={{ height: 88 }}>
          {week.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="hw-label hw-num text-[10px]">{d.count || ''}</span>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max(4, (d.count / maxWeek) * 62)}px`,
                  background: d.count ? 'var(--primary)' : 'var(--muted)',
                  opacity: d.count ? 1 : 0.6,
                }}
                title={`${d.day} 完成 ${d.count} 项`}
              />
              <span className="hw-label text-[10px]">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 里程碑 */}
      <section>
        <p className="hw-title text-sm">里程碑</p>
        <div className={`mt-2 grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
          {milestones.map((m) => <MilestoneCard key={m.id} item={m} />)}
        </div>
      </section>

      {/* 学科分布 */}
      {subjects.length > 0 && (
        <section className="hw-panel p-3">
          <p className="hw-title text-sm">学科分布</p>
          <div className="mt-2 space-y-2">
            {subjects.slice(0, 8).map((s) => (
              <div key={s.subject} className="flex items-center gap-2 text-xs" style={subjectStyle(s.subject)}>
                <span className="w-16 shrink-0 truncate">{s.subject}</span>
                <div className="hw-load-track flex-1">
                  <div className="hw-load-fill"
                    style={{ width: `${(s.done / Math.max(1, s.total)) * 100}%`, background: 'var(--hw-subject)' }} />
                </div>
                <span className="hw-label hw-num w-14 shrink-0 text-right">{s.done}/{s.total}</span>
              </div>
            ))}
          </div>
          <p className="hw-label mt-2">只统计你真实记录过的作业；没有积分、徽章或排名。</p>
        </section>
      )}
    </div>
  );
}

function MilestoneCard({ item }: { item: Milestone }) {
  const Icon = ICONS[item.icon];
  return (
    <div className="hw-panel flex items-center gap-3 p-3" style={{ opacity: item.reached ? 1 : 0.72 }}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: item.reached ? 'var(--primary)' : 'var(--muted)', color: item.reached ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="hw-title text-sm">{item.title}</span>
          {item.reached
            ? <CheckCircle2 size={13} style={{ color: 'var(--primary)' }} />
            : <Circle size={12} className="hw-label" />}
        </div>
        <p className="hw-label">{item.desc}</p>
        <div className="hw-load-track mt-1.5">
          <div className="hw-load-fill" style={{ width: `${item.progress * 100}%` }} />
        </div>
      </div>
      <span className="hw-label hw-num shrink-0">{Math.round(item.progress * 100)}%</span>
    </div>
  );
}

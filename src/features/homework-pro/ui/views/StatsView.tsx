'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { usePro } from '../../hooks/ProContext';
import { completionTrend, heatmap, dailyLoad } from '../../core/stats';
import { todayKey } from '../../core/date';
import { LoadBar } from '../common/bits';

export function StatsView() {
  const { tasks, stats, settings } = usePro();
  const trend = completionTrend(tasks, 30);
  const heat = heatmap(tasks, 12);
  const load = dailyLoad(tasks, todayKey(), settings.dailyLimitMin);

  const cards = [
    ['总作业', stats.total], ['待完成', stats.active], ['已完成', stats.completed],
    ['已逾期', stats.overdue], ['今日到期', stats.dueToday], ['迟交', stats.late],
    ['完成率', `${Math.round(stats.completionRate * 100)}%`], ['连续打卡', `${stats.streak} 天`],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="hw-panel p-3 text-center">
            <div className="hw-title hw-num text-xl">{value}</div>
            <div className="hw-label">{label}</div>
          </div>
        ))}
      </div>

      <section className="hw-panel p-3">
        <p className="hw-title text-sm">近 30 天完成趋势</p>
        <div className="mt-2 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} interval={5} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{ background: 'var(--popover)', color: 'var(--popover-foreground)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => String(v)}
              />
              <Line type="monotone" dataKey="completed" name="完成" stroke="var(--primary)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="created" name="新增" stroke="var(--hw-due-soon)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="hw-panel p-3">
        <p className="hw-title text-sm">完成热力图（近 12 周）</p>
        <div className="mt-2 grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto hw-scroll pb-1">
          {heat.map((cell) => (
            <div key={cell.day} className="hw-heat" data-level={cell.level} title={`${cell.day} · 完成 ${cell.count} 项`} />
          ))}
        </div>
      </section>

      <section className="hw-panel p-3">
        <p className="hw-title text-sm">今日负担</p>
        <div className="mt-2"><LoadBar minutes={load.minutes} limit={settings.dailyLimitMin} /></div>
        <p className="hw-label mt-2">统计基于完成时间与创建时间；不做积分、徽章或排名，保持轻量。</p>
      </section>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X, Plus, Trash2, Shuffle, Sparkles, Copy, Check, Calendar, Wand2, AlertTriangle, Info,
} from 'lucide-react';

export interface PlannerItem {
  id: string;
  name: string;
  difficulty: number;
}

export interface PlannerDay {
  index: number;
  date: string;
  items: PlannerItem[];
  load: number;
}

interface HomeworkPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  /** 已有作业名称，用于「从作业清单快速加入」 */
  existingTaskNames?: string[];
  /** 把排期结果写入作业列表；返回是否成功 */
  onImport?: (assignments: { text: string; dueDate: string }[]) => Promise<{ ok: boolean; message?: string }>;
}

const STORAGE_KEY = 'homeworkPlannerState';

/* ---------- 日期工具 ---------- */

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dt.getDay()];
  return `${m}月${d}日 ${week}`;
}

/* ---------- 分配算法 ---------- */

function loadRange(bins: PlannerItem[][]): number {
  const loads = bins.map((b) => b.reduce((s, i) => s + i.difficulty, 0));
  return Math.max(...loads) - Math.min(...loads);
}

/**
 * 把作业分配到各天：
 *   1) 按难度降序（LPT 贪心，先放大件，天然让「一张试卷」独占一天）
 *   2) 每次都放进当前最轻的一天；负载相同的天之间随机挑 → 结果不唯一
 *   3) 随机局部搜索（移动 / 交换），只在极差变小时接受 → 既均衡又随机
 */
function distribute(items: PlannerItem[], dayCount: number): PlannerItem[][] {
  const bins: PlannerItem[][] = Array.from({ length: dayCount }, () => []);
  if (items.length === 0) return bins;

  const sorted = [...items].sort((a, b) => b.difficulty - a.difficulty);
  for (const item of sorted) {
    const loads = bins.map((b) => b.reduce((s, i) => s + i.difficulty, 0));
    const min = Math.min(...loads);
    const candidates = bins.filter((_, idx) => loads[idx] <= min + 1e-9);
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    target.push(item);
  }

  // 局部搜索：400 次随机扰动，只在极差严格变小时保留
  let bestRange = loadRange(bins);
  for (let iter = 0; iter < 400 && bestRange > 1e-9; iter++) {
    const a = Math.floor(Math.random() * dayCount);
    const b = Math.floor(Math.random() * dayCount);
    if (a === b || bins[a].length === 0) continue;

    if (Math.random() < 0.5 || bins[b].length === 0) {
      // 移动：把 a 的随机一项挪到 b
      const idx = Math.floor(Math.random() * bins[a].length);
      const moved = bins[a][idx];
      const before = bestRange;
      bins[a].splice(idx, 1);
      bins[b].push(moved);
      const after = loadRange(bins);
      if (after < before) {
        bestRange = after;
      } else {
        bins[b].pop();
        bins[a].splice(idx, 0, moved);
      }
    } else {
      // 交换：a、b 各取一项互换
      const ia = Math.floor(Math.random() * bins[a].length);
      const ib = Math.floor(Math.random() * bins[b].length);
      const before = bestRange;
      const tmp = bins[a][ia];
      bins[a][ia] = bins[b][ib];
      bins[b][ib] = tmp;
      const after = loadRange(bins);
      if (after < before) {
        bestRange = after;
      } else {
        const t2 = bins[a][ia];
        bins[a][ia] = bins[b][ib];
        bins[b][ib] = t2;
      }
    }
  }

  return bins;
}

/* ---------- 组件 ---------- */

export default function HomeworkPlanner({ isOpen, onClose, existingTaskNames = [], onImport }: HomeworkPlannerProps) {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [dayCount, setDayCount] = useState(7);
  const [startDate, setStartDate] = useState(todayISO());
  const [nameInput, setNameInput] = useState('');
  const [diffInput, setDiffInput] = useState('1');
  const [plan, setPlan] = useState<PlannerDay[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null);

  // 打开时恢复上次的输入
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.items)) setItems(saved.items);
        if (typeof saved.dayCount === 'number') setDayCount(saved.dayCount);
        if (typeof saved.startDate === 'string') setStartDate(saved.startDate);
      }
    } catch {
      /* 忽略损坏的缓存 */
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, dayCount, startDate }));
    } catch {
      /* 存储不可用时忽略 */
    }
  }, [isOpen, items, dayCount, startDate]);

  const totalDifficulty = useMemo(() => items.reduce((s, i) => s + i.difficulty, 0), [items]);
  const avgLoad = dayCount > 0 ? totalDifficulty / dayCount : 0;
  const maxLoad = plan ? Math.max(1, ...plan.map((d) => d.load)) : 1;

  const addItem = useCallback(
    (name: string, difficulty: number) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setItems((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: trimmed, difficulty },
      ]);
      setPlan(null);
      setNotice(null);
    },
    []
  );

  const handleAdd = () => {
    const d = Math.max(0.5, Number(diffInput) || 1);
    addItem(nameInput, d);
    setNameInput('');
    setDiffInput('1');
  };

  const updateItem = (id: string, patch: Partial<PlannerItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setPlan(null);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setPlan(null);
  };

  const generate = () => {
    if (items.length === 0) {
      setNotice({ type: 'warn', text: '先加入至少一个作业' });
      return;
    }
    const days = Math.max(1, Math.min(60, Math.round(dayCount)));
    setDayCount(days);
    const bins = distribute(items, days);
    setPlan(
      bins.map((bin, i) => ({
        index: i + 1,
        date: addDays(startDate || todayISO(), i),
        items: bin,
        load: bin.reduce((s, it) => s + it.difficulty, 0),
      }))
    );
    setNotice(null);
  };

  const planText = useMemo(() => {
    if (!plan) return '';
    const head = `作业分配方案（共 ${plan.length} 天，${items.length} 个作业，总难度 ${totalDifficulty}）`;
    const body = plan
      .map((d) => {
        const list = d.items.length
          ? d.items.map((i) => `  · ${i.name}（难度 ${i.difficulty}）`).join('\n')
          : '  · （休息日）';
        return `第 ${d.index} 天 ${formatDay(d.date)}  合计难度 ${d.load.toFixed(1)}\n${list}`;
      })
      .join('\n\n');
    return `${head}\n\n${body}`;
  }, [plan, items.length, totalDifficulty]);

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(planText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice({ type: 'warn', text: '复制失败，可手动选中文本' });
    }
  };

  const importPlan = async () => {
    if (!plan || !onImport) return;
    setImporting(true);
    try {
      const assignments = plan.flatMap((d) => d.items.map((i) => ({ text: i.name, dueDate: d.date })));
      const res = await onImport(assignments);
      setNotice(res.ok ? { type: 'ok', text: res.message ?? '已写入作业清单' } : { type: 'warn', text: res.message ?? '写入失败' });
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  const balanced = plan ? Math.max(...plan.map((d) => d.load)) - Math.min(...plan.map((d) => d.load)) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="智能排期"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Wand2 className="h-5 w-5 text-fuchsia-400" />
              智能排期
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              设定天数与作业难度，自动把作业均衡地分配到每一天
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-[22rem_1fr]">
          {/* 左：设置 */}
          <div className="space-y-5 border-b border-slate-700/60 p-5 md:border-b-0 md:border-r">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs text-slate-400">完成天数</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={dayCount}
                  onChange={(e) => {
                    setDayCount(Number(e.target.value) || 1);
                    setPlan(null);
                  }}
                  className="w-full rounded-lg border border-slate-600/60 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition focus:border-fuchsia-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-slate-400">开始日期</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPlan(null);
                  }}
                  className="w-full rounded-lg border border-slate-600/60 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition focus:border-fuchsia-500"
                />
              </label>
            </div>

            {/* 添加作业 */}
            <div>
              <span className="mb-1.5 block text-xs text-slate-400">逐个加入作业</span>
              <div className="flex gap-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                  }}
                  placeholder="作业名称，如：语文试卷"
                  className="min-w-0 flex-1 rounded-lg border border-slate-600/60 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-500"
                />
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={diffInput}
                  onChange={(e) => setDiffInput(e.target.value)}
                  className="w-16 rounded-lg border border-slate-600/60 bg-slate-800 px-2 py-2 text-center text-sm text-white outline-none transition focus:border-fuchsia-500"
                  aria-label="难度系数"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-700"
                >
                  <Plus className="h-4 w-4" />
                  加入
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                <span>难度系数：</span>
                {[1, 2, 3, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiffInput(String(d))}
                    className="rounded border border-slate-600/60 px-1.5 py-0.5 text-slate-300 transition hover:border-fuchsia-500 hover:text-white"
                  >
                    {d}
                  </button>
                ))}
                <span className="ml-1">越大占用时间越多（试卷类可给 3）</span>
              </div>
            </div>

            {/* 从已有作业快速加入 */}
            {existingTaskNames.length > 0 && (
              <div>
                <span className="mb-1.5 block text-xs text-slate-400">从作业清单快速加入</span>
                <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {existingTaskNames.slice(0, 40).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => addItem(n, Math.max(0.5, Number(diffInput) || 1))}
                      className="max-w-full truncate rounded-full border border-slate-600/60 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-fuchsia-500 hover:text-white"
                      title={n}
                    >
                      + {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 已加入列表 */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  已加入 <span className="text-white">{items.length}</span> 项 · 总难度{' '}
                  <span className="text-white">{totalDifficulty.toFixed(1)}</span>
                </span>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setItems([]);
                      setPlan(null);
                    }}
                    className="text-[11px] text-slate-500 transition hover:text-red-400"
                  >
                    清空
                  </button>
                )}
              </div>
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-center text-xs text-slate-500">
                  还没有作业，先在上面输入名称和难度
                </p>
              ) : (
                <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-200" title={it.name}>
                        {it.name}
                      </span>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={it.difficulty}
                        onChange={(e) => updateItem(it.id, { difficulty: Math.max(0.5, Number(e.target.value) || 1) })}
                        className="w-14 rounded border border-slate-600/60 bg-slate-900 px-1.5 py-0.5 text-center text-xs text-white outline-none focus:border-fuchsia-500"
                        aria-label={`${it.name} 难度`}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="shrink-0 rounded p-1 text-slate-500 transition hover:text-red-400"
                        aria-label={`删除 ${it.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={generate}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:from-fuchsia-700 hover:to-violet-700"
              >
                <Sparkles className="h-4 w-4" />
                {plan ? '重新随机' : '生成分配'}
              </button>
              {plan && (
                <button
                  type="button"
                  onClick={generate}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-600/60 px-3 py-2.5 text-sm text-slate-300 transition hover:border-fuchsia-500 hover:text-white"
                  title="换一套分配"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 右：结果 */}
          <div className="p-5">
            {notice && (
              <div
                className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                  notice.type === 'ok'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                }`}
              >
                {notice.type === 'ok' ? <Check className="mt-0.5 h-3.5 w-3.5" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />}
                {notice.text}
              </div>
            )}

            {!plan ? (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-slate-500">
                <Wand2 className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">设置好天数与作业后，点「生成分配」</p>
                <p className="mt-1 text-xs">难度大的作业会独占一天，轻松的几个凑一天</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 text-xs text-slate-300">
                  <span>
                    共 <span className="font-semibold text-white">{plan.length}</span> 天
                  </span>
                  <span>
                    <span className="font-semibold text-white">{items.length}</span> 个作业
                  </span>
                  <span>
                    总难度 <span className="font-semibold text-white">{totalDifficulty.toFixed(1)}</span>
                  </span>
                  <span>
                    日均 <span className="font-semibold text-white">{avgLoad.toFixed(1)}</span>
                  </span>
                  <span className={balanced <= 1 ? 'text-emerald-300' : 'text-amber-300'}>
                    极差 {balanced.toFixed(1)} {balanced <= 1 ? '· 分配均衡' : '· 略有差异'}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {plan.map((day) => {
                    const ratio = day.load / maxLoad;
                    const over = avgLoad > 0 && day.load > avgLoad * 1.25;
                    const light = avgLoad > 0 && day.load < avgLoad * 0.6;
                    return (
                      <div
                        key={day.index}
                        className={`rounded-xl border bg-slate-800/40 p-3.5 ${
                          over ? 'border-amber-500/50' : light ? 'border-slate-700/60' : 'border-emerald-500/40'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                            <Calendar className="h-3.5 w-3.5 text-fuchsia-400" />
                            第 {day.index} 天
                          </span>
                          <span className="text-[11px] text-slate-400">{formatDay(day.date)}</span>
                        </div>
                        <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
                          <div
                            className={`h-full rounded-full ${
                              over ? 'bg-amber-400' : light ? 'bg-slate-500' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.max(4, ratio * 100)}%` }}
                          />
                        </div>
                        {day.items.length === 0 ? (
                          <p className="text-xs text-slate-500">（休息日）</p>
                        ) : (
                          <ul className="space-y-1">
                            {day.items.map((it) => (
                              <li key={it.id} className="flex items-baseline justify-between gap-2 text-xs">
                                <span className="min-w-0 flex-1 truncate text-slate-200" title={it.name}>
                                  {it.name}
                                </span>
                                <span className="shrink-0 text-slate-500">{it.difficulty}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-2 text-right text-[11px] text-slate-400">合计 {day.load.toFixed(1)}</div>
                      </div>
                    );
                  })}
                </div>

                <p className="flex items-start gap-1.5 pt-1 text-[11px] text-slate-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  分配结果每次不同但总量均衡。觉得某天太满就调大它的难度系数或增加天数，再点「重新随机」。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-700/60 px-5 py-3.5">
          <button
            type="button"
            onClick={copyPlan}
            disabled={!plan}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600/60 px-3.5 py-2 text-sm text-slate-300 transition hover:border-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? '已复制' : '复制方案'}
          </button>
          {onImport && (
            <button
              type="button"
              onClick={importPlan}
              disabled={!plan || importing}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {importing ? '写入中…' : '写入作业清单（带截止日期）'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600/60 px-3.5 py-2 text-sm text-slate-300 transition hover:border-slate-400 hover:text-white"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X, Plus, Trash2, Shuffle, Sparkles, Copy, Check, Calendar, Wand2, AlertTriangle, Info, ChevronDown,
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
  /**
   * 当天可用时间，单位与难度系数一致（「份」）：
   * 3 = 正常一天（能写 3 个普通作业）；0 表示这天没空、不排作业。
   */
  capacity: number;
}

interface HomeworkPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  /** 已有作业名称，用于「从作业清单快速加入」 */
  existingTaskNames?: string[];
  /** 把排期结果写入作业列表；返回是否成功 */
  onImport?: (assignments: { text: string; dueDate: string }[]) => Promise<{ ok: boolean; message?: string }>;
}

// 键名带 V2：早期版本「可用时间 1 = 一整天」的语义已废弃。
// 但旧键的数据必须迁移过来（用户可能已经填了很多作业），见下方的读取逻辑。
const STORAGE_KEY = 'homeworkPlannerStateV2';
const LEGACY_STORAGE_KEY = 'homeworkPlannerState';

/**
 * 难度与可用时间用同一套单位（「份」）：
 *   普通作业 = 1 份；试卷/大作业 ≈ 3 份（正好一整天）；正常一天 = 3 份。
 * 这样「试卷占一整天」和「一天能写 3 个普通作业」才能同时成立。
 */
const DEFAULT_DAY_CAPACITY = 3;
const DEFAULT_DIFFICULTY = 1;

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

function sumLoad(bin: PlannerItem[]): number {
  return bin.reduce((s, i) => s + i.difficulty, 0);
}

/** 各天「负载率」= 当天难度合计 / 当天可用时间；可用时间为 0 的天不参与 */
function ratios(bins: PlannerItem[][], caps: number[]): number[] {
  return bins
    .map((b, i) => (caps[i] > 0 ? sumLoad(b) / caps[i] : null))
    .filter((v): v is number => v !== null);
}

function spreadOf(bins: PlannerItem[][], caps: number[]): number {
  const rs = ratios(bins, caps);
  if (rs.length === 0) return Number.POSITIVE_INFINITY;
  return Math.max(...rs) - Math.min(...rs);
}

/**
 * 把作业分配到各天（支持每天可用时间不同）：
 *   1) 按难度降序（LPT 贪心，先放大件，天然让「一张试卷」独占一天）
 *   2) 每次放进「负载率最低」的一天（负载率 = 已排难度 / 当天可用时间），
 *      可用时间少的天会自然少排；负载率相同的天之间随机挑 → 结果不唯一
 *   3) 随机局部搜索（移动 / 交换），只在负载率极差变小时接受 → 均衡又随机
 *   4) 可用时间为 0 的天完全不排
 */
function distribute(items: PlannerItem[], caps: number[]): PlannerItem[][] {
  const n = caps.length;
  const bins: PlannerItem[][] = Array.from({ length: n }, () => []);
  const usable = caps.map((c, i) => (c > 0 ? i : -1)).filter((i) => i >= 0);
  if (items.length === 0 || usable.length === 0) return bins;

  const rate = (i: number) => (caps[i] > 0 ? sumLoad(bins[i]) / caps[i] : Number.POSITIVE_INFINITY);

  const sorted = [...items].sort((a, b) => b.difficulty - a.difficulty);
  for (const item of sorted) {
    let minRate = Number.POSITIVE_INFINITY;
    for (const i of usable) minRate = Math.min(minRate, rate(i));
    const candidates = usable.filter((i) => rate(i) <= minRate + 1e-9);
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    bins[target].push(item);
  }

  // 局部搜索：400 次随机扰动，只在负载率极差严格变小时保留
  let best = spreadOf(bins, caps);
  for (let iter = 0; iter < 400 && best > 1e-9; iter++) {
    const a = usable[Math.floor(Math.random() * usable.length)];
    const b = usable[Math.floor(Math.random() * usable.length)];
    if (a === b || bins[a].length === 0) continue;

    if (Math.random() < 0.5 || bins[b].length === 0) {
      // 移动：把 a 的随机一项挪到 b
      const idx = Math.floor(Math.random() * bins[a].length);
      const moved = bins[a][idx];
      bins[a].splice(idx, 1);
      bins[b].push(moved);
      const after = spreadOf(bins, caps);
      if (after < best) {
        best = after;
      } else {
        bins[b].pop();
        bins[a].splice(idx, 0, moved);
      }
    } else {
      // 交换：a、b 各取一项互换
      const ia = Math.floor(Math.random() * bins[a].length);
      const ib = Math.floor(Math.random() * bins[b].length);
      const t = bins[a][ia];
      bins[a][ia] = bins[b][ib];
      bins[b][ib] = t;
      const after = spreadOf(bins, caps);
      if (after < best) {
        best = after;
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
  /** 每天的可用时间（份）；长度始终与 dayCount 一致 */
  const [dayCapacity, setDayCapacity] = useState<number[]>(() => Array(7).fill(DEFAULT_DAY_CAPACITY));
  const [showCapacity, setShowCapacity] = useState(false);
  /** 载入完成前禁止回写，否则会用空状态覆盖刚迁移过来的数据 */
  const [hydrated, setHydrated] = useState(false);

  // 天数变化时同步容量数组：保留已填的值，多出来的用 1 补齐
  useEffect(() => {
    const n = Math.max(1, Math.min(60, Math.round(dayCount)));
    setDayCapacity((prev) => {
      if (prev.length === n) return prev;
      const next = Array(n).fill(DEFAULT_DAY_CAPACITY) as number[];
      for (let i = 0; i < Math.min(n, prev.length); i++) next[i] = prev[i];
      return next;
    });
  }, [dayCount]);

  // 打开时恢复上次的输入；新键为空而旧键有数据时执行迁移（含容量单位换算）
  useEffect(() => {
    if (!isOpen) {
      setHydrated(false);
      return;
    }
    try {
      const v2 = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? 'null');
      const v2Items: unknown[] = Array.isArray(v2?.items) ? v2.items : [];
      const legacyItems: unknown[] = Array.isArray(legacy?.items) ? legacy.items : [];
      // 注意：不能只判断「新键是否存在」。回写逻辑可能已用空状态写过新键，
      // 那种情况下新键存在但没内容，必须继续用旧键的数据。
      const useLegacy = legacyItems.length > 0 && v2Items.length === 0;
      const saved = useLegacy ? legacy : v2 ?? legacy;

      if (saved) {
        if (Array.isArray(saved.items)) setItems(saved.items);
        if (typeof saved.dayCount === 'number') setDayCount(saved.dayCount);
        if (typeof saved.startDate === 'string') setStartDate(saved.startDate);

        let caps: number[] | null = null;
        if (Array.isArray(saved.dayCapacity) && saved.dayCapacity.every((v: unknown) => typeof v === 'number')) {
          // 旧版语义是「1 = 一整天」，新版是「3 份 = 一整天」→ 乘 3 保留原来的意图
          const next: number[] = useLegacy
            ? (saved.dayCapacity as number[]).map((v: number) => Math.round(v * 3 * 2) / 2)
            : (saved.dayCapacity as number[]);
          caps = next;
          setDayCapacity(next);
        }

        // 迁移完成即落到新键，旧键保留不动（万一要回退）
        if (useLegacy) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...saved, dayCapacity: caps ?? saved.dayCapacity })
          );
        }
      }
    } catch {
      /* 忽略损坏的缓存 */
    }
    setHydrated(true);
  }, [isOpen]);

  useEffect(() => {
    // hydrated 与上面的 setState 在同一批更新里生效，因此这里读到的 items 一定是恢复后的值。
    // 没有这道闸门，首次打开会用空状态覆盖刚迁移过来的数据。
    if (!isOpen || !hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, dayCount, startDate, dayCapacity }));
    } catch {
      /* 存储不可用时忽略 */
    }
  }, [isOpen, items, dayCount, startDate, dayCapacity]);

  const totalDifficulty = useMemo(() => items.reduce((s, i) => s + i.difficulty, 0), [items]);
  /** 所有天的可用时间总和（可用时间为 0 的天不计） */
  const totalCapacity = useMemo(
    () => dayCapacity.slice(0, Math.max(1, Math.round(dayCount))).reduce((s, c) => s + c, 0),
    [dayCapacity, dayCount]
  );
  const overallRate = totalCapacity > 0 ? totalDifficulty / totalCapacity : 0;
  const maxRatio = plan ? Math.max(0.0001, ...plan.filter((d) => d.capacity > 0).map((d) => d.load / d.capacity)) : 1;

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
    // 容量数组长度对齐到天数
    const caps = Array.from({ length: days }, (_, i) => {
      const v = dayCapacity[i];
      return typeof v === 'number' && v >= 0 ? v : DEFAULT_DAY_CAPACITY;
    });
    if (caps.every((c) => c <= 0)) {
      setNotice({ type: 'warn', text: '所有天的可用时间都是 0，至少给一天留出时间' });
      return;
    }
    const bins = distribute(items, caps);
    setPlan(
      bins.map((bin, i) => ({
        index: i + 1,
        date: addDays(startDate || todayISO(), i),
        items: bin,
        load: bin.reduce((s, it) => s + it.difficulty, 0),
        capacity: caps[i],
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
          : d.capacity > 0
            ? '  · （休息日）'
            : '  · （这天没空）';
        return `第 ${d.index} 天 ${formatDay(d.date)}  合计难度 ${d.load.toFixed(1)} / 可用 ${d.capacity}\n${list}`;
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

  // 负载差异：各天「负载率」的极差（可用时间为 0 的天不参与比较）
  const balanced = plan
    ? (() => {
        const rs = plan.filter((d) => d.capacity > 0).map((d) => d.load / d.capacity);
        return rs.length ? Math.max(...rs) - Math.min(...rs) : 0;
      })()
    : 0;

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

            {/* 每天可用时间：允许某些天时间少 */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/30">
              <button
                type="button"
                onClick={() => setShowCapacity((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              >
                <span className="text-xs text-slate-300">
                  每天可用时间
                  <span className="ml-1.5 text-[11px] text-slate-500">
                    {dayCapacity.slice(0, Math.max(1, Math.round(dayCount))).every((c) => c === DEFAULT_DAY_CAPACITY)
                      ? `默认每天 ${DEFAULT_DAY_CAPACITY} 份`
                      : '已按天单独设置'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
                  {showCapacity ? '收起' : '展开'}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCapacity ? 'rotate-180' : ''}`} />
                </span>
              </button>

              {showCapacity && (
                <div className="border-t border-slate-700/60 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">快速设置</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDayCapacity(Array(Math.max(1, Math.round(dayCount))).fill(DEFAULT_DAY_CAPACITY));
                        setPlan(null);
                      }}
                      className="rounded border border-slate-600/60 px-1.5 py-0.5 text-slate-300 transition hover:border-fuchsia-500 hover:text-white"
                    >
                      全部正常（3 份）
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDayCapacity(Array(Math.max(1, Math.round(dayCount))).fill(DEFAULT_DAY_CAPACITY / 2));
                        setPlan(null);
                      }}
                      className="rounded border border-slate-600/60 px-1.5 py-0.5 text-slate-300 transition hover:border-fuchsia-500 hover:text-white"
                    >
                      全部减半（1.5 份）
                    </button>
                  </div>
                  <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto">
                    {Array.from({ length: Math.max(1, Math.min(60, Math.round(dayCount))) }).map((_, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-1.5 rounded border border-slate-700/60 bg-slate-900/40 px-2 py-1"
                      >
                        <span className="w-10 shrink-0 text-[11px] text-slate-400">第{i + 1}天</span>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={dayCapacity[i] ?? DEFAULT_DAY_CAPACITY}
                          onChange={(e) => {
                            const v = Math.max(0, Number(e.target.value) || 0);
                            setDayCapacity((prev) => {
                              const next = [...prev];
                              while (next.length <= i) next.push(DEFAULT_DAY_CAPACITY);
                              next[i] = v;
                              return next;
                            });
                            setPlan(null);
                          }}
                          className="w-full rounded border border-slate-600/60 bg-slate-900 px-1.5 py-0.5 text-center text-xs text-white outline-none focus:border-fuchsia-500"
                          aria-label={`第${i + 1}天可用时间`}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    <b className="text-slate-400">3 份 = 正常一天</b>（能写 3 个普通作业）；2 份 = 这天时间偏少；
                    0 = 这天没空、不排作业。可用时间少的天会自动少排。
                  </p>
                </div>
              )}
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
                <span className="ml-1">1 = 普通作业，3 = 试卷 / 大作业（正好占一整天）</span>
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
                    总可用 <span className="font-semibold text-white">{totalCapacity.toFixed(1)}</span>
                  </span>
                  <span>
                    整体负载{' '}
                    <span className={`font-semibold ${overallRate > 1.15 ? 'text-amber-300' : 'text-white'}`}>
                      {totalCapacity > 0 ? `${Math.round(overallRate * 100)}%` : '—'}
                    </span>
                  </span>
                  <span className={balanced <= 0.25 ? 'text-emerald-300' : 'text-amber-300'}>
                    负载差 {balanced.toFixed(2)} {balanced <= 0.25 ? '· 分配均衡' : '· 略有差异'}
                  </span>
                </div>

                {/* 总负载超过可用时间时给出可操作的调整建议 */}
                {totalCapacity > 0 && overallRate > 1.02 && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="leading-relaxed">
                      作业总量是可用时间的 <b>{Math.round(overallRate * 100)}%</b>，按现在的时间安排写不完。
                      把天数从 {plan.length} 天增加到{' '}
                      <b>{Math.ceil(totalDifficulty / Math.max(1, totalCapacity / plan.length))}</b> 天，
                      或把每天的可用时间调大（现在平均每天 {Math.round((totalCapacity / plan.length) * 10) / 10} 份），
                      也可以把部分作业的难度系数调小。
                    </span>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {plan.map((day) => {
                    const noTime = day.capacity <= 0;
                    const fill = noTime ? 0 : day.load / day.capacity; // 该天负载率（相对自己的可用时间）
                    const ratio = maxRatio > 0 ? fill / maxRatio : 0; // 相对最忙的一天，用于着色
                    const overload = !noTime && fill > 1.15; // 超出当天可用时间
                    const light = !noTime && ratio < 0.5;
                    return (
                      <div
                        key={day.index}
                        className={`rounded-xl border bg-slate-800/40 p-3.5 ${
                          noTime
                            ? 'border-slate-700/40 opacity-70'
                            : light
                              ? 'border-slate-700/60'
                              : 'border-emerald-500/40'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                            <Calendar className="h-3.5 w-3.5 text-fuchsia-400" />
                            第 {day.index} 天
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDay(day.date)}
                            {!noTime && day.capacity !== 1 && (
                              <span className="ml-1.5 text-slate-500">可用 {day.capacity}</span>
                            )}
                            {noTime && <span className="ml-1.5 text-slate-500">没空</span>}
                          </span>
                        </div>
                        <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
                          <div
                            className={`h-full rounded-full ${
                              noTime ? 'bg-slate-700' : light ? 'bg-sky-400/70' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.max(noTime ? 0 : 4, ratio * 100)}%` }}
                          />
                        </div>
                        {day.items.length === 0 ? (
                          <p className="text-xs text-slate-500">{noTime ? '（这天没空）' : '（休息日）'}</p>
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
                        <div className="mt-2 flex items-baseline justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5">
                            {noTime ? '' : `负载 ${Math.round(fill * 100)}%`}
                            {overload && (
                              <span className="rounded bg-amber-400/15 px-1 py-0.5 text-[10px] text-amber-300">超出可用时间</span>
                            )}
                          </span>
                          <span>
                            合计 {day.load.toFixed(1)}
                            {!noTime && <span className="text-slate-500"> / {day.capacity}</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="flex items-start gap-1.5 pt-1 text-[11px] text-slate-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  分配结果每次不同但负载均衡。某天时间少就在左侧把它的「可用时间」调小，那天自然排得少；
                  填 0 表示那天完全没空。觉得整体偏满就增加天数。
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

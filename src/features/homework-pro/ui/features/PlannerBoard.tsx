'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw, Copy, Wand2, CalendarDays, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { DraftInput } from '../common/DraftInput';
import { isComposing } from '../common/interaction';
import { AiFeatureCard } from '../common/AiFeature';
import { GradePicker } from '../common/ProfilePickers';
import { distribute, formatPlanText, planToTaskInputs, DEFAULT_DAY_CAPACITY, emptyDraft, migrateCapacity } from '../../core/planner';
import { todayKey, localDayKey } from '../../core/date';
import { readScoped, writeScoped, KEYS, LEGACY_KEYS } from '../../core/storage';
import { newLocalId } from '../../core/templates';
import { estimateApi } from '../../api/ai';
import type { PlannerDraft, PlannerItem } from '../../core/types';

/**
 * AI 智能排期主体（独立页面 /homework/pro/planner 专用）。
 *
 * 顺序按真实操作流排：先输入作业 → 列表 → 再让 AI 按年级/薄弱项估时 →
 * 调天数与每天可用时间 → 看预览 → 写入清单。
 * AI 估算卡刻意放在输入之后，而不是一进来顶在最前面。
 */
export function PlannerBoard() {
  const { tasks, importPlan, user, settings, setSettings } = usePro();
  const uid = user?.id ?? 'guest';
  const [draft, setDraft] = useState<PlannerDraft>(() => emptyDraft(todayKey()));
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [seed, setSeed] = useState(0);
  const [showCapacity, setShowCapacity] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [writing, setWriting] = useState(false);
  const [writeProgress, setWriteProgress] = useState(0);
  const [writeTotal, setWriteTotal] = useState(0);

  /** AI 用时推测：把每条作业的预计分钟数换算成排期难度权重 */
  const runEstimate = async () => {
    if (!draft.items.length) { toast.error('先添加几条待排作业，再让 AI 估时'); return; }
    setEstimating(true);
    try {
      const res = await estimateApi.estimate(draft.items.map((i) => i.name), settings.grade || '初中', settings.weakSubjects ?? []);
      if (!res.success || !res.estimates) { toast.error(res.message || '用时推测失败'); return; }
      setDraft((d) => ({
        ...d,
        items: d.items.map((item, i) => ({
          ...item,
          difficulty: Math.max(1, Math.round(((res.estimates![i] ?? 30) / 30) * 10) / 10),
        })),
      }));
      toast.success(`已按${settings.grade || '初中'}年级推测 ${draft.items.length} 条用时，共约 ${res.total} 分钟`);
      if (res.notice) toast(res.notice);
    } finally {
      setEstimating(false);
    }
  };

  // 草稿按用户隔离；首次打开时从原版 legacy key 复制迁移（不删原 key）
  useEffect(() => {
    const saved = readScoped<PlannerDraft | null>(uid, KEYS.planner, null);
    if (saved && Array.isArray(saved.items)) { setDraft(saved); return; }
    try {
      const legacyRaw = localStorage.getItem(LEGACY_KEYS.planner);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as { items?: PlannerItem[]; dayCount?: number; startDate?: string; dayCapacity?: number[] };
        setDraft({
          items: legacy.items ?? [], dayCount: legacy.dayCount ?? 7,
          startDate: legacy.startDate ?? todayKey(),
          dayCapacity: migrateCapacity(legacy.dayCapacity ?? []),
        });
      }
    } catch { /* 忽略损坏的草稿 */ }
  }, [uid]);

  useEffect(() => { writeScoped(uid, KEYS.planner, draft); }, [draft, uid]);

  const plan = useMemo(
    () => distribute(draft.items, draft.dayCount, draft.startDate, draft.dayCapacity),
    // seed 变化 → 重新随机（换一套均衡方案）
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft.items, draft.dayCount, draft.startDate, draft.dayCapacity, seed],
  );

  const addItem = (text: string, diff = difficulty) => {
    const clean = text.trim();
    if (!clean) return;
    setDraft((d) => ({ ...d, items: [...d.items, { id: newLocalId('plan'), name: clean, difficulty: diff }] }));
    setName('');
  };

  const setCapacity = (index: number, value: number) => {
    setDraft((d) => {
      const caps = Array.from({ length: d.dayCount }, (_, i) => d.dayCapacity[i] ?? DEFAULT_DAY_CAPACITY);
      caps[index] = value;
      return { ...d, dayCapacity: caps };
    });
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(formatPlanText(plan)); toast.success('方案已复制'); }
    catch { toast.error('复制失败，请手动选择文本'); }
  };

  const totalMinutes = draft.items.reduce((s, i) => s + i.difficulty * 30, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* ---------------------------------------------------- 左：输入与参数 */}
      <section className="space-y-3">
        <div className="hw-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="hw-title text-sm">待排作业（{draft.items.length}）</p>
            <span className="hw-label">共约 {totalMinutes} 分钟</span>
          </div>

          {/* 输入框独占一整行：和下拉框挤一行会让输入区只剩一百多像素 */}
          <input
            className="hw-input mt-2"
            value={name}
            placeholder="输入作业名称，回车即可加入待排列表"
            aria-label="待排作业名称"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (isComposing(e)) return;
              if (e.key === 'Enter') { e.preventDefault(); addItem(name); }
            }}
          />
          <div className="mt-2 flex items-center gap-2">
            <select
              className="hw-input hw-w-fit" value={difficulty} aria-label="难度"
              onChange={(e) => setDifficulty(Number(e.target.value))}
            >
              {[1, 2, 3, 5].map((d) => (
                <option key={d} value={d}>难度 {d}（{d <= 1 ? '轻' : d <= 2 ? '一般' : d <= 3 ? '偏难' : '很重'}）</option>
              ))}
            </select>
            <button type="button" className="hw-btn shrink-0" data-variant="primary" onClick={() => addItem(name)}>
              <Plus size={14} /> 加入待排
            </button>
          </div>

          <div className="mt-3 max-h-64 space-y-1 overflow-y-auto hw-scroll">
            {draft.items.map((item) => (
              <div key={item.id} className="hw-row flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="hw-chip shrink-0">难度 {item.difficulty}</span>
                <button type="button" className="hw-btn shrink-0" data-variant="ghost"
                  aria-label="移除"
                  onClick={() => setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== item.id) }))}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {!draft.items.length && <p className="hw-label py-3">还没有作业，可以在上面输入，或从右侧「未完成的作业」一键加入。</p>}
          </div>
        </div>

        {/* AI 估算放在「输入完作业」之后：这才是用户需要它的时机 */}
        <AiFeatureCard
          title="AI 按年级 + 薄弱项估算每项用时"
          desc={
            <>
              当前年级：<strong style={{ color: 'var(--primary)' }}>{settings.grade || '未选择'}</strong>
              {' · '}
              薄弱项：
              <strong style={{ color: 'var(--primary)' }}>
                {(settings.weakSubjects ?? []).length ? (settings.weakSubjects ?? []).join('/') : '未设置'}
              </strong>
              {' · '}估出来的分钟数会折成难度权重，排出来的每一天才真的写得完
            </>
          }
          actions={
            settings.grade ? (
              <>
                <button type="button" className="hw-btn" data-variant="primary" disabled={estimating || !draft.items.length}
                  onClick={() => void runEstimate()}>
                  {estimating ? <Loader2 size={15} className="hw-spin" /> : <Sparkles size={15} />}
                  {estimating ? `推测中…（${draft.items.length} 条）` : 'AI 按年级推测用时'}
                </button>
                <a href="/homework/pro" className="hw-chip">个人中心改薄弱项</a>
              </>
            ) : (
              // 没选年级就地补，不要为了选个年级再跳走一次
              <div className="w-full space-y-2">
                <p className="hw-label">先选年级，AI 才有估算基准（选完立刻保存）</p>
                <GradePicker dense value={settings.grade}
                  onChange={(g) => { setSettings({ ...settings, grade: g }); toast.success(`已保存年级：${g}`); }} />
              </div>
            )
          }
        />

        <div className="hw-panel space-y-3 p-4">
          <p className="hw-title text-sm">排期参数</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hw-label">完成天数</span>
            <DraftInput type="number" min={1} max={60} className="hw-input w-24" ariaLabel="完成天数"
              value={String(draft.dayCount)}
              onCommit={(v) => setDraft((d) => ({ ...d, dayCount: Math.max(1, Math.min(60, Number(v) || 1)) }))} />
            <label className="hw-label" htmlFor="plan-start">开始日期</label>
            <input id="plan-start" type="date" className="hw-input w-auto" value={draft.startDate}
              onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value || todayKey() }))} />
          </div>

          <button type="button" className="hw-chip" onClick={() => setShowCapacity((v) => !v)}>
            <CalendarDays size={12} /> 每天可用时间（{showCapacity ? '收起' : '展开'}）
          </button>
          {showCapacity && (
            <div className="hw-panel max-h-44 space-y-1 overflow-y-auto p-2 hw-scroll">
              <div className="flex gap-1">
                <button type="button" className="hw-chip" onClick={() => setDraft((d) => ({ ...d, dayCapacity: Array(d.dayCount).fill(DEFAULT_DAY_CAPACITY) }))}>全部正常</button>
                <button type="button" className="hw-chip" onClick={() => setDraft((d) => ({ ...d, dayCapacity: Array(d.dayCount).fill(1.5) }))}>全部减半</button>
              </div>
              {plan.map((day) => (
                <div key={day.index} className="flex items-center gap-2 text-xs">
                  <span className="hw-num w-24">{day.date}</span>
                  <DraftInput type="number" min={0} step={0.5} className="hw-input w-24"
                    value={String(draft.dayCapacity[day.index] ?? DEFAULT_DAY_CAPACITY)}
                    onCommit={(v) => setCapacity(day.index, Math.max(0, Number(v) || 0))} />
                  <span className="hw-label">份（3 = 正常一天，0 = 不排）</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------- 右：快速加入与预览 */}
      <section className="space-y-3">
        <div className="hw-panel p-4">
          <p className="hw-title text-sm">从现有作业快速加入</p>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto hw-scroll">
            {tasks.filter((t) => !t.completed).slice(0, 60).map((t) => (
              <button key={t.id} type="button" className="hw-chip w-full truncate text-left"
                onClick={() => addItem(t.text, t.meta.estimateMin ? Math.max(1, Math.round(t.meta.estimateMin / 30)) : 1)}>
                + {t.text}
              </button>
            ))}
            {!tasks.some((t) => !t.completed) && <p className="hw-label">清单里还没有未完成的作业</p>}
          </div>
        </div>

        <div className="hw-panel p-4">
          <div className="flex items-center justify-between">
            <p className="hw-title text-sm">方案预览</p>
            <button type="button" className="hw-chip" onClick={() => setSeed((s) => s + 1)}>
              <RefreshCw size={12} /> 换一套
            </button>
          </div>
          <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto hw-scroll">
            {plan.map((day) => (
              <div key={day.index} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="hw-num hw-title">{day.date}</span>
                  <span className="hw-label hw-num">{day.load.toFixed(1)} / {day.capacity}</span>
                </div>
                <div className="hw-load-track my-1">
                  <div className="hw-load-fill" data-over={day.capacity > 0 && day.load > day.capacity}
                    style={{ width: `${day.capacity > 0 ? Math.min(100, (day.load / day.capacity) * 100) : 0}%` }} />
                </div>
                <p className="hw-label">{day.items.map((i) => i.name).join('、') || '（休息）'}</p>
              </div>
            ))}
            {!plan.length && <p className="hw-label py-4">还没有可排的内容</p>}
          </div>
          {plan.some((d) => d.capacity > 0 && d.load > d.capacity) && (
            <p className="hw-label hw-overdue mt-2">作业总量超过可用时间，建议增加完成天数或调小难度</p>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------- 底部操作条 */}
      <div className="hw-panel flex flex-wrap items-center gap-2 p-3 lg:col-span-2">
        <button type="button" className="hw-btn" onClick={() => void copy()}><Copy size={14} /> 复制方案</button>
        <button type="button" className="hw-btn" onClick={() => setDraft(emptyDraft(localDayKey(new Date())))}>
          <Trash2 size={14} /> 清空
        </button>
        <button
          type="button" className="hw-btn ml-auto" data-variant="primary"
          disabled={!draft.items.length || writing}
          aria-busy={writing}
          onClick={async () => {
            if (writing) return;
            const payload = planToTaskInputs(plan);
            setWriting(true);
            setWriteProgress(0);
            setWriteTotal(payload.length);
            // 立刻给反馈：按钮转圈 + 进度数字，不能让人干等着猜有没有点到
            const tid = toast.loading(`正在写入 ${payload.length} 条作业…`);
            try {
              const res = await importPlan(payload, (done) => setWriteProgress(done));
              toast.dismiss(tid);
              if (res.failed) {
                toast.error(`已写入 ${res.created} 条，${res.failed} 条失败，可再点一次重试`);
              } else {
                toast.success(`已写入 ${res.created} 条作业，正在返回清单…`);
                window.setTimeout(() => { window.location.href = '/homework/pro'; }, 500);
              }
            } catch (err) {
              toast.dismiss(tid);
              toast.error(err instanceof Error ? err.message : '写入失败，请重试');
            } finally {
              setWriting(false);
            }
          }}
        >
          {writing ? <Loader2 size={14} className="hw-spin" /> : <Wand2 size={14} />}
          {writing
            ? `写入中… ${writeProgress}/${writeTotal}`
            : '写入作业清单'}
        </button>
        <a href="/homework/pro" className="hw-btn"><ArrowLeft size={14} /> 返回工作台</a>
      </div>
    </div>
  );
}

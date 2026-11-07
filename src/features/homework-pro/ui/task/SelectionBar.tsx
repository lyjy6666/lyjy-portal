'use client';

import { useState } from 'react';
import { Trash2, Pin, PinOff, CalendarClock, Tag, X, GraduationCap, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { runBatch } from '../../core/batch';
import { isComposing } from '../common/interaction';
import type { DateMode, Priority, ProMeta } from '../../core/types';

const MODES: { id: DateMode; label: string; type: string; placeholder: string }[] = [
  { id: 'full', label: '整条替换', type: 'datetime-local', placeholder: '' },
  { id: 'dateOnly', label: '只改日期', type: 'date', placeholder: '保留各自时刻' },
  { id: 'timeOnly', label: '只改时间', type: 'time', placeholder: '无截止时间的会跳过' },
];

export function SelectionBar() {
  const {
    tasks, filtered, selection, setSelection, batchDelete, batchPin, batchReschedule, patchMeta,
  } = usePro();
  const [mode, setMode] = useState<DateMode>('full');
  const [dateValue, setDateValue] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!selection.size) return null;
  // 只操作当前可见且真实存在的任务，绝不误删被筛选隐藏的作业
  const visibleIds = new Set(filtered.filter((t) => t.id > 0).map((t) => t.id));
  const ids = [...selection].filter((id) => visibleIds.has(id));
  const activeMode = MODES.find((m) => m.id === mode)!;

  const clear = () => { setSelection(new Set()); setConfirmDelete(false); };

  const applyMeta = async (make: (id: number) => Partial<ProMeta>, success: string) => {
    if (!ids.length || busy) return;
    setBusy(true);
    try {
      // 并发上限 4：几百条一次性 PUT 会打满连接池并连锁触发刷新
      const res = await runBatch(ids, (id) => patchMeta(id, make(id)), 4);
      if (res.failed.length) { toast.error(`${res.failed.length} 项保存失败，请重试`); return; }
      toast.success(success);
      clear();
    } finally {
      setBusy(false);
    }
  };

  const addTag = async () => {
    const tag = tagDraft.trim();
    if (!tag) return;
    await applyMeta((id) => {
      const t = tasks.find((x) => x.id === id);
      return { tags: [...new Set([...(t?.meta.tags ?? []), tag])] };
    }, `已给 ${ids.length} 项加上标签 #${tag}`);
    setTagDraft('');
  };

  return (
    <div className="hw-panel hw-float fixed bottom-5 left-1/2 z-40 w-[min(94vw,760px)] -translate-x-1/2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="hw-title text-sm">已选 {ids.length} 项</span>
        <button type="button" className="hw-chip"
          onClick={() => setSelection(new Set(filtered.filter((t) => !t.completed && t.id > 0).map((t) => t.id)))}>
          全选未完成
        </button>
        <button type="button" className="hw-chip" onClick={clear}>取消选择</button>

        <div className="ml-auto flex flex-wrap items-center gap-1">
          <button type="button" className="hw-btn" disabled={busy}
            onClick={() => { void batchPin(ids, true); clear(); }}>
            <Pin size={14} /> 置顶
          </button>
          <button type="button" className="hw-btn" disabled={busy}
            onClick={() => { void batchPin(ids, false); clear(); }}>
            <PinOff size={14} /> 取消置顶
          </button>
          <button type="button" className="hw-btn" disabled={busy}
            onClick={() => void applyMeta(() => ({ priority: 'urgent' as Priority }), `已将 ${ids.length} 项设为紧急`)}>
            <GraduationCap size={14} /> 设为紧急
          </button>
          <button type="button" className="hw-btn" disabled={busy}
            onClick={() => void applyMeta(() => ({ reviewList: true }), `已将 ${ids.length} 项加入复习`)}>
            <CheckSquare size={14} /> 加入复习
          </button>
          <button type="button" className="hw-btn" onClick={() => setShowReschedule((v) => !v)}>
            <CalendarClock size={14} /> 批量改期
          </button>
          {confirmDelete ? (
            <>
              <span className="hw-chip hw-overdue">确认删除 {ids.length} 项？不可撤销</span>
              <button type="button" className="hw-btn" disabled={busy}
                onClick={() => { void batchDelete(ids); clear(); }}
                style={{ color: 'var(--hw-overdue)' }}>
                <Trash2 size={14} /> 确认删除
              </button>
              <button type="button" className="hw-btn" onClick={() => setConfirmDelete(false)}>取消</button>
            </>
          ) : (
            <button type="button" className="hw-btn" disabled={busy}
              onClick={() => setConfirmDelete(true)}
              style={{ color: 'var(--hw-overdue)' }}>
              <Trash2 size={14} /> 删除
            </button>
          )}
          <button type="button" className="hw-btn" data-variant="ghost" onClick={clear} aria-label="关闭"><X size={14} /></button>
        </div>
      </div>

      {showReschedule && (
        <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
          <div className="flex flex-wrap items-center gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className="hw-chip"
                style={mode === m.id ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : undefined}
                onClick={() => { setMode(m.id); setDateValue(''); }}
              >{m.label}</button>
            ))}
            <input
              key={mode}
              type={activeMode.type}
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              placeholder={activeMode.placeholder}
              className="hw-input w-auto text-xs"
            />
            <button
              type="button"
              className="hw-btn"
              data-variant="primary"
              disabled={!dateValue || busy}
              onClick={async () => {
                const res = await batchReschedule(ids, mode, dateValue);
                // 失败时保留日期和面板，用户可以直接重试，不用重选一遍
                if (res.failed) { toast.error(`${res.failed} 项改期失败，请重试`); return; }
                if (res.skipped) toast(`${res.skipped} 项没有截止时间，已跳过`);
                setDateValue('');
                setShowReschedule(false);
                clear();
              }}
            >应用</button>
          </div>
          <p className="hw-label mt-1.5">
            {mode === 'timeOnly' ? '只改时间时，原本没设截止时间的作业会被跳过' :
             mode === 'dateOnly' ? '保留每项原本的时刻；没设截止时间的按 00:00' : '日期与时间一起替换'}
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <Tag size={12} className="hw-label" />
        <input
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (isComposing(e)) return;
            if (e.key !== 'Enter' || !tagDraft.trim()) return;
            e.preventDefault();
            void addTag();
          }}
          placeholder="输入标签后按回车，批量加标签"
          className="hw-input flex-1 py-1 text-xs"
        />
      </div>
    </div>
  );
}

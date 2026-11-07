'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, ListChecks, Bell, Repeat2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { ProDialog, SubjectChip, LoadBar } from '../common/bits';
import { DraftInput } from '../common/DraftInput';
import { isComposing } from '../common/interaction';
import { SUBJECTS, OTHER_SUBJECT, extractSubject } from '../../core/subject';
import { fromUtcIso, toUtcIso, formatDateTime, expandRepeat, todayKey } from '../../core/date';
import { splitIntoChecklist, newLocalId, subtaskProgress } from '../../core/templates';
import type { Priority, RepeatRule, Subtask } from '../../core/types';

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'urgent', label: '紧急' }, { id: 'high', label: '高' },
  { id: 'normal', label: '普通' }, { id: 'low', label: '低' },
];

export function TaskDetail() {
  const { tasks, detailId, setDetailId, patchTask, patchMeta, removeTask, settings } = usePro();
  const task = tasks.find((t) => t.id === detailId) ?? null;
  const [newTag, setNewTag] = useState('');
  const [newSub, setNewSub] = useState('');
  const [newLink, setNewLink] = useState('');

  // 组件常驻不卸载：换一条任务时清掉上一条的临时输入
  useEffect(() => { setNewTag(''); setNewSub(''); setNewLink(''); }, [detailId]);

  if (!task) return null;
  const meta = task.meta;
  const progress = subtaskProgress(meta.subtasks);

  const setSubtasks = (list: Subtask[]) => void patchMeta(task.id, { subtasks: list });

  return (
    <ProDialog
      open={Boolean(task)}
      onOpenChange={(v) => { if (!v) setDetailId(null); }}
      title="作业详情"
      desc={`创建于 ${formatDateTime(task.createdAt)}`}
      className="sm:max-w-[620px]"
    >
      <div className="space-y-4">
        {/* 基础信息 */}
        <div className="space-y-2">
          <label className="hw-label">作业内容</label>
          <DraftInput
            className="hw-input"
            value={task.text}
            onCommit={(v) => { if (v.trim()) void patchTask(task.id, { text: v }); }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="hw-label">截止时间</label>
            <DraftInput
              type="datetime-local"
              className="hw-input w-auto text-xs"
              value={fromUtcIso(task.dueDate)}
              onCommit={(v) => void patchTask(task.id, { dueDate: toUtcIso(v) })}
            />
            <button type="button" className="hw-chip" onClick={() => void patchTask(task.id, { dueDate: null })}>清除截止</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="hw-label">优先级</label>
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                className="hw-chip"
                style={(meta.priority ?? 'normal') === p.id ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : undefined}
                onClick={() => void patchMeta(task.id, { priority: p.id })}
              >{p.label}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="hw-label">科目</label>
            <select
              className="hw-input w-auto text-xs"
              value={meta.subject ?? extractSubject(task.text)}
              onChange={(e) => void patchMeta(task.id, { subject: e.target.value })}
            >
              {[...SUBJECTS, OTHER_SUBJECT].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <SubjectChip subject={meta.subject ?? extractSubject(task.text)} />
          </div>
        </div>

        {/* 标签 */}
        <div>
          <label className="hw-label">标签</label>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {(meta.tags ?? []).map((tag) => (
              <button
                key={tag} type="button" className="hw-chip"
                onClick={() => void patchMeta(task.id, { tags: (meta.tags ?? []).filter((t) => t !== tag) })}
              >#{tag} ×</button>
            ))}
            <input
              className="hw-input w-32 py-1 text-xs"
              value={newTag}
              placeholder="加标签"
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (isComposing(e)) return;
                if (e.key !== 'Enter' || !newTag.trim()) return;
                e.preventDefault();
                void patchMeta(task.id, { tags: [...new Set([...(meta.tags ?? []), newTag.trim()])] });
                setNewTag('');
              }}
            />
          </div>
        </div>

        {/* 子任务检查清单 */}
        <div>
          <div className="flex items-center justify-between">
            <label className="hw-label flex items-center gap-1"><ListChecks size={13} /> 检查清单 {progress.done}/{progress.total}</label>
            <button
              type="button" className="hw-chip"
              onClick={() => setSubtasks(splitIntoChecklist(task.text))}
            >一键把作业拆成步骤</button>
          </div>
          <div className="mt-1 space-y-1">
            {(meta.subtasks ?? []).map((sub) => (
              <div key={sub.id} className="flex items-center gap-2">
                <input
                  type="checkbox" checked={sub.done}
                  onChange={() => setSubtasks((meta.subtasks ?? []).map((s) => s.id === sub.id ? { ...s, done: !s.done } : s))}
                />
                <span className="flex-1 text-sm" style={{ textDecoration: sub.done ? 'line-through' : undefined }}>{sub.text}</span>
                <button type="button" className="hw-btn" data-variant="ghost" onClick={() => setSubtasks((meta.subtasks ?? []).filter((s) => s.id !== sub.id))}><Trash2 size={13} /></button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                className="hw-input flex-1 py-1 text-xs"
                value={newSub} placeholder="新增一个步骤"
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (isComposing(e)) return;
                  if (e.key !== 'Enter' || !newSub.trim()) return;
                  e.preventDefault();
                  setSubtasks([...(meta.subtasks ?? []), { id: newLocalId('sub'), text: newSub.trim(), done: false }]);
                  setNewSub('');
                }}
              />
              <button
                type="button" className="hw-btn"
                onClick={() => {
                  if (!newSub.trim()) return;
                  setSubtasks([...(meta.subtasks ?? []), { id: newLocalId('sub'), text: newSub.trim(), done: false }]);
                  setNewSub('');
                }}
              ><Plus size={14} /></button>
            </div>
          </div>
        </div>

        {/* 耗时 / 每日负担 */}
        <div className="grid grid-cols-2 gap-2">
          <label className="hw-label">预计耗时（分钟）
            <DraftInput type="number" min={0} className="hw-input mt-1 text-xs"
              value={String(meta.estimateMin ?? '')}
              onCommit={(v) => void patchMeta(task.id, { estimateMin: v === '' ? undefined : Number(v) })} />
          </label>
          <label className="hw-label">实际耗时（分钟）
            <DraftInput type="number" min={0} className="hw-input mt-1 text-xs"
              value={String(meta.actualMin ?? '')}
              onCommit={(v) => void patchMeta(task.id, { actualMin: v === '' ? undefined : Number(v) })} />
          </label>
        </div>
        {task.dueDate && (
          <LoadBar minutes={meta.estimateMin ?? 0} limit={settings.dailyLimitMin} />
        )}

        {/* 备注与链接 */}
        <div>
          <label className="hw-label">备注</label>
          <DraftInput
            className="hw-input mt-1" rows={2}
            value={meta.note ?? ''}
            placeholder="补充要求、页码、注意事项…"
            onCommit={(v) => void patchMeta(task.id, { note: v })}
          />
          <div className="mt-2 space-y-1.5">
            {(meta.links ?? []).map((l, i) => (
              <div key={`${l.url}-${i}`} className="flex flex-wrap items-center gap-1.5">
                <DraftInput className="hw-input w-28" ariaLabel="链接显示名"
                  value={l.label || ''} placeholder="显示名"
                  onCommit={(v) => {
                    const next = [...(meta.links ?? [])];
                    next[i] = { ...next[i], label: v };
                    void patchMeta(task.id, { links: next });
                  }} />
                <DraftInput className="hw-input min-w-[220px] flex-1" ariaLabel="链接地址"
                  value={l.url} placeholder="https://…"
                  onCommit={(v) => {
                    const next = [...(meta.links ?? [])];
                    next[i] = { ...next[i], url: v };
                    void patchMeta(task.id, { links: next });
                  }} />
                <a href={l.url} target="_blank" rel="noreferrer" className="hw-chip" title="打开链接">↗</a>
                <button type="button" className="hw-btn" data-variant="ghost" aria-label="删除链接"
                  onClick={() => void patchMeta(task.id, { links: (meta.links ?? []).filter((_, j) => j !== i) })}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <input
              className="hw-input min-w-[240px] flex-1" value={newLink} placeholder="贴一个网盘/文档链接，回车添加"
              onChange={(e) => setNewLink(e.target.value)}
              onKeyDown={(e) => {
                if (isComposing(e)) return;
                if (e.key !== 'Enter' || !newLink.trim()) return;
                e.preventDefault();
                void patchMeta(task.id, { links: [...(meta.links ?? []), { label: '资料', url: newLink.trim() }] });
                setNewLink('');
              }}
            />
          </div>
          <p className="hw-label mt-1">真附件需要对象存储，这里用「备注 + 链接」覆盖绝大多数场景</p>
        </div>

        {/* 提醒 / 重复 / 成绩 */}
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="hw-label flex items-center gap-1"><Bell size={13} /> 提前提醒（分钟）
            <DraftInput type="number" min={0} step={5} className="hw-input mt-1 text-xs"
              value={String(meta.notifyLeadMin ?? settings.notifyLeadMin)}
              onCommit={(v) => void patchMeta(task.id, { notifyLeadMin: v === '' ? 0 : Number(v) })} />
          </label>
          <label className="hw-label flex items-center gap-1"><Repeat2 size={13} /> 重复作业
            <select
              className="hw-input mt-1 text-xs"
              value={meta.repeat?.rule ?? 'none'}
              onChange={(e) => {
                const rule = e.target.value;
                if (rule === 'none') { void patchMeta(task.id, { repeat: undefined }); return; }
                const next: RepeatRule = {
                  rule: rule as RepeatRule['rule'],
                  weekdays: rule === 'custom' ? (meta.repeat?.weekdays ?? [1, 3, 5]) : undefined,
                };
                void patchMeta(task.id, { repeat: next });
              }}
            >
              <option value="none">不重复</option>
              <option value="daily">每天</option>
              <option value="weekly">每周同一天</option>
              <option value="custom">自定义星期</option>
            </select>
          </label>
        </div>
        {meta.repeat && (
          <div className="hw-panel p-3">
            {meta.repeat.rule === 'custom' && (
              <>
                <span className="hw-label">选择重复的星期</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['日', '一', '二', '三', '四', '五', '六'].map((label, i) => {
                    const picked = (meta.repeat?.weekdays ?? []).includes(i);
                    return (
                      <button key={i} type="button" className="hw-chip"
                        data-active={picked ? 'true' : undefined}
                        onClick={() => {
                          const cur = meta.repeat?.weekdays ?? [];
                          const weekdays = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
                          void patchMeta(task.id, { repeat: { ...meta.repeat!, weekdays } });
                        }}>周{label}</button>
                    );
                  })}
                </div>
              </>
            )}
            <label className="hw-label mt-2 block">结束日期（可选）
              <input type="date" className="hw-input mt-1" value={meta.repeat.until ?? ''}
                onChange={(e) => void patchMeta(task.id, { repeat: { ...meta.repeat!, until: e.target.value || undefined } })} />
            </label>
            <p className="hw-label mt-2">
              接下来：{expandRepeat(meta.repeat, todayKey(), 4).join('、') || '（无）'} · 完成后会在本地生成下一条草稿，确认后再创建
            </p>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="hw-label">得分
            <DraftInput type="number" min={0} className="hw-input mt-1 text-xs"
              value={String(meta.grade?.score ?? '')}
              onCommit={(v) => void patchMeta(task.id, { grade: { ...meta.grade, score: v === '' ? undefined : Number(v) } })} />
          </label>
          <label className="hw-label">满分
            <DraftInput type="number" min={0} className="hw-input mt-1 text-xs"
              value={String(meta.grade?.full ?? '')}
              onCommit={(v) => void patchMeta(task.id, { grade: { ...meta.grade, full: v === '' ? undefined : Number(v) } })} />
          </label>
          <label className="hw-label flex items-center gap-1">已订正
            <input type="checkbox" checked={Boolean(meta.grade?.corrected)}
              onChange={(e) => void patchMeta(task.id, { grade: { ...meta.grade, corrected: e.target.checked } })} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
          <button
            type="button" className="hw-chip"
            style={{ color: meta.reviewList ? 'var(--primary)' : undefined }}
            onClick={() => void patchMeta(task.id, { reviewList: !meta.reviewList })}
          ><Star size={12} /> {meta.reviewList ? '已加入考前复习清单' : '加入考前复习清单'}</button>
          <button
            type="button" className="hw-btn ml-auto" style={{ color: 'var(--hw-overdue)' }}
            onClick={() => { removeTask(task.id); setDetailId(null); toast('已删除（8 秒内可撤销）'); }}
          ><Trash2 size={14} /> 删除作业</button>
        </div>
      </div>
    </ProDialog>
  );
}

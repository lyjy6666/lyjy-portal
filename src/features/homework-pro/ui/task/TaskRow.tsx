'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Pin, Trash2, Pencil, ListChecks, Clock, AlertTriangle, Play } from 'lucide-react';
import type { ProTask } from '../../core/types';
import { usePro } from '../../hooks/ProContext';
import { subjectOf } from '../../core/grouping';
import { formatRelative, formatDateTime, fromUtcIso, toUtcIso } from '../../core/date';
import { subtaskProgress } from '../../core/templates';
import { lateLabel } from '../../core/stats';
import { PriorityBadge, subjectStyle, Confetti } from '../common/bits';
import { DraftInput } from '../common/DraftInput';

export function TaskRow({ task }: { task: ProTask }) {
  const {
    toggleDone, togglePin, removeTask, patchTask, patchMeta, setDetailId, setFocusTaskId,
    selection, setSelection, settings,
  } = usePro();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const [editingDue, setEditingDue] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const confettiTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (confettiTimer.current !== null) window.clearTimeout(confettiTimer.current);
  }, []);

  // 详情里改过文本后，行内改名草稿要跟着更新，不能拿挂载时的旧快照
  useEffect(() => { if (!editing) setDraft(task.text); }, [task.text, editing]);

  const subject = subjectOf(task);
  const rel = formatRelative(task.dueDate);
  const progress = subtaskProgress(task.meta.subtasks);
  const late = settings.showCompleted ? lateLabel(task) : null;
  const selected = selection.has(task.id);

  const commitText = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== task.text) void patchTask(task.id, { text: next });
    else setDraft(task.text);
  };

  const onDone = () => {
    if (!task.completed) {
      setConfetti(true);
      if (confettiTimer.current !== null) window.clearTimeout(confettiTimer.current);
      confettiTimer.current = window.setTimeout(() => setConfetti(false), 900);
    }
    void toggleDone(task.id);
  };

  return (
    <div
      className="hw-row flex items-center gap-2"
      data-completed={task.completed}
      data-selected={selected}
      data-task-id={task.id}
      data-tour="task"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/homework-task', String(task.id))}
    >
      <Confetti show={confetti} />
      <span className="hw-subject-bar" style={subjectStyle(subject)} />

      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => {
          const next = new Set(selection);
          if (e.target.checked) next.add(task.id); else next.delete(task.id);
          setSelection(next);
        }}
        aria-label="选择此作业"
        className="h-4 w-4 shrink-0"
      />

      <button
        type="button"
        onClick={onDone}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
        style={{ borderColor: 'var(--border)' }}
        aria-label={task.completed ? '标记为未完成' : '标记为完成'}
      >
        {task.completed && <Check size={14} />}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitText();
              if (e.key === 'Escape') { setDraft(task.text); setEditing(false); }
            }}
            className="hw-input py-1 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setDetailId(task.id)}
            className="block w-full truncate text-left text-sm"
            style={{ textDecoration: task.completed ? 'line-through' : undefined }}
            title="单击打开详情；改名请用右侧铅笔按钮"
          >
            {task.text}
          </button>
        )}

        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
          <PriorityBadge priority={task.meta.priority} />
          {task.isPinned && <span className="hw-chip">置顶</span>}
          {task.meta.tags?.slice(0, 2).map((tag) => <span key={tag} className="hw-chip">#{tag}</span>)}
          {progress.total > 0 && (
            <span className="hw-chip flex items-center gap-1">
              <ListChecks size={11} /> {progress.done}/{progress.total}
            </span>
          )}
          {task.dueDate && (
            <button
              type="button"
              onClick={() => setEditingDue((v) => !v)}
              className={`hw-chip ${rel.urgent ? 'hw-overdue' : ''}`}
              title="点击修改截止时间"
            >
              <Clock size={11} /> {formatDateTime(task.dueDate)}
            </button>
          )}
          {rel.urgent && !task.completed && (
            <span className="hw-chip hw-overdue flex items-center gap-1">
              <AlertTriangle size={11} /> {rel.text}
            </span>
          )}
          {late && <span className="hw-chip hw-overdue">{late}</span>}
        </div>

        {editingDue && (
          <div className="mt-1 flex items-center gap-2">
            <DraftInput
              type="datetime-local"
              value={fromUtcIso(task.dueDate)}
              onCommit={(v) => void patchTask(task.id, { dueDate: toUtcIso(v) })}
              className="hw-input w-auto text-xs"
            />
            <button type="button" className="hw-btn" onClick={() => setEditingDue(false)}>完成</button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!task.completed && (
          <button
            type="button" className="hw-btn" data-variant="ghost"
            onClick={() => setFocusTaskId(task.id)}
            aria-label="开始专注计时" title="开始做 · 专注计时"
            style={{ color: 'var(--primary)' }}
          ><Play size={14} /></button>
        )}
        <button type="button" className="hw-btn" data-variant="ghost" onClick={() => setEditing(true)} aria-label="快速改名"><Pencil size={14} /></button>
        <button
          type="button" className="hw-btn" data-variant="ghost"
          onClick={() => void patchMeta(task.id, { reviewList: !task.meta.reviewList })}
          aria-label="加入/移出考前复习清单"
          title="加入考前复习清单"
          style={{ color: task.meta.reviewList ? 'var(--primary)' : undefined }}
        ><BookMarkIcon active={Boolean(task.meta.reviewList)} /></button>
        <button
          type="button" className="hw-btn" data-variant="ghost"
          onClick={() => void togglePin(task.id)}
          aria-label="置顶切换"
          style={{ color: task.isPinned ? 'var(--primary)' : undefined }}
        ><Pin size={14} /></button>
        <button type="button" className="hw-btn" data-variant="ghost" onClick={() => removeTask(task.id)} aria-label="删除"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function BookMarkIcon({ active }: { active: boolean }) {
  return active ? <span className="text-xs">★</span> : <span className="text-xs">☆</span>;
}

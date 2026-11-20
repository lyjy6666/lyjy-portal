'use client';

import { useState, type DragEvent } from 'react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { EmptyState, SubjectChip, PriorityBadge, subjectStyle } from '../common/bits';
import { readDragTaskId, TASK_DRAG_MIME } from '../common/interaction';
import { formatRelative } from '../../core/date';
import { subjectOf } from '../../core/grouping';
import type { ProTask } from '../../core/types';

/** 看板专用卡片：短文本 + 元信息，长内容自动折行且不会把列撑破 */
function BoardCard({ task, onOpen }: { task: ProTask; onOpen: (id: number) => void }) {
  const subject = subjectOf(task);
  const due = task.dueDate ? formatRelative(task.dueDate) : null;
  return (
    <button
      type="button"
      className="hw-panel hw-board-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(TASK_DRAG_MIME, String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onOpen(task.id)}
      title={task.text}
    >
      <span className="flex items-start gap-2">
        <span className="hw-subject-bar" style={subjectStyle(subject)} />
        <span className="min-w-0 flex-1">
          <span className="hw-board-text block text-sm"
            style={{ textDecoration: task.completed ? 'line-through' : undefined }}>
            {task.text}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-1">
            <SubjectChip subject={subject} />
            <PriorityBadge priority={task.meta.priority} />
            {due?.text && (
              <span className="hw-chip" data-tone={due.overdue ? 'late' : due.urgent ? 'warn' : undefined}>
                {due.text}
              </span>
            )}
          </span>
        </span>
      </span>
    </button>
  );
}

/** 看板：列宽自适应、内容多时自动换行，卡片不重叠不溢出 */
export function BoardView() {
  const { board, boardBy, setBoardBy, patchMeta, patchTask, filtered, setDetailId } = usePro();
  const [dragOver, setDragOver] = useState<string | null>(null);

  const onDrop = (groupId: string, e: DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = readDragTaskId(e, filtered);
    if (id === null) return;
    if (boardBy === 'status') {
      // 拖拽会真的写入完成状态，必须让用户看见并能一键撤销
      const done = groupId === 'done';
      void patchTask(id, { completed: done });
      toast(done ? '已标记完成' : '已恢复为未完成', {
        duration: 8000,
        action: { label: '撤销', onClick: () => void patchTask(id, { completed: !done }) },
      });
    } else if (boardBy === 'priority') {
      void patchMeta(id, { priority: groupId as 'urgent' | 'high' | 'normal' | 'low' });
    } else {
      void patchMeta(id, { subject: groupId });
    }
  };

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="hw-label">分列方式</span>
        {(['status', 'subject', 'priority'] as const).map((by) => (
          <button key={by} type="button" className="hw-chip"
            data-active={boardBy === by ? 'true' : undefined}
            onClick={() => setBoardBy(by)}>
            {{ status: '按状态', subject: '按科目', priority: '按优先级' }[by]}
          </button>
        ))}
        <span className="hw-label ml-auto">拖动卡片可直接改归属</span>
      </div>

      {!filtered.length ? (
        <EmptyState title="没有可展示的作业" hint="换个筛选条件或先添加几条作业。" />
      ) : (
        <div className="hw-board-grid">
          {board.map((group) => (
            <section
              key={group.id}
              className="hw-panel hw-board-col"
              onDragOver={(e) => { e.preventDefault(); setDragOver(group.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDrop(group.id, e)}
              style={dragOver === group.id ? { borderColor: 'var(--primary)' } : undefined}
            >
              <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--hw-rule)' }}>
                <span className="hw-title truncate text-sm">{group.label}</span>
                <span className="hw-label hw-num ml-auto shrink-0">{group.tasks.length}</span>
              </div>
              <div className="hw-board-col-body hw-scroll">
                {group.tasks.length === 0
                  ? <p className="hw-label py-6 text-center">拖到这里</p>
                  : group.tasks.map((t) => <BoardCard key={t.id} task={t} onOpen={setDetailId} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

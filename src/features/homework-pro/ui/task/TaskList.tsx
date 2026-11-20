'use client';

import { useState, type DragEvent } from 'react';
import { ChevronDown, ChevronRight, Inbox } from 'lucide-react';
import { usePro } from '../../hooks/ProContext';
import { GroupHeader, EmptyState, Skeleton } from '../common/bits';
import { readDragTaskId } from '../common/interaction';
import { TaskRow } from './TaskRow';

export function TaskList() {
  const { groups, loading, tasks, filtered, patchMeta, filter, setFilter, settings } = usePro();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(true);

  const toggle = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCollapsed(next);
  };

  const onDrop = (groupId: string, targetId: number | null, e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    // 非任务拖拽（文本/文件）取到空串，旧代码 Number('') === 0 会误通过
    const dragged = readDragTaskId(e, tasks);
    if (dragged === null) return;
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const ids = group.tasks.filter((t) => !t.completed).map((t) => t.id);
    const from = ids.indexOf(dragged);
    if (from < 0) return;
    // targetId 为 null 表示拖到了分组空白处：追加到末尾，而不是静默失败
    const to = targetId === null ? ids.length - 1 : ids.indexOf(targetId);
    if (to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]!);
    ids.forEach((id, index) => void patchMeta(id, { order: index }));
  };

  if (loading) return <Skeleton rows={6} />;

  if (!tasks.length) {
    return (
      <div data-tour="task">
        <EmptyState
          title="还没有作业，从上面添加第一条吧"
          hint="可以一次粘贴一整段作业，AI 会自动拆成多条并识别科目；也可以点「语音」直接念。"
          action={<span className="hw-chip">Ctrl + Enter 快速添加</span>}
        />
      </div>
    );
  }

  // 已完成作业统一由底部区块渲染；分组里排除，避免同一条任务出现两次
  const activeGroups = groups
    .map((g) => ({ ...g, tasks: g.tasks.filter((t) => !t.completed) }))
    .filter((g) => g.tasks.length > 0);
  // 底部区块必须遵守当前搜索/筛选，否则搜「数学」仍列出所有科目的已完成作业
  const completed = filtered.filter((t) => t.completed);
  const active = filtered.filter((t) => !t.completed);

  return (
    <div className="space-y-3">
      {activeGroups.map((group) => {
        const isCollapsed = collapsed.has(group.id);
        return (
          <section key={group.id} className="hw-panel overflow-hidden">
            <div className="px-3">
              <GroupHeader
                label={group.label}
                count={group.tasks.length}
                collapsed={isCollapsed}
                onToggle={() => toggle(group.id)}
                colorIndex={group.colorIndex}
              />
            </div>
            {!isCollapsed && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const raw = (e.target as HTMLElement).closest('[data-task-id]')?.getAttribute('data-task-id');
                  onDrop(group.id, raw ? Number(raw) : null, e);
                }}
              >
                {group.tasks.map((task) => <TaskRow key={task.id} task={task} />)}
              </div>
            )}
          </section>
        );
      })}

      {activeGroups.length === 0 && (
        <EmptyState title="没有符合条件的作业" hint="试试清空搜索或筛选条件。" />
      )}

      {settings.showCompleted && completed.length > 0 && (
        <section className="hw-panel overflow-hidden">
          <div className="flex items-center gap-2 px-3">
            <button
              type="button"
              onClick={() => setShowCompleted((v) => !v)}
              className="flex flex-1 items-center gap-2 py-2 text-left"
            >
              {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="hw-title text-sm">已完成</span>
              <span className="hw-label hw-num">{completed.length}</span>
            </button>
            <button
              type="button"
              className="hw-chip"
              onClick={() => setFilter({ ...filter, status: filter.status === 'completed' ? 'all' : 'completed' })}
            >
              {filter.status === 'completed' ? '显示全部' : '只看已完成'}
            </button>
          </div>
          {showCompleted && completed.map((task) => <TaskRow key={task.id} task={task} />)}
        </section>
      )}

      {active.length === 0 && (
        <EmptyState title="全部完成啦" hint="今天没有待办作业，休息一下吧。" action={<Inbox size={20} />} />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import styles from '../studyroom.module.css';

interface TaskPanelProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onAdd: (title: string, estimated: number) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onIncrementPomodoro: (id: string) => void;
  onSelect: (id: string | null) => void;
}

export function TaskPanel({
  tasks,
  selectedTaskId,
  onAdd,
  onUpdate,
  onDelete,
  onToggleComplete,
  onIncrementPomodoro,
  onSelect,
}: TaskPanelProps) {
  const [title, setTitle] = useState('');
  const [estimated, setEstimated] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const add = () => {
    if (!title.trim()) return;
    onAdd(title, estimated);
    setTitle('');
    setEstimated(1);
  };

  const saveEdit = (id: string) => {
    if (draft.trim()) onUpdate(id, { title: draft.trim() });
    setEditingId(null);
  };

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>今日计划</h2>
        <span className={styles.cardSub}>
          {doneCount}/{tasks.length} 完成
        </span>
      </div>

      <div className={styles.taskForm}>
        <input
          className={styles.textInput}
          placeholder="写下一件要完成的事…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <div className={styles.taskFormRow}>
          <span className={styles.goalLabel}>预计</span>
          <input
            className={styles.numberInput}
            type="number"
            min={1}
            max={20}
            value={estimated}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(n)) setEstimated(Math.max(1, Math.min(20, n)));
            }}
            aria-label="预计番茄数"
          />
          <span className={styles.goalLabel}>段</span>
          <button className={styles.addBtn} onClick={add} style={{ marginLeft: 'auto' }}>
            <Plus size={14} /> 添加
          </button>
        </div>
      </div>

      <div className={styles.taskList}>
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>还没有任务，写一条开始专注吧。</div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`${styles.taskItem} ${
                selectedTaskId === task.id ? styles.taskItemActive : ''
              } ${task.completed ? styles.taskItemDone : ''}`}
              onClick={() => onSelect(selectedTaskId === task.id ? null : task.id)}
            >
              <div className={styles.taskTop}>
                <button
                  className={`${styles.checkBtn} ${task.completed ? styles.checkBtnOn : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task.id);
                  }}
                  aria-label={task.completed ? '标记未完成' : '标记完成'}
                >
                  {task.completed && <Check size={12} />}
                </button>

                <div className={styles.taskMain}>
                  {editingId === task.id ? (
                    <input
                      className={styles.editInput}
                      value={draft}
                      autoFocus
                      onChange={(e) => setDraft(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(task.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => saveEdit(task.id)}
                    />
                  ) : (
                    <div
                      className={`${styles.taskTitle} ${
                        task.completed ? styles.taskTitleDone : ''
                      }`}
                    >
                      {task.title}
                    </div>
                  )}

                  <div className={styles.taskMeta}>
                    <div className={styles.pomoDots}>
                      {Array.from({ length: task.estimatedPomodoros }).map((_, i) => (
                        <span
                          key={i}
                          className={`${styles.pomoDot} ${
                            i < task.pomodoros ? styles.pomoDotOn : ''
                          }`}
                        />
                      ))}
                    </div>
                    <span className={styles.pomoCount}>
                      {task.pomodoros}/{task.estimatedPomodoros}
                    </span>
                  </div>
                </div>

                <div className={styles.taskActions}>
                  <button
                    className={styles.miniIconBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(task.id);
                      setDraft(task.title);
                    }}
                    aria-label="编辑任务"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className={`${styles.miniIconBtn} ${styles.miniIconBtnDanger}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                    aria-label="删除任务"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTaskId && (
        <div className={styles.taskFooter}>
          <button
            className={styles.wideBtn}
            onClick={() => onIncrementPomodoro(selectedTaskId)}
          >
            <Plus size={13} /> 给选中任务 +1 段
          </button>
        </div>
      )}
    </div>
  );
}

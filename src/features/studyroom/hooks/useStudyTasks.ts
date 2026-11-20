'use client';

import { useCallback, useEffect, useState } from 'react';
import { Task } from '@/lib/types';
import { createTask } from '@/lib/pomodoro-utils';
import { STORAGE_KEYS } from '../lib/constants';
import { normalizeTasks, readJSON, writeJSON } from '../lib/storage';

/** 与原版共用 pomodoro-tasks，两版任务互通 */
export function useStudyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = readJSON<Task[]>(STORAGE_KEYS.tasks, [], normalizeTasks);
    setTasks(loaded);
    setSelectedTaskId((prev) =>
      prev && loaded.some((t) => t.id === prev) ? prev : null,
    );
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeJSON(STORAGE_KEYS.tasks, tasks);
  }, [tasks, ready]);

  const addTask = useCallback((title: string, estimated: number = 1) => {
    if (!title.trim()) return;
    setTasks((prev) => [...prev, createTask(title.trim(), estimated)]);
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setSelectedTaskId((prev) => (prev === id ? null : prev));
    },
    [],
  );

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }, []);

  const incrementPomodoro = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pomodoros: t.pomodoros + 1 } : t)),
    );
  }, []);

  const selectTask = useCallback((id: string | null) => {
    setSelectedTaskId(id);
  }, []);

  return {
    tasks,
    selectedTaskId,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    incrementPomodoro,
    selectTask,
    setSelectedTaskId,
  };
}

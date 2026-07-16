'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, Clock, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Task } from '@/lib/types';
import { createTask } from '@/lib/pomodoro-utils';
import { cn } from '@/lib/utils';

interface TaskManagerProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string | null) => void;
}

export function TaskManager({
  tasks,
  onTasksChange,
  selectedTaskId,
  onTaskSelect,
}: TaskManagerProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = createTask(newTaskTitle, estimatedPomodoros);
      onTasksChange([...tasks, newTask]);
      setNewTaskTitle('');
      setEstimatedPomodoros(1);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    onTasksChange(tasks.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) {
      onTaskSelect(null);
    }
  };

  const handleToggleComplete = (taskId: string) => {
    onTasksChange(
      tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = (taskId: string) => {
    onTasksChange(
      tasks.map((t) =>
        t.id === taskId ? { ...t, title: editingTitle } : t
      )
    );
    setEditingTaskId(null);
  };

  const handleIncrementPomodoro = (taskId: string) => {
    onTasksChange(
      tasks.map((t) =>
        t.id === taskId ? { ...t, pomodoros: t.pomodoros + 1 } : t
      )
    );
  };

  return (
    <Card className="p-6 w-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">任务列表</h2>

      {/* 添加任务 */}
      <div className="space-y-3 mb-6">
        <Input
          type="text"
          placeholder="添加新任务..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500"
        />
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span>预计番茄数</span>
              <span>{estimatedPomodoros}</span>
            </div>
            <Slider
              value={[estimatedPomodoros]}
              onValueChange={([value]) => setEstimatedPomodoros(value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
          <Button
            onClick={handleAddTask}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>还没有任务，添加一个开始专注吧！</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'p-4 rounded-lg border-2 transition-all cursor-pointer',
                selectedTaskId === task.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600',
                task.completed && 'opacity-60'
              )}
              onClick={() => onTaskSelect(task.id)}
            >
              <div className="flex items-start gap-3">
                {/* 完成按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleComplete(task.id);
                  }}
                  className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                    task.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-slate-400 dark:border-slate-600 hover:border-green-500'
                  )}
                >
                  {task.completed && <Check className="h-4 w-4 text-white" />}
                </button>

                {/* 任务内容 */}
                <div className="flex-1 min-w-0">
                  {editingTaskId === task.id ? (
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(task.id);
                        } else if (e.key === 'Escape') {
                          setEditingTaskId(null);
                        }
                      }}
                      onBlur={() => handleSaveEdit(task.id)}
                      autoFocus
                      className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm h-8"
                    />
                  ) : (
                    <h3
                      className={cn(
                        'font-medium text-sm truncate',
                        task.completed ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'
                      )}
                    >
                      {task.title}
                    </h3>
                  )}

                  {/* 番茄进度 */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1">
                      {Array.from({ length: task.estimatedPomodoros }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'w-4 h-4 rounded-sm',
                              i < task.pomodoros
                                ? 'bg-red-500'
                                : 'bg-slate-300 dark:bg-slate-700'
                            )}
                          />
                        )
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {task.pomodoros}/{task.estimatedPomodoros}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-1">
                  {editingTaskId === task.id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(task.id);
                      }}
                      className="h-8 w-8 p-0 text-green-500 hover:text-green-400"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(task);
                      }}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 增加番茄数按钮（仅当选中任务时显示） */}
      {selectedTaskId && (
        <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-700">
          <Button
            onClick={() => handleIncrementPomodoro(selectedTaskId)}
            variant="outline"
            className="w-full border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            完成一个番茄
          </Button>
        </div>
      )}
    </Card>
  );
}

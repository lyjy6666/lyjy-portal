'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CancelledError,
  ResourceScope,
  createTaskContext,
  type TaskContext,
} from '../core/tasks';

export type TaskStatus = 'idle' | 'running' | 'done' | 'error' | 'cancelled';

export type TaskState = {
  status: TaskStatus;
  /** 0~1，只能由真实计算驱动 */
  progress: number;
  note: string;
  error: string;
};

const IDLE: TaskState = { status: 'idle', progress: 0, note: '', error: '' };

/**
 * 统一的「执行一次转换」钩子。
 *
 * 保证：进度真实、可取消、结束（含出错/取消）后资源必定释放、组件卸载时自动收尾。
 */
export function useTask() {
  const [state, setState] = useState<TaskState>(IDLE);
  const ctrlRef = useRef<AbortController | null>(null);
  const scopeRef = useRef<ResourceScope | null>(null);

  /** 释放上一轮资源并中止上一轮任务 */
  const teardown = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
    scopeRef.current?.dispose();
    scopeRef.current = null;
  }, []);

  // 组件卸载时务必收尾，否则切 Tab / 跳路由会泄漏
  useEffect(() => teardown, [teardown]);

  const run = useCallback(
    async <T,>(fn: (ctx: TaskContext) => Promise<T>): Promise<T | undefined> => {
      teardown();

      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      const scope = new ResourceScope();
      scopeRef.current = scope;

      setState({ status: 'running', progress: 0, note: '', error: '' });

      const ctx = createTaskContext(ctrl.signal, (value, note) => {
        if (ctrl.signal.aborted) return;
        setState((s) => ({
          ...s,
          progress: Math.max(0, Math.min(1, value)),
          note: note ?? s.note,
        }));
      });

      try {
        const result = await fn(ctx);
        if (ctrl.signal.aborted) throw new CancelledError();
        setState({ status: 'done', progress: 1, note: '', error: '' });
        return result;
      } catch (e) {
        if (e instanceof CancelledError || ctrl.signal.aborted) {
          setState({ status: 'cancelled', progress: 0, note: '', error: '' });
          return undefined;
        }
        setState({
          status: 'error',
          progress: 0,
          note: '',
          error: e instanceof Error ? e.message : '处理失败',
        });
        return undefined;
      } finally {
        // 成功路径的产物已在外部取走（如 blob），这里只清任务态资源
        if (ctrlRef.current === ctrl) {
          scope.dispose();
          scopeRef.current = null;
          ctrlRef.current = null;
        }
      }
    },
    [teardown]
  );

  const cancel = useCallback(() => {
    ctrlRef.current?.abort();
    setState({ status: 'cancelled', progress: 0, note: '', error: '' });
  }, []);

  const reset = useCallback(() => {
    teardown();
    setState(IDLE);
  }, [teardown]);

  return {
    state,
    run,
    cancel,
    reset,
    running: state.status === 'running',
    finished: state.status === 'done',
  };
}

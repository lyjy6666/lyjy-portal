/**
 * 任务框架（纯 TS，无 React 依赖）
 *
 * 旧版的问题：进度写死、不能取消、URL.createObjectURL 从不 revoke、
 * FFmpeg 实例不 terminate、AudioContext 不 close —— 反复操作就累积泄漏。
 *
 * 这里把三件事做成默认行为：
 *   1. 进度只能由真实计算驱动（没有假进度）
 *   2. 取消随时可用
 *   3. 资源登记到 ResourceScope，任务结束（含出错/取消）自动释放
 */

export class CancelledError extends Error {
  constructor() {
    super('任务已取消');
    this.name = 'CancelledError';
  }
}

/** 进度上报：0~1 的小数 + 可选说明 */
export type ProgressFn = (value: number, note?: string) => void;

/**
 * 资源作用域。
 * 所有需要手动释放的东西都登记进来，dispose() 时逆序执行，保证成对清理。
 */
export class ResourceScope {
  private disposers: (() => void)[] = [];

  /** 登记一个 blob URL 并直接返回，结束时自动 revoke */
  url(blob: Blob): string {
    const u = URL.createObjectURL(blob);
    this.onDispose(() => URL.revokeObjectURL(u));
    return u;
  }

  /** 登记任意清理动作 */
  onDispose(fn: () => void): void {
    this.disposers.push(fn);
  }

  /** 逆序释放，单个失败不影响其它 */
  dispose(): void {
    for (let i = this.disposers.length - 1; i >= 0; i--) {
      try {
        this.disposers[i]();
      } catch {
        /* 单个清理失败不阻断其余 */
      }
    }
    this.disposers = [];
  }
}

export type TaskContext = {
  signal: AbortSignal;
  progress: ProgressFn;
  scope: ResourceScope;
  /** 在耗时循环里定期调用，取消时抛 CancelledError */
  throwIfCancelled: () => void;
};

/** 创建一个任务上下文 */
export function createTaskContext(
  signal: AbortSignal,
  onProgress: ProgressFn
): TaskContext {
  const scope = new ResourceScope();
  return {
    signal,
    progress: onProgress,
    scope,
    throwIfCancelled() {
      if (signal.aborted) throw new CancelledError();
    },
  };
}

/** 把「让出主线程」写成一行，避免长循环卡死 UI */
export const yieldToUI = () => new Promise<void>((r) => setTimeout(r, 0));

/** 文件大小格式化 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(2) : v.toFixed(1)} ${units[i]}`;
}

/** 体积变化：返回真实增减（负数表示变大），不美化 */
export function sizeDelta(before: number, after: number): {
  bytes: number;
  percent: number;
  label: string;
  grew: boolean;
} {
  const bytes = before - after;
  const percent = before > 0 ? (bytes / before) * 100 : 0;
  const grew = bytes < 0;
  return {
    bytes,
    percent,
    grew,
    label: grew ? `增大 ${formatBytes(-bytes)}` : `减少 ${formatBytes(bytes)}`,
  };
}

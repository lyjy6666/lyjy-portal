/**
 * Pro 版统一 API 客户端。
 *
 * 旧版在每个组件里重复 getAuthHeaders()，且大量 fetch 完全不检查 response.ok。
 * 这里收口：自动带鉴权头、超时、非 2xx 一律抛错、错误信息归一化。
 */

let auth: { token: string; userId: number | null } = { token: '', userId: null };

/** 登录后设置；Pro 优先 Bearer，没有 token 时回退 X-User-Id（兼容旧会话） */
export function setApiAuth(token: string, userId: number | null): void {
  auth = { token: token || '', userId };
}

export function getApiAuth(): { token: string; userId: number | null } {
  return { ...auth };
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, timeoutMs = 20_000): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (auth.token) headers.set('Authorization', `Bearer ${auth.token}`);
  else if (auth.userId) headers.set('X-User-Id', String(auth.userId));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, { ...init, headers, signal: controller.signal });
    if (!res.ok) {
      let message = `请求失败（HTTP ${res.status}）`;
      try {
        const body = (await res.json()) as { error?: string; message?: string };
        message = body.error || body.message || message;
      } catch { /* 忽略非 JSON 响应 */ }
      throw new ApiError(message, res.status);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('请求超时，请检查网络后重试', 408);
    }
    throw new ApiError('网络连接失败，已进入离线模式', 0);
  } finally {
    clearTimeout(timer);
  }
}

export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0;
}

import { apiFetch } from './client';
import type { UserInfo } from '../core/types';

type AuthResponse = { success: boolean; user: { id: number; username: string }; token?: string; error?: string };

async function call(path: string, username: string, password: string): Promise<UserInfo> {
  const data = await apiFetch<AuthResponse>(path, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!data.success || !data.user) throw new Error(data.error || '登录失败');
  return { id: Number(data.user.id), username: data.user.username, token: data.token || '' };
}

export const authApi = {
  login: (username: string, password: string) => call('/api/homework/auth/login', username, password),
  register: (username: string, password: string) => call('/api/homework/auth/register', username, password),
};

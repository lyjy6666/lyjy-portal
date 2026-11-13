'use client';

import { readScoped, writeScoped } from '../core/storage';
import type { ModelKey } from './useAiUsage';

/** 聊天记录按账号隔离存在本地，关闭对话不会丢，重新从首页入口进来继续聊 */
export const AI_CHAT_NAME = 'aiChatV1';
const MAX_KEEP = 60;

export type ChatPhase = 'reviewing' | 'thinking' | 'done' | 'failed';
export type ChatMsg = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  phase?: ChatPhase;
  reason?: string;
  model?: ModelKey;
  deep?: boolean;
};

function sanitize(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is Record<string, unknown> => Boolean(m) && typeof m === 'object')
    .slice(-MAX_KEEP)
    .map((m) => ({
      id: Number(m.id) || 0,
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      text: String(m.text ?? ''),
      // 中途关掉页面可能停在「审核中 / 思考中」，恢复时统一标成失败，避免卡住
      phase: (m.phase === 'reviewing' || m.phase === 'thinking' ? 'failed' : m.phase || 'done') as ChatPhase,
      reason: m.reason ? String(m.reason) : undefined,
      model: m.model === 'B' ? ('B' as const) : m.model === 'A' ? ('A' as const) : undefined,
      deep: Boolean(m.deep),
    }))
    .filter((m) => m.text);
}

export function readChat(uid: number | string): ChatMsg[] {
  return sanitize(readScoped<unknown>(uid, AI_CHAT_NAME, []));
}

/** 只落盘已结束的消息；进行中的状态不写，刷新后不会留下假进度 */
export function writeChat(uid: number | string, msgs: ChatMsg[]): void {
  const done = msgs
    .filter((m) => m.phase === 'done' || m.phase === 'failed')
    .filter((m) => m.text)
    .slice(-MAX_KEEP);
  writeScoped(uid, AI_CHAT_NAME, done);
}

export function clearChat(uid: number | string): void {
  writeScoped(uid, AI_CHAT_NAME, []);
}

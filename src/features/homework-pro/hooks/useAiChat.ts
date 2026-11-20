'use client';

import { readScoped, writeScoped } from '../core/storage';
import type { ModelKey } from './useAiUsage';

/**
 * AI 聊天：多会话存储（左侧会话列表 + 右侧消息）。
 * 按账号隔离存在本地；旧的 aiChatV1 单会话数据会自动迁移成第一条会话，不丢记录。
 */
export const AI_SESSIONS_NAME = 'aiChatSessionsV1';
export const AI_ACTIVE_NAME = 'aiChatActiveV1';
export const LEGACY_CHAT_NAME = 'aiChatV1';
const MAX_SESSIONS = 30;
const MAX_MSGS = 60;

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

export type ChatSession = {
  id: string;
  title: string;
  msgs: ChatMsg[];
  updatedAt: number;
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function titleOf(text: string): string {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '新对话';
  return t.length > 18 ? `${t.slice(0, 18)}…` : t;
}

function sanitizeMsgs(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is Record<string, unknown> => Boolean(m) && typeof m === 'object')
    .slice(-MAX_MSGS)
    .map((m) => ({
      id: Number(m.id) || 0,
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      text: String(m.text ?? ''),
      // 中途关页面可能停在「审核中 / 思考中」，恢复时标成失败，避免假进度
      phase: (m.phase === 'reviewing' || m.phase === 'thinking' ? 'failed' : m.phase || 'done') as ChatPhase,
      reason: m.reason ? String(m.reason) : undefined,
      model: m.model === 'B' ? ('B' as const) : m.model === 'A' ? ('A' as const) : undefined,
      deep: Boolean(m.deep),
    }))
    .filter((m) => m.text);
}

function sanitizeSessions(raw: unknown): ChatSession[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === 'object')
    .slice(-MAX_SESSIONS)
    .map((s) => ({
      id: String(s.id || newId()),
      title: String(s.title || '新对话'),
      msgs: sanitizeMsgs(s.msgs),
      updatedAt: Number(s.updatedAt) || Date.now(),
    }));
  // 空会话必须保留：刚「新建对话」还没发消息时，左侧列表也要能看见它
}

export function readSessions(uid: number | string): ChatSession[] {
  const list = sanitizeSessions(readScoped<unknown>(uid, AI_SESSIONS_NAME, []));

  // 一次性迁移旧的单会话记录
  const legacy = sanitizeMsgs(readScoped<unknown>(uid, LEGACY_CHAT_NAME, []));
  if (legacy.length) {
    const migrated: ChatSession = {
      id: newId(),
      title: titleOf(legacy.find((m) => m.role === 'user')?.text || '历史对话'),
      msgs: legacy,
      updatedAt: Date.now(),
    };
    const next = [...list, migrated].slice(-MAX_SESSIONS);
    writeScoped(uid, AI_SESSIONS_NAME, next);
    writeScoped(uid, LEGACY_CHAT_NAME, []);
    return next;
  }
  return list;
}

export function writeSessions(uid: number | string, list: ChatSession[]): void {
  writeScoped(uid, AI_SESSIONS_NAME, list.slice(-MAX_SESSIONS));
}

export function readActiveId(uid: number | string): string | null {
  const v = readScoped<string | null>(uid, AI_ACTIVE_NAME, null);
  return typeof v === 'string' && v ? v : null;
}

export function writeActiveId(uid: number | string, id: string | null): void {
  writeScoped(uid, AI_ACTIVE_NAME, id);
}

export function createSession(uid: number | string): ChatSession {
  const fresh: ChatSession = { id: newId(), title: '新对话', msgs: [], updatedAt: Date.now() };
  // 丢弃之前留下的空会话，避免连点「新建对话」堆出一排同名条目
  const kept = readSessions(uid).filter((s) => s.msgs.length > 0);
  writeSessions(uid, [...kept, fresh]);
  writeActiveId(uid, fresh.id);
  return fresh;
}

/** 只落盘已结束的消息，进行中的状态不写 */
export function updateSessionMsgs(uid: number | string, id: string, msgs: ChatMsg[]): ChatSession[] {
  const done = msgs
    .filter((m) => m.phase === 'done' || m.phase === 'failed')
    .filter((m) => m.text)
    .slice(-MAX_MSGS);
  const list = readSessions(uid).map((s) =>
    s.id === id
      ? {
          ...s,
          msgs: done,
          title: titleOf(done.find((m) => m.role === 'user')?.text || s.title),
          updatedAt: Date.now(),
        }
      : s,
  );
  // 空会话（还没发过消息）保留，方便左侧列表显示；超过上限才裁掉最旧的
  writeSessions(uid, list);
  return list;
}

export function deleteSession(uid: number | string, id: string): ChatSession[] {
  const list = readSessions(uid).filter((s) => s.id !== id);
  writeSessions(uid, list);
  return list;
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { readScoped, writeScoped } from '../core/storage';
import { usePro } from './ProContext';

/**
 * AI 问答用量统计。
 *
 * 口径说明（重要）：Agnes / 智谱都没有可读的真实账单接口（Agnes 的
 * /dashboard/billing/usage 恒返回 0，智谱相关端点全部 404），
 * 所以这里累计的是**每次 /chat/completions 响应里 usage.total_tokens 的真实值**，
 * 按账号隔离存在本地、**每天 0 点归零**；进度条是「今日累计 / 预设每日预算」，
 * 属于本站自己的用量估算，不是平台账单余额。
 */

export type ModelKey = 'A' | 'B';

export const AI_USAGE_NAME = 'aiUsageV1';
export const AI_USAGE_EVENT = 'hw:ai-usage-changed';

/** 基础每日额度（tokens）：站主说「基础改为 1 万和 3 万」 */
export const BASE_DAILY_BUDGET: Record<ModelKey, number> = {
  A: 10_000,
  B: 30_000,
};

/** 当前生效的每日额度 = 基础 ×3（用量狂欢活动）；活动结束由站主手动调回基础值 */
export const DAILY_BUDGET: Record<ModelKey, number> = {
  A: BASE_DAILY_BUDGET.A * 3, // 30,000
  B: BASE_DAILY_BUDGET.B * 3, // 90,000
};

/** 试行期活动文案：只做展示，不感知日期，站主到时候会通知调回 */
export const USAGE_PROMO = 'Pro 版刚发布，用量狂欢，翻三倍，持续到 12.18';
export const USAGE_PROMO_DETAIL = '基础每日 1 万 / 3 万 tokens，活动期翻三倍为 3 万 / 9 万。';

export type AiUsage = {
  /** YYYY-MM-DD，跨天自动归零 */
  day: string;
  A: number;
  B: number;
  callsA: number;
  callsB: number;
};

function dayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function emptyUsage(): AiUsage {
  return { day: dayKey(), A: 0, B: 0, callsA: 0, callsB: 0 };
}

function normalize(raw: unknown): AiUsage {
  const base = emptyUsage();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AiUsage>;
  if (r.day !== base.day) return base; // 跨天归零
  return {
    day: base.day,
    A: Number(r.A) || 0,
    B: Number(r.B) || 0,
    callsA: Number(r.callsA) || 0,
    callsB: Number(r.callsB) || 0,
  };
}

export function readAiUsage(uid: number | string): AiUsage {
  return normalize(readScoped<unknown>(uid, AI_USAGE_NAME, null));
}

/** 记一次真实消耗，并广播事件让输入框 / 个人中心的进度条同步刷新 */
export function addAiUsage(uid: number | string, key: ModelKey, tokens: number): AiUsage {
  const cur = readAiUsage(uid);
  const t = Math.max(0, Math.round(tokens));
  const next: AiUsage =
    key === 'A'
      ? { ...cur, A: cur.A + t, callsA: cur.callsA + 1 }
      : { ...cur, B: cur.B + t, callsB: cur.callsB + 1 };
  writeScoped(uid, AI_USAGE_NAME, next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_USAGE_EVENT));
  }
  return next;
}

export function usagePercent(u: AiUsage, key: ModelKey): number {
  return Math.min(100, Math.round((u[key] / DAILY_BUDGET[key]) * 100));
}

/** 组件订阅：输入框、模型选择、个人中心共用同一份数据 */
export function useAiUsage() {
  const { user } = usePro();
  const uid = user?.id ?? 'guest';
  const [usage, setUsage] = useState<AiUsage>(emptyUsage);

  useEffect(() => {
    const sync = () => setUsage(readAiUsage(uid));
    sync();
    window.addEventListener(AI_USAGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AI_USAGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [uid]);

  const record = useCallback(
    (key: ModelKey, tokens: number) => setUsage(addAiUsage(uid, key, tokens)),
    [uid],
  );

  return { usage, record, uid };
}

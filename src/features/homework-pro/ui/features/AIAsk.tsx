'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, ShieldCheck, MessagesSquare, Gauge, Zap } from 'lucide-react';
import { usePro } from '../../hooks/ProContext';
import {
  useAiUsage, DAILY_BUDGET, USAGE_PROMO, USAGE_PROMO_DETAIL, usagePercent, type ModelKey,
} from '../../hooks/useAiUsage';
import { readSessions } from '../../hooks/useAiChat';

/** 面向用户只出现「模型 A / 模型 B」，真实模型名不出现在任何文案里 */
export const MODEL_META: Record<ModelKey, {
  name: string;
  tag: string;
  quality: string;
  speed: string;
  cost: string;
  icon: typeof Gauge;
}> = {
  A: { name: '模型 A', tag: '质量优先', quality: '质量高', speed: '速度较慢', cost: '用量较高', icon: Gauge },
  B: { name: '模型 B', tag: '速度优先', quality: '质量较低', speed: '速度快', cost: '用量较低', icon: Zap },
};

export const MODEL_STORAGE_KEY = 'hwAskModel';
export const DEEP_STORAGE_KEY = 'hwAskDeep';
/** 首页带到聊天页的第一条问题；聊天页读完即删 */
export const AI_PENDING_KEY = 'hwAskPending';

/**
 * 快捷工具下方的 AI 问答入口。
 * 发送后不再开浮层，而是跳到独立页面 /homework/pro/ai（左右两栏、多会话）。
 */
export function AIAskDock() {
  const router = useRouter();
  const { user, settings } = usePro();
  const uid = user?.id ?? 'guest';
  const [text, setText] = useState('');
  const [model, setModel] = useState<ModelKey>('A');
  const [deep, setDeep] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const { usage } = useAiUsage();

  const refresh = useCallback(() => {
    setSessionCount(readSessions(uid).length);
  }, [uid]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_STORAGE_KEY);
      if (saved === 'A' || saved === 'B') setModel(saved);
      setDeep(localStorage.getItem(DEEP_STORAGE_KEY) === '1');
    } catch { /* 隐私模式忽略 */ }
    refresh();
  }, [refresh]);

  // 从聊天页返回时刷新会话数
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const goChat = (pending?: { text: string; model: ModelKey; deep: boolean }) => {
    try {
      if (pending) sessionStorage.setItem(AI_PENDING_KEY, JSON.stringify(pending));
      else sessionStorage.removeItem(AI_PENDING_KEY);
    } catch { /* 忽略 */ }
    router.push('/homework/pro/ai');
  };

  const pickModel = (key: ModelKey) => {
    setModel(key);
    try { localStorage.setItem(MODEL_STORAGE_KEY, key); } catch { /* 忽略 */ }
  };
  const toggleDeep = (v: boolean) => {
    setDeep(v);
    try { localStorage.setItem(DEEP_STORAGE_KEY, v ? '1' : '0'); } catch { /* 忽略 */ }
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    goChat({ text: t, model, deep });
    setText('');
  };

  const profileText = [settings.grade || '未设学段', (settings.weakSubjects ?? []).length
    ? `薄弱项 ${(settings.weakSubjects ?? []).join('/')}` : '未设薄弱项'].join(' · ');

  return (
    <section className="hw-panel p-3 hw-ask-dock">
      <div className="flex items-center justify-between gap-2">
        <p className="hw-eyebrow flex items-center gap-1.5">
          <Sparkles size={13} /> AI 问答
        </p>
        <span className="hw-ai-badge">学习专用</span>
      </div>

      {/* 进入独立聊天页：左侧会话列表、右侧消息 */}
      <button type="button" className="hw-btn mt-2 w-full justify-center" onClick={() => goChat()}>
        <MessagesSquare size={14} /> 进入 AI 聊天{sessionCount ? ` · ${sessionCount} 个会话` : ''}
      </button>

      <textarea
        className="hw-input hw-ask-input"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); send(); }
        }}
        placeholder={'把不会的作业题、知识点或算式写在这里…\n例如：1+1 等于几？这道二次函数题怎么求顶点？'}
        aria-label="AI 问答输入框"
      />

      <p className="hw-eyebrow mt-2.5">选择模型 · 下方为各自的消耗情况</p>
      <div className="hw-ask-models mt-1.5">
        {(['A', 'B'] as ModelKey[]).map((key) => {
          const m = MODEL_META[key];
          const Icon = m.icon;
          const cardPct = usagePercent(usage, key);
          const active = model === key;
          return (
            <button
              key={key}
              type="button"
              className="hw-ask-model"
              data-active={active ? 'true' : undefined}
              onClick={() => pickModel(key)}
              aria-pressed={active}
            >
              <span className="flex items-center justify-between gap-1.5">
                <span className="hw-title flex items-center gap-1 text-sm"><Icon size={13} /> {m.name}</span>
                <span className="hw-ai-pill">{m.tag}</span>
              </span>
              <span className="hw-label block">{m.quality} · {m.speed} · {m.cost}</span>
              <span className="hw-ask-bar" aria-hidden="true">
                <i style={{ width: `${cardPct}%` }} data-key={key} />
              </span>
              <span className="hw-label hw-num block">
                今日 {usage[key].toLocaleString()} / {DAILY_BUDGET[key].toLocaleString()} tokens · {cardPct}%
              </span>
            </button>
          );
        })}
      </div>

      <div className="hw-ask-promo mt-2">
        <Sparkles size={11} />
        <span>
          {USAGE_PROMO}
          <span className="hw-label block font-normal">{USAGE_PROMO_DETAIL}</span>
        </span>
      </div>

      <label className="hw-ask-deep">
        <input type="checkbox" checked={deep} onChange={(e) => toggleDeep(e.target.checked)} />
        <span className="hw-title text-sm">深度分析</span>
        <span className="hw-label">结合{profileText}，讲得更细并给巩固建议</span>
      </label>

      <button type="button" className="hw-btn mt-2.5 w-full justify-center"
        data-variant="primary" disabled={!text.trim()} onClick={send}>
        <Send size={14} /> 发送问题
      </button>
      <p className="hw-label mt-1.5 flex items-start gap-1">
        <ShieldCheck size={11} className="mt-0.5 shrink-0" />
        发送前经过平台审核，只解答学习相关问题；Ctrl + Enter 也可发送。
      </p>
    </section>
  );
}

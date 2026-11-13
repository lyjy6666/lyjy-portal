'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Send, Sparkles, X, ArrowLeft, ShieldCheck, Loader2, AlertTriangle,
  RotateCcw, MessagesSquare, Trash2, Gauge, Zap,
} from 'lucide-react';
import { usePro } from '../../hooks/ProContext';
import { useAiUsage, DAILY_BUDGET, usagePercent, type ModelKey } from '../../hooks/useAiUsage';
import { readChat, writeChat, clearChat, type ChatMsg, type ChatPhase } from '../../hooks/useAiChat';
import { MarkdownView } from './MarkdownView';

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

const MODEL_STORAGE_KEY = 'hwAskModel';
const DEEP_STORAGE_KEY = 'hwAskDeep';

type Pending = { id: number; text: string; model: ModelKey; deep: boolean };

/* ==================================================================== */
/* 快捷工具下方：大输入框 + 下拉选模型 + 回聊入口                        */
/* ==================================================================== */
export function AIAskDock() {
  const { user, settings } = usePro();
  const uid = user?.id ?? 'guest';
  const [text, setText] = useState('');
  const [model, setModel] = useState<ModelKey>('A');
  const [deep, setDeep] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const { usage, record } = useAiUsage();

  const refreshHistory = useCallback(() => {
    setHistoryCount(readChat(uid).length);
  }, [uid]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_STORAGE_KEY);
      if (saved === 'A' || saved === 'B') setModel(saved);
      setDeep(localStorage.getItem(DEEP_STORAGE_KEY) === '1');
    } catch { /* 隐私模式忽略 */ }
    refreshHistory();
  }, [refreshHistory]);

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
    setPending({ id: Date.now(), text: t, model, deep });
    setChatOpen(true);
    setText('');
  };

  const closeChat = () => {
    setChatOpen(false);
    setPending(null);
    refreshHistory();
  };

  const profileText = [settings.grade || '未设学段', (settings.weakSubjects ?? []).length
    ? `薄弱项 ${(settings.weakSubjects ?? []).join('/')}` : '未设薄弱项'].join(' · ');

  return (
    <>
      <section className="hw-panel p-3 hw-ask-dock">
        <div className="flex items-center justify-between gap-2">
          <p className="hw-eyebrow flex items-center gap-1.5">
            <Sparkles size={13} /> AI 问答
          </p>
          <span className="hw-ai-badge">学习专用</span>
        </div>

        {/* 首页入口：关掉对话后随时回来，历史记录还在 */}
        {historyCount > 0 && (
          <button type="button" className="hw-btn mt-2 w-full justify-center"
            onClick={() => { setPending(null); setChatOpen(true); }}>
            <MessagesSquare size={14} /> 回到 AI 聊天 · {historyCount} 条记录
          </button>
        )}

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

        {/* 模型选择：两张卡片平铺，各自带今日消耗进度条 */}
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

      {chatOpen && typeof document !== 'undefined' && createPortal(
        <AIAskChat
          uid={uid}
          pending={pending}
          defaultModel={model}
          defaultDeep={deep}
          grade={settings.grade || ''}
          weak={settings.weakSubjects ?? []}
          usage={usage}
          onUsage={record}
          onClose={closeChat}
        />,
        document.body,
      )}
    </>
  );
}

/* ==================================================================== */
/* 发送后的新界面：审核中 → 深度思考中 → Markdown 回答 / 失败原因         */
/* ==================================================================== */
function AIAskChat({
  uid, pending, defaultModel, defaultDeep, grade, weak, usage, onUsage, onClose,
}: {
  uid: number | string;
  pending: Pending | null;
  defaultModel: ModelKey;
  defaultDeep: boolean;
  grade: string;
  weak: string[];
  usage: ReturnType<typeof useAiUsage>['usage'];
  onUsage: (key: ModelKey, tokens: number) => void;
  onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => readChat(uid));
  const [model, setModel] = useState<ModelKey>(pending?.model ?? defaultModel);
  const [deep, setDeep] = useState(pending?.deep ?? defaultDeep);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const idRef = useRef(msgs.reduce((max, m) => Math.max(max, m.id), 0));
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgsRef = useRef<ChatMsg[]>([]);

  useEffect(() => { msgsRef.current = msgs; }, [msgs]);
  // 聊天记录落盘：只写已结束的消息，关闭界面不丢
  useEffect(() => { writeChat(uid, msgs); }, [uid, msgs]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const ask = useCallback(async (text: string, key: ModelKey, useDeep: boolean) => {
    const mid = ++idRef.current;
    setMsgs((prev) => [...prev, { id: mid, role: 'user', text, phase: 'reviewing', model: key, deep: useDeep }]);
    setBusy(true);

    const history = msgsRef.current
      .filter((m) => m.phase === 'done' && m.text)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const res = await fetch('/api/homework/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model: key, history, grade, weakSubjects: weak, deep: useDeep }),
      });
      if (!res.ok || !res.body) throw new Error('bad response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let gotAnswer = false;

      const handle = (line: string) => {
        if (!line.trim()) return;
        let ev: Record<string, unknown>;
        try { ev = JSON.parse(line); } catch { return; }

        if (ev.stage === 'review') {
          if (ev.ok) {
            setMsgs((prev) => prev.map((m) => (m.id === mid ? { ...m, phase: 'thinking' } : m)));
          } else {
            setMsgs((prev) => prev.map((m) =>
              m.id === mid ? { ...m, phase: 'failed', reason: String(ev.reason || '审核未通过') } : m,
            ));
          }
        } else if (ev.stage === 'answer') {
          gotAnswer = true;
          const answer = String(ev.text || '');
          setMsgs((prev) => [
            ...prev.map((m) => (m.id === mid ? { ...m, phase: 'done' as ChatPhase } : m)),
            { id: ++idRef.current, role: 'assistant', text: answer, phase: 'done', model: key, deep: useDeep },
          ]);
        } else if (ev.stage === 'usage') {
          onUsage(key, Number(ev.total_tokens) || 0);
        } else if (ev.stage === 'error') {
          const reason = String(ev.reason || '服务异常，请稍后重试。');
          setMsgs((prev) => [
            ...prev.map((m) => (m.id === mid ? { ...m, phase: 'failed' as ChatPhase, reason } : m)),
            { id: ++idRef.current, role: 'assistant', text: reason, phase: 'failed', reason },
          ]);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach(handle);
      }
      if (buffer.trim()) handle(buffer);

      if (!gotAnswer) {
        setMsgs((prev) => prev.map((m) =>
          m.id === mid && (m.phase === 'reviewing' || m.phase === 'thinking')
            ? { ...m, phase: 'failed', reason: '未收到回答，请稍后重试。' }
            : m,
        ));
      }
    } catch {
      setMsgs((prev) => prev.map((m) =>
        m.id === mid ? { ...m, phase: 'failed', reason: '网络异常，请稍后重试。' } : m,
      ));
    } finally {
      setBusy(false);
    }
  }, [grade, weak, onUsage]);

  useEffect(() => {
    if (startedRef.current || !pending) return;
    startedRef.current = true;
    void ask(pending.text, pending.model, pending.deep);
  }, [ask, pending]);

  const submit = () => {
    const t = draft.trim();
    if (!t || busy) return;
    setDraft('');
    void ask(t, model, deep);
  };

  return (
    <div className="hw-ask-chat" role="dialog" aria-modal="true" aria-label="AI 问答对话">
      <header className="hw-ask-chat-head">
        <button type="button" className="hw-btn" onClick={onClose} aria-label="返回工作台">
          <ArrowLeft size={15} /> 返回
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="hw-title flex items-center justify-center gap-1.5 text-base">
            <Sparkles size={15} /> AI 问答
          </p>
          <p className="hw-label">聊天记录自动保留 · {grade || '未设学段'}{weak.length ? ` · 薄弱项 ${weak.join('/')}` : ''}</p>
        </div>
        <button type="button" className="hw-btn" aria-label="清空聊天记录"
          onClick={() => { clearChat(uid); setMsgs([]); }}>
          <Trash2 size={15} />
        </button>
        <button type="button" className="hw-btn" onClick={onClose} aria-label="关闭对话">
          <X size={15} />
        </button>
      </header>

      <div className="hw-ask-chat-body hw-scroll">
        {msgs.length === 0 && (
          <p className="hw-label text-center">还没有对话，回到工作台输入一个问题开始吧。</p>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`hw-ask-msg ${m.role === 'user' ? 'is-user' : 'is-ai'}`}>
            <div className="hw-ask-bubble">
              {m.role === 'assistant' && m.phase === 'done'
                ? <MarkdownView text={m.text} />
                : <span>{m.text}</span>}
            </div>
            {m.role === 'user' && m.phase && (
              <div className="hw-ask-status" data-tone={m.phase}>
                {m.phase === 'reviewing' && <><Loader2 size={12} className="hw-ask-spin" /> 平台审核中</>}
                {m.phase === 'thinking' && <><Loader2 size={12} className="hw-ask-spin" /> AI 深度思考中</>}
                {m.phase === 'done' && <><ShieldCheck size={12} /> 审核通过{m.deep ? ' · 深度分析' : ''}</>}
                {m.phase === 'failed' && (
                  <><AlertTriangle size={12} /> 审核未通过{m.reason ? `：${m.reason}` : ''}</>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <footer className="hw-ask-chat-foot">
        <div className="hw-ask-model-switch">
          {(['A', 'B'] as ModelKey[]).map((k) => (
            <button key={k} type="button" className="hw-chip"
              data-active={model === k ? 'true' : undefined}
              onClick={() => setModel(k)}
              title={`${MODEL_META[k].quality} · ${MODEL_META[k].speed} · ${MODEL_META[k].cost}`}>
              {MODEL_META[k].name} · 今日 {usagePercent(usage, k)}%
            </button>
          ))}
          <label className="hw-ask-deep hw-ask-deep-sm">
            <input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} />
            <span className="hw-label">深度分析</span>
          </label>
          <span className="hw-label hw-num">A {usage.A.toLocaleString()} / B {usage.B.toLocaleString()} tokens</span>
        </div>
        <div className="flex items-end gap-2">
          <textarea className="hw-input hw-ask-reply" rows={2} value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submit(); }
            }}
            placeholder={busy ? '正在等待回答…' : '继续追问，Ctrl + Enter 发送'} aria-label="继续追问" />
          <button type="button" className="hw-btn shrink-0" data-variant="primary"
            disabled={!draft.trim() || busy} onClick={submit} aria-label="发送">
            {busy ? <Loader2 size={15} className="hw-ask-spin" /> : <Send size={15} />}
          </button>
        </div>
        {msgs.some((m) => m.phase === 'failed') && (
          <button type="button" className="hw-btn mt-2 w-full justify-center"
            onClick={() => {
              const last = [...msgs].reverse().find((m) => m.role === 'user');
              if (last) void ask(last.text, model, deep);
            }}>
            <RotateCcw size={13} /> 修改后重新发送上一条
          </button>
        )}
      </footer>
    </div>
  );
}

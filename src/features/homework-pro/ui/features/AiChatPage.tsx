'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Send, Sparkles, ShieldCheck, Loader2, AlertTriangle,
  MessagesSquare, Plus, Trash2, RotateCcw,
} from 'lucide-react';
import { ProProvider, usePro } from '../../hooks/ProContext';
import { SkinProvider } from '../../skins/skin';
import {
  useAiUsage, DAILY_BUDGET, USAGE_PROMO, USAGE_PROMO_DETAIL, usagePercent, type ModelKey,
} from '../../hooks/useAiUsage';
import {
  readSessions, writeSessions, readActiveId, writeActiveId, createSession,
  updateSessionMsgs, deleteSession, type ChatMsg, type ChatSession, type ChatPhase,
} from '../../hooks/useAiChat';
import { MODEL_META, DEEP_STORAGE_KEY, AI_PENDING_KEY } from './AIAsk';
import { MarkdownView } from './MarkdownView';

/** 独立路由 /homework/pro/ai：自己包一层 Provider，避免依赖工作台的 Shell */
export default function AiChatApp() {
  return (
    <ProProvider>
      <WithSkin />
    </ProProvider>
  );
}

function WithSkin() {
  const { user } = usePro();
  return (
    <SkinProvider uid={user?.id ?? 'guest'}>
      <AiChatPage />
    </SkinProvider>
  );
}

function AiChatPage() {
  const router = useRouter();
  const { user, settings } = usePro();
  const uid = user?.id ?? 'guest';
  const { usage, record } = useAiUsage();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState('');
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [model, setModel] = useState<ModelKey>('A');
  const [deep, setDeep] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const idRef = useRef(0);
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgsRef = useRef<ChatMsg[]>([]);
  const activeIdRef = useRef('');
  const readyRef = useRef(false);

  useEffect(() => { msgsRef.current = msgs; }, [msgs]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs]);

  // 初始化：读出会话列表，选中上次那条；没有就建一条
  useEffect(() => {
    let list = readSessions(uid);
    let id = readActiveId(uid);
    if (!id || !list.some((s) => s.id === id)) {
      if (list.length) {
        id = list[list.length - 1].id;
      } else {
        const fresh = createSession(uid);
        list = readSessions(uid);
        id = fresh.id;
      }
    }
    setSessions(list);
    setActiveId(id);
    activeIdRef.current = id;
    writeActiveId(uid, id);
    const target = list.find((s) => s.id === id);
    setMsgs(target?.msgs ?? []);
    idRef.current = (target?.msgs ?? []).reduce((max, m) => Math.max(max, m.id), 0);
    try { setDeep(localStorage.getItem(DEEP_STORAGE_KEY) === '1'); } catch { /* 忽略 */ }
    readyRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // 消息变化时把当前会话落盘（只写已结束的消息）
  useEffect(() => {
    if (!readyRef.current || !activeId) return;
    setSessions(updateSessionMsgs(uid, activeId, msgs));
  }, [uid, activeId, msgs]);

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
        body: JSON.stringify({
          text, model: key, history,
          grade: settings.grade || '',
          weakSubjects: settings.weakSubjects ?? [],
          deep: useDeep,
        }),
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
          setMsgs((prev) => [
            ...prev.map((m) => (m.id === mid ? { ...m, phase: 'done' as ChatPhase } : m)),
            { id: ++idRef.current, role: 'assistant', text: String(ev.text || ''), phase: 'done', model: key, deep: useDeep },
          ]);
        } else if (ev.stage === 'usage') {
          record(key, Number(ev.total_tokens) || 0);
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
  }, [record, settings.grade, settings.weakSubjects]);

  // 从首页带过来的第一条问题：新建会话后自动发送，读完即删
  useEffect(() => {
    if (startedRef.current || !activeId) return;
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(AI_PENDING_KEY); } catch { /* 忽略 */ }
    if (!raw) { startedRef.current = true; return; }
    startedRef.current = true;
    try {
      const p = JSON.parse(raw) as { text: string; model: ModelKey; deep: boolean };
      if (!p.text) return;
      const fresh = createSession(uid);
      setSessions(readSessions(uid));
      setActiveId(fresh.id);
      activeIdRef.current = fresh.id;
      setMsgs([]);
      idRef.current = 0;
      setModel(p.model);
      setDeep(Boolean(p.deep));
      void ask(p.text, p.model, Boolean(p.deep));
    } finally {
      try { sessionStorage.removeItem(AI_PENDING_KEY); } catch { /* 忽略 */ }
    }
  }, [activeId, uid, ask]);

  const selectSession = (id: string) => {
    if (busy || id === activeId) return;
    const s = sessions.find((x) => x.id === id);
    setActiveId(id);
    writeActiveId(uid, id);
    setMsgs(s?.msgs ?? []);
    idRef.current = (s?.msgs ?? []).reduce((max, m) => Math.max(max, m.id), 0);
  };

  const newSession = () => {
    if (busy) return;
    const s = createSession(uid);
    setSessions(readSessions(uid));
    setActiveId(s.id);
    writeActiveId(uid, s.id);
    setMsgs([]);
    idRef.current = 0;
  };

  const removeSession = (id: string) => {
    if (busy) return;
    let list = deleteSession(uid, id);
    if (!list.length) {
      const s = createSession(uid);
      list = readSessions(uid);
      setActiveId(s.id);
      writeActiveId(uid, s.id);
      setMsgs([]);
      idRef.current = 0;
    } else if (id === activeId) {
      const next = list[list.length - 1];
      setActiveId(next.id);
      writeActiveId(uid, next.id);
      setMsgs(next.msgs);
      idRef.current = next.msgs.reduce((max, m) => Math.max(max, m.id), 0);
    }
    setSessions(list);
  };

  const submit = () => {
    const t = draft.trim();
    if (!t || busy) return;
    setDraft('');
    void ask(t, model, deep);
  };

  return (
    <div className="hw-ai-page" role="dialog" aria-modal="true" aria-label="AI 问答">
      <header className="hw-ai-page-head">
        <p className="hw-title flex items-center gap-2 text-base">
          <Sparkles size={16} /> AI 问答
          <span className="hw-label">· {settings.grade || '未设学段'}{(settings.weakSubjects ?? []).length ? ` · 薄弱项 ${(settings.weakSubjects ?? []).join('/')}` : ''}</span>
        </p>
        {/* 只留一个关闭按钮，不再同时出现「返回」和「叉叉」 */}
        <button type="button" className="hw-btn" aria-label="关闭并返回 Pro 版"
          onClick={() => router.push('/homework/pro')}>
          <X size={16} />
        </button>
      </header>

      <div className="hw-ai-split">
        {/* 左栏：聊天记录选择 */}
        <aside className="hw-ai-sessions">
          <button type="button" className="hw-btn w-full justify-center" data-variant="primary"
            onClick={newSession} disabled={busy}>
            <Plus size={14} /> 新建对话
          </button>
          <p className="hw-eyebrow mt-3">聊天记录 · {sessions.length} 个会话</p>
          <div className="hw-ai-session-list hw-scroll">
            {sessions.slice().reverse().map((s) => (
              <div key={s.id} className="hw-ai-session" data-active={s.id === activeId ? 'true' : undefined}>
                <button type="button" className="hw-ai-session-main" onClick={() => selectSession(s.id)}>
                  <MessagesSquare size={13} />
                  <span className="min-w-0 flex-1 truncate text-left">{s.title}</span>
                </button>
                <button type="button" className="hw-ai-session-del" aria-label={`删除会话 ${s.title}`}
                  onClick={() => removeSession(s.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="hw-ask-promo mt-2">
            <Sparkles size={11} />
            <span>
              {USAGE_PROMO}
              <span className="hw-label block font-normal">{USAGE_PROMO_DETAIL}</span>
            </span>
          </div>
        </aside>

        {/* 右栏：当前会话的聊天记录 */}
        <main className="hw-ai-conv">
          <div className="hw-ask-chat-body hw-scroll">
            {msgs.length === 0 && (
              <p className="hw-label text-center">这个会话还没有消息，在下面输入问题开始吧。</p>
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
                  data-active={model === k ? 'true' : undefined} onClick={() => setModel(k)}
                  title={`${MODEL_META[k].quality} · ${MODEL_META[k].speed} · ${MODEL_META[k].cost}`}>
                  {MODEL_META[k].name} · 今日 {usagePercent(usage, k)}%
                </button>
              ))}
              <label className="hw-ask-deep hw-ask-deep-sm">
                <input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} />
                <span className="hw-label">深度分析</span>
              </label>
              <span className="hw-label hw-num">
                A {usage.A.toLocaleString()} / B {usage.B.toLocaleString()} · 今日上限 {DAILY_BUDGET.A.toLocaleString()} / {DAILY_BUDGET.B.toLocaleString()} tokens
              </span>
            </div>
            <div className="flex items-end gap-2">
              <textarea className="hw-input hw-ask-reply" rows={2} value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submit(); }
                }}
                placeholder={busy ? '正在等待回答…' : '输入问题，Ctrl + Enter 发送'} aria-label="输入问题" />
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
        </main>
      </div>
    </div>
  );
}

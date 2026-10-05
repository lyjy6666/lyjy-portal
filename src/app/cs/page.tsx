'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMarkdown from '@/components/ChatMarkdown';
import {
  CS_AGENTS,
  DEFAULT_AGENT_ID,
  getAgent,
  type CsAgentId,
} from '@/data/csAgents';

/** 后端在正文末尾追加的「建议转接」标记，前端解析后转成按钮 */
const SUGGEST_RE = /<<<CS_SUGGEST:([a-z]+)>>>/;
/** 后端撞到 max_tokens 时追加的标记，前端转成「继续生成」按钮 */
const TRUNCATED_RE = /<<<CS_TRUNCATED>>>/;
/** 流式过程中可能出现半截标记，先抹掉 */
const stripSuggest = (t: string) =>
  t.replace(SUGGEST_RE, '').replace(TRUNCATED_RE, '').replace(/<<<CS_[A-Z_]*$/, '');

/** 人机验证状态存在本地：验证过一次就长期有效 */
const VERIFIED_KEY = 'cs_verified';

/** 隐藏通道：连点专员头像 5 次后输入密码解锁 */
const DEV_KEY_STORAGE = 'cs_dev_key';
const DEV_CLICKS_NEEDED = 5;
const DEV_CLICK_WINDOW = 2500;

interface Message {
  role: 'user' | 'assistant' | 'notice';
  content: string;
  /** 回复这条消息的专员（仅 assistant 有） */
  agentId?: CsAgentId;
  /** 专员建议切换到谁（仅 assistant 有） */
  suggest?: CsAgentId;
  /** 这条回复是否被输出长度截断（可点「继续生成」） */
  truncated?: boolean;
}

// 滑块验证组件
function SliderCaptcha({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [verified, setVerified] = useState(false);
  const [failed, setFailed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const MAX_OFFSET = 258; // 轨道宽度 - 滑块宽度

  const handleStart = (clientX: number) => {
    if (verified) return;
    setDragging(true);
    setFailed(false);
    startXRef.current = clientX - offsetX;
  };

  const handleMove = (clientX: number) => {
    if (!dragging || verified) return;
    let x = clientX - startXRef.current;
    if (x < 0) x = 0;
    if (x > MAX_OFFSET) x = MAX_OFFSET;
    setOffsetX(x);
  };

  const handleEnd = () => {
    if (!dragging || verified) return;
    setDragging(false);

    if (offsetX >= MAX_OFFSET - 3) {
      // 验证成功
      setVerified(true);
      setTimeout(() => {
        onSuccess();
      }, 600);
    } else {
      // 验证失败，回弹
      setFailed(true);
      setTimeout(() => {
        setOffsetX(0);
        setFailed(false);
      }, 400);
    }
  };

  // 鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, offsetX]);

  // 触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  useEffect(() => {
    if (!dragging) return;
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging, offsetX]);

  const progress = (offsetX / MAX_OFFSET) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={verified ? undefined : onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 rounded-2xl p-6 shadow-2xl border border-white/10 w-[340px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <i className="fa-solid fa-shield-halved text-blue-400"></i>
            安全验证
          </h3>
          {!verified && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <p className="text-slate-400 text-xs mb-4">
          请拖动滑块完成验证。验证通过后长期有效，无需重复验证
        </p>

        {/* 滑块轨道 */}
        <div
          ref={trackRef}
          className="relative h-11 bg-slate-800 rounded-lg overflow-hidden border border-white/5"
        >
          {/* 进度条背景 */}
          <div
            className={`absolute inset-y-0 left-0 rounded-l-lg transition-none ${
              verified ? 'bg-green-500/30' : failed ? 'bg-red-500/30' : 'bg-blue-500/20'
            }`}
            style={{ width: `${progress}%` }}
          />

          {/* 提示文字 */}
          {!dragging && !verified && !failed && offsetX === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs select-none">
              向右拖动滑块完成验证
            </div>
          )}
          {verified && (
            <div className="absolute inset-0 flex items-center justify-center text-green-400 text-xs font-medium select-none gap-1.5">
              <i className="fa-solid fa-circle-check"></i>
              验证通过
            </div>
          )}
          {failed && (
            <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs select-none gap-1.5">
              <i className="fa-solid fa-circle-xmark"></i>
              验证失败，请重试
            </div>
          )}

          {/* 滑块按钮 */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`absolute top-0 left-0 h-11 w-11 flex items-center justify-center cursor-grab select-none shadow-lg ${
              verified
                ? 'bg-green-500 cursor-default'
                : failed
                ? 'bg-red-500'
                : 'bg-gradient-to-br from-blue-500 to-purple-600 active:cursor-grabbing'
            }`}
            style={{ transform: `translateX(${offsetX}px)`, transition: dragging ? 'none' : 'all 0.3s ease' }}
          >
            <i className={`fa-solid ${verified ? 'fa-check' : 'fa-arrow-right'} text-white text-sm`}></i>
          </div>
        </div>

        <p className="text-slate-600 text-[11px] text-center mt-3">
          验证通过后不再需要重复验证
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function CustomerServicePage() {
  const [agentId, setAgentId] = useState<CsAgentId>(DEFAULT_AGENT_ID);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const agent = getAgent(agentId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  /** 是否已通过人机验证（通过后长期有效，除非检测到敏感提问） */
  const [verified, setVerified] = useState(false);

  // 隐藏通道（开发者模式）
  const [devKey, setDevKey] = useState('');
  const [showDevPrompt, setShowDevPrompt] = useState(false);
  const [devInput, setDevInput] = useState('');
  const [devError, setDevError] = useState('');
  const devClicks = useRef<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 初始化：URL 上的 ?agent= 参数优先，用于从子站直接带专员进来
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('agent');
    const initial = getAgent(fromUrl);
    setAgentId(initial.id);
    setMessages([{ role: 'assistant', content: initial.greeting, agentId: initial.id }]);
    try {
      if (localStorage.getItem(VERIFIED_KEY) === '1') setVerified(true);
      const savedDev = localStorage.getItem(DEV_KEY_STORAGE);
      if (savedDev) setDevKey(savedDev);
    } catch {
      /* 忽略 */
    }
  }, []);

  /** 连点头像 5 次（2.5 秒内）打开密码框 */
  const handleAvatarClick = () => {
    const now = Date.now();
    devClicks.current = [...devClicks.current, now].filter(t => now - t < DEV_CLICK_WINDOW);
    if (devClicks.current.length >= DEV_CLICKS_NEEDED) {
      devClicks.current = [];
      setDevInput('');
      setDevError('');
      setShowDevPrompt(true);
    }
  };

  /** 密码交给服务端校验，校验通过才记住 */
  const handleDevSubmit = async () => {
    const pwd = devInput.trim();
    if (!pwd) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cs-Dev-Key': pwd },
        body: JSON.stringify({ agentId: 'portal', messages: [{ role: 'user', content: 'ping' }] }),
      });
      if (res.headers.get('X-Cs-Dev') === '1') {
        setDevKey(pwd);
        setShowDevPrompt(false);
        try {
          localStorage.setItem(DEV_KEY_STORAGE, pwd);
        } catch {
          /* 忽略 */
        }
        setMessages(prev => [
          ...prev,
          { role: 'notice', content: '已进入开发者模式' },
          {
            role: 'assistant',
            agentId: 'portal',
            content: '开发者模式已开启 🔓\n\n现在没有子站范围限制，可以问任何问题，也能让我写代码、做技术方案。\n\n想退出的话，点右上角的「开发者模式」标签即可。',
          },
        ]);
      } else {
        setDevError('密码不对');
      }
    } catch {
      setDevError('校验失败，请重试');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, loading]);

  // 计时器
  useEffect(() => {
    if (loading && !streamingContent) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading, streamingContent]);

  // 预计剩余时间
  const estimatedRemaining = useCallback(() => {
    if (!loading) return 0;
    if (streamingContent.length === 0) return -1;
    // 上限提到 4096 token 后回答会长很多，估算基数也跟着调大，否则剩余时间会一直显示 0
    const estimatedTotal = 1200;
    const progress = Math.min(streamingContent.length / estimatedTotal, 0.9);
    if (progress <= 0 || elapsedSeconds === 0) return 0;
    const totalEstimated = elapsedSeconds / progress;
    return Math.max(0, Math.ceil(totalEstimated - elapsedSeconds));
  }, [loading, streamingContent, elapsedSeconds]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  };

  /** 切换专员：插一条分隔提示 + 新专员的自我介绍 */
  const switchAgent = (next: CsAgentId) => {
    const target = getAgent(next);
    setAgentId(target.id);
    setShowSwitcher(false);
    if (target.id === agentId) return;
    setMessages(prev => [
      ...prev,
      { role: 'notice', content: `已切换到「${target.name}」` },
      { role: 'assistant', content: target.greeting, agentId: target.id },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // 开发者模式不受人机验证限制
    if (!devKey && !verified && userMsgCount >= 3) {
      setShowCaptcha(true);
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setStreamingContent('');
    setElapsedSeconds(0);
    setUserMsgCount(c => c + 1);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(devKey ? { 'X-Cs-Dev-Key': devKey } : {}),
        },
        body: JSON.stringify({
          agentId,
          messages: newMessages
            .filter(m => m.role !== 'notice')
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '抱歉，AI服务暂时不可用，请稍后再试。',
          agentId,
        }]);
        setLoading(false);
        return;
      }

      // 检测到敏感提问 → 撤销验证，下次提问前重新验证
      const sensitive = res.headers.get('X-Cs-Sensitive') === '1';

      const reader = res.body?.getReader();
      if (!reader) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '抱歉，响应读取失败，请稍后再试。',
          agentId,
        }]);
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamingContent(stripSuggest(accumulated));
      }

      // 正文末尾可能带「建议转接」标记，拆出来单独展示
      const marker = accumulated.match(SUGGEST_RE);
      const suggest = marker && marker[1] !== agentId ? (marker[1] as CsAgentId) : undefined;
      const truncated = TRUNCATED_RE.test(accumulated);
      const content = stripSuggest(accumulated).trim();

      if (content) {
        setMessages(prev => [...prev, { role: 'assistant', content, agentId, suggest, truncated }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '抱歉，我没有理解你的问题，请换一种方式提问。',
          agentId,
        }]);
      }
      setStreamingContent('');

      if (sensitive) {
        setVerified(false);
        setUserMsgCount(0);
        try {
          localStorage.removeItem(VERIFIED_KEY);
        } catch {
          /* 忽略 */
        }
        setMessages(prev => [...prev, {
          role: 'notice',
          content: '检测到敏感提问，下次提问需要重新完成验证',
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '网络异常，请检查网络连接后重试。',
        agentId,
      }]);
      setStreamingContent('');
    } finally {
      setLoading(false);
    }
  };

  /** 被截断后接着写：把该条消息之前的历史 + 一句「继续」发过去，结果追加到同一条 */
  const handleContinue = async (msgIndex: number) => {
    if (loading) return;
    const history = messages.slice(0, msgIndex + 1).filter(m => m.role !== 'notice');
    const payload = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: '继续（接着上面断掉的地方往下写，不要重复已写过的内容）' },
    ];

    setLoading(true);
    setStreamingContent('');
    setElapsedSeconds(0);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(devKey ? { 'X-Cs-Dev-Key': devKey } : {}),
        },
        body: JSON.stringify({ agentId, messages: payload }),
      });
      if (!res.ok) return;

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamingContent(stripSuggest(accumulated));
      }

      const more = stripSuggest(accumulated).trim();
      const stillTruncated = TRUNCATED_RE.test(accumulated);
      if (more) {
        setMessages(prev =>
          prev.map((m, i) =>
            i === msgIndex ? { ...m, content: `${m.content}\n${more}`, truncated: stillTruncated } : m
          )
        );
      } else {
        setMessages(prev => prev.map((m, i) => (i === msgIndex ? { ...m, truncated: false } : m)));
      }
    } catch {
      /* 忽略，保持原样 */
    } finally {
      setStreamingContent('');
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 转人工
  const handleTransferHuman = () => {
    if (loading) return;
    const hour = new Date().getHours();
    const isWorkHour = hour >= 9 && hour < 18;
    const content = isWorkHour
      ? '⚠️ 当前人工服务繁忙，排队人数较多，请稍后再试。\n\n您也可以继续向AI客服提问，我会尽力为您解答！'
      : '⚠️ 人工服务时间为 09:00-18:00，当前已下班，请在工作时间内联系。\n\n您也可以继续向AI客服提问，我会尽力为您解答！';
    setMessages(prev => [...prev, { role: 'user', content: '转人工客服' }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content, agentId }]);
    }, 500);
  };

  // 验证成功
  const handleCaptchaSuccess = () => {
    setVerified(true);
    setUserMsgCount(0);
    setShowCaptcha(false);
    try {
      localStorage.setItem(VERIFIED_KEY, '1');
    } catch {
      /* 忽略 */
    }
  };

  const remaining = estimatedRemaining();
  const remainingMsgs = 3 - userMsgCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="flex-shrink-0 border-b border-white/10 bg-black/30 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={handleAvatarClick}
              title={devKey ? '开发者模式已开启' : undefined}
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                devKey ? 'from-amber-400 to-orange-500 ring-2 ring-amber-400/50' : agent.gradient
              } flex items-center justify-center shadow-lg flex-shrink-0 cursor-pointer select-none active:scale-95 transition-transform`}
            >
              <i className={`fa-solid ${devKey ? 'fa-unlock' : agent.icon} text-white`}></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-lg truncate flex items-center gap-2">
                {devKey ? '开发者模式' : agent.name}
                {devKey && (
                  <button
                    onClick={() => {
                      setDevKey('');
                      try {
                        localStorage.removeItem(DEV_KEY_STORAGE);
                      } catch {
                        /* 忽略 */
                      }
                      setMessages(prev => [...prev, { role: 'notice', content: '已退出开发者模式' }]);
                    }}
                    className="text-[10px] font-normal rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-amber-300 hover:bg-amber-400/20 transition-all"
                    title="点击退出开发者模式"
                  >
                    退出
                  </button>
                )}
              </h1>
              <p className="text-slate-400 text-xs truncate">
                {devKey ? 'LYJY导航系统 · 无限制通道' : `LYJY导航系统 · ${agent.shortName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowSwitcher(true)}
              className="flex items-center gap-1.5 px-3 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 text-white text-sm"
              title="切换专员"
            >
              <i className="fa-solid fa-users-gear text-xs"></i>
              <span className="hidden sm:inline">切换专员</span>
            </button>
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center text-white flex-shrink-0"
              title="返回首页"
            >
              <i className="fa-solid fa-house"></i>
            </Link>
          </div>
        </div>
      </header>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => {
              // 切换专员的系统提示
              if (msg.role === 'notice') {
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 py-1"
                  >
                    <span className="h-px flex-1 bg-white/10" />
                    <span className="text-slate-500 text-xs whitespace-nowrap">{msg.content}</span>
                    <span className="h-px flex-1 bg-white/10" />
                  </motion.div>
                );
              }

              const msgAgent = msg.role === 'assistant' ? getAgent(msg.agentId) : null;
              const suggestAgent_ = msg.suggest ? getAgent(msg.suggest) : null;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* 头像 */}
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-md ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700'
                        : `bg-gradient-to-br ${msgAgent?.gradient || 'from-purple-500 to-pink-500'}`
                    }`}>
                      <i className={`fa-solid ${msg.role === 'user' ? 'fa-user' : (msgAgent?.icon || 'fa-robot')} text-white text-sm`}></i>
                    </div>
                    <div className="min-w-0">
                      {/* 专员名 */}
                      {msgAgent && (
                        <p className="text-slate-500 text-[11px] mb-1 ml-1">{msgAgent.name}</p>
                      )}
                      {/* 消息气泡 */}
                      <div className={`rounded-2xl px-4 py-3 shadow-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm'
                          : 'bg-white/10 backdrop-blur-lg text-slate-100 border border-white/10 rounded-tl-sm'
                      }`}>
                        <ChatMarkdown text={msg.content} />
                      </div>

                      {/* 输出被截断 → 继续生成 */}
                      {msg.truncated && !loading && (
                        <button
                          onClick={() => handleContinue(i)}
                          className="mt-2 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 transition-all hover:border-amber-400/60 hover:bg-amber-500/20"
                        >
                          <i className="fa-solid fa-arrow-down-long text-[10px]"></i>
                          回答被长度限制截断，点此继续生成
                        </button>
                      )}

                      {/* 系统推荐切换专员 */}
                      {suggestAgent_ && (
                        <button
                          onClick={() => switchAgent(suggestAgent_.id)}
                          className="mt-2 w-full flex items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2.5 text-left transition-all hover:border-sky-400/60 hover:bg-sky-500/20"
                        >
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${suggestAgent_.gradient} flex items-center justify-center flex-shrink-0`}>
                            <i className={`fa-solid ${suggestAgent_.icon} text-white text-xs`}></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sky-200 text-xs font-medium">建议转接给「{suggestAgent_.name}」</p>
                            <p className="text-slate-400 text-[11px] truncate">{suggestAgent_.desc}</p>
                          </div>
                          <span className="text-sky-300 text-xs whitespace-nowrap flex items-center gap-1 rounded-full border border-sky-400/40 px-2.5 py-1">
                            转接客服
                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* 流式输出中的消息 */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[80%]">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${agent.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                  <i className={`fa-solid ${agent.icon} text-white text-sm`}></i>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg border border-white/10 min-w-[80px]">
                  {streamingContent ? (
                    <>
                      <ChatMarkdown text={streamingContent} />
                      <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse align-middle"></span>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <i className="fa-solid fa-clock text-[10px]"></i>
                          已用 {formatTime(elapsedSeconds)}
                        </span>
                        {remaining > 0 && (
                          <span className="text-slate-500 text-xs">
                            · 预计还需 {formatTime(remaining)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-slate-500 text-xs">
                        正在思考中... {formatTime(elapsedSeconds)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/30 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* AI免责声明 + 转人工 + 剩余消息数 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <p className="text-slate-500 text-xs flex items-center gap-1">
                <i className="fa-solid fa-circle-info text-[10px]"></i>
                AI回答仅供参考
              </p>
              {!devKey && !verified && remainingMsgs > 0 && remainingMsgs <= 2 && !loading && (
                <span className="text-slate-600 text-xs flex items-center gap-1">
                  <i className="fa-solid fa-shield-halved text-[10px]"></i>
                  剩余 {remainingMsgs} 条
                </span>
              )}
            </div>
            <button
              onClick={handleTransferHuman}
              disabled={loading}
              className={`text-xs flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                loading
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-blue-400 hover:bg-white/5'
              }`}
            >
              <i className="fa-solid fa-headset"></i>
              转人工
            </button>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !devKey && !verified && remainingMsgs <= 0
                    ? '请先完成安全验证...'
                    : devKey
                    ? '开发者模式 · 想聊什么都可以...'
                    : `向「${agent.shortName}」提问...`
                }
                rows={1}
                className="w-full bg-white/10 backdrop-blur-lg text-white placeholder-slate-400 rounded-2xl px-4 py-3 pr-4 resize-none outline-none border border-white/10 focus:border-blue-500/50 transition-colors text-sm max-h-32"
                style={{ minHeight: '48px' }}
                disabled={loading}
              />
            </div>
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              whileHover={{ scale: input.trim() && !loading ? 1.05 : 1 }}
              whileTap={{ scale: input.trim() && !loading ? 0.95 : 1 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                input.trim() && !loading
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg hover:shadow-blue-500/30'
                  : 'bg-slate-700/50 cursor-not-allowed'
              }`}
            >
              <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-white`}></i>
            </motion.button>
          </div>
          <p className="text-slate-500 text-xs text-center mt-2">
            按 Enter 发送 · Shift + Enter 换行
          </p>
        </div>
      </div>

      {/* 专员切换面板 */}
      <AnimatePresence>
        {showSwitcher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSwitcher(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-lg max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    <i className="fa-solid fa-users-gear text-blue-400"></i>
                    选择专属客服
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">每位专员只精通自己的子站，答得更准</p>
                </div>
                <button
                  onClick={() => setShowSwitcher(false)}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center flex-shrink-0"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="overflow-y-auto p-3 space-y-1.5">
                {CS_AGENTS.map(a => {
                  const active = a.id === agentId;
                  return (
                    <button
                      key={a.id}
                      onClick={() => switchAgent(a.id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                        active
                          ? 'bg-blue-500/15 border border-blue-400/40'
                          : 'border border-transparent hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${a.gradient} flex items-center justify-center flex-shrink-0`}>
                        <i className={`fa-solid ${a.icon} text-white text-sm`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-slate-200'}`}>
                          {a.name}
                        </p>
                        <p className="text-slate-500 text-[11px] truncate">{a.desc}</p>
                      </div>
                      {active ? (
                        <span className="text-blue-300 text-[11px] whitespace-nowrap flex items-center gap-1">
                          <i className="fa-solid fa-circle-check"></i>
                          当前
                        </span>
                      ) : (
                        <i className="fa-solid fa-chevron-right text-slate-600 text-xs"></i>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 隐藏通道密码框 */}
      <AnimatePresence>
        {showDevPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowDevPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl border border-amber-400/30 bg-slate-900 p-5 shadow-2xl"
            >
              <h3 className="text-white font-bold text-base flex items-center gap-2 mb-1">
                <i className="fa-solid fa-unlock text-amber-400"></i>
                隐藏通道
              </h3>
              <p className="text-slate-500 text-xs mb-4">输入密码以解锁无限制通道</p>
              <input
                type="password"
                value={devInput}
                autoFocus
                onChange={e => {
                  setDevInput(e.target.value);
                  setDevError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleDevSubmit();
                }}
                placeholder="密码"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/50 transition-colors"
              />
              {devError && <p className="mt-2 text-xs text-red-400">{devError}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowDevPrompt(false)}
                  className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 hover:bg-white/5 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleDevSubmit}
                  disabled={!devInput.trim()}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    devInput.trim()
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  解锁
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 人机验证弹窗 */}
      <AnimatePresence>
        {showCaptcha && (
          <SliderCaptcha
            onSuccess={handleCaptchaSuccess}
            onClose={() => setShowCaptcha(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

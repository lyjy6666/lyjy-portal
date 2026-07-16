'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
          请拖动滑块完成验证，以继续使用智能客服
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
          验证后可继续发送 3 条消息
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function CustomerServicePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是LYJY导航系统的智能客服助手 🤖\n\n你可以问我关于本网站的任何问题，比如：\n• 网站有哪些功能？\n• 作业管理系统怎么用？\n• 搜索页支持哪些搜索引擎？\n• 强力锁是什么？\n\n请问有什么可以帮你的吗？',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const estimatedTotal = 300;
    const progress = Math.min(streamingContent.length / estimatedTotal, 0.9);
    if (progress <= 0 || elapsedSeconds === 0) return 0;
    const totalEstimated = elapsedSeconds / progress;
    return Math.max(0, Math.ceil(totalEstimated - elapsedSeconds));
  }, [loading, streamingContent, elapsedSeconds]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // 检查是否需要验证
    if (userMsgCount >= 3) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '抱歉，AI服务暂时不可用，请稍后再试。',
        }]);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '抱歉，响应读取失败，请稍后再试。',
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
        setStreamingContent(accumulated);
      }

      if (accumulated.trim()) {
        setMessages(prev => [...prev, { role: 'assistant', content: accumulated.trim() }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '抱歉，我没有理解你的问题，请换一种方式提问。',
        }]);
      }
      setStreamingContent('');
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '网络异常，请检查网络连接后重试。',
      }]);
      setStreamingContent('');
    } finally {
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
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    }, 500);
  };

  // 验证成功
  const handleCaptchaSuccess = () => {
    setUserMsgCount(0);
    setShowCaptcha(false);
  };

  const remaining = estimatedRemaining();
  const remainingMsgs = 3 - userMsgCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="flex-shrink-0 border-b border-white/10 bg-black/30 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-robot text-white"></i>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">智能客服</h1>
              <p className="text-slate-400 text-xs">LYJY导航系统 · 随时为你解答</p>
            </div>
          </div>
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center text-white"
            title="返回首页"
          >
            <i className="fa-solid fa-house"></i>
          </Link>
        </div>
      </header>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
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
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    <i className={`fa-solid ${msg.role === 'user' ? 'fa-user' : 'fa-robot'} text-white text-sm`}></i>
                  </div>
                  {/* 消息气泡 */}
                  <div className={`rounded-2xl px-4 py-3 shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm'
                      : 'bg-white/10 backdrop-blur-lg text-slate-100 border border-white/10 rounded-tl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 流式输出中的消息 */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <i className="fa-solid fa-robot text-white text-sm"></i>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg border border-white/10 min-w-[80px]">
                  {streamingContent ? (
                    <>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {streamingContent}
                        <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse align-middle"></span>
                      </p>
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
              {remainingMsgs > 0 && remainingMsgs <= 2 && !loading && (
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
                placeholder={remainingMsgs <= 0 ? "请先完成安全验证..." : "输入你的问题..."}
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

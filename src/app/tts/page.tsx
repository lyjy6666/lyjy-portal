'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Upload, Music, Mic, Wand2, Layers, Clock, Loader2, ScanText, History, Trash2, RotateCcw, Crown, Lock, LogIn, LogOut, Sparkles } from 'lucide-react';
import AudioEditor from '@/components/AudioEditor';
import AuthDialog from '@/components/tts/AuthDialog';
import VipPricingDialog from '@/components/tts/VipPricingDialog';
import type { TtsUser } from '@/components/tts/types';
import { createWorker } from 'tesseract.js';

const VOICE_OPTIONS = {
  '普通话·女声': [
    { value: 'xiaoxiao', label: '晓晓（温柔亲切）' },
    { value: 'xiaoyi', label: '晓伊（甜美活泼）' },
    { value: 'xiaobei', label: '晓贝（东北口音）' },
    { value: 'xiaoni', label: '晓妮（陕西口音）' },
  ],
  '普通话·男声': [
    { value: 'yunjian', label: '云健（沉稳磁性）' },
    { value: 'yunxi', label: '云希（阳光少年）' },
    { value: 'yunxia', label: '云夏（清亮少年）' },
    { value: 'yunyang', label: '云扬（专业播报）' },
  ],
  '粤语·港澳': [
    { value: 'hiugaai', label: '曉佳（粤语女声）' },
    { value: 'hiumaan', label: '曉曼（粤语女声）' },
    { value: 'wanlung', label: '允龍（粤语男声）' },
  ],
  '台湾·繁体': [
    { value: 'hsiaochen', label: '曉臻（台湾女声）' },
    { value: 'hsiaoyu', label: '曉雨（台湾女声）' },
    { value: 'yunjhe', label: '雲哲（台湾男声）' },
  ],
};

// 示例文本常量保留，但不显示按钮

const DEFAULT_BGM_URL = 'https://coze-coding-project.tos.coze.site/create_attachment/2026-04-24/3854201856209593_f53475c6b363ecfd48d83084b8321290_7518340447241030427.mp3?sign=4899095887-c9bac5fc96-0-48d8025fe99f37f601a7f6fb369191a3e33e777c0210fa2548f752868ce3ed45';

interface HistoryItem {
  id: string;
  text: string;
  voice: string;
  voiceLabel: string;
  speechRate: number;
  createdAt: number;
}

const HISTORY_STORAGE_KEY = 'tts_history';
const MAX_HISTORY = 20;

function getVoiceLabel(voiceValue: string): string {
  for (const options of Object.values(VOICE_OPTIONS)) {
    const found = options.find((o) => o.value === voiceValue);
    if (found) return found.label;
  }
  return voiceValue;
}

function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 存储满时忽略
  }
}

function formatHistoryTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (isToday) return `今天 ${hh}:${mm}`;
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${mo}-${da} ${hh}:${mm}`;
}

export default function NewsReaderPage() {
  // 注意：原项目的人机验证跳转逻辑（useEffect 跳转到 /verify）已移除，新项目无 /verify 页面

  const [text, setText] = useState('');
  const [voice, setVoice] = useState('xiaoxiao');
  const [speechRate, setSpeechRate] = useState(0);
  const [bgmVolume, setBgmVolume] = useState(30);
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [bgmUrl, setBgmUrl] = useState(DEFAULT_BGM_URL);
  // 背景音乐总开关：默认关闭，开启后才会有声音
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAudioEditor, setShowAudioEditor] = useState(false);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [isVoiceEnded, setIsVoiceEnded] = useState(false);
  const [isBgmLoaded, setIsBgmLoaded] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLongTextMode, setIsLongTextMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // 当前 TTS 模式：'edge-tts'（高质量神经语音）| 'web-speech'（浏览器降级）| null
  const [ttsMode, setTtsMode] = useState<'edge-tts' | 'web-speech' | null>(null);

  // 登录与 VIP 状态
  const [user, setUser] = useState<TtsUser | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showVipDialog, setShowVipDialog] = useState(false);
  // 触发登录弹窗时的副标题（根据场景定制提示）
  const [authSubtitle, setAuthSubtitle] = useState('所有功能需要登录后才能使用');
  // 用于标记是否因想用某 VIP 功能而触发的登录（登录成功后自动弹 VIP 窗）
  const [pendingVipAfterLogin, setPendingVipAfterLogin] = useState(false);

  const MAX_CHARS = isLongTextMode ? 10000 : 3000;

  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioAreaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    setHistory(loadHistory());
    // 恢复登录态
    try {
      const raw = localStorage.getItem('tts_user');
      if (raw) {
        const u = JSON.parse(raw) as TtsUser;
        // 简单校验：过期则视为非 VIP
        if (u && typeof u.id === 'number') {
          if (u.vipExpiresAt) {
            const exp = new Date(u.vipExpiresAt).getTime();
            u.isVip = exp > Date.now();
          }
          setUser(u);
        }
      }
    } catch {}
    voiceAudioRef.current = new Audio();
    voiceAudioRef.current.addEventListener('ended', () => {
      setIsVoiceEnded(true);
      setCurrentTime(0);
      // 朗读结束时暂停 BGM（若未播放则 pause 无副作用）
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        setIsBgmPlaying(false);
      }
      setIsPlaying(false);
    });

    voiceAudioRef.current.addEventListener('timeupdate', () => {
      if (!isDraggingRef.current && voiceAudioRef.current) {
        setCurrentTime(voiceAudioRef.current.currentTime);
      }
    });
    voiceAudioRef.current.addEventListener('loadedmetadata', () => {
      if (voiceAudioRef.current) setDuration(voiceAudioRef.current.duration);
    });

    bgmAudioRef.current = new Audio();
    bgmAudioRef.current.loop = true;
    bgmAudioRef.current.addEventListener('canplay', () => setIsBgmLoaded(true));
    bgmAudioRef.current.addEventListener('error', () => setIsBgmLoaded(false));

    return () => {
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      if (bgmAudioRef.current) bgmAudioRef.current.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (voiceAudioRef.current) voiceAudioRef.current.volume = voiceVolume / 100;
  }, [voiceVolume]);

  useEffect(() => {
    if (bgmAudioRef.current) bgmAudioRef.current.volume = bgmVolume / 100;
  }, [bgmVolume]);

  useEffect(() => {
    if (bgmAudioRef.current && bgmUrl) {
      bgmAudioRef.current.src = bgmUrl;
      setIsBgmLoaded(false);
    }
  }, [bgmUrl]);

  // BGM 总开关：关闭时立即停止 BGM 播放并清空状态
  useEffect(() => {
    if (!bgmEnabled && bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current.currentTime = 0;
      setIsBgmPlaying(false);
    }
  }, [bgmEnabled]);

  useEffect(() => {
    if (showAlert && audioAreaRef.current) {
      audioAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showAlert]);

  // ============ 登录 / VIP 门控辅助 ============

  // 触发登录弹窗（可定制副标题）
  const requireLogin = (subtitle = '所有功能需要登录后才能使用') => {
    setAuthSubtitle(subtitle);
    setShowAuthDialog(true);
  };

  // 登录成功回调
  const handleAuthSuccess = (u: TtsUser) => {
    setUser(u);
    setShowAuthDialog(false);
    // 若是因 VIP 功能触发的登录，登录成功后自动弹 VIP 窗
    if (pendingVipAfterLogin) {
      setPendingVipAfterLogin(false);
      setShowVipDialog(true);
    }
  };

  // 退出登录
  const handleLogout = () => {
    setUser(null);
    try { localStorage.removeItem('tts_user'); } catch {}
    stopBgmIfAny();
  };

  // 停止 BGM（辅助）
  const stopBgmIfAny = () => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      setIsBgmPlaying(false);
    }
  };

  // 检查 VIP 功能：内测期间，所有登录用户均可使用全部功能
  const requireVip = (): boolean => {
    if (!user) {
      setPendingVipAfterLogin(true);
      requireLogin('内测期间，登录即可免费使用全部功能');
      return false;
    }
    // 内测期间，登录用户直接放行（不再校验 VIP 状态）
    return true;
  };

  // 更新用户状态（VIP 试用激活后）
  const handleUserUpdate = (u: TtsUser) => {
    setUser(u);
  };

  const handleOcr = async (file: File) => {
    // 图片识别：内测期间登录即可使用
    if (!requireVip()) return;
    setIsOcrProcessing(true);
    setError(null);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      const base64Image = await base64Promise;
      setOcrPreview(base64Image);

      // 使用 Tesseract.js 在前端做 OCR，不依赖后端 API
      // 使用 jsdelivr CDN 加载语言文件（tessdata.projectnaptha.com 国内无法访问）
      const worker = await createWorker(['chi_sim', 'eng'], 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7',
        langPath: 'https://cdn.jsdelivr.net/gh/naptha/tessdata_fast@gh-pages/4.0.0',
        logger: () => {},
      });
      const { data: { text } } = await worker.recognize(base64Image);
      await worker.terminate();

      const ocrText = text.trim();
      if (ocrText) {
        if (ocrText.length <= MAX_CHARS) {
          setText(ocrText);
        } else {
          setText(ocrText.slice(0, MAX_CHARS));
        }
      } else {
        setError('未识别到文字，请上传更清晰的图片');
      }
    } catch {
      setError('图片识别失败，请重试');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('请输入要朗读的文本');
      return;
    }
    // 生成语音需要登录
    if (!user) {
      requireLogin('登录后才能生成语音');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVoiceUrl(null);
    setIsPlaying(false);
    setIsBgmPlaying(false);
    setIsVoiceEnded(false);
    setShowAlert(false);
    setCurrentTime(0);
    setDuration(0);
    setTtsMode(null);

    try {
      // 调用 Edge TTS 后端生成高质量神经语音
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speechRate }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.audioUrl) {
        throw new Error(data.error || '语音生成失败，请稍后重试');
      }

      setVoiceUrl(data.audioUrl);
      setTtsMode('edge-tts');
      if (voiceAudioRef.current) {
        voiceAudioRef.current.src = data.audioUrl;
        voiceAudioRef.current.volume = voiceVolume / 100;
      }
      setIsVoiceEnded(false);
      if (voiceAudioRef.current) {
        await voiceAudioRef.current.play();
        setIsPlaying(true);
      }
      // 仅当背景音乐开关开启时才自动播放 BGM
      if (bgmEnabled && bgmAudioRef.current && bgmUrl) {
        bgmAudioRef.current.currentTime = 0;
        bgmAudioRef.current.play().catch(() => {});
        setIsBgmPlaying(true);
      }
      setTimeout(() => setShowAlert(true), 100);

      // 添加到历史记录
      const newItem: HistoryItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        text,
        voice,
        voiceLabel: getVoiceLabel(voice),
        speechRate,
        createdAt: Date.now(),
      };
      const updated = [newItem, ...history].slice(0, MAX_HISTORY);
      setHistory(updated);
      saveHistory(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!voiceUrl) return;
    setShowAlert(false);

    // Edge TTS 模式（唯一模式）
    if (!voiceAudioRef.current) return;
    if (isPlaying) {
      voiceAudioRef.current.pause();
      if (bgmEnabled && bgmAudioRef.current) bgmAudioRef.current.pause();
      setIsPlaying(false);
      setIsBgmPlaying(false);
    } else {
      if (isVoiceEnded) {
        voiceAudioRef.current.currentTime = 0;
        setIsVoiceEnded(false);
      }
      voiceAudioRef.current.play();
      setIsPlaying(true);
      // 仅当背景音乐开关开启时才同步播放 BGM
      if (bgmEnabled && bgmAudioRef.current && bgmUrl) {
        bgmAudioRef.current.play().catch(() => {});
        setIsBgmPlaying(true);
      }
    }
  };

  // 进度条拖动处理
  const handleProgressChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (voiceAudioRef.current) {
      voiceAudioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 恢复历史记录的文本和设置
  const restoreHistory = (item: HistoryItem) => {
    setText(item.text);
    setVoice(item.voice);
    setSpeechRate(item.speechRate);
    setVoiceUrl(null);
    setIsPlaying(false);
    setError(null);
    setShowHistory(false);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 删除单条历史
  const deleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  // 清空全部历史
  const clearAllHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const toggleBgmPlay = () => {
    // 背景音乐总开关关闭时禁用
    if (!bgmEnabled) return;
    if (!bgmAudioRef.current || !bgmUrl) return;
    if (isBgmPlaying) {
      bgmAudioRef.current.pause();
      setIsBgmPlaying(false);
    } else {
      bgmAudioRef.current.currentTime = 0;
      bgmAudioRef.current.play().catch(() => {});
      setIsBgmPlaying(true);
    }
  };

  const handleBgmUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setBgmUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 py-6 px-4 overflow-auto">
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className={`flex items-center justify-between transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Left side - Title */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span className="text-white/80 text-sm font-medium">LYJY 智能语音系统</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-lg">
              语音朗读
            </h1>
          </div>

          {/* Right side - 用户/登录/VIP */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* VIP 徽章 */}
                {user.isVip ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40">
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span className="text-amber-200 text-xs font-semibold">VIP</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowVipDialog(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all"
                    title="内测期间免费使用"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span className="text-emerald-200 text-xs font-semibold">内测免费</span>
                  </button>
                )}
                {/* 用户名 */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                  <span className="text-white/80 text-xs">{user.username}</span>
                </div>
                {/* 退出 */}
                <button
                  onClick={handleLogout}
                  title="退出登录"
                  className="p-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => requireLogin('登录后即可使用语音朗读功能')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.03]"
              >
                <LogIn className="w-4 h-4" />
                登录
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Input */}
          <Card className={`bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden transition-all duration-700 delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Mic className="w-5 h-5 text-purple-400" />
                文本输入
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* OCR图片预览 */}
              {ocrPreview && (
                <div className="relative group">
                  <div className="relative rounded-lg overflow-hidden border border-white/10 max-h-[120px]">
                    <img src={ocrPreview} alt="上传的图片" className="w-full h-full object-contain bg-black/20" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => setOcrPreview(null)}
                        className="text-white text-sm bg-red-500/80 px-3 py-1 rounded-lg hover:bg-red-500 transition-colors"
                      >
                        移除图片
                      </button>
                    </div>
                  </div>
                  {isOcrProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-300 bg-purple-900/80 px-4 py-2 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>正在识别文字...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Textarea
                id="text"
                placeholder="在这里输入要朗读的新闻文本..."
                value={text}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= MAX_CHARS) setText(val);
                }}
                maxLength={MAX_CHARS}
                className="min-h-[240px] bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              />

              {/* 字符统计 + 图片识别 + 长文本模式 */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono transition-colors ${text.length > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-white/40'}`}>
                  {text.length} / {MAX_CHARS}
                </span>
                <div className="flex items-center gap-3">
                  {/* 图片识别（内测免费） */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleOcr(file);
                        e.target.value = '';
                      }}
                    />
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all relative ${isOcrProcessing ? 'bg-purple-600/30 text-purple-300 cursor-wait' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}>
                      {isOcrProcessing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>识别中...</span>
                        </>
                      ) : (
                        <>
                          <ScanText className="w-3.5 h-3.5" />
                          <span>图片识别</span>
                          {!user?.isVip && (
                            <span className="inline-flex items-center gap-0.5 ml-0.5 px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold">
                              <Sparkles className="w-2.5 h-2.5" />内测
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </label>
                  {/* 长文本模式（内测免费） */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="long-text"
                      checked={isLongTextMode}
                      onCheckedChange={(checked) => {
                        // 开启长文本模式需要 VIP；关闭允许
                        if (checked && !requireVip()) return;
                        setIsLongTextMode(checked);
                      }}
                      className="data-[state=checked]:bg-purple-500"
                    />
                    <Label htmlFor="long-text" className="text-white/70 text-sm cursor-pointer flex items-center gap-1">
                      长文本模式
                      {!user?.isVip && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold">
                          <Sparkles className="w-2.5 h-2.5" />内测
                        </span>
                      )}
                    </Label>
                  </div>
                </div>
              </div>

              {isLongTextMode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <p className="text-yellow-300/80 text-xs">
                    长文本模式下生成时间较长，请耐心等待（约 30-90 秒）
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">主播声音</Label>
                </div>

                {Object.entries(VOICE_OPTIONS).map(([category, options]) => (
                  <div key={category} className="space-y-1">
                    <p className="text-xs text-cyan-400 font-medium px-1">{category}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setVoice(option.value)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-all duration-300 hover:scale-[1.02] text-left ${
                            voice === option.value
                              ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-500/50 text-white shadow-md shadow-purple-500/20'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-white/40 px-1 mt-2">
                  <i className="fa-solid fa-circle-info mr-1"></i>
                  基于微软 Edge 神经语音合成，14 种中文音色
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-white/80 text-sm">语速调节</Label>
                  <span className="text-cyan-400 text-sm font-mono">
                    {speechRate > 0 ? `+${speechRate}` : speechRate}
                  </span>
                </div>
                <Slider
                  value={[speechRate]}
                  onValueChange={(v) => setSpeechRate(v[0])}
                  min={-50}
                  max={50}
                  step={5}
                  className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-cyan-500 [&_[role=slider]]:border-white"
                />
                <div className="flex justify-between mt-1 text-xs text-white/40">
                  <span>慢</span>
                  <span>中</span>
                  <span>快</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Settings */}
          <Card className={`bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden transition-all duration-700 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-cyan-400" />
                  背景音乐
                </span>
                {/* 背景音乐总开关：默认关闭 */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="bgm-switch" className={`text-xs cursor-pointer ${bgmEnabled ? 'text-cyan-300' : 'text-white/40'}`}>
                    {bgmEnabled ? '已开启' : '已关闭'}
                  </Label>
                  <Switch
                    id="bgm-switch"
                    checked={bgmEnabled}
                    onCheckedChange={setBgmEnabled}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 关闭时的遮罩提示 */}
              {!bgmEnabled && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-white/50 text-xs">
                    背景音乐已关闭，开启开关后才会有声音
                  </p>
                </div>
              )}

              {/* 上传背景音乐 */}
              <div className={`space-y-2 transition-opacity ${bgmEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <Label className="text-white/80 text-sm">上传背景音乐</Label>
                <Button
                  variant="outline"
                  onClick={() => bgmFileInputRef.current?.click()}
                  className="w-full h-10 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-cyan-400/50 transition-all duration-300 hover:scale-[1.02] rounded-lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {bgmUrl === DEFAULT_BGM_URL ? '上传自定义音乐' : '已上传自定义音乐'}
                </Button>
                <input
                  ref={bgmFileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleBgmUpload}
                  className="hidden"
                />
              </div>

              {/* 背景音乐播放 */}
              <div className={`p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-white/10 transition-opacity ${bgmEnabled ? 'opacity-100' : 'opacity-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium flex items-center gap-2 text-sm">
                    <Music className="w-4 h-4 text-cyan-400" />
                    背景音乐
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleBgmPlay}
                    disabled={!bgmEnabled || !bgmUrl}
                    className="text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    {isBgmPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isBgmPlaying ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
                  <span className="text-white/60 text-sm flex-1">
                    {bgmUrl === DEFAULT_BGM_URL ? '默认背景音乐' : '自定义音乐'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${isBgmLoaded ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                    {isBgmLoaded ? '已加载' : '加载中'}
                  </span>
                </div>
              </div>

              {/* 音量控制 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-white/80 flex items-center gap-2 text-sm">
                    <Music className="w-4 h-4" />
                    背景音量
                  </Label>
                  <span className="text-cyan-400 font-mono text-sm">{bgmVolume}%</span>
                </div>
                <Slider
                  value={[bgmVolume]}
                  onValueChange={(v) => setBgmVolume(v[0])}
                  min={0}
                  max={100}
                  className="[&_[role=slider]]:bg-cyan-400"
                />
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-white/80 flex items-center gap-2 text-sm">
                  <Mic className="w-4 h-4" />
                  语音音量
                </Label>
                <span className="text-purple-400 font-mono text-sm">{voiceVolume}%</span>
              </div>
              <Slider
                value={[voiceVolume]}
                onValueChange={(v) => setVoiceVolume(v[0])}
                min={0}
                max={100}
                className="[&_[role=slider]]:bg-purple-400"
              />
            </CardContent>
          </Card>
        </div>

        {/* Generate Button - 紧贴卡片下方 */}
        <div className={`flex justify-center transition-all duration-700 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="px-10 py-5 text-base font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100 rounded-xl"
          >
            {isGenerating ? (
              <>
                <span className="mr-2 animate-spin">⏳</span>
                <span>正在生成...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                <span>生成智能朗读</span>
              </>
            )}
          </Button>
        </div>

        {/* 朗读预览 - 带闪烁光环效果 */}
        <div
          ref={audioAreaRef}
          className={`transition-all duration-500 ${voiceUrl ? 'translate-y-0 opacity-100 max-h-[400px]' : 'translate-y-4 opacity-0 max-h-0 overflow-hidden'}`}
        >
          <Card className={`bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ${showAlert ? 'ring-4 ring-purple-500/50 animate-pulse shadow-purple-500/30 shadow-2xl' : ''}`}>
            <div className={`h-1 transition-all duration-300 ${showAlert ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 animate-pulse' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`} />
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={togglePlay}
                  size="icon"
                  disabled={!voiceUrl}
                  className={`w-14 h-14 rounded-full transition-all duration-300 ${voiceUrl ? 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 hover:scale-110' : 'bg-white/20 cursor-not-allowed'} ${showAlert ? 'animate-bounce scale-110 ring-4 ring-white/30' : ''}`}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </Button>
                <div className="text-center">
                  <div className="text-white font-medium">语音朗读</div>
                  <div className="text-white/50 text-sm">
                    {isVoiceEnded ? '播放完成' : isPlaying ? '播放中...' : voiceUrl ? '点击播放' : '生成后显示'}
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
              </div>

              {/* 朗读进度条 - 可拖动 */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-white/60 text-xs font-mono w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  onValueChange={handleProgressChange}
                  onPointerDown={() => { isDraggingRef.current = true; }}
                  onPointerUp={() => { isDraggingRef.current = false; }}
                  max={duration || 1}
                  step={0.1}
                  disabled={!voiceUrl || duration === 0}
                  className="flex-1 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-cyan-500 [&_[role=slider]]:border-white"
                />
                <span className="text-white/60 text-xs font-mono w-12">
                  {formatTime(duration)}
                </span>
              </div>

              {/* 闪烁光环效果 */}
              {showAlert && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-purple-400/50 rounded-xl animate-ping" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl animate-pulse" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur">
            <p className="text-red-300 text-center text-sm">{error}</p>
          </div>
        )}

        {/* TTS 模式提示 */}
        {ttsMode === 'edge-tts' && voiceUrl && (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl backdrop-blur">
            <p className="text-emerald-200 text-center text-xs">
              当前为<span className="font-semibold">高质量神经语音模式</span>（Edge TTS）
            </p>
          </div>
        )}

        {/* 历史记录 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="text-sm font-medium">生成历史</span>
              {history.length > 0 && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{history.length}</span>
              )}
            </button>
            {showHistory && history.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                清空全部
              </button>
            )}
          </div>

          {showHistory && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  暂无生成历史
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm line-clamp-2 break-words">
                          {item.text}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-white/40 flex-wrap">
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                            {item.voiceLabel}
                          </span>
                          {item.speechRate !== 0 && (
                            <span className="text-cyan-300/70">
                              语速 {item.speechRate > 0 ? `+${item.speechRate}` : item.speechRate}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatHistoryTime(item.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => restoreHistory(item)}
                          title="恢复文本和设置"
                          className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 hover:text-white transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          title="删除"
                          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-white transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes alertPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
          50% { box-shadow: 0 0 0 20px rgba(168, 85, 247, 0); }
        }
        .animate-alert {
          animation: alertPulse 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* 右下角浮动按钮组：返回首页 + 音频编辑器 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {/* 音频编辑器按钮（内测免费） */}
        <button
          onClick={() => {
            // 音频编辑器：内测期间登录即可使用
            if (!requireVip()) return;
            setShowAudioEditor(true);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/40 hover:scale-110 transition-all duration-300 flex items-center justify-center relative"
          title="音频编辑器"
          aria-label="音频编辑器"
        >
          <Music className="h-6 w-6 text-white" />
        </button>

        {/* 返回首页按钮 */}
        <Link
          href="/"
          className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-600 to-pink-700 shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center"
          title="返回首页"
          aria-label="返回首页"
        >
          <i className="fa-solid fa-house text-white"></i>
        </Link>
      </div>

      {/* 音频编辑器弹窗 */}
      <AudioEditor
        isOpen={showAudioEditor}
        onClose={() => setShowAudioEditor(false)}
        initialAudioUrl={voiceUrl || undefined}
      />

      {/* 登录弹窗 */}
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => {
          setShowAuthDialog(false);
          setPendingVipAfterLogin(false);
        }}
        onSuccess={handleAuthSuccess}
        subtitle={authSubtitle}
      />

      {/* VIP 定价弹窗 */}
      <VipPricingDialog
        isOpen={showVipDialog}
        onClose={() => setShowVipDialog(false)}
        user={user}
        onTrialActivated={handleUserUpdate}
        onRequireLogin={() => {
          setShowVipDialog(false);
          setPendingVipAfterLogin(true);
          requireLogin('登录后可开通 VIP 或领取免费试用');
        }}
      />
    </div>
  );
}

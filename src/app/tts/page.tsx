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
import { Play, Pause, Upload, Music, Mic, Wand2, Layers, Clock, Loader2, ScanText, History, Trash2, RotateCcw, Crown, Lock, LogIn, LogOut, Sparkles, Download, SlidersHorizontal } from 'lucide-react';
import AudioEditor from '@/components/AudioEditor';
import { VersionHistoryDialog } from '@/components/VersionHistoryDialog';
import type { Release } from '@/components/UpdateTimeline';
import AuthDialog from '@/components/tts/AuthDialog';
import VipPricingDialog from '@/components/tts/VipPricingDialog';
import type { TtsUser } from '@/components/tts/types';
import { getAudio, putAudio, deleteAudio, clearAudio } from './lib/audioCache';
import { exportMixedWav } from './lib/audioMix';
import { createWorker } from 'tesseract.js';

/** 语音朗读版本历史：越靠前越新 */
const TTS_RELEASES: Release[] = [
  {
    version: 'V3.0', date: '2026.11.20', latest: true, tag: '功能更新',
    items: [
      '修复 Edge TTS 鉴权令牌升级到 v2 后的 403，恢复在线合成，不再误降级到浏览器语音。',
      '新增一键下载 MP3，生成后可直接保存音频。',
      '新增语音 + 背景音乐混音导出 WAV，按当前音量与播放位置合成。',
      '历史音频缓存到本机 IndexedDB，恢复历史不必重新生成。',
      'Edge 合成失败时自动降级浏览器自带语音；登录改为加盐密码存储并加失败限流。',
    ],
  },
  { version: 'V2.2', date: '2026.10.7', items: ['音色扩充到 14 种，按普通话、粤语与台湾口音分组', '补充背景音乐上传与独立音量控制'] },
  { version: 'V2.1', date: '2026.8.16', items: ['新增图片 OCR 识别后朗读', '新增长文本模式，上限 10000 字'] },
  { version: 'V2.0', date: '2026.7.16', items: ['语音朗读系统上线：Edge 神经语音、语速调节、生成历史与音频编辑器'] },
];

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
  // 旧历史项没有此字段，按 edge-tts 处理
  mode?: 'edge-tts' | 'web-speech';
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
  // 混音导出中
  const [isMixing, setIsMixing] = useState(false);

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

  // 浏览器原生语音降级：纯前端，不依赖后端、不校验登录、不重试 Edge API
  const speakWithBrowser = (content: string): boolean => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      !('SpeechSynthesisUtterance' in window)
    ) {
      setError('当前浏览器不支持语音合成，无法降级朗读');
      return false;
    }
    const synth = window.speechSynthesis;
    synth.cancel();

    // 按当前音色推断目标语言，尽量匹配系统里的中文语音
    const targetLang =
      voice.startsWith('hiu') || voice === 'wanlung'
        ? 'zh-HK'
        : voice.startsWith('hsiao') || voice === 'yunjhe'
          ? 'zh-TW'
          : 'zh-CN';
    const voices = synth.getVoices();
    const match =
      voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('zh'));

    const utterance = new SpeechSynthesisUtterance(content);
    if (match) utterance.voice = match;
    utterance.lang = match?.lang || targetLang;
    // 现有 speechRate 范围 -50~50 → 0.5~1.5 倍速
    utterance.rate = Math.max(0.5, Math.min(1.5, 1 + speechRate / 100));
    utterance.pitch = 1;
    utterance.volume = Math.max(0, Math.min(1, voiceVolume / 100));

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsVoiceEnded(false);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsVoiceEnded(true);
      stopBgmIfAny();
    };
    utterance.onerror = (e) => {
      // 主动 cancel / 切模式时浏览器会报 canceled、interrupted，属正常
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        setError('浏览器语音播放失败，请重试');
      }
      setIsPlaying(false);
    };
    synth.speak(utterance);
    return true;
  };

  // 浏览器自动播放策略：在用户点击的同步栈里"解锁"音频，否则 await 网络请求后再 play() 会被拦截，
  // 表现就是界面显示"播放中"却一点声音都没有。这里在手势内 resume AudioContext + 播一段静音 WAV。
  const unlockAudioPlayback = () => {
    if (typeof window === 'undefined') return;
    // Web Audio：解除页面级 autoplay 限制
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        void ctx.resume().catch(() => {});
      }
    } catch {
      /* 不支持 Web Audio 时，退回静音媒体播放 */
    }
    // HTMLAudio：兼容只按媒体元素判断 autoplay 的浏览器
    try {
      const silent = new Audio(
        'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQ4AAAD//wAAAAAAAAAAAAAAAAAAAAA='
      );
      silent.volume = 0;
      void silent.play().catch(() => {});
    } catch {
      /* 忽略 */
    }
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
    // 必须在用户点击的同步调用栈里解锁音频，下面 await 网络请求后再 play() 才不会被自动播放策略拦截
    unlockAudioPlayback();
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      // 先尝试 Edge TTS；网络失败 / 非 2xx / 无 audioUrl 一律自动降级，不重试、不弹错
      let edgeAudioUrl: string | null = null;
      try {
        const response = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice, speechRate }),
        });
        let data: { success?: boolean; audioUrl?: string } | null = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        if (
          response.ok &&
          data?.success &&
          typeof data.audioUrl === 'string' &&
          data.audioUrl.startsWith('data:audio/')
        ) {
          edgeAudioUrl = data.audioUrl;
        }
      } catch {
        // 网络层失败：交给下面的降级分支
      }

      const newItem: HistoryItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        text,
        voice,
        voiceLabel: getVoiceLabel(voice),
        speechRate,
        createdAt: Date.now(),
        mode: edgeAudioUrl ? 'edge-tts' : 'web-speech',
      };

      if (edgeAudioUrl) {
        setVoiceUrl(edgeAudioUrl);
        setTtsMode('edge-tts');
        if (voiceAudioRef.current) {
          voiceAudioRef.current.src = edgeAudioUrl;
          voiceAudioRef.current.volume = voiceVolume / 100;
          voiceAudioRef.current.load();
        }
        setIsVoiceEnded(false);
        // 如实反映播放状态：成功才算"播放中"，失败给出可见提示而不是静默假装播放
        let started = false;
        if (voiceAudioRef.current) {
          try {
            await voiceAudioRef.current.play();
            started = true;
            setIsPlaying(true);
          } catch {
            started = false;
          }
        }
        if (!started) {
          setError('浏览器拦截了自动播放，请点击中间的播放按钮开始朗读');
          setIsPlaying(false);
        }
        // 音频缓存失败不影响主流程（内部已静默降级）
        void putAudio(newItem.id, edgeAudioUrl);
      } else {
        if (!speakWithBrowser(text)) return;
        setVoiceUrl(null);
        setTtsMode('web-speech');
        setIsVoiceEnded(false);
      }

      // 仅当背景音乐开关开启时才自动播放 BGM
      if (bgmEnabled && bgmAudioRef.current && bgmUrl) {
        bgmAudioRef.current.currentTime = 0;
        bgmAudioRef.current.play().catch(() => {});
        setIsBgmPlaying(true);
      }
      setTimeout(() => setShowAlert(true), 100);

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
    if (!voiceUrl && ttsMode !== 'web-speech') return;
    setShowAlert(false);

    // 浏览器原生语音降级模式：用 speechSynthesis 的 pause/resume/speak 控制
    if (ttsMode === 'web-speech') {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        speakWithBrowser(text);
      }
      return;
    }

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
      void voiceAudioRef.current.play().catch(() => {
        setError('播放失败，请再点一次播放按钮');
        setIsPlaying(false);
      });
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

  // 恢复历史：优先读本地缓存直接播放，不再请求 Edge TTS；无缓存则只恢复文本与设置
  const restoreHistory = async (item: HistoryItem) => {
    setText(item.text);
    setVoice(item.voice);
    setSpeechRate(item.speechRate);
    setVoiceUrl(null);
    setIsPlaying(false);
    setIsVoiceEnded(false);
    setError(null);
    setShowHistory(false);
    setTtsMode(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const cached = await getAudio(item.id);
    if (!cached) return;

    setVoiceUrl(cached);
    setTtsMode('edge-tts');
    if (voiceAudioRef.current) {
      voiceAudioRef.current.src = cached;
      voiceAudioRef.current.volume = voiceVolume / 100;
      voiceAudioRef.current.currentTime = 0;
      try {
        await voiceAudioRef.current.play();
        setIsPlaying(true);
      } catch {
        // 自动播放被拦截时保留"点击播放"状态，用户可手动播放
      }
    }
    setIsVoiceEnded(false);
    if (bgmEnabled && bgmAudioRef.current && bgmUrl) {
      bgmAudioRef.current.currentTime = 0;
      bgmAudioRef.current.play().catch(() => {});
      setIsBgmPlaying(true);
    }
  };

  // 删除单条历史（同步清理音频缓存）
  const deleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
    void deleteAudio(id);
  };

  // 清空全部历史（同步清空音频缓存）
  const clearAllHistory = () => {
    setHistory([]);
    saveHistory([]);
    void clearAudio();
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

  // 一键下载 MP3：使用现成的 data URL，不额外请求后端
  const handleDownloadMp3 = () => {
    if (!voiceUrl || ttsMode !== 'edge-tts') return;
    const a = document.createElement('a');
    a.href = voiceUrl;
    a.download = `tts_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 语音 + 背景音乐真混音导出 WAV
  const handleExportMix = async () => {
    if (!voiceUrl || ttsMode !== 'edge-tts' || !bgmUrl) return;
    setIsMixing(true);
    setError(null);
    try {
      const blob = await exportMixedWav({
        voiceUrl,
        bgmUrl,
        voiceVolume,
        bgmVolume,
        startSec: voiceAudioRef.current?.currentTime || 0,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tts_mixed_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '混音导出失败');
    } finally {
      setIsMixing(false);
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
          className={`transition-all duration-500 ${voiceUrl || ttsMode === 'web-speech' ? 'translate-y-0 opacity-100 max-h-[520px]' : 'translate-y-4 opacity-0 max-h-0 overflow-hidden'}`}
        >
          <Card className={`bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ${showAlert ? 'ring-4 ring-purple-500/50 animate-pulse shadow-purple-500/30 shadow-2xl' : ''}`}>
            <div className={`h-1 transition-all duration-300 ${showAlert ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 animate-pulse' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`} />
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={togglePlay}
                  size="icon"
                  disabled={!voiceUrl && ttsMode !== 'web-speech'}
                  className={`w-14 h-14 rounded-full transition-all duration-300 ${voiceUrl || ttsMode === 'web-speech' ? 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 hover:scale-110' : 'bg-white/20 cursor-not-allowed'} ${showAlert ? 'animate-bounce scale-110 ring-4 ring-white/30' : ''}`}
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
                    {ttsMode === 'web-speech' ? '浏览器自带语音' : isVoiceEnded ? '播放完成' : isPlaying ? '播放中...' : voiceUrl ? '点击播放' : '生成后显示'}
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
                  disabled={!voiceUrl || duration === 0 || ttsMode === 'web-speech'}
                  className="flex-1 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-cyan-500 [&_[role=slider]]:border-white"
                />
                <span className="text-white/60 text-xs font-mono w-12">
                  {formatTime(duration)}
                </span>
              </div>

              {/* 导出操作：下载 MP3 / 语音+BGM 混音 WAV */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadMp3}
                  disabled={!voiceUrl || ttsMode !== 'edge-tts'}
                  title={ttsMode === 'web-speech' ? '浏览器原生语音无法导出音频' : !voiceUrl ? '请先生成语音' : '下载 Edge TTS 生成的 MP3'}
                  className="h-9 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-purple-400/50 disabled:opacity-40"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  下载 MP3
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMix}
                  disabled={!voiceUrl || ttsMode !== 'edge-tts' || !bgmUrl || isMixing}
                  title={ttsMode === 'web-speech' ? '浏览器原生语音无法导出音频' : !bgmUrl ? '请先准备背景音乐' : '按当前音量与播放位置混入背景音乐'}
                  className="h-9 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-cyan-400/50 disabled:opacity-40"
                >
                  {isMixing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <SlidersHorizontal className="w-4 h-4 mr-1.5" />}
                  导出混音 WAV
                </Button>
              </div>
              {ttsMode === 'web-speech' && (
                <p className="mt-2 text-center text-[11px] text-amber-300/80">
                  浏览器原生语音无法录制音频，MP3 下载与混音导出不可用
                </p>
              )}

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
        {ttsMode === 'web-speech' && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl backdrop-blur">
            <p className="text-amber-200 text-center text-xs">
              当前使用<span className="font-semibold">浏览器自带语音</span>（离线降级，不可导出音频）
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
                          {item.mode === 'web-speech' && (
                            <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                              浏览器语音
                            </span>
                          )}
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

      {/* 更新记录 */}
      <VersionHistoryDialog
        releases={TTS_RELEASES}
        subtitle="语音朗读系统 · 版本历史"
        tone="dark"
        position="bottom-left"
      />

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

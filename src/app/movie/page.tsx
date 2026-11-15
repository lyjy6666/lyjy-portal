'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import UpdateTimeline, { type Release } from '@/components/UpdateTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Background from '@/components/Background';

// ============ 类型定义 ============
interface VodItem {
  vod_id: number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year?: string;
  vod_class?: string;
  vod_score?: string;
}

interface VodDetail extends VodItem {
  vod_content: string;
  vod_actor: string;
  vod_director: string;
  vod_play_from: string;
  vod_play_url: string;
  vod_pubdate?: string;
}

interface Category {
  type_id: number;
  type_name: string;
}

// 剧集
interface Episode {
  name: string;
  url: string;
}

// 播放线路
interface PlayLine {
  id: string;
  name: string;
  type: 'hls' | 'collector';
  // hls: 直接用 episode.url（当前采集站的 m3u8，最快）
  // collector: 用 collectorUrl 重新搜当前影片名，取该站的 m3u8 播放（多源兜底）
  collectorUrl?: string;
}

/** 线路测速结果：ok=false 表示超时/不可达，ms 为该次请求耗时 */
interface LineLatency {
  ms: number;
  ok: boolean;
}

// ============ 常量 ============
const DEFAULT_COLLECTOR = 'https://cj.lziapi.com/api.php/provide/vod/';
const COLLECTOR_STORAGE_KEY = 'movie_collector_url';
const MINIMAL_MODE_KEY = 'movie_minimal_mode';
// hls.js 自托管：原先从 cdn.jsdelivr.net 加载，该 CDN 不可达时视频会完全播不了
const HLS_SCRIPT_SRC = '/vendor/hls.min.js';

// 预设采集站列表（移植自 MoonTV 开源项目 config.json，实测筛选可用站点）
// 来源：https://github.com/samqin123/MoonTV/blob/main/config.json
// 复测日期 2026-11-13：原线路③域名解析已失效，替换为实测可用的飘零资源
const COLLECTOR_PRESETS: { name: string; url: string; note: string }[] = [
  { name: '量子资源（默认）', url: 'https://cj.lziapi.com/api.php/provide/vod/', note: '16.4万部' },
  { name: '飘零资源', url: 'https://p2100.net/api.php/provide/vod/', note: '10.1万部' },
  { name: '最大资源', url: 'https://api.zuidapi.com/api.php/provide/vod/', note: '12.1万部' },
  { name: '无尽资源', url: 'https://api.wujinapi.me/api.php/provide/vod/', note: '11.6万部' },
  { name: '极速资源', url: 'https://jszyapi.com/api.php/provide/vod/', note: '10.7万部' },
  { name: '樱花资源', url: 'https://m3u8.apiyhzy.com/api.php/provide/vod/', note: '10万部' },
  { name: '非凡影视', url: 'http://ffzy5.tv/api.php/provide/vod/', note: '9.7万部' },
  { name: '魔都资源', url: 'https://www.mdzyapi.com/api.php/provide/vod/', note: '8.6万部' },
  { name: '360资源', url: 'https://360zy.com/api.php/provide/vod/', note: '6.7万部' },
];

// 播放线路：线路①用当前采集站直播（最快），线路②-⑩为 9 个预设采集站（多源兜底）
// 切到采集站线路时，会用当前影片名去该站现搜，取 m3u8 播放
// 一个站没片或失效，切另一个站即可，大幅提升可播率
const PLAY_LINES: PlayLine[] = [
  { id: 'lzm3u8', name: '① 当前站', type: 'hls' },
  { id: 'lizi', name: '② 量子资源', type: 'collector', collectorUrl: 'https://cj.lziapi.com/api.php/provide/vod/' },
  { id: 'piaoling', name: '③ 飘零资源', type: 'collector', collectorUrl: 'https://p2100.net/api.php/provide/vod/' },
  { id: 'zuida', name: '④ 最大资源', type: 'collector', collectorUrl: 'https://api.zuidapi.com/api.php/provide/vod/' },
  { id: 'wujin', name: '⑤ 无尽资源', type: 'collector', collectorUrl: 'https://api.wujinapi.me/api.php/provide/vod/' },
  { id: 'jisu', name: '⑥ 极速资源', type: 'collector', collectorUrl: 'https://jszyapi.com/api.php/provide/vod/' },
  { id: 'yinghua', name: '⑦ 樱花资源', type: 'collector', collectorUrl: 'https://m3u8.apiyhzy.com/api.php/provide/vod/' },
  { id: 'feifan', name: '⑧ 非凡影视', type: 'collector', collectorUrl: 'http://ffzy5.tv/api.php/provide/vod/' },
  { id: 'modu', name: '⑨ 魔都资源', type: 'collector', collectorUrl: 'https://www.mdzyapi.com/api.php/provide/vod/' },
  { id: 'zy360', name: '⑩ 360资源', type: 'collector', collectorUrl: 'https://360zy.com/api.php/provide/vod/' },
];

// 免责声明文本
const DISCLAIMER_MAIN = '视频资源全部来源于第三方播放接口，本站服务器不储存任何视频资源。视频中自带广告、视频内容均归属第三方平台，本站不承担相关责任。如有版权争议，请直接联系对应第三方资源方。';
const DISCLAIMER_SUB = '每条线路会自动测速并显示延迟，播放异常时可切换到延迟更低的线路。';

// 违规内容过滤黑名单（明确违法的，一律删除不显示）
const BLOCKED_KEYWORDS = ['伦理', '三级', '两性', '情色', '成人', 'AV'];


// 判断是否为违法内容（直接删除）
function isBlocked(text: string): boolean {
  if (!text) return false;
  return BLOCKED_KEYWORDS.some((kw) => text.includes(kw));
}

// 倍速选项
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ============ 工具函数 ============
function getCollectorUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_COLLECTOR;
  return localStorage.getItem(COLLECTOR_STORAGE_KEY) || DEFAULT_COLLECTOR;
}

function setCollectorUrl(url: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COLLECTOR_STORAGE_KEY, url);
}

// ============ 播放线路测速 ============
// 结果缓存 5 分钟：避免每打开一部影片就并发打满 10 个采集站
let latencyCache: { at: number; data: Record<string, LineLatency> } | null = null;
const LATENCY_TTL = 5 * 60 * 1000;

/** 线路①用「当前采集站」，其余线路用各自绑定的采集站 */
function lineCollector(line: PlayLine): string {
  return line.type === 'hls' ? getCollectorUrl() : line.collectorUrl || DEFAULT_COLLECTOR;
}

async function pingLine(line: PlayLine): Promise<[string, LineLatency]> {
  try {
    const res = await fetch(
      `/api/movie/ping?collector=${encodeURIComponent(lineCollector(line))}`,
      { cache: 'no-store' },
    );
    const data = await res.json();
    return [line.id, { ms: Number(data.ms) || 0, ok: Boolean(data.ok) }];
  } catch {
    return [line.id, { ms: 0, ok: false }];
  }
}

function latencyLabel(lat?: LineLatency, loading = false): string {
  if (!lat) return loading ? '测速中…' : '未测速';
  return lat.ok ? `${lat.ms} ms` : '不可用';
}

function latencyTone(lat?: LineLatency): string {
  if (!lat) return 'text-white/40';
  if (!lat.ok) return 'text-red-300';
  if (lat.ms < 500) return 'text-emerald-300';
  if (lat.ms < 1200) return 'text-yellow-300';
  return 'text-orange-300';
}

// 动态加载 hls.js
let hlsPromise: Promise<any> | null = null;
function loadHls(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject();
  if ((window as any).Hls) return Promise.resolve((window as any).Hls);
  if (hlsPromise) return hlsPromise;
  hlsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = HLS_SCRIPT_SRC;
    script.onload = () => {
      if ((window as any).Hls) resolve((window as any).Hls);
      else reject(new Error('hls.js 加载失败'));
    };
    script.onerror = () => reject(new Error('hls.js 加载失败'));
    document.head.appendChild(script);
  });
  return hlsPromise;
}

// 时间格式化
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ============ 自定义视频播放器组件 ============
// 仅用于 LZM3U8 线路（hls.js 直接播放）
function CustomVideoPlayer({
  src,
  onPrevEpisode,
  onNextEpisode,
}: {
  src: string;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragging, setDragging] = useState(false);

  // 加载视频源
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);

    // 清理旧 hls
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = src;

    // 采集站的 m3u8 常不带扩展名（如 https://v.xxx.com/share/abc），
    // 不能只靠 .m3u8 后缀判断；只把明确的直链媒体格式交给 <video> 原生播放。
    const isDirectMedia = /\.(mp4|webm|ogg|ogv|m4v|mov)(\?|#|$)/i.test(url);
    if (isDirectMedia) {
      video.src = url;
      return;
    }

    // Chromium 的 canPlayType('application/vnd.apple.mpegurl') 会返回 "maybe"，
    // 但实际并不支持 HLS 解复用：若据此直接 video.src = m3u8，会报
    // DEMUXER_ERROR_COULD_NOT_PARSE。所以一律优先用 hls.js（站内自托管），
    // 只有 hls.js 不支持 / 加载失败时才回退原生 HLS（Safari）。
    let cancelled = false;
    const playNative = () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        toast.error('当前浏览器不支持该视频格式');
      }
    };

    loadHls()
      .then((Hls) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          playNative();
          return;
        }
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            toast.error('视频加载失败，请尝试切换播放线路');
          }
        });
      })
      .catch(() => {
        if (!cancelled) playNative();
      });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // 视频事件监听
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      if (!dragging) setCurrentTime(video.currentTime);
    };
    const onDur = () => setDuration(video.duration);
    const onProg = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onVol = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };
    const onWait = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onCanPlay = () => setLoading(false);
    const onEnded = () => {
      if (onNextEpisode) onNextEpisode();
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDur);
    video.addEventListener('progress', onProg);
    video.addEventListener('volumechange', onVol);
    video.addEventListener('waiting', onWait);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDur);
      video.removeEventListener('progress', onProg);
      video.removeEventListener('volumechange', onVol);
      video.removeEventListener('waiting', onWait);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('ended', onEnded);
    };
  }, [dragging, onNextEpisode]);

  // 全屏状态监听
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // 控制条自动隐藏
  const triggerHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (playing) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    triggerHideTimer();
  }, [triggerHideTimer]);

  // 操作函数
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = parseFloat(e.target.value);
    video.volume = v;
    video.muted = v === 0;
  };

  const handleRateChange = (r: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = r;
    setRate(r);
    setShowRateMenu(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen().catch(() => {});
    }
  };

  // 进度条交互
  const seekTo = (clientX: number) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const onProgressMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    seekTo(e.clientX);
    const onMove = (ev: MouseEvent) => seekTo(ev.clientX);
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onProgressTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    seekTo(e.touches[0].clientX);
    const onMove = (ev: TouchEvent) => seekTo(ev.touches[0].clientX);
    const onEnd = () => {
      setDragging(false);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black group/player overflow-hidden select-none"
      onMouseMove={triggerHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        onClick={togglePlay}
      />

      {/* 加载圈 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-3 border-white/30 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* 中间大播放按钮（暂停时显示） */}
      {!playing && !loading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="播放"
        >
          <div className="w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-amber-500/80 transition-all">
            <i className="fa-solid fa-play text-white text-2xl ml-1"></i>
          </div>
        </button>
      )}

      {/* 控制条 */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-12 pb-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* 进度条 */}
        <div
          ref={progressRef}
          onMouseDown={onProgressMouseDown}
          onTouchStart={onProgressTouchStart}
          className="relative h-1.5 hover:h-2.5 transition-all bg-white/20 rounded-full cursor-pointer mb-3 group/progress"
        >
          {/* 缓冲 */}
          <div
            className="absolute left-0 top-0 h-full bg-white/30 rounded-full"
            style={{ width: `${bufferedPct}%` }}
          />
          {/* 已播放 */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            style={{ width: `${progressPct}%` }}
          >
            {/* 拖动手柄 */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-amber-500 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
          </div>
        </div>

        {/* 按钮组 */}
        <div className="flex items-center gap-3 text-white">
          {/* 上一集 */}
          {onPrevEpisode && (
            <button
              onClick={onPrevEpisode}
              className="hover:text-amber-400 transition-colors"
              title="上一集"
            >
              <i className="fa-solid fa-backward-step"></i>
            </button>
          )}
          {/* 播放/暂停 */}
          <button
            onClick={togglePlay}
            className="hover:text-amber-400 transition-colors"
            title={playing ? '暂停' : '播放'}
          >
            <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'}`}></i>
          </button>
          {/* 下一集 */}
          {onNextEpisode && (
            <button
              onClick={onNextEpisode}
              className="hover:text-amber-400 transition-colors"
              title="下一集"
            >
              <i className="fa-solid fa-forward-step"></i>
            </button>
          )}

          {/* 音量 */}
          <div className="flex items-center gap-2 group/vol">
            <button onClick={toggleMute} className="hover:text-amber-400 transition-colors" title={muted ? '取消静音' : '静音'}>
              <i className={`fa-solid ${muted || volume === 0 ? 'fa-volume-xmark' : volume < 0.5 ? 'fa-volume-low' : 'fa-volume-high'}`}></i>
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-0 group-hover/vol:w-16 transition-all duration-300 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* 时间 */}
          <span className="text-xs text-white/80 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* 右侧 */}
          <div className="ml-auto flex items-center gap-3">
            {/* 倍速 */}
            <div className="relative">
              <button
                onClick={() => setShowRateMenu(!showRateMenu)}
                className="hover:text-amber-400 transition-colors text-sm px-1.5 py-0.5 rounded"
                title="倍速"
              >
                {rate}x <i className="fa-solid fa-caret-down ml-0.5 text-xs"></i>
              </button>
              <AnimatePresence>
                {showRateMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden py-1 min-w-[80px]"
                  >
                    {PLAYBACK_RATES.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRateChange(r)}
                        className={`block w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 transition-colors ${
                          rate === r ? 'text-amber-400' : 'text-white/80'
                        }`}
                      >
                        {r === 1 ? '正常' : `${r}x`}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 全屏 */}
            <button
              onClick={toggleFullscreen}
              className="hover:text-amber-400 transition-colors"
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 主组件 ============
/** 影视资源站的版本历史（越靠前越新） */
export const MOVIE_RELEASES: Release[] = [
  {
    version: 'V2.0',
    date: '2026-11-13',
    latest: true,
    items: ['优化了影片播放', '优化了界面排版'],
  },
  { version: 'V1.0', date: '2026-07-22', items: ['网站上线了'] },
];

export default function MoviePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [movies, setMovies] = useState<VodItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // 播放弹窗
  const [detail, setDetail] = useState<VodDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [currentLineId, setCurrentLineId] = useState<string>(PLAY_LINES[0].id); // 当前播放线路

  // 极简模式：只保留播放器、换源、选集，不显示影片介绍与免责声明
  const [minimalMode, setMinimalMode] = useState(false);

  // 线路延迟：key = PLAY_LINES 的 id
  const [lineLatency, setLineLatency] = useState<Record<string, LineLatency>>({});
  const [latencyLoading, setLatencyLoading] = useState(false);

  // collector 线路（其他采集站）的播放数据：切到某采集站线路时现搜现取
  const [lineEpisodes, setLineEpisodes] = useState<Record<string, Episode[]>>({});
  const [lineLoading, setLineLoading] = useState(false);
  const [lineError, setLineError] = useState('');

  // 设置弹窗
  const [showSettings, setShowSettings] = useState(false);
  const [collectorInput, setCollectorInput] = useState('');
  const [showUpdateLog, setShowUpdateLog] = useState(false);

  // 测试阶段提示弹窗（每次进入站点都弹出，直到用户点击"我已了解"关闭）
  const [showBetaNotice, setShowBetaNotice] = useState(false);

  // ============ 极简模式 & 线路测速 ============
  const toggleMinimalMode = () => {
    setMinimalMode((prev) => {
      const next = !prev;
      try { localStorage.setItem(MINIMAL_MODE_KEY, next ? '1' : '0'); } catch { /* 隐私模式忽略 */ }
      return next;
    });
  };

  const measureLines = useCallback(async (force = false) => {
    if (!force && latencyCache && Date.now() - latencyCache.at < LATENCY_TTL) {
      setLineLatency(latencyCache.data);
      return;
    }
    setLatencyLoading(true);
    const pairs = await Promise.all(PLAY_LINES.map(pingLine));
    const data = Object.fromEntries(pairs) as Record<string, LineLatency>;
    latencyCache = { at: Date.now(), data };
    setLineLatency(data);
    setLatencyLoading(false);
  }, []);

  // 切换线路时重测「当前源」，保证显示的是刚切过去那条线路的实时延迟
  const measureOne = useCallback(async (lineId: string) => {
    const line = PLAY_LINES.find((l) => l.id === lineId);
    if (!line) return;
    const [id, result] = await pingLine(line);
    setLineLatency((prev) => {
      const next = { ...prev, [id]: result };
      latencyCache = { at: Date.now(), data: next };
      return next;
    });
  }, []);

  // ============ 数据请求 ============
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`/api/movie?collector=${encodeURIComponent(getCollectorUrl())}&ac=list`);
      const data = await res.json();
      if (data.class && Array.isArray(data.class)) {
        // 只做违法内容过滤；隐藏分类（密码入口）已整体下线，合法分类直接展示
        const normal: Category[] = data.class.filter((c: Category) => !isBlocked(c.type_name));
        setCategories(normal);
        // 默认选中"电影"分类，避免首页推荐乱七八糟的内容
        const movieCat = normal.find((c: Category) => c.type_name === '电影');
        if (movieCat) {
          setActiveCategory(movieCat.type_id);
        }
      }
    } catch (err) {
      console.error('获取分类失败:', err);
      toast.error('获取分类失败，请检查采集站地址');
    }
  }, []);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('collector', getCollectorUrl());
      params.set('ac', 'detail');
      params.set('pg', String(page));
      if (searchKeyword) {
        params.set('wd', searchKeyword);
      } else if (activeCategory > 0) {
        params.set('t', String(activeCategory));
      }

      const res = await fetch(`/api/movie?${params.toString()}`);
      const data = await res.json();

      if (data.list && Array.isArray(data.list)) {
        // 只过滤明确违法的内容；隐藏内容已下线，不再按解锁状态做区分
        const cleanMovies = data.list.filter(
          (v: VodItem) => !isBlocked(v.vod_class ?? '') && !isBlocked(v.vod_name),
        );
        setMovies(cleanMovies);
        setPageCount(data.pagecount || 1);
      } else {
        setMovies([]);
        setPageCount(1);
      }
    } catch (err) {
      console.error('获取影片失败:', err);
      toast.error('获取影片失败');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, searchKeyword]);

  const fetchDetail = useCallback(async (vodId: number) => {
    setDetailLoading(true);
    setDetail(null);
    setCurrentEpisode(0);
    setCurrentLineId(PLAY_LINES[0].id);
    // 清空 collector 线路缓存（新影片需要重新搜）
    setLineEpisodes({});
    setLineError('');
    setLineLoading(false);
    try {
      const params = new URLSearchParams();
      params.set('collector', getCollectorUrl());
      params.set('ac', 'detail');
      params.set('ids', String(vodId));
      const res = await fetch(`/api/movie?${params.toString()}`);
      const data = await res.json();
      if (data.list && data.list.length > 0) {
        setDetail(data.list[0]);
      } else {
        toast.error('未找到影片详情');
      }
    } catch (err) {
      console.error('获取详情失败:', err);
      toast.error('获取详情失败');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ============ 初始化 ============
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 极简模式偏好：只在客户端读取，避免 SSR / hydration 文本不一致
  useEffect(() => {
    try { setMinimalMode(localStorage.getItem(MINIMAL_MODE_KEY) === '1'); } catch { /* 隐私模式忽略 */ }
  }, []);

  // 每次打开影片弹窗，自动测一遍全部播放线路的延迟（5 分钟内有缓存则直接复用）
  useEffect(() => {
    if (detail) void measureLines();
  }, [detail?.vod_id, measureLines]);

  // 进入影视站弹出测试阶段提醒（每个会话首次进入弹一次）
  useEffect(() => {
    const SESSION_KEY = 'movie_beta_notice_shown';
    if (typeof window === 'undefined') return;
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setShowBetaNotice(true);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // ============ 派生数据：解析播放源 ============
  // 采集站返回的 vod_play_from / vod_play_url 按 $$$ 分隔多个源
  // 需求：移除"量子"源，接入 LZM3U8 源
  // 注意：采集站返回的源名是拼音 "liangzi" 而非中文"量子"，需同时匹配
  const parseEpisodes = (d: any): Episode[] => {
    if (!d) return [];
    // 显式转字符串：d 是采集站原始 JSON，不能让 split 结果退化成 any
    const playFromArr: string[] = String(d.vod_play_from || '').split('$$$');
    const playUrlArr: string[] = String(d.vod_play_url || '').split('$$$');
    // 优先选 lzm3u8 源；找不到再取第一个非量子源
    let validIdx = playFromArr.findIndex((name) => name.toLowerCase().includes('lzm3u8'));
    if (validIdx === -1) {
      validIdx = playFromArr.findIndex(
        (name) => !name.includes('量子') && !name.toLowerCase().includes('liangzi')
      );
    }
    if (validIdx === -1 || !playUrlArr[validIdx]) return [];
    return playUrlArr[validIdx].split('#').map((item) => {
      const [name, url] = item.split('$');
      return { name: name || '', url: url || '' };
    });
  };

  const rawEpisodes: Episode[] = parseEpisodes(detail);

  // 当前线路
  const currentLine = PLAY_LINES.find((l) => l.id === currentLineId) || PLAY_LINES[0];

  // collector 线路用各自采集站搜出的集数，hls/iframe 线路用当前采集站的 rawEpisodes
  const currentEpisodes: Episode[] =
    currentLine.type === 'collector' ? lineEpisodes[currentLine.id] || [] : rawEpisodes;
  const currentEp = currentEpisodes[currentEpisode];

  // 当前播放地址：hls 与 collector 线路都是直接播 m3u8
  const currentPlayUrl = currentEp?.url || '';

  // collector 线路：切到该线路时，用影片名去对应采集站现搜，取 m3u8 播放地址
  useEffect(() => {
    if (currentLine.type !== 'collector' || !detail) {
      setLineError('');
      return;
    }
    // 已缓存则不重复请求
    if (lineEpisodes[currentLine.id]) {
      setLineError('');
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLineLoading(true);
      setLineError('');
      try {
        // 第一步：用影片名搜索，拿到 vod_id
        const searchParams = new URLSearchParams();
        searchParams.set('collector', currentLine.collectorUrl!);
        searchParams.set('wd', detail.vod_name);
        const searchRes = await fetch(`/api/movie?${searchParams.toString()}`);
        const searchData = await searchRes.json();
        if (cancelled) return;
        const searchList = searchData.list || [];
        if (searchList.length === 0) {
          setLineEpisodes((prev) => ({ ...prev, [currentLine.id]: [] }));
          setLineError('该采集站未找到此影片');
          return;
        }
        const vodId = searchList[0].vod_id;
        // 第二步：用 vod_id 查详情，拿到播放地址（wd 搜索不返回 vod_play_url，必须 ac=detail）
        const detailParams = new URLSearchParams();
        detailParams.set('collector', currentLine.collectorUrl!);
        detailParams.set('ac', 'detail');
        detailParams.set('ids', String(vodId));
        const detailRes = await fetch(`/api/movie?${detailParams.toString()}`);
        const detailData = await detailRes.json();
        if (cancelled) return;
        const detailList = detailData.list || [];
        if (detailList.length === 0) {
          setLineEpisodes((prev) => ({ ...prev, [currentLine.id]: [] }));
          setLineError('该站有影片但无可播放源');
          return;
        }
        const eps = parseEpisodes(detailList[0]);
        setLineEpisodes((prev) => ({ ...prev, [currentLine.id]: eps }));
        if (eps.length === 0) setLineError('该站有影片但无可播放源');
      } catch (err) {
        if (!cancelled) setLineError('该采集站请求失败');
      } finally {
        if (!cancelled) setLineLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentLine.id, currentLine.type, detail]);

  // 切线路时重置集数到第0集（不同线路集数划分不同）
  useEffect(() => {
    setCurrentEpisode(0);
  }, [currentLineId]);

  // ============ 交互 ============
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(searchInput.trim());
    setActiveCategory(0);
    setPage(1);
  };

  const handleCategoryClick = (catId: number) => {
    setSearchKeyword('');
    setSearchInput('');
    setActiveCategory(catId);
    setPage(1);
  };

  const handleMovieClick = (vodId: number) => {
    fetchDetail(vodId);
  };

  const handleCloseDetail = () => {
    setDetail(null);
    setCurrentEpisode(0);
    setCurrentLineId(PLAY_LINES[0].id);
    setLineEpisodes({});
    setLineError('');
    setLineLoading(false);
  };

  const handleSwitchLine = (lineId: string) => {
    setCurrentLineId(lineId);
    // 切过去之后立刻重测这条线路，当前源延迟总是新鲜的
    void measureOne(lineId);
    toast.success(`已切换到 ${PLAY_LINES.find((l) => l.id === lineId)?.name}`);
  };

  const handleEpisodeClick = (idx: number) => {
    setCurrentEpisode(idx);
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 0) setCurrentEpisode(currentEpisode - 1);
  };

  const handleNextEpisode = () => {
    if (currentEpisode < currentEpisodes.length - 1) setCurrentEpisode(currentEpisode + 1);
  };

  const handleSaveCollector = () => {
    const url = collectorInput.trim();
    if (!url) {
      toast.error('请输入采集站地址');
      return;
    }
    setCollectorUrl(url);
    setShowSettings(false);
    toast.success('采集站已更新，正在刷新数据');
    setCategories([]);
    setMovies([]);
    setPage(1);
    setSearchKeyword('');
    setSearchInput('');
    setActiveCategory(0);
    setTimeout(() => {
      fetchCategories();
      fetchMovies();
    }, 300);
  };

  // ============ 渲染 ============
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 group"
              aria-label="返回首页"
            >
              <i className="fa-solid fa-arrow-left text-white/80 group-hover:text-white"></i>
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold tracking-tight inline-flex items-center gap-2"
              style={{
                backgroundImage: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              <i className="fa-solid fa-film mr-3"></i>
              LYJY 影视
              <span className="text-xs md:text-sm font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 align-middle">
                Beta
              </span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜索电影、电视剧..."
                className="w-64 md:w-80 pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 focus:bg-white/15 transition-all duration-300"
              />
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-amber-500/80 hover:bg-amber-500 text-white text-sm rounded-lg transition-all"
              >
                搜索
              </button>
            </form>

            <button
              onClick={() => {
                setCollectorInput(getCollectorUrl());
                setShowSettings(true);
              }}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group"
              aria-label="设置"
              title="采集站设置"
            >
              <i className="fa-solid fa-gear text-white/80 group-hover:text-white"></i>
            </button>
          </div>
        </div>

        {/* 分类切换 */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => handleCategoryClick(0)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              activeCategory === 0 && !searchKeyword
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            首页推荐
          </button>
          {categories.map((cat) => (
            <button
              key={cat.type_id}
              onClick={() => handleCategoryClick(cat.type_id)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                activeCategory === cat.type_id && !searchKeyword
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cat.type_name}
            </button>
          ))}
        </div>

        {/* 当前状态提示 */}
        {searchKeyword && (
          <div className="mb-4 text-white/60 text-sm">
            搜索「<span className="text-amber-400">{searchKeyword}</span>」的结果：
            <button
              onClick={() => {
                setSearchKeyword('');
                setSearchInput('');
                setPage(1);
              }}
              className="ml-3 text-amber-400 hover:underline"
            >
              清除搜索
            </button>
          </div>
        )}

        {/* 影片网格 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-white/30 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-white/60 text-sm">加载中...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <i className="fa-solid fa-film text-5xl text-white/20"></i>
            <p className="text-white/60">暂无影片数据</p>
            <p className="text-white/40 text-xs">请检查采集站地址是否可用（右上角设置）</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((movie, idx) => (
                <motion.div
                  key={movie.vod_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.5) }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => handleMovieClick(movie.vod_id)}
                  className="cursor-pointer group"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-amber-500/50 transition-all duration-300 relative">
                    {movie.vod_pic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={movie.vod_pic}
                        alt={movie.vod_name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-image text-3xl text-white/20"></i>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <div className="w-12 h-12 bg-amber-500/90 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-play text-white text-lg ml-1"></i>
                      </div>
                    </div>
                    {movie.vod_remarks && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded text-xs text-amber-400">
                        {movie.vod_remarks}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 px-1">
                    <h3 className="text-sm font-medium text-white/90 truncate group-hover:text-amber-400 transition-colors">
                      {movie.vod_name}
                    </h3>
                    {movie.vod_year && (
                      <p className="text-xs text-white/40 mt-0.5">{movie.vod_year}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 分页 */}
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white/80 text-sm transition-all"
                >
                  <i className="fa-solid fa-chevron-left mr-1"></i> 上一页
                </button>
                <span className="px-4 py-2 text-white/60 text-sm">
                  {page} / {pageCount}
                </span>
                <button
                  onClick={() => setPage(Math.min(pageCount, page + 1))}
                  disabled={page >= pageCount}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white/80 text-sm transition-all"
                >
                  下一页 <i className="fa-solid fa-chevron-right ml-1"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 详情 & 播放弹窗 */}
      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleCloseDetail}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* 弹窗头：片名 + 极简模式开关 + 关闭 */}
              <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white truncate flex items-center gap-2 min-w-0 flex-1">
                  <i className="fa-solid fa-circle-play text-amber-400 flex-shrink-0"></i>
                  <span className="truncate">{detail.vod_name}</span>
                </h2>
                <button
                  type="button"
                  onClick={toggleMinimalMode}
                  aria-pressed={minimalMode}
                  title={minimalMode ? '关闭极简模式，恢复影片介绍' : '开启极简模式，只保留换源与选集'}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    minimalMode
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <i className={`fa-solid ${minimalMode ? 'fa-compress' : 'fa-expand'}`}></i>
                  <span className="hidden sm:inline">极简模式</span>
                  {minimalMode && <span className="hidden sm:inline">· 开</span>}
                </button>
                <button
                  onClick={handleCloseDetail}
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                  aria-label="关闭"
                >
                  <i className="fa-solid fa-times text-white/80"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* ① 播放器：所有线路都直接播 m3u8，不再有 iframe 嵌入分支 */}
                {currentPlayUrl ? (
                  <CustomVideoPlayer
                    src={currentPlayUrl}
                    onPrevEpisode={currentEpisode > 0 ? handlePrevEpisode : undefined}
                    onNextEpisode={currentEpisode < currentEpisodes.length - 1 ? handleNextEpisode : undefined}
                  />
                ) : lineLoading ? (
                  <div className="bg-black aspect-video flex items-center justify-center px-6">
                    <div className="text-center max-w-md">
                      <i className="fa-solid fa-spinner fa-spin text-4xl text-amber-400 mb-3"></i>
                      <p className="text-white/80 text-sm mb-2">正在从「{currentLine.name}」搜索片源…</p>
                      <p className="text-white/50 text-xs leading-relaxed">
                        正在从第三方获取资源，通常需要 10 秒左右，可能根据网络环境会受到影响。若超过 30 秒无反应，则建议您切换线路。
                      </p>
                    </div>
                  </div>
                ) : lineError ? (
                  <div className="bg-black aspect-video flex items-center justify-center px-6">
                    <div className="text-center max-w-sm">
                      <i className="fa-solid fa-circle-exclamation text-4xl text-red-400 mb-3"></i>
                      <p className="text-white/80 text-sm mb-1">{lineError}</p>
                      <p className="text-white/50 text-xs">请尝试切换其他播放线路</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <i className="fa-solid fa-circle-play text-5xl text-white/30 mb-3"></i>
                      <p className="text-white/50 text-sm">请从下方选择剧集开始播放</p>
                    </div>
                  </div>
                )}

                {/* ② 换源：每条线路自动显示实时延迟，当前源单独标注 */}
                <div className="px-4 pt-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <i className="fa-solid fa-shuffle text-amber-400 text-sm"></i>
                        <span className="text-sm text-white/70">播放线路</span>
                        <span className={`inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[11px] ${latencyTone(lineLatency[currentLineId])}`}>
                          <i className="fa-solid fa-bolt text-[9px]"></i>
                          当前源 {currentLine.name} · {latencyLabel(lineLatency[currentLineId], latencyLoading)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void measureLines(true)}
                        disabled={latencyLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs text-white/70 transition-all"
                        title="重新测量所有线路延迟"
                      >
                        <i className={`fa-solid fa-rotate-right text-[10px] ${latencyLoading ? 'fa-spin' : ''}`}></i>
                        刷新测速
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PLAY_LINES.map((line) => {
                        const lat = lineLatency[line.id];
                        return (
                          <button
                            key={line.id}
                            type="button"
                            onClick={() => handleSwitchLine(line.id)}
                            className={`min-w-[5.5rem] px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-all ${
                              currentLineId === line.id
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <i className={`fa-solid ${line.type === 'hls' ? 'fa-bolt' : 'fa-server'} text-[10px]`}></i>
                              {line.name}
                            </span>
                            <span className={`block text-[10px] font-normal mt-0.5 ${currentLineId === line.id ? 'text-white/90' : latencyTone(lat)}`}>
                              {latencyLabel(lat, latencyLoading)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ③ 选集：只保留剧集网格，去掉缩放 / 全屏 / 当前集文字等冗余控件 */}
                {currentEpisodes.length > 0 && (
                  <div className="px-4 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-list-ol text-amber-400 text-sm"></i>
                      <span className="text-sm text-white/70">选集</span>
                      <span className="text-xs text-white/40">共 {currentEpisodes.length} 集</span>
                    </div>
                    <div className={`grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 overflow-y-auto pr-1 ${minimalMode ? 'max-h-[42vh]' : 'max-h-52'}`}>
                      {currentEpisodes.map((ep, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleEpisodeClick(idx)}
                          className={`px-2 py-2 rounded-lg text-sm transition-all truncate ${
                            currentEpisode === idx
                              ? 'bg-amber-500 text-white font-medium'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                          title={ep.name}
                        >
                          {ep.name || `第${idx + 1}集`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ④ 影片介绍与免责声明：极简模式下完全不显示 */}
                {!minimalMode && (
                  <>
                    <div className="px-4 pt-5 pb-4">
                      <div className="flex flex-col md:flex-row gap-5">
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                          <div className="w-32 md:w-40 aspect-[2/3] rounded-lg overflow-hidden bg-white/5 border border-white/10">
                            {detail.vod_pic ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={detail.vod_pic} alt={detail.vod_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="fa-solid fa-image text-3xl text-white/20"></i>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            {detail.vod_year && (
                              <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">{detail.vod_year}</span>
                            )}
                            {detail.vod_class && (
                              <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs text-amber-400">{detail.vod_class}</span>
                            )}
                            {detail.vod_remarks && (
                              <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">{detail.vod_remarks}</span>
                            )}
                            {detail.vod_score && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 rounded text-xs text-yellow-400">
                                <i className="fa-solid fa-star mr-1"></i>{detail.vod_score}
                              </span>
                            )}
                          </div>
                          {detail.vod_director && (
                            <p className="text-sm text-white/70 mb-2">
                              <span className="text-white/40">导演：</span>{detail.vod_director}
                            </p>
                          )}
                          {detail.vod_actor && (
                            <p className="text-sm text-white/70 mb-2 line-clamp-2">
                              <span className="text-white/40">主演：</span>{detail.vod_actor}
                            </p>
                          )}
                          {detail.vod_content && (
                            <p className="text-sm text-white/60 line-clamp-4 leading-relaxed">
                              <span className="text-white/40">简介：</span>
                              {detail.vod_content.replace(/<[^>]+>/g, '')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-amber-500/5 border-t border-amber-500/20">
                      <p className="text-xs text-amber-200/80 leading-relaxed">
                        <i className="fa-solid fa-shield-halved mr-1.5 text-amber-400"></i>
                        <span className="font-medium text-amber-300">免责声明：</span>
                        {DISCLAIMER_MAIN}
                      </p>
                      <p className="text-xs text-white/40 mt-1 ml-5">
                        <i className="fa-solid fa-circle-info mr-1"></i>
                        {DISCLAIMER_SUB}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 详情加载中 */}
        {detailLoading && !detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-white/30 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-white/70 text-sm">加载影片详情...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 采集站设置弹窗 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-gear text-amber-400"></i>
                  采集站设置
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
                >
                  <i className="fa-solid fa-times text-white/70"></i>
                </button>
              </div>

              <p className="text-xs text-white/50 mb-3 leading-relaxed">
                本站通过苹果 CMS V10 标准接口从第三方采集站获取影片数据。可从下方预设列表中选择，也可在输入框自定义其他同格式采集站地址。
              </p>

              {/* 极简模式开关（与播放页头部的快捷开关共用同一状态） */}
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-white/80">极简模式</p>
                  <p className="text-[11px] text-white/40 mt-0.5">播放页隐藏影片介绍与免责声明，只保留换源和选集</p>
                </div>
                <button
                  type="button"
                  onClick={toggleMinimalMode}
                  aria-pressed={minimalMode}
                  aria-label="切换极简模式"
                  className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${minimalMode ? 'bg-amber-500' : 'bg-white/20'}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      minimalMode ? 'left-[1.375rem]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* 预设采集站列表 */}
              <div className="mb-4">
                <p className="text-sm text-white/70 mb-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-list text-amber-400 text-xs"></i>
                  预设采集站
                </p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {COLLECTOR_PRESETS.map((preset) => {
                    const isActive = collectorInput === preset.url;
                    return (
                      <button
                        key={preset.url}
                        onClick={() => setCollectorInput(preset.url)}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                          isActive
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            {isActive && <i className="fa-solid fa-circle-check text-xs"></i>}
                            {preset.name}
                          </span>
                          <span className="text-[10px] text-white/40 flex-shrink-0">{preset.note}</span>
                        </div>
                        <div className="text-[10px] text-white/30 truncate mt-0.5 font-mono">{preset.url}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 自定义输入 */}
              <label className="block text-sm text-white/70 mb-2 flex items-center gap-1.5">
                <i className="fa-solid fa-pen-to-square text-amber-400 text-xs"></i>
                自定义采集站地址
              </label>
              <input
                type="text"
                value={collectorInput}
                onChange={(e) => setCollectorInput(e.target.value)}
                placeholder="https://example.com/api.php/provide/vod/"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-500/50 mb-4"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setCollectorInput(DEFAULT_COLLECTOR)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/70 text-sm rounded-lg transition-all"
                >
                  恢复默认
                </button>
                <button
                  onClick={handleSaveCollector}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-all font-medium"
                >
                  保存并刷新
                </button>
              </div>

              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  <i className="fa-solid fa-info-circle mr-1"></i>
                  {DISCLAIMER_MAIN}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部版权 */}
      <div className="relative z-10 text-center py-6 text-xs text-white/30">
        <p>本站不存储任何视频内容，所有资源来自第三方采集站 · 仅供学习交流</p>
      </div>

      {/* 右下角更新记录按钮 */}
      <button
        onClick={() => setShowUpdateLog(true)}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-110 transition-transform group"
        aria-label="更新记录"
        title="更新记录"
      >
        <i className="fa-solid fa-clock-rotate-left text-white text-lg group-hover:rotate-12 transition-transform"></i>
      </button>

      {/* 更新记录弹窗 */}
      <AnimatePresence>
        {showUpdateLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setShowUpdateLog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <i className="fa-solid fa-clock-rotate-left text-white text-sm"></i>
                  </div>
                  <h3 className="text-lg font-bold text-white">更新记录</h3>
                </div>
                <button
                  onClick={() => setShowUpdateLog(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>

              <UpdateTimeline releases={MOVIE_RELEASES} />

              <button
                onClick={() => setShowUpdateLog(false)}
                className="w-full mt-5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-all font-medium"
              >
                我知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 测试阶段提醒弹窗 */}
      <AnimatePresence>
        {showBetaNotice && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBetaNotice(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-xl shadow-2xl w-full max-w-md p-6 border border-amber-500/40 relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowBetaNotice(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                aria-label="关闭"
              >
                <i className="fa-solid fa-times"></i>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-triangle-exclamation text-amber-400 text-xl"></i>
                </div>
                <h2 className="text-xl font-bold text-amber-300">测试阶段提醒</h2>
              </div>

              <div className="space-y-3 text-slate-200 text-sm leading-relaxed">
                <p>现在是测试阶段，很多功能尚不完善，部分影片无法播放，请谅解。</p>
                <p>
                  有什么需求可以向{' '}
                  <a
                    href="mailto:lyjy0505@qq.com"
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    lyjy0505@qq.com
                  </a>{' '}
                  这个邮箱发送信息。
                </p>
              </div>

              <button
                onClick={() => {
                  sessionStorage.setItem('movie_beta_notice_shown', '1');
                  setShowBetaNotice(false);
                }}
                className="w-full mt-5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-all font-medium"
              >
                我已了解
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

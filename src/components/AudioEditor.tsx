'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, Scissors, Play, Pause, Loader2, Plus, Trash2, Wand2, Music, VolumeX, Undo2, Redo2, Eraser } from 'lucide-react';

interface AudioEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialAudioUrl?: string; // 从 TTS 生成结果传入
}

interface Clip {
  id: string;
  name: string;
  audioBuffer: AudioBuffer;
  start: number; // 在原始 buffer 中的起始秒
  end: number;   // 在原始 buffer 中的结束秒
  color: string;
}

const CLIP_COLORS = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#fb923c'];

export default function AudioEditor({ isOpen, onClose, initialAudioUrl }: AudioEditorProps) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [fileName, setFileName] = useState('audio');
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [selStart, setSelStart] = useState(0);
  const [selEnd, setSelEnd] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [pitchSemitones, setPitchSemitones] = useState(0);
  const [volume, setVolume] = useState(1);
  // 撤销/重做历史
  const [history, setHistory] = useState<AudioBuffer[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 初始化 AudioContext
  const getCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  // 保存到历史记录（用于撤销/重做）
  const pushHistory = useCallback((buf: AudioBuffer) => {
    setHistory((prev) => {
      const newHist = prev.slice(0, historyIdx + 1);
      newHist.push(buf);
      // 限制历史记录数量，避免内存溢出
      if (newHist.length > 20) newHist.shift();
      return newHist;
    });
    setHistoryIdx((prev) => Math.min(prev + 1, 19));
  }, [historyIdx]);

  // 从 URL 加载音频
  const loadAudioFromUrl = useCallback(async (url: string) => {
    // 拦截无效的音频 URL
    if (!url || url === 'web-speech-api' || (!url.startsWith('data:audio/') && !url.startsWith('http'))) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('音频加载失败（HTTP ' + res.status + '）');
      }
      const arrBuf = await res.arrayBuffer();
      if (arrBuf.byteLength === 0) {
        throw new Error('音频数据为空');
      }
      const ctx = getCtx();
      const decoded = await ctx.decodeAudioData(arrBuf);
      setAudioBuffer(decoded);
      setSelStart(0);
      setSelEnd(decoded.duration);
      // 重置历史
      setHistory([decoded]);
      setHistoryIdx(0);
    } catch (e) {
      console.warn('AudioEditor loadAudioFromUrl failed:', e instanceof Error ? e.message : e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 打开时如果有初始 URL 则加载
  useEffect(() => {
    if (isOpen && initialAudioUrl && !audioBuffer) {
      loadAudioFromUrl(initialAudioUrl);
    }
  }, [isOpen, initialAudioUrl, audioBuffer, loadAudioFromUrl]);

  // 文件选择
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name.replace(/\.[^.]+$/, '') || 'audio');
    const url = URL.createObjectURL(f);
    setAudioBuffer(null);
    loadAudioFromUrl(url);
  };

  // 绘制波形
  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const mid = height / 2;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const v = data[i * step + j] || 0;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = mid + min * mid;
      const y2 = mid + max * mid;
      ctx.moveTo(i, y1);
      ctx.lineTo(i, y2);
    }
    ctx.stroke();

    // 选中区域高亮
    if (selEnd > selStart && buffer.duration > 0) {
      const sx = (selStart / buffer.duration) * width;
      const ex = (selEnd / buffer.duration) * width;
      ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
      ctx.fillRect(sx, 0, ex - sx, height);
      // 选区边界线
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.moveTo(ex, 0);
      ctx.lineTo(ex, height);
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (audioBuffer) drawWaveform(audioBuffer);
  }, [audioBuffer, selStart, selEnd]);

  // 拖拽选区（移除 onCanvasClick，只保留 mousedown 拖拽）
  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const startT = ratio * audioBuffer.duration;
    setSelStart(startT);
    setSelEnd(startT);

    let hasMoved = false;
    const onMove = (ev: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const ra = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const t = ra * audioBuffer.duration;
      // 拖拽时设置选区终点（允许向左拖）
      if (t < startT) {
        setSelStart(t);
        setSelEnd(startT);
      } else {
        setSelStart(startT);
        setSelEnd(t);
      }
      hasMoved = true;
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // 如果没有拖动（单击），保持选区为单点（selStart = selEnd）
      // 用户可以用输入框精确设置终点
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 停止播放
  const stopPlay = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setPlaying(false);
  };

  // 播放选中片段
  const playSelection = async () => {
    if (!audioBuffer) return;
    stopPlay();
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;

    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);

    const start = Math.max(0, Math.min(selStart, audioBuffer.duration));
    const end = Math.max(start, Math.min(selEnd, audioBuffer.duration));
    // 如果选区为零（单击），播放从该点开始的 0.5 秒预览
    const dur = end - start > 0.01 ? end - start : Math.min(0.5, audioBuffer.duration - start);
    source.start(0, start, dur);
    sourceRef.current = source;
    gainRef.current = gain;
    setPlaying(true);
    source.onended = () => {
      setPlaying(false);
      sourceRef.current = null;
    };
  };

  // 剪切片段（添加到片段列表）
  const cutClip = () => {
    if (!audioBuffer) return;
    const ctx = getCtx();
    const start = Math.max(0, Math.min(selStart, audioBuffer.duration));
    const end = Math.max(start + 0.01, Math.min(selEnd, audioBuffer.duration));
    const dur = end - start;
    if (dur < 0.01) {
      alert('请先在波形上拖拽选择一段区域');
      return;
    }
    const clipBuffer = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      Math.ceil(dur * audioBuffer.sampleRate),
      audioBuffer.sampleRate
    );
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const src = audioBuffer.getChannelData(ch);
      const dst = clipBuffer.getChannelData(ch);
      const startIdx = Math.floor(start * audioBuffer.sampleRate);
      const len = Math.min(dst.length, src.length - startIdx);
      for (let i = 0; i < len; i++) dst[i] = src[i];
    }
    const id = `clip-${Date.now()}-${Math.random()}`;
    setClips((prev) => [
      ...prev,
      {
        id,
        name: `片段 ${prev.length + 1}`,
        audioBuffer: clipBuffer,
        start,
        end,
        color: CLIP_COLORS[prev.length % CLIP_COLORS.length],
      },
    ]);
  };

  // 删除选区（从原音频中移除选中部分，前后拼接）
  const deleteSelection = () => {
    if (!audioBuffer) return;
    const start = Math.max(0, Math.min(selStart, audioBuffer.duration));
    const end = Math.max(start + 0.001, Math.min(selEnd, audioBuffer.duration));
    if (end - start < 0.001) {
      alert('请先在波形上拖拽选择要删除的区域');
      return;
    }
    const ctx = getCtx();
    const sr = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const startIdx = Math.floor(start * sr);
    const endIdx = Math.floor(end * sr);
    const newLen = audioBuffer.length - (endIdx - startIdx);
    if (newLen <= 0) {
      alert('不能删除全部音频');
      return;
    }
    const newBuffer = ctx.createBuffer(channels, newLen, sr);
    for (let ch = 0; ch < channels; ch++) {
      const src = audioBuffer.getChannelData(ch);
      const dst = newBuffer.getChannelData(ch);
      // 前半部分
      for (let i = 0; i < startIdx; i++) dst[i] = src[i];
      // 后半部分
      for (let i = endIdx; i < src.length; i++) dst[i - (endIdx - startIdx)] = src[i];
    }
    setAudioBuffer(newBuffer);
    pushHistory(newBuffer);
    // 调整选区
    setSelStart(start);
    setSelEnd(start + (end - start) > newBuffer.duration ? newBuffer.duration : start);
    if (selStart >= newBuffer.duration) {
      setSelStart(0);
      setSelEnd(newBuffer.duration);
    }
  };

  // 静音选区（将选中部分的音量设为 0，但不删除）
  const muteSelection = () => {
    if (!audioBuffer) return;
    const start = Math.max(0, Math.min(selStart, audioBuffer.duration));
    const end = Math.max(start + 0.001, Math.min(selEnd, audioBuffer.duration));
    if (end - start < 0.001) {
      alert('请先在波形上拖拽选择要静音的区域');
      return;
    }
    const ctx = getCtx();
    const sr = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const newBuffer = ctx.createBuffer(channels, audioBuffer.length, sr);
    const startIdx = Math.floor(start * sr);
    const endIdx = Math.floor(end * sr);
    for (let ch = 0; ch < channels; ch++) {
      const src = audioBuffer.getChannelData(ch);
      const dst = newBuffer.getChannelData(ch);
      for (let i = 0; i < src.length; i++) {
        dst[i] = (i >= startIdx && i < endIdx) ? 0 : src[i];
      }
    }
    setAudioBuffer(newBuffer);
    pushHistory(newBuffer);
  };

  // 淡入淡出选区
  const fadeSelection = (type: 'in' | 'out') => {
    if (!audioBuffer) return;
    const start = Math.max(0, Math.min(selStart, audioBuffer.duration));
    const end = Math.max(start + 0.001, Math.min(selEnd, audioBuffer.duration));
    if (end - start < 0.001) {
      alert('请先在波形上拖拽选择要应用淡变的区域');
      return;
    }
    const ctx = getCtx();
    const sr = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const newBuffer = ctx.createBuffer(channels, audioBuffer.length, sr);
    const startIdx = Math.floor(start * sr);
    const endIdx = Math.floor(end * sr);
    const fadeLen = endIdx - startIdx;
    for (let ch = 0; ch < channels; ch++) {
      const src = audioBuffer.getChannelData(ch);
      const dst = newBuffer.getChannelData(ch);
      for (let i = 0; i < src.length; i++) {
        if (i >= startIdx && i < endIdx) {
          const progress = (i - startIdx) / fadeLen;
          const factor = type === 'in' ? progress : (1 - progress);
          dst[i] = src[i] * factor;
        } else {
          dst[i] = src[i];
        }
      }
    }
    setAudioBuffer(newBuffer);
    pushHistory(newBuffer);
  };

  // 撤销
  const undo = () => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setAudioBuffer(history[newIdx]);
      setSelStart(0);
      setSelEnd(history[newIdx].duration);
    }
  };

  // 重做
  const redo = () => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      setAudioBuffer(history[newIdx]);
      setSelStart(0);
      setSelEnd(history[newIdx].duration);
    }
  };

  const removeClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  const playClip = async (clip: Clip) => {
    stopPlay();
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = clip.audioBuffer;
    source.playbackRate.value = playbackRate;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    sourceRef.current = source;
    setPlaying(true);
    source.onended = () => {
      setPlaying(false);
      sourceRef.current = null;
    };
  };

  // 合并所有片段为一个音频（按顺序拼接）
  const mergeClips = async () => {
    if (clips.length === 0) return;
    const ctx = getCtx();
    const sampleRate = clips[0].audioBuffer.sampleRate;
    const channels = clips[0].audioBuffer.numberOfChannels;
    const totalLen = clips.reduce((s, c) => s + c.audioBuffer.length, 0);
    const merged = ctx.createBuffer(channels, totalLen, sampleRate);
    let offset = 0;
    for (const c of clips) {
      for (let ch = 0; ch < channels; ch++) {
        const src = c.audioBuffer.getChannelData(ch);
        const dst = merged.getChannelData(ch);
        for (let i = 0; i < src.length; i++) dst[offset + i] = src[i];
      }
      offset += c.audioBuffer.length;
    }
    // 下载
    const wav = audioBufferToWav(merged);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_merged.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出当前音频为 WAV
  const exportAudio = async () => {
    if (!audioBuffer) return;
    setLoading(true);
    try {
      const ctx = getCtx();
      const rate = playbackRate;
      const newLen = Math.ceil(audioBuffer.length / rate);
      const out = ctx.createBuffer(audioBuffer.numberOfChannels, newLen, audioBuffer.sampleRate);
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const src = audioBuffer.getChannelData(ch);
        const dst = out.getChannelData(ch);
        for (let i = 0; i < newLen; i++) {
          dst[i] = (src[Math.floor(i * rate)] || 0) * volume;
        }
      }
      const wav = audioBufferToWav(out);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}_export.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : '导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 清理
  const reset = () => {
    stopPlay();
    setAudioBuffer(null);
    setClips([]);
    setSelStart(0);
    setSelEnd(0);
    setPlaybackRate(1);
    setPitchSemitones(0);
    setVolume(1);
    setHistory([]);
    setHistoryIdx(-1);
  };

  useEffect(() => {
    return () => stopPlay();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gradient-to-br from-slate-900 to-pink-950 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto border border-pink-500/30"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex justify-between items-center p-5 border-b border-pink-500/20 bg-black/30">
              <h2 className="text-xl font-bold flex items-center gap-2 text-pink-300">
                <Music className="h-5 w-5" />
                音频编辑器
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={historyIdx <= 0}
                  title="撤销"
                  className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={historyIdx >= history.length - 1}
                  title="重做"
                  className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Redo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={reset}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
                >
                  重置
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-pink-500/20 transition-colors text-pink-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* 上传 */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  onChange={onPickFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white text-sm hover:bg-pink-700"
                >
                  <Upload className="h-4 w-4" />
                  上传音频
                </button>
                {initialAudioUrl && !audioBuffer && (
                  <button
                    onClick={() => loadAudioFromUrl(initialAudioUrl)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700"
                  >
                    <Wand2 className="h-4 w-4" />
                    加载朗读结果
                  </button>
                )}
                {loading && <Loader2 className="h-4 w-4 animate-spin text-pink-400" />}
                {audioBuffer && (
                  <span className="text-xs text-slate-400">
                    时长 {audioBuffer.duration.toFixed(2)}s · {audioBuffer.sampleRate}Hz · {audioBuffer.numberOfChannels}声道
                  </span>
                )}
              </div>

              {/* 波形 */}
              {audioBuffer && (
                <div className="space-y-2">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={160}
                    onMouseDown={onCanvasMouseDown}
                    className="w-full h-40 rounded-lg border border-slate-700 cursor-crosshair"
                  />
                  {/* 选区信息与精确控制 */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>选区：</span>
                      <input
                        type="number"
                        min="0"
                        max={audioBuffer.duration}
                        step="0.01"
                        value={selStart.toFixed(2)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!isNaN(v)) setSelStart(Math.max(0, Math.min(v, audioBuffer.duration)));
                        }}
                        className="w-16 px-1 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-200 text-center"
                      />
                      <span>s -</span>
                      <input
                        type="number"
                        min="0"
                        max={audioBuffer.duration}
                        step="0.01"
                        value={selEnd.toFixed(2)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!isNaN(v)) setSelEnd(Math.max(0, Math.min(v, audioBuffer.duration)));
                        }}
                        className="w-16 px-1 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-200 text-center"
                      />
                      <span>s</span>
                    </div>
                    <span className="text-pink-400">时长：{(selEnd - selStart).toFixed(2)}s</span>
                    <button
                      onClick={() => { setSelStart(0); setSelEnd(audioBuffer.duration); }}
                      className="text-pink-400 hover:text-pink-300"
                    >
                      全选
                    </button>
                    <button
                      onClick={() => { setSelStart(0); setSelEnd(0); }}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      清除选区
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    提示：在波形上按住鼠标拖拽选择任意长度区域（支持零点几秒），也可用上方输入框精确设置起止时间
                  </p>
                </div>
              )}

              {/* 控制参数 */}
              {audioBuffer && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <label className="text-xs text-slate-300">播放速度：{playbackRate.toFixed(2)}x</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">变速同时变调</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300">音量：{Math.round(volume * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300">音调（半音）：{pitchSemitones}</label>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={pitchSemitones}
                      onChange={(e) => setPitchSemitones(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">导出时与变速合并生效</p>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              {audioBuffer && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={playing ? stopPlay : playSelection}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {playing ? '停止' : '播放选区'}
                    </button>
                    <button
                      onClick={cutClip}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white text-sm hover:bg-pink-700"
                    >
                      <Scissors className="h-4 w-4" />
                      剪切到片段列表
                    </button>
                    <button
                      onClick={deleteSelection}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除选区
                    </button>
                    <button
                      onClick={muteSelection}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-600 text-white text-sm hover:bg-slate-500"
                    >
                      <VolumeX className="h-4 w-4" />
                      静音选区
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => fadeSelection('in')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/80 text-white text-xs hover:bg-purple-600"
                    >
                      淡入
                    </button>
                    <button
                      onClick={() => fadeSelection('out')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/80 text-white text-xs hover:bg-purple-600"
                    >
                      淡出
                    </button>
                    <button
                      onClick={exportAudio}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      导出音频
                    </button>
                  </div>
                </div>
              )}

              {/* 片段列表 */}
              {clips.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-300">片段列表（{clips.length}）</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setClips([])}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs hover:bg-slate-600"
                      >
                        <Eraser className="h-3 w-3" />
                        清空
                      </button>
                      <button
                        onClick={mergeClips}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs hover:bg-purple-700"
                      >
                        <Plus className="h-3 w-3" />
                        合并并下载
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {clips.map((c, i) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 rounded-lg bg-slate-800/50 border border-slate-700 p-2.5"
                      >
                        <div
                          className="w-2 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {c.start.toFixed(2)}s - {c.end.toFixed(2)}s · {c.audioBuffer.duration.toFixed(2)}s
                          </p>
                        </div>
                        <button
                          onClick={() => playClip(c)}
                          className="p-1.5 rounded-md bg-blue-600/30 text-blue-300 hover:bg-blue-600/50"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeClip(c.id)}
                          className="p-1.5 rounded-md bg-red-600/30 text-red-300 hover:bg-red-600/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!audioBuffer && !loading && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  请上传音频文件，或加载当前朗读结果进行编辑
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============ AudioBuffer 转 WAV ============
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferLength = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV 文件头
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // 写入采样数据
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

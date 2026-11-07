'use client';

import { useEffect, useRef, useState } from 'react';
import { DropZone, Notice, ResultCard, ToolPanel, ToolProgress } from './primitives';
import { useTask } from './useTask';
import { formatBytes } from '../core/tasks';
import {
  convertMedia,
  disposeFFmpeg,
  extractAudio,
  extractFrame,
  planAudio,
  planVideo,
  type AudioFormat,
  type VideoFormat,
} from '../core/media';

type Mode = 'video' | 'audio' | 'frame';

const VIDEO_FORMATS: { id: VideoFormat; label: string; hint: string }[] = [
  { id: 'mp4', label: 'MP4 (H.264)', hint: '兼容性最好，需要 GPL 版核心' },
  { id: 'webm', label: 'WebM (VP9)', hint: '网页友好，体积小' },
  { id: 'mkv', label: 'MKV (VP9)', hint: '容器灵活' },
  { id: 'mov', label: 'MOV (H.264)', hint: '苹果生态' },
  { id: 'gif', label: 'GIF 动图', hint: '短片段转表情包' },
];

const AUDIO_FORMATS: { id: AudioFormat; label: string; hint: string }[] = [
  { id: 'mp3', label: 'MP3', hint: '最通用，需要 GPL 版核心' },
  { id: 'wav', label: 'WAV', hint: '无损未压缩，体积大' },
  { id: 'aac', label: 'AAC (m4a)', hint: '苹果生态常用' },
  { id: 'ogg', label: 'OGG (Vorbis)', hint: '开源格式' },
  { id: 'flac', label: 'FLAC', hint: '无损压缩' },
];

export default function MediaTool() {
  const [mode, setMode] = useState<Mode>('video');
  const [file, setFile] = useState<File | null>(null);
  const [videoFmt, setVideoFmt] = useState<VideoFormat>('webm');
  const [audioFmt, setAudioFmt] = useState<AudioFormat>('mp3');
  const [crf, setCrf] = useState(28);
  const [bitrate, setBitrate] = useState(192);
  const [scale, setScale] = useState(0);
  const [frameTime, setFrameTime] = useState(1);
  const [result, setResult] = useState<{ url: string; blob: Blob; name: string } | null>(null);

  const { state, run, cancel } = useTask();
  const urls = useRef<string[]>([]);

  const release = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
  };

  // 组件卸载时释放：URL 与 FFmpeg 实例都要清
  useEffect(
    () => () => {
      release();
      disposeFFmpeg();
    },
    []
  );

  const setOut = (blob: Blob, name: string) => {
    release();
    const u = URL.createObjectURL(blob);
    urls.current.push(u);
    setResult({ url: u, blob, name });
  };

  const needsGpl =
    (mode === 'video' && planVideo(videoFmt, crf).needsGpl) ||
    (mode === 'audio' && planAudio(audioFmt, bitrate).needsGpl);

  return (
    <div className="space-y-5">
      <ToolPanel title="选择文件" subtitle="全程在浏览器本地转码，文件不会上传">
        <DropZone
          accept={mode === 'audio' ? 'audio/*,video/*' : 'video/*'}
          icon="fa-film"
          onFiles={(f) => {
            setFile(f[0]);
            release();
            setResult(null);
          }}
          hint={
            mode === 'audio'
              ? '视频或音频都行 —— 视频会自动提取音轨'
              : '支持 FFmpeg 能解码的常见格式；大文件受浏览器内存限制'
          }
        />
        {file && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px]">
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <span style={{ color: 'var(--muted-foreground)' }}>{formatBytes(file.size)}</span>
          </div>
        )}
      </ToolPanel>

      <ToolPanel title="做什么">
        <div className="flex flex-wrap gap-1.5">
          {([
            ['video', '视频转格式', 'fa-video'],
            ['audio', '提取/转换音频', 'fa-music'],
            ['frame', '抽取一帧', 'fa-camera'],
          ] as const).map(([m, label, icon]) => (
            <button
              key={m}
              type="button"
              className="tb-btn"
              onClick={() => setMode(m)}
              style={{
                background: mode === m ? 'var(--primary)' : undefined,
                color: mode === m ? 'var(--primary-foreground)' : undefined,
                borderColor: mode === m ? 'var(--primary)' : undefined,
              }}
            >
              <i className={`fa-solid ${icon} text-[11px]`} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {mode === 'video' && (
            <>
              <div>
                <p className="tb-label mb-2">目标格式</p>
                <div className="flex flex-wrap gap-1.5">
                  {VIDEO_FORMATS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="tb-btn"
                      title={f.hint}
                      onClick={() => setVideoFmt(f.id)}
                      style={{ background: videoFmt === f.id ? 'var(--primary)' : undefined, color: videoFmt === f.id ? 'var(--primary-foreground)' : undefined }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  WebM / MKV 用 VP9 + Opus，MP4 / MOV 用 H.264 + AAC。
                  旧版给 WebM 容器塞 H.264，所以<b>选 WebM 必定失败</b>。
                </p>
              </div>
              {videoFmt !== 'gif' && (
                <label className="block text-[12px]">
                  <span className="tb-label mb-1 block">
                    画质 CRF {crf}（越小越清晰、体积越大，常用 18~28）
                  </span>
                  <input type="range" min={0} max={51} value={crf} onChange={(e) => setCrf(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--primary)' }} />
                </label>
              )}
              <label className="block text-[12px]">
                <span className="tb-label mb-1 block">
                  缩放 {scale === 0 ? '保持原分辨率' : `宽度 ${scale}px`}
                </span>
                <input type="range" min={0} max={1920} step={80} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--primary)' }} />
              </label>
            </>
          )}

          {mode === 'audio' && (
            <>
              <div>
                <p className="tb-label mb-2">目标格式</p>
                <div className="flex flex-wrap gap-1.5">
                  {AUDIO_FORMATS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="tb-btn"
                      title={f.hint}
                      onClick={() => setAudioFmt(f.id)}
                      style={{ background: audioFmt === f.id ? 'var(--primary)' : undefined, color: audioFmt === f.id ? 'var(--primary-foreground)' : undefined }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  每种格式都真的走对应编码器。旧版无论选什么<b>都只输出 WAV</b>，选项形同虚设。
                </p>
              </div>
              {audioFmt !== 'wav' && audioFmt !== 'flac' && (
                <label className="block text-[12px]">
                  <span className="tb-label mb-1 block">码率 {bitrate} kbps</span>
                  <input type="range" min={64} max={320} step={32} value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--primary)' }} />
                </label>
              )}
            </>
          )}

          {mode === 'frame' && (
            <label className="block text-[12px]">
              <span className="tb-label mb-1 block">在第 {frameTime} 秒抽帧</span>
              <input type="range" min={0} max={120} value={frameTime} onChange={(e) => setFrameTime(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--primary)' }} />
              <span className="mt-1 block text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                输出 PNG 静图。旧版视频工具卡片写着「帧画面提取」，但实际只有格式转换 —— 这里是真的做了。
              </span>
            </label>
          )}
        </div>

        {needsGpl && (
          <div className="mt-4">
            <Notice tone="warn">
              所选格式的编码器（H.264 / MP3）属于 <b>GPL 版</b> FFmpeg 核心，
              首次使用会加载另一套核心文件（约 30MB）。如果加载失败，可以先试试 WebM / WAV / OGG 这些不需要 GPL 的格式。
            </Notice>
          </div>
        )}

        <button
          type="button"
          className="tb-btn tb-btn-primary mt-4"
          disabled={!file || state.status === 'running'}
          onClick={async () => {
            if (!file) return;
            release();
            setResult(null);

            const out = await run(async (ctx) => {
              ctx.progress(0.05, '加载 FFmpeg…');
              if (mode === 'video') {
                const plan = planVideo(videoFmt, crf, scale || undefined);
                const r = await convertMedia(file, plan, ctx);
                return r;
              }
              if (mode === 'audio') {
                return extractAudio(file, audioFmt, bitrate, ctx);
              }
              return extractFrame(file, frameTime, ctx);
            });

            if (out) setOut(out.blob, out.filename);
          }}
        >
          <i className="fa-solid fa-play text-[11px]" />
          开始转换
        </button>
        <ToolProgress state={state} onCancel={cancel} />
      </ToolPanel>

      {result && (
        <ToolPanel title="转换完成">
          <ResultCard
            url={result.url}
            filename={result.name}
            mime={result.blob.type}
            beforeBytes={file?.size}
            afterBytes={result.blob.size}
          />
        </ToolPanel>
      )}

      <Notice tone="info">
        <strong>性能提示：</strong>FFmpeg 跑在 WebAssembly 里，比本地软件慢不少，
        而且受浏览器内存限制 —— 建议单个文件控制在 200MB 以内。
        核心文件首次从 CDN 加载（约 30MB），之后会走浏览器缓存。
      </Notice>
    </div>
  );
}

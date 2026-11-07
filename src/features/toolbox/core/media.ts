/**
 * 音视频转换（FFmpeg.wasm）
 *
 * 修掉旧版的硬伤：
 *   - **选 WebM 必失败**：旧版用 `-c:v libx264 -c:a aac` 配 `.webm` 容器，
 *     容器与编码器不兼容，FFmpeg 直接报错。这里按容器正确映射编码器。
 *   - **音频选 MP3/AAC/OGG 实际只输出 WAV**：旧版 targetFormat 从未参与转换。
 *     这里每种格式都真的走对应编码器。
 *   - **失败不清理 MEMFS**：旧版 deleteFile 写在 try 末尾，一旦 exec 抛错就跳过，
 *     虚拟文件系统残留累积。这里用 finally 保证清理。
 *   - **实例不销毁 / 无进度**：补上 terminate() 与真实进度回调。
 */

import type { TaskContext } from './tasks';

/* ============================================================
   格式与编码器映射（这是修 WebM bug 的关键）
   ============================================================ */

export type VideoFormat = 'mp4' | 'webm' | 'mkv' | 'mov' | 'gif';
export type AudioFormat = 'mp3' | 'wav' | 'aac' | 'ogg' | 'flac';

export type CodecPlan = {
  /** 输出文件扩展名 */
  ext: string;
  /** 容器 mime */
  mime: string;
  /** FFmpeg 参数 */
  args: string[];
  /** 是否需要 GPL 版 core */
  needsGpl: boolean;
  note?: string;
};

/**
 * 按目标容器选择**兼容的**编码器组合。
 *
 * 这是旧版最容易翻车的地方：WebM 容器只接受 VP8/VP9/AV1 + Vorbis/Opus，
 * 塞 libx264 + aac 进去必然失败。
 */
export function planVideo(format: VideoFormat, crf: number, scale?: number): CodecPlan {
  const scaleArgs = scale ? ['-vf', `scale=${scale}:-2`] : [];

  switch (format) {
    case 'mp4':
      return {
        ext: 'mp4',
        mime: 'video/mp4',
        // H.264 属于 GPL 版 core 才带的编码器
        args: ['-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-c:a', 'aac', '-b:a', '128k', ...scaleArgs],
        needsGpl: true,
        note: 'MP4/H.264 需要 GPL 版 FFmpeg core',
      };
    case 'webm':
      return {
        ext: 'webm',
        mime: 'video/webm',
        // WebM 必须用 VP9 + Opus（旧版塞 libx264+aac 必然失败）
        args: ['-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-c:a', 'libopus', '-b:a', '128k', ...scaleArgs],
        needsGpl: false,
      };
    case 'mkv':
      return {
        ext: 'mkv',
        mime: 'video/x-matroska',
        args: ['-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-c:a', 'libopus', ...scaleArgs],
        needsGpl: false,
      };
    case 'mov':
      return {
        ext: 'mov',
        mime: 'video/quicktime',
        args: ['-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-c:a', 'aac', ...scaleArgs],
        needsGpl: true,
      };
    case 'gif':
      return {
        ext: 'gif',
        mime: 'image/gif',
        // 调色板滤镜链，否则 GIF 颜色很差
        args: ['-vf', 'fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0'],
        needsGpl: false,
      };
  }
}

export function planAudio(format: AudioFormat, bitrate = 192): CodecPlan {
  switch (format) {
    case 'mp3':
      // libmp3lame 需要 GPL 版 core
      return { ext: 'mp3', mime: 'audio/mpeg', args: ['-c:a', 'libmp3lame', '-b:a', `${bitrate}k`], needsGpl: true, note: 'MP3 需要 GPL 版 FFmpeg core' };
    case 'wav':
      return { ext: 'wav', mime: 'audio/wav', args: ['-c:a', 'pcm_s16le'], needsGpl: false };
    case 'aac':
      return { ext: 'm4a', mime: 'audio/mp4', args: ['-c:a', 'aac', '-b:a', `${bitrate}k`], needsGpl: false };
    case 'ogg':
      return { ext: 'ogg', mime: 'audio/ogg', args: ['-c:a', 'libvorbis', '-b:a', `${bitrate}k`], needsGpl: false };
    case 'flac':
      return { ext: 'flac', mime: 'audio/flac', args: ['-c:a', 'flac'], needsGpl: false };
  }
}

/* ============================================================
   FFmpeg 加载
   ============================================================ */

/**
 * core 的托管地址。
 *
 * 默认走 CDN。**生产环境建议自托管**：把 core 文件放到 public/ffmpeg/，
 * 然后把这里改成 '/ffmpeg'，避免 CDN 挂了整个功能不可用。
 */
const CORE_BASE = {
  lgpl: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',
  gpl: 'https://unpkg.com/@ffmpeg/core-gpl@0.12.6/dist/umd',
};

type FFmpegLike = {
  load: (opts: unknown) => Promise<void>;
  exec: (args: string[]) => Promise<number>;
  writeFile: (name: string, data: Uint8Array) => Promise<boolean>;
  readFile: (name: string) => Promise<Uint8Array | string>;
  deleteFile: (name: string) => Promise<boolean>;
  on: (event: string, cb: (data: { progress: number }) => void) => void;
  off: (event: string, cb: (data: { progress: number }) => void) => void;
  terminate: () => void;
  loaded: boolean;
};

let cached: { ffmpeg: FFmpegLike; gpl: boolean } | null = null;

/** 按需加载 FFmpeg（GPL 版与非 GPL 版分开缓存） */
export async function loadFFmpeg(needsGpl: boolean): Promise<FFmpegLike> {
  if (cached && (!needsGpl || cached.gpl)) return cached.ffmpeg;
  if (cached?.gpl === false && needsGpl) {
    // 已加载非 GPL 版但需要 GPL 编码器 —— 必须换一个实例
    cached.ffmpeg.terminate();
    cached = null;
  }

  const ffmpegMod = await import('@ffmpeg/ffmpeg');
  const FFmpeg = (ffmpegMod as unknown as { FFmpeg: new () => FFmpegLike }).FFmpeg;
  const utilMod = await import('@ffmpeg/util');
  const toBlobURL = (utilMod as unknown as { toBlobURL: (u: string, t: string) => Promise<string> }).toBlobURL;

  const ffmpeg = new FFmpeg();
  const base = needsGpl ? CORE_BASE.gpl : CORE_BASE.lgpl;

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  } catch (e) {
    throw new Error(
      `FFmpeg 核心加载失败（${needsGpl ? 'GPL' : '标准'}版）。这通常是网络问题 —— ` +
        `核心文件从 CDN 加载，首次使用需要联网。原始错误：${e instanceof Error ? e.message : '未知'}`
    );
  }

  cached = { ffmpeg, gpl: needsGpl };
  return ffmpeg;
}

/** 主动释放（组件卸载时调用） */
export function disposeFFmpeg(): void {
  if (cached) {
    try {
      cached.ffmpeg.terminate();
    } catch {
      /* 忽略 */
    }
    cached = null;
  }
}

/* ============================================================
   转换
   ============================================================ */

export type MediaConvertResult = { blob: Blob; filename: string; ext: string };

/** 通用转换：按 args 跑一次 ffmpeg */
export async function convertMedia(
  file: File,
  plan: CodecPlan,
  ctx: TaskContext,
  /** 额外的输入侧参数（如 -ss / -t 裁剪） */
  extraArgs: string[] = []
): Promise<MediaConvertResult> {
  const ffmpeg = await loadFFmpeg(plan.needsGpl);

  const inExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const inputName = `input.${inExt}`;
  const outputName = `output.${plan.ext}`;

  const onProgress = (e: { progress: number }) => {
    // FFmpeg 的 progress 是 0~1，偶尔会给负值或超过 1
    const p = Math.max(0, Math.min(1, e.progress));
    ctx.progress(0.2 + p * 0.7, `转码中… ${Math.round(p * 100)}%`);
  };

  ctx.progress(0.1, '写入文件…');

  try {
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    ctx.throwIfCancelled();

    ffmpeg.on('progress', onProgress);
    ctx.progress(0.2, '开始转码…');

    const code = await ffmpeg.exec([...extraArgs, '-i', inputName, ...plan.args, outputName]);
    if (code !== 0) {
      throw new Error(`转码失败（FFmpeg 退出码 ${code}）。可能是源文件格式不支持或参数与容器不匹配。`);
    }

    ctx.throwIfCancelled();
    ctx.progress(0.92, '读取结果…');

    const data = await ffmpeg.readFile(outputName);
    if (typeof data === 'string') throw new Error('转码输出异常');
    // 必须复制一份：MEMFS 的 buffer 在清理后就失效了
    const blob = new Blob([new Uint8Array(data)], { type: plan.mime });

    if (blob.size === 0) throw new Error('转码输出为空，请检查源文件是否完整');

    const base = file.name.replace(/\.[^.]+$/, '') || 'output';
    ctx.progress(1, '完成');

    return { blob, filename: `${base}.${plan.ext}`, ext: plan.ext };
  } finally {
    ffmpeg.off('progress', onProgress);
    // 关键：不管成功失败都清理，旧版写在 try 末尾导致异常时残留
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}

/** 从视频提取音频 */
export async function extractAudio(
  file: File,
  format: AudioFormat,
  bitrate: number,
  ctx: TaskContext
): Promise<MediaConvertResult> {
  const plan = planAudio(format, bitrate);
  return convertMedia(file, plan, ctx, ['-vn']);
}

/** 抽帧（截取某一时刻的静图） */
export async function extractFrame(
  file: File,
  timeSec: number,
  ctx: TaskContext
): Promise<MediaConvertResult> {
  const plan: CodecPlan = {
    ext: 'png',
    mime: 'image/png',
    args: ['-frames:v', '1'],
    needsGpl: false,
  };
  return convertMedia(file, plan, ctx, ['-ss', String(Math.max(0, timeSec))]);
}

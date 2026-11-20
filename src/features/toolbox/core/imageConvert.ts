/**
 * 图片转换核心（纯逻辑，无 UI）
 *
 * 修掉旧版的几个硬伤：
 *   - canvas.toBlob 不支持目标格式时**静默回退 PNG**，导致扩展名与内容不符
 *     → 这里先做能力探测，不支持就明确报错，绝不悄悄换格式
 *   - 不保留透明通道（GIF/PNG 转 JPEG 变黑底）
 *     → 目标格式不支持透明时，显式铺白底
 *   - 尺寸逻辑写死 1920×1080 横屏框，竖图被无谓压缩
 *     → 改为「按最长边」约束
 */

import type { TaskContext } from './tasks';
import { yieldToUI } from './tasks';

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'bmp' | 'gif';

export const IMAGE_FORMATS: { id: ImageFormat; label: string; ext: string; mime: string }[] = [
  { id: 'jpeg', label: 'JPEG', ext: 'jpg', mime: 'image/jpeg' },
  { id: 'png', label: 'PNG', ext: 'png', mime: 'image/png' },
  { id: 'webp', label: 'WebP', ext: 'webp', mime: 'image/webp' },
  { id: 'bmp', label: 'BMP', ext: 'bmp', mime: 'image/bmp' },
  { id: 'gif', label: 'GIF', ext: 'gif', mime: 'image/gif' },
];

/** 浏览器是否真能编码出该格式 */
const encodeCache = new Map<string, boolean>();

export async function canEncode(mime: string): Promise<boolean> {
  if (encodeCache.has(mime)) return encodeCache.get(mime)!;
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ok = await new Promise<boolean>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(!!blob && blob.type === mime),
      mime,
      0.9
    );
  });
  encodeCache.set(mime, ok);
  return ok;
}

/** 一次性探测所有格式，供 UI 提前禁用不支持的选项 */
export async function probeFormats(): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  for (const f of IMAGE_FORMATS) {
    out[f.id] = await canEncode(f.mime);
  }
  return out;
}

export type ImageOptions = {
  target: ImageFormat;
  /** 0~1，仅对 jpeg/webp 有效 */
  quality: number;
  /** 尺寸模式 */
  resize:
    | { mode: 'none' }
    | { mode: 'longest'; px: number }
    | { mode: 'percent'; percent: number }
    | { mode: 'exact'; width: number; height: number };
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
};

export type ImageResult = {
  blob: Blob;
  width: number;
  height: number;
  filename: string;
};

/** 读取图片为 HTMLImageElement */
async function loadImage(file: File, scope: TaskContext['scope']): Promise<HTMLImageElement> {
  const url = scope.url(file);
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    // 明确报错，而不是像旧版那样让 isConverting 永远卡在 true
    img.onerror = () => reject(new Error(`无法解析图片：${file.name}（可能已损坏或不是图片）`));
    img.src = url;
  });
  return img;
}

/** 按选项计算目标尺寸 */
function computeSize(w: number, h: number, resize: ImageOptions['resize']): { w: number; h: number } {
  switch (resize.mode) {
    case 'none':
      return { w, h };
    case 'longest': {
      const longest = Math.max(w, h);
      if (longest <= resize.px) return { w, h }; // 只缩不放
      const scale = resize.px / longest;
      return { w: Math.round(w * scale), h: Math.round(h * scale) };
    }
    case 'percent': {
      const scale = Math.max(1, resize.percent) / 100;
      return { w: Math.round(w * scale), h: Math.round(h * scale) };
    }
    case 'exact':
      return { w: Math.max(1, Math.round(resize.width)), h: Math.max(1, Math.round(resize.height)) };
  }
}

/**
 * 转换单张图片。
 *
 * @param transparentBg 目标格式不支持透明时用来铺底的色（默认白）
 */
export async function convertImage(
  file: File,
  options: ImageOptions,
  ctx: TaskContext
): Promise<ImageResult> {
  const fmt = IMAGE_FORMATS.find((f) => f.id === options.target)!;

  // 先探测编码能力，不支持就明确报错（旧版在这里静默产出错格式的文件）
  if (!(await canEncode(fmt.mime))) {
    throw new Error(`当前浏览器无法编码 ${fmt.label}，请换一种目标格式`);
  }

  ctx.throwIfCancelled();
  ctx.progress(0.1, '读取图片…');

  const img = await loadImage(file, ctx.scope);
  const natural = { w: img.naturalWidth, h: img.naturalHeight };
  if (!natural.w || !natural.h) throw new Error(`图片尺寸异常：${file.name}`);

  ctx.throwIfCancelled();
  ctx.progress(0.35, '计算尺寸…');

  const size = computeSize(natural.w, natural.h, options.resize);
  const rotated = options.rotate === 90 || options.rotate === 270;
  const canvasW = rotated ? size.h : size.w;
  const canvasH = rotated ? size.w : size.h;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const c2d = canvas.getContext('2d');
  if (!c2d) throw new Error('无法创建画布上下文');

  // 目标格式不支持透明 → 显式铺底，避免变成黑块
  const supportsAlpha = fmt.id === 'png' || fmt.id === 'webp' || fmt.id === 'gif';
  if (!supportsAlpha) {
    c2d.fillStyle = '#ffffff';
    c2d.fillRect(0, 0, canvasW, canvasH);
  }

  c2d.imageSmoothingEnabled = true;
  c2d.imageSmoothingQuality = 'high';

  c2d.save();
  c2d.translate(canvasW / 2, canvasH / 2);
  c2d.rotate((options.rotate * Math.PI) / 180);
  c2d.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);
  c2d.drawImage(img, -size.w / 2, -size.h / 2, size.w, size.h);
  c2d.restore();

  ctx.throwIfCancelled();
  ctx.progress(0.7, '编码中…');
  await yieldToUI(); // 让出主线程，避免大图卡死 UI

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      fmt.mime,
      fmt.id === 'jpeg' || fmt.id === 'webp' ? options.quality : undefined
    );
  });

  if (!blob) throw new Error(`编码失败（${fmt.label}）`);
  // 二次确认：某些浏览器会「成功」返回但其实是别的格式
  if (blob.type && blob.type !== fmt.mime && !(fmt.id === 'jpeg' && blob.type === 'image/jpg')) {
    throw new Error(`浏览器实际输出的是 ${blob.type}，与所选 ${fmt.label} 不一致`);
  }

  ctx.progress(1, '完成');

  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  const suffix = [
    options.resize.mode === 'longest' ? `${size.w}x${size.h}` : '',
    options.rotate ? `r${options.rotate}` : '',
  ]
    .filter(Boolean)
    .join('_');

  return {
    blob,
    width: canvasW,
    height: canvasH,
    filename: `${base}${suffix ? '_' + suffix : ''}.${fmt.ext}`,
  };
}

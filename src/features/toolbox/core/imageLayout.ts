/**
 * 图片加工核心：长图拼接 / 九宫格切图 / 固定比例裁剪 / EXIF 清除
 *
 * 全部用 canvas 在浏览器本地完成：
 *   - 输出 PNG 保留透明通道；输出 JPEG 铺白底并提示
 *   - EXIF 清除后回扫输出字节，仍带 Exif 标记就报错，绝不交付带元数据的文件
 *   - 图片 URL 由 TaskContext.scope 统一登记，任务结束自动 revoke
 */

import type { TaskContext } from './tasks';
import { yieldToUI } from './tasks';

/* ============================================================
   公共工具
   ============================================================ */

export type ImageOutput = { blob: Blob; filename: string; width: number; height: number };

async function loadImage(file: File, ctx: TaskContext): Promise<HTMLImageElement> {
  const url = ctx.scope.url(file);
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`无法解析图片：${file.name}（可能已损坏或不是图片）`));
    img.src = url;
  });
  return img;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('画布编码失败，输出为空'))),
      type,
      quality
    );
  });
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '') || 'image';
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const c = canvas.getContext('2d');
  if (!c) throw new Error('无法创建画布上下文');
  return c;
}

/* ============================================================
   长图拼接
   ============================================================ */

export type ConcatOptions = {
  direction: 'horizontal' | 'vertical' | 'grid';
  /** 间距（像素） */
  gap: number;
  /** CSS 颜色；'transparent' 表示保留透明（仅 PNG 有效） */
  background: string;
  /** 输出总宽度（像素）；0 表示按原始尺寸 */
  outputWidth: number;
  /** 网格列数 */
  columns: number;
};

/**
 * 多图拼接。返回单张 PNG（保留透明）—— 「不支持透明时铺白底」由调用方在选择
 * 非 PNG 输出时负责，这里固定输出 PNG 以免破坏用户的透明背景。
 */
export async function concatImages(
  files: File[],
  opts: ConcatOptions,
  ctx: TaskContext
): Promise<ImageOutput> {
  if (files.length < 2) throw new Error('拼接至少需要 2 张图片');
  const gap = Math.max(0, Math.floor(opts.gap));
  const images: HTMLImageElement[] = [];

  for (let i = 0; i < files.length; i++) {
    ctx.throwIfCancelled();
    ctx.progress((i / files.length) * 0.4, `读取第 ${i + 1}/${files.length} 张…`);
    images.push(await loadImage(files[i], ctx));
  }

  const sizes = images.map((img) => ({ w: img.naturalWidth, h: img.naturalHeight }));
  const maxW = Math.max(...sizes.map((s) => s.w));
  const maxH = Math.max(...sizes.map((s) => s.h));
  const targetW = Math.max(0, Math.floor(opts.outputWidth));
  let scale = 1;
  let canvasW = 0;
  let canvasH = 0;
  let columns = 1;
  let rows = 1;
  let cellW = 0;
  let cellH = 0;

  if (opts.direction === 'horizontal') {
    const natural = sizes.reduce((sum, s) => sum + s.w, 0) + gap * (images.length - 1);
    scale = targetW > 0 ? targetW / natural : 1;
    canvasW = Math.ceil(sizes.reduce((sum, s) => sum + s.w * scale, 0) + gap * (images.length - 1));
    canvasH = Math.ceil(Math.max(...sizes.map((s) => s.h * scale)));
  } else if (opts.direction === 'vertical') {
    scale = targetW > 0 ? targetW / maxW : 1;
    canvasW = Math.ceil(maxW * scale);
    canvasH = Math.ceil(sizes.reduce((sum, s) => sum + s.h * scale, 0) + gap * (images.length - 1));
  } else {
    columns = Math.max(1, Math.min(images.length, Math.floor(opts.columns) || 2));
    rows = Math.ceil(images.length / columns);
    const natural = columns * maxW + (columns - 1) * gap;
    scale = targetW > 0 ? targetW / natural : 1;
    cellW = Math.ceil(maxW * scale);
    cellH = Math.ceil(maxH * scale);
    canvasW = cellW * columns + gap * (columns - 1);
    canvasH = cellH * rows + gap * (rows - 1);
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const c2d = context2d(canvas);

  if (opts.background === 'transparent') {
    c2d.clearRect(0, 0, canvasW, canvasH);
  } else {
    c2d.fillStyle = opts.background;
    c2d.fillRect(0, 0, canvasW, canvasH);
  }
  c2d.imageSmoothingEnabled = true;
  c2d.imageSmoothingQuality = 'high';

  if (opts.direction === 'horizontal') {
    let x = 0;
    for (let i = 0; i < images.length; i++) {
      ctx.throwIfCancelled();
      const w = sizes[i].w * scale;
      const h = sizes[i].h * scale;
      c2d.drawImage(images[i], 0, 0, sizes[i].w, sizes[i].h, x, (canvasH - h) / 2, w, h);
      x += w + gap;
      ctx.progress(0.4 + ((i + 1) / images.length) * 0.5, `拼接第 ${i + 1}/${images.length} 张…`);
      await yieldToUI();
    }
  } else if (opts.direction === 'vertical') {
    let y = 0;
    for (let i = 0; i < images.length; i++) {
      ctx.throwIfCancelled();
      const w = sizes[i].w * scale;
      const h = sizes[i].h * scale;
      c2d.drawImage(images[i], 0, 0, sizes[i].w, sizes[i].h, (canvasW - w) / 2, y, w, h);
      y += h + gap;
      ctx.progress(0.4 + ((i + 1) / images.length) * 0.5, `拼接第 ${i + 1}/${images.length} 张…`);
      await yieldToUI();
    }
  } else {
    for (let i = 0; i < images.length; i++) {
      ctx.throwIfCancelled();
      const col = i % columns;
      const row = Math.floor(i / columns);
      const w = sizes[i].w * scale;
      const h = sizes[i].h * scale;
      const x = col * (cellW + gap) + (cellW - w) / 2;
      const y = row * (cellH + gap) + (cellH - h) / 2;
      c2d.drawImage(images[i], 0, 0, sizes[i].w, sizes[i].h, x, y, w, h);
      ctx.progress(0.4 + ((i + 1) / images.length) * 0.5, `拼接第 ${i + 1}/${images.length} 张…`);
      await yieldToUI();
    }
  }

  ctx.progress(0.92, '编码中…');
  const blob = await canvasToBlob(canvas, 'image/png');
  ctx.progress(1, '完成');
  return { blob, filename: `${baseName(files[0].name)}_joined.png`, width: canvasW, height: canvasH };
}

/* ============================================================
   九宫格 / 任意网格切图
   ============================================================ */

export async function sliceGrid(
  file: File,
  rows: number,
  cols: number,
  ctx: TaskContext
): Promise<{ name: string; blob: Blob }[]> {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
    throw new Error('行列数必须是大于 0 的整数');
  }
  const img = await loadImage(file, ctx);
  // 用整数边界，避免切片之间出现 1px 重叠或缝隙
  const cellW = Math.floor(img.naturalWidth / cols);
  const cellH = Math.floor(img.naturalHeight / rows);
  if (cellW < 1 || cellH < 1) throw new Error('图片太小，无法按该行列数切分');

  const base = baseName(file.name);
  const out: { name: string; blob: Blob }[] = [];
  const total = rows * cols;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.throwIfCancelled();
      ctx.progress((out.length / total) * 0.9, `切图 ${out.length + 1}/${total}…`);
      const canvas = document.createElement('canvas');
      canvas.width = cellW;
      canvas.height = cellH;
      const c2d = context2d(canvas);
      c2d.drawImage(
        img,
        c * cellW,
        r * cellH,
        cellW,
        cellH,
        0,
        0,
        cellW,
        cellH
      );
      out.push({
        name: `${base}_r${r + 1}c${c + 1}.png`,
        blob: await canvasToBlob(canvas, 'image/png'),
      });
      await yieldToUI();
    }
  }

  ctx.progress(1, '完成');
  return out;
}

/* ============================================================
   固定比例居中裁剪
   ============================================================ */

export const RATIOS = {
  '1:1': { w: 1, h: 1, label: '1:1' },
  '4:3': { w: 4, h: 3, label: '4:3' },
  '16:9': { w: 16, h: 9, label: '16:9' },
  '9:16': { w: 9, h: 16, label: '9:16' },
} as const;

export type RatioKey = keyof typeof RATIOS;

/** 计算居中裁剪矩形（纯函数，便于理解与测试） */
export function centeredCropRect(
  width: number,
  height: number,
  ratio: { w: number; h: number }
): { sx: number; sy: number; sw: number; sh: number } {
  const target = ratio.w / ratio.h;
  const current = width / height;
  let sw: number;
  let sh: number;
  if (current > target) {
    sh = height;
    sw = height * target;
  } else {
    sw = width;
    sh = width / target;
  }
  return { sx: (width - sw) / 2, sy: (height - sh) / 2, sw, sh };
}

export async function cropToRatio(
  file: File,
  ratioKey: RatioKey,
  ctx: TaskContext
): Promise<ImageOutput> {
  const ratio = RATIOS[ratioKey];
  if (!ratio) throw new Error('不支持的裁剪比例');
  const img = await loadImage(file, ctx);
  const rect = centeredCropRect(img.naturalWidth, img.naturalHeight, ratio);
  const w = Math.max(1, Math.round(rect.sw));
  const h = Math.max(1, Math.round(rect.sh));

  ctx.progress(0.5, '裁剪中…');
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c2d = context2d(canvas);
  c2d.imageSmoothingQuality = 'high';
  c2d.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, w, h);

  ctx.progress(0.8, '编码中…');
  const blob = await canvasToBlob(canvas, 'image/png');
  ctx.progress(1, '完成');
  return { blob, filename: `${baseName(file.name)}_${ratioKey.replace(':', 'x')}.png`, width: w, height: h };
}

/* ============================================================
   EXIF 清除
   ============================================================ */

/** 扫描 JPEG 的 APP1 "Exif\0\0" 标记 */
export function hasJpegExif(bytes: Uint8Array): boolean {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    let marker = bytes[i + 1];
    // 跳过 FF 填充字节
    while (marker === 0xff && i + 1 < bytes.length) {
      i++;
      marker = bytes[i + 1];
    }
    if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (len < 2) break;
    if (
      marker === 0xe1 &&
      len >= 8 &&
      bytes[i + 4] === 0x45 &&
      bytes[i + 5] === 0x78 &&
      bytes[i + 6] === 0x69 &&
      bytes[i + 7] === 0x66 &&
      bytes[i + 8] === 0x00 &&
      bytes[i + 9] === 0x00
    ) {
      return true;
    }
    i += 2 + len;
  }
  return false;
}

/** PNG 的 eXIf 块（canvas 重绘不会产生，但既然要验证就一并检查） */
export function hasPngExif(bytes: Uint8Array): boolean {
  const pattern = [0x65, 0x58, 0x49, 0x66]; // eXIf
  for (let i = 0; i <= bytes.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * 重绘图片并清除全部元数据（EXIF / GPS / 拍摄参数 / ICC 等）。
 * 输出后回扫标记，发现仍带 Exif 就报错，绝不交付。
 */
export async function stripExif(
  file: File,
  format: 'png' | 'jpeg',
  quality: number,
  ctx: TaskContext
): Promise<ImageOutput> {
  const img = await loadImage(file, ctx);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const c2d = context2d(canvas);

  if (format === 'jpeg') {
    // JPEG 不支持透明：铺白底，由 UI 提示用户
    c2d.fillStyle = '#ffffff';
    c2d.fillRect(0, 0, canvas.width, canvas.height);
  }
  c2d.drawImage(img, 0, 0);

  ctx.progress(0.6, '编码中…');
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await canvasToBlob(canvas, mime, format === 'jpeg' ? quality : undefined);

  ctx.progress(0.8, '回扫元数据标记…');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const stillHasExif = format === 'jpeg' ? hasJpegExif(bytes) : hasPngExif(bytes);
  if (stillHasExif) {
    throw new Error('输出文件仍检测到 Exif 标记，已中止 —— 不会交付带元数据的文件');
  }

  ctx.progress(1, '完成');
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  return {
    blob,
    filename: `${baseName(file.name)}_clean.${ext}`,
    width: canvas.width,
    height: canvas.height,
  };
}

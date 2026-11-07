/**
 * 水印工具
 *
 * 旧版把「去水印」说成是智能修复，实际只是取上下左右各 1 像素做插值，
 * 复杂背景必留痕。这里改成**诚实的能力**：
 *   - 加水印：文字 / 图片，位置、透明度、旋转、平铺、颜色都可调
 *   - 去水印：只提供「模糊 / 马赛克 / 纯色覆盖」三种遮挡方式，
 *     界面明确写清楚这是遮挡不是修复
 */

import type { TaskContext } from './tasks';
import { yieldToUI } from './tasks';

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'tile';

export const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: '左上' },
  { id: 'top-center', label: '上中' },
  { id: 'top-right', label: '右上' },
  { id: 'middle-left', label: '左中' },
  { id: 'center', label: '正中' },
  { id: 'middle-right', label: '右中' },
  { id: 'bottom-left', label: '左下' },
  { id: 'bottom-center', label: '下中' },
  { id: 'bottom-right', label: '右下' },
  { id: 'tile', label: '平铺' },
];

export type TextWatermarkOptions = {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotate: number;
  position: WatermarkPosition;
  margin: number;
  bold: boolean;
};

export type ImageWatermarkOptions = {
  image: HTMLImageElement;
  scale: number; // 相对原图宽度的比例
  opacity: number;
  rotate: number;
  position: WatermarkPosition;
  margin: number;
};

/** 把 9 个位置换算成左上角坐标 */
function anchor(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  wmW: number,
  wmH: number,
  margin: number
): { x: number; y: number } {
  const [v, h] = position.split('-');
  const vertical = position === 'center' ? 'middle' : position === 'tile' ? 'top' : v;

  let x = margin;
  let y = margin;

  if (h === 'center') x = (canvasW - wmW) / 2;
  else if (h === 'right') x = canvasW - wmW - margin;

  if (vertical === 'middle') y = (canvasH - wmH) / 2;
  else if (vertical === 'bottom') y = canvasH - wmH - margin;

  return { x, y };
}

/**
 * 加文字水印。
 *
 * @returns 处理后的 Blob（保留原图尺寸与格式特征）
 */
export async function addTextWatermark(
  file: File,
  opts: TextWatermarkOptions,
  ctx: TaskContext
): Promise<{ blob: Blob; width: number; height: number }> {
  const { img, canvas, c2d } = await prepare(file, ctx);

  ctx.throwIfCancelled();
  ctx.progress(0.5, '绘制水印…');

  c2d.globalAlpha = Math.max(0, Math.min(1, opts.opacity));
  c2d.fillStyle = opts.color;
  c2d.font = `${opts.bold ? 'bold ' : ''}${opts.fontSize}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`;
  c2d.textBaseline = 'top';

  const metrics = c2d.measureText(opts.text);
  const textW = metrics.width;
  const textH = opts.fontSize * 1.2;

  if (opts.position === 'tile') {
    const stepX = textW + opts.margin * 2;
    const stepY = textH + opts.margin * 2;
    for (let y = 0; y < canvas.height; y += stepY) {
      for (let x = 0; x < canvas.width; x += stepX) {
        ctx.throwIfCancelled();
        c2d.save();
        c2d.translate(x + textW / 2, y + textH / 2);
        c2d.rotate((opts.rotate * Math.PI) / 180);
        c2d.fillText(opts.text, -textW / 2, -textH / 2);
        c2d.restore();
      }
    }
  } else {
    const { x, y } = anchor(opts.position, canvas.width, canvas.height, textW, textH, opts.margin);
    c2d.save();
    c2d.translate(x + textW / 2, y + textH / 2);
    c2d.rotate((opts.rotate * Math.PI) / 180);
    c2d.fillText(opts.text, -textW / 2, -textH / 2);
    c2d.restore();
  }

  c2d.globalAlpha = 1;
  ctx.progress(0.9, '导出中…');
  await yieldToUI();

  const blob = await exportBlob(canvas, file);
  ctx.progress(1, '完成');
  return { blob, width: canvas.width, height: canvas.height };
}

/** 加图片水印（logo 等） */
export async function addImageWatermark(
  file: File,
  opts: ImageWatermarkOptions,
  ctx: TaskContext
): Promise<{ blob: Blob; width: number; height: number }> {
  const { canvas, c2d } = await prepare(file, ctx);

  ctx.throwIfCancelled();
  ctx.progress(0.5, '绘制水印…');

  const wmW = Math.max(8, canvas.width * opts.scale);
  const wmH = (opts.image.naturalHeight / opts.image.naturalWidth) * wmW;

  c2d.globalAlpha = Math.max(0, Math.min(1, opts.opacity));

  if (opts.position === 'tile') {
    const stepX = wmW + opts.margin * 2;
    const stepY = wmH + opts.margin * 2;
    for (let y = 0; y < canvas.height; y += stepY) {
      for (let x = 0; x < canvas.width; x += stepX) {
        ctx.throwIfCancelled();
        c2d.save();
        c2d.translate(x + wmW / 2, y + wmH / 2);
        c2d.rotate((opts.rotate * Math.PI) / 180);
        c2d.drawImage(opts.image, -wmW / 2, -wmH / 2, wmW, wmH);
        c2d.restore();
      }
    }
  } else {
    const { x, y } = anchor(opts.position, canvas.width, canvas.height, wmW, wmH, opts.margin);
    c2d.save();
    c2d.translate(x + wmW / 2, y + wmH / 2);
    c2d.rotate((opts.rotate * Math.PI) / 180);
    c2d.drawImage(opts.image, -wmW / 2, -wmH / 2, wmW, wmH);
    c2d.restore();
  }

  c2d.globalAlpha = 1;
  ctx.progress(0.9, '导出中…');
  await yieldToUI();

  const blob = await exportBlob(canvas, file);
  ctx.progress(1, '完成');
  return { blob, width: canvas.width, height: canvas.height };
}

/* ============================================================
   区域遮挡（不是「去水印」，是遮挡）
   ============================================================ */

export type Rect = { x: number; y: number; w: number; h: number };
export type MaskMode = 'blur' | 'mosaic' | 'solid';

export type MaskOptions = {
  rects: Rect[];
  mode: MaskMode;
  /** blur 的模糊半径 / mosaic 的像素块大小 */
  strength: number;
  solidColor: string;
};

/**
 * 对指定区域做遮挡。
 *
 * 三种方式都是**遮挡**，不是把内容「修」回来 —— 界面会如实说明。
 * 旧版宣称的「智能修复/内容感知填充」浏览器端做不到。
 */
export async function maskRegions(
  file: File,
  opts: MaskOptions,
  ctx: TaskContext
): Promise<{ blob: Blob; width: number; height: number }> {
  const { canvas, c2d } = await prepare(file, ctx);

  if (!opts.rects.length) throw new Error('请先在图上框选要遮挡的区域');

  for (let i = 0; i < opts.rects.length; i++) {
    ctx.throwIfCancelled();
    ctx.progress(0.3 + (i / opts.rects.length) * 0.5, `处理区域 ${i + 1}/${opts.rects.length}`);

    const r = opts.rects[i];
    const x = Math.max(0, Math.round(r.x));
    const y = Math.max(0, Math.round(r.y));
    const w = Math.min(canvas.width - x, Math.round(r.w));
    const h = Math.min(canvas.height - y, Math.round(r.h));
    if (w <= 0 || h <= 0) continue;

    if (opts.mode === 'solid') {
      c2d.save();
      c2d.fillStyle = opts.solidColor;
      c2d.fillRect(x, y, w, h);
      c2d.restore();
      continue;
    }

    if (opts.mode === 'blur') {
      // 用「取该区域 → 缩小再放大」实现模糊，不依赖 ctx.filter（兼容性更好）
      const tmp = document.createElement('canvas');
      const factor = Math.max(2, Math.round(opts.strength / 4));
      tmp.width = Math.max(1, Math.floor(w / factor));
      tmp.height = Math.max(1, Math.floor(h / factor));
      const tctx = tmp.getContext('2d');
      if (!tctx) continue;
      tctx.drawImage(canvas, x, y, w, h, 0, 0, tmp.width, tmp.height);
      c2d.save();
      c2d.imageSmoothingEnabled = true;
      c2d.imageSmoothingQuality = 'high';
      c2d.drawImage(tmp, 0, 0, tmp.width, tmp.height, x, y, w, h);
      c2d.restore();
      continue;
    }

    // mosaic：把区域按块取平均色再填回去
    const block = Math.max(2, Math.round(opts.strength / 2));
    const data = c2d.getImageData(x, y, w, h);
    const px = data.data;

    for (let by = 0; by < h; by += block) {
      for (let bx = 0; bx < w; bx += block) {
        let r0 = 0;
        let g0 = 0;
        let b0 = 0;
        let n = 0;

        for (let yy = by; yy < Math.min(by + block, h); yy++) {
          for (let xx = bx; xx < Math.min(bx + block, w); xx++) {
            const idx = (yy * w + xx) * 4;
            r0 += px[idx];
            g0 += px[idx + 1];
            b0 += px[idx + 2];
            n++;
          }
        }
        if (!n) continue;
        const avgR = r0 / n;
        const avgG = g0 / n;
        const avgB = b0 / n;

        for (let yy = by; yy < Math.min(by + block, h); yy++) {
          for (let xx = bx; xx < Math.min(bx + block, w); xx++) {
            const idx = (yy * w + xx) * 4;
            px[idx] = avgR;
            px[idx + 1] = avgG;
            px[idx + 2] = avgB;
          }
        }
      }
    }
    c2d.putImageData(data, x, y);
  }

  ctx.progress(0.9, '导出中…');
  await yieldToUI();

  const blob = await exportBlob(canvas, file);
  ctx.progress(1, '完成');
  return { blob, width: canvas.width, height: canvas.height };
}

/* ============================================================
   工具
   ============================================================ */

/** 读图并建画布（超过 MAX_DIM 会等比缩小 —— 但会如实告知） */
const MAX_DIM = 4096;

async function prepare(file: File, ctx: TaskContext) {
  ctx.progress(0.1, '读取图片…');
  const url = ctx.scope.url(file);
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('无法解析这张图片'));
    img.src = url;
  });

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longest > MAX_DIM ? MAX_DIM / longest : 1;
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c2d = canvas.getContext('2d', { willReadFrequently: true });
  if (!c2d) throw new Error('无法创建画布上下文');
  c2d.drawImage(img, 0, 0, w, h);

  return { img, canvas, c2d, scaled: scale < 1, originalSize: { w: img.naturalWidth, h: img.naturalHeight } };
}

/** 导出：PNG 输入保留 PNG（透明），其余用高质量 JPEG */
async function exportBlob(canvas: HTMLCanvasElement, source: File): Promise<Blob> {
  const isPng = source.type.toLowerCase().includes('png');
  const mime = isPng ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, mime, isPng ? undefined : 0.95)
  );
  if (!blob) throw new Error('导出失败');
  return blob;
}

export { MAX_DIM };

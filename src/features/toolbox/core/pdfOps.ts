/**
 * PDF 处理核心：合并 / 拆分 / 旋转 / 转图片 / 提取内嵌图片
 *
 * 全部在浏览器本地完成，文件不上传。
 * 原则：
 *   - 加密或损坏的 PDF 明确报错，绝不静默产出空白页
 *   - 页码一律 1 开始给用户，内部换成 0 基索引
 *   - 每个循环都检查取消、上报真实进度
 *   - pdfjs 的 worker 只指向本地文件，绝不使用 CDN
 */

import { PDFDocument, degrees } from 'pdf-lib';
import type { TaskContext } from './tasks';
import { yieldToUI } from './tasks';

/* ============================================================
   页码范围解析（纯函数）
   ============================================================ */

/**
 * 把用户输入的页码范围解析为 **0 基** 页索引。
 *
 * 支持："1-3,5"、" 2, 4-6 "、"8"。
 * 页码从 1 开始，越界 / 逆序 / 非法字符都会明确报错。
 */
export function parsePageRanges(spec: string, totalPages: number): number[] {
  if (!Number.isInteger(totalPages) || totalPages <= 0) {
    throw new Error('PDF 没有可处理的页面');
  }
  const input = spec.trim();
  if (!input) throw new Error('页码范围不能为空');

  const result: number[] = [];
  const seen = new Set<number>();

  const push = (page: number) => {
    if (page < 1 || page > totalPages) {
      throw new Error(`页码 ${page} 超出范围（共 ${totalPages} 页）`);
    }
    const index = page - 1;
    if (!seen.has(index)) {
      seen.add(index);
      result.push(index);
    }
  };

  for (const piece of input.split(',')) {
    const seg = piece.trim();
    if (!seg) throw new Error('页码范围格式错误：出现了空片段（如 "1,,3"）');

    const range = seg.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end < 1) throw new Error(`页码必须从 1 开始：「${seg}」无效`);
      if (start > end) throw new Error(`页码范围逆序：「${seg}」，起点不能大于终点`);
      for (let p = start; p <= end; p++) push(p);
    } else if (/^\d+$/.test(seg)) {
      push(Number(seg));
    } else {
      throw new Error(`无法解析页码「${seg}」，正确写法如 "1-3,5"`);
    }
  }

  if (!result.length) throw new Error('页码范围没有选中任何页');
  return result;
}

/* ============================================================
   内部工具
   ============================================================ */

/** 明确报错，不让损坏文件变成空白页 */
async function loadSource(bytes: ArrayBuffer, name: string): Promise<PDFDocument> {
  const head = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 5));
  const signature = String.fromCharCode(...head);
  if (!signature.startsWith('%PDF-')) {
    throw new Error(`「${name}」不是有效的 PDF 文件（缺少 %PDF- 文件头）`);
  }
  try {
    // ignoreEncryption 默认 false：加密 PDF 会在这里直接抛错
    return await PDFDocument.load(bytes);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw new Error(
      `无法打开「${name}」：可能是加密或已损坏的 PDF。${detail ? `（${detail}）` : ''}`
    );
  }
}

async function fileBytes(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

function pdfBlob(bytes: Uint8Array): Blob {
  // 复制成 ArrayBuffer 视图，兼容较新的 TS BlobPart 类型定义
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

function splitBase(name: string): string {
  return name.replace(/\.pdf$/i, '') || 'document';
}

/** 把单页复制出来做成一个新文档 */
async function onePageDoc(src: PDFDocument, index: number): Promise<PDFDocument> {
  const out = await PDFDocument.create();
  const [page] = await out.copyPages(src, [index]);
  out.addPage(page);
  return out;
}

/* ============================================================
   合并
   ============================================================ */

export async function mergePdfs(files: File[], ctx: TaskContext): Promise<Blob> {
  if (files.length < 2) throw new Error('合并至少需要 2 个 PDF 文件');
  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    ctx.throwIfCancelled();
    ctx.progress((i / files.length) * 0.85, `读取第 ${i + 1}/${files.length} 个 PDF…`);

    const src = await loadSource(await fileBytes(files[i]), files[i].name);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    await yieldToUI();
  }

  ctx.throwIfCancelled();
  ctx.progress(0.9, '正在保存…');
  const bytes = await merged.save();
  ctx.progress(1, '完成');
  return pdfBlob(bytes);
}

/* ============================================================
   拆分
   ============================================================ */

export type SplitMode = { kind: 'each' } | { kind: 'ranges'; spec: string };

export async function splitPdf(
  file: File,
  mode: SplitMode,
  ctx: TaskContext
): Promise<{ name: string; blob: Blob }[]> {
  const src = await loadSource(await fileBytes(file), file.name);
  const total = src.getPageCount();
  ctx.progress(0.1, `共 ${total} 页，开始拆分…`);

  let indices: number[];
  if (mode.kind === 'each') {
    indices = Array.from({ length: total }, (_, i) => i);
  } else {
    indices = parsePageRanges(mode.spec, total);
  }

  const base = splitBase(file.name);
  const out: { name: string; blob: Blob }[] = [];

  for (let i = 0; i < indices.length; i++) {
    ctx.throwIfCancelled();
    ctx.progress(0.1 + (i / indices.length) * 0.8, `拆分第 ${i + 1}/${indices.length} 页…`);

    const doc = await onePageDoc(src, indices[i]);
    out.push({
      name: `${base}_p${indices[i] + 1}.pdf`,
      blob: pdfBlob(await doc.save()),
    });
    await yieldToUI();
  }

  ctx.progress(1, '完成');
  return out;
}

/* ============================================================
   旋转
   ============================================================ */

export type RotateTarget = { kind: 'all' } | { kind: 'ranges'; spec: string };

export async function rotatePdf(
  file: File,
  angle: 90 | 180 | 270,
  target: RotateTarget,
  ctx: TaskContext
): Promise<Blob> {
  if (![90, 180, 270].includes(angle)) throw new Error('旋转角度只能是 90 / 180 / 270');
  const doc = await loadSource(await fileBytes(file), file.name);
  const total = doc.getPageCount();

  const indices =
    target.kind === 'all'
      ? Array.from({ length: total }, (_, i) => i)
      : parsePageRanges(target.spec, total);

  for (let i = 0; i < indices.length; i++) {
    ctx.throwIfCancelled();
    ctx.progress((i / indices.length) * 0.9, `旋转第 ${i + 1}/${indices.length} 页…`);
    const page = doc.getPage(indices[i]);
    const current = page.getRotation().angle as 0 | 90 | 180 | 270;
    page.setRotation(degrees((current + angle) % 360));
    await yieldToUI();
  }

  ctx.throwIfCancelled();
  ctx.progress(0.92, '正在保存…');
  const bytes = await doc.save();
  ctx.progress(1, '完成');
  return pdfBlob(bytes);
}

/* ============================================================
   PDF → 图片 / 提取内嵌图片（pdfjs-dist，动态加载）
   ============================================================ */

/**
 * 只声明用到的 pdfjs 接口，避免把整个 pdfjs 的类型拖进首屏类型检查。
 * worker 固定用本地 /pdf/pdf.worker.min.mjs —— 绝不使用 CDN。
 */
type PdfViewport = { width: number; height: number };
type PdfOperatorList = { fnArray: number[]; argsArray: unknown[][] };
type PdfPageLike = {
  getViewport(opts: { scale: number }): PdfViewport;
  render(opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }): { promise: Promise<void> };
  getOperatorList(): Promise<PdfOperatorList>;
  objs: { get(id: string): Promise<unknown> } & Record<string, unknown>;
  cleanup(): void;
};
type PdfDocumentLike = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageLike>;
  destroy(): Promise<void>;
};
type PdfJsLike = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfDocumentLike> };
  OPS: Record<string, number>;
};

async function loadPdfJs(): Promise<PdfJsLike> {
  const mod = await import('pdfjs-dist');
  const pdfjs = mod as unknown as PdfJsLike;
  // 指向随项目一起部署的本地 worker，永不回退 CDN
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.mjs';
  return pdfjs;
}

async function openPdfDocument(file: File, pdfjs: PdfJsLike): Promise<PdfDocumentLike> {
  let data: ArrayBuffer;
  try {
    data = await file.arrayBuffer();
  } catch {
    throw new Error(`无法读取「${file.name}」`);
  }
  const head = new Uint8Array(data, 0, Math.min(data.byteLength, 5));
  if (!String.fromCharCode(...head).startsWith('%PDF-')) {
    throw new Error(`「${file.name}」不是有效的 PDF 文件`);
  }
  try {
    return await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  } catch (e) {
    throw new Error(
      `无法打开「${file.name}」：可能是加密或已损坏的 PDF。` +
        (e instanceof Error ? `（${e.message}）` : '')
    );
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('画布编码失败，输出为空'))),
      type
    );
  });
}

/** 每页渲染成 PNG */
export async function pdfToImages(
  file: File,
  scale: number,
  ctx: TaskContext
): Promise<{ name: string; blob: Blob }[]> {
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('缩放比例必须大于 0');
  ctx.progress(0.05, '加载 PDF 渲染引擎…');
  const pdfjs = await loadPdfJs();
  const doc = await openPdfDocument(file, pdfjs);
  const base = splitBase(file.name);
  const out: { name: string; blob: Blob }[] = [];

  try {
    for (let i = 0; i < doc.numPages; i++) {
      ctx.throwIfCancelled();
      ctx.progress(0.1 + (i / doc.numPages) * 0.85, `渲染第 ${i + 1}/${doc.numPages} 页…`);

      const page = await doc.getPage(i + 1);
      try {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const c2d = canvas.getContext('2d');
        if (!c2d) throw new Error('无法创建画布上下文');

        const task = page.render({ canvasContext: c2d, viewport });
        await task.promise;
        ctx.throwIfCancelled();

        out.push({ name: `${base}_p${i + 1}.png`, blob: await canvasToBlob(canvas, 'image/png') });
      } finally {
        page.cleanup();
      }
      await yieldToUI();
    }

    ctx.progress(1, '完成');
    return out;
  } finally {
    await doc.destroy();
  }
}

/** 内嵌图片对象：pdfjs 给出的可能是 JPEG 字节，也可能是原始像素 */
type EmbeddedImageObject = {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
};

function isJpegBytes(data: Uint8Array | Uint8ClampedArray): boolean {
  return data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
}

/** RGB 或 RGBA 原始数据 → PNG（长度对不上就判为无法提取，不伪造） */
async function rawPixelsToPng(obj: EmbeddedImageObject): Promise<Blob> {
  const { width, height, data } = obj;
  const expected = width * height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const c2d = canvas.getContext('2d');
  if (!c2d) throw new Error('无法创建画布上下文');

  const imageData = c2d.createImageData(width, height);
  if (data.length === expected * 4) {
    imageData.data.set(data);
  } else if (data.length === expected * 3) {
    for (let p = 0; p < expected; p++) {
      imageData.data[p * 4] = data[p * 3];
      imageData.data[p * 4 + 1] = data[p * 3 + 1];
      imageData.data[p * 4 + 2] = data[p * 3 + 2];
      imageData.data[p * 4 + 3] = 255;
    }
  } else {
    throw new Error(`像素数据长度异常（${data.length}）`);
  }
  c2d.putImageData(imageData, 0, 0);
  return canvasToBlob(canvas, 'image/png');
}

/**
 * 提取内嵌图片。
 * 返回能成功导出的图片，以及**无法提取的真实数量** —— 绝不假装成功。
 */
export async function extractEmbeddedImages(
  file: File,
  ctx: TaskContext
): Promise<{ images: { name: string; blob: Blob }[]; failed: number; total: number }> {
  ctx.progress(0.05, '加载 PDF 渲染引擎…');
  const pdfjs = await loadPdfJs();
  const doc = await openPdfDocument(file, pdfjs);
  const base = splitBase(file.name);
  const images: { name: string; blob: Blob }[] = [];
  const seen = new Set<string>();
  let failed = 0;
  let total = 0;

  const paintOps = new Set(
    [pdfjs.OPS?.paintImageXObject, pdfjs.OPS?.paintJpegXObject, pdfjs.OPS?.paintInlineImageXObject]
      .filter((v): v is number => typeof v === 'number')
  );

  try {
    for (let i = 0; i < doc.numPages; i++) {
      ctx.throwIfCancelled();
      ctx.progress(0.1 + (i / doc.numPages) * 0.8, `检查第 ${i + 1}/${doc.numPages} 页的图片…`);

      const page = await doc.getPage(i + 1);
      try {
        const ops = await page.getOperatorList();
        const ids: string[] = [];
        for (let k = 0; k < ops.fnArray.length; k++) {
          if (!paintOps.has(ops.fnArray[k])) continue;
          const arg = ops.argsArray[k]?.[0];
          if (typeof arg === 'string' && !seen.has(arg)) {
            seen.add(arg);
            ids.push(arg);
          }
        }

        for (const id of ids) {
          ctx.throwIfCancelled();
          total++;
          try {
            const raw = await page.objs.get(id);
            if (!raw || typeof raw !== 'object') throw new Error('图片对象为空');
            const obj = raw as Partial<EmbeddedImageObject>;
            if (!obj.data || !obj.width || !obj.height) throw new Error('图片数据不完整');
            const image = obj as EmbeddedImageObject;

            if (isJpegBytes(image.data)) {
              images.push({
                name: `${base}_img${images.length + 1}.jpg`,
                blob: new Blob([new Uint8Array(image.data)], { type: 'image/jpeg' }),
              });
            } else {
              images.push({
                name: `${base}_img${images.length + 1}.png`,
                blob: await rawPixelsToPng(image),
              });
            }
          } catch {
            failed++;
          }
        }
      } finally {
        page.cleanup();
      }
      await yieldToUI();
    }

    ctx.progress(1, '完成');
    return { images, failed, total };
  } finally {
    await doc.destroy();
  }
}

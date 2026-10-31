/**
 * 文档处理核心
 *
 * 修掉旧版的致命 bug：
 *   - **单位混用**：jsPDF 默认单位是 mm（A4 = 210×297），旧版却传入了
 *     pt 的数值（595×842）当 mm 用，于是 lineHeight=20 被当成 20mm，
 *     每页只放得下 13 行而代码按 39 行分页 —— **第 14 行起全部画到页面外丢失**。
 *     这里统一用 mm，并按真实可用高度计算每页行数。
 *   - **中文乱码**：旧版用 pdf.text() 配内置字体，中文全部丢失。
 *     这里提供两种中文方案（见下），让用户自己选。
 *
 * 能力边界（不做的就不写进界面）：
 *   PDF 合并 / 拆分 / 旋转 / PDF→图片 需要 pdf-lib 与 pdfjs-dist，当前未安装。
 */

import { jsPDF } from 'jspdf';
import type { TaskContext } from './tasks';
import { yieldToUI } from './tasks';

/* ============================================================
   页面尺寸（统一 mm）
   ============================================================ */

export type PageSize = 'a4' | 'a3' | 'a5' | 'letter';
export type Orientation = 'portrait' | 'landscape';

export const PAGE_SIZES: Record<PageSize, { w: number; h: number; label: string }> = {
  a4: { w: 210, h: 297, label: 'A4' },
  a3: { w: 297, h: 420, label: 'A3' },
  a5: { w: 148, h: 210, label: 'A5' },
  letter: { w: 215.9, h: 279.4, label: 'Letter' },
};

export type LayoutOptions = {
  size: PageSize;
  orientation: Orientation;
  /** 四边留白（mm） */
  margin: number;
};

/** 取出实际可用的页面尺寸（考虑横竖） */
export function effectiveSize(opts: LayoutOptions): { w: number; h: number } {
  const s = PAGE_SIZES[opts.size];
  return opts.orientation === 'landscape' ? { w: s.h, h: s.w } : { w: s.w, h: s.h };
}

/* ============================================================
   图片 → PDF
   ============================================================ */

export type ImageToPdfOptions = LayoutOptions & {
  /** fit = 等比缩放完整放入；fill = 铺满（可能裁切） */
  fit: 'fit' | 'fill';
};

export async function imagesToPdf(
  files: File[],
  opts: ImageToPdfOptions,
  ctx: TaskContext
): Promise<Blob> {
  if (!files.length) throw new Error('请先选择图片');

  const { w: pageW, h: pageH } = effectiveSize(opts);
  const contentW = pageW - opts.margin * 2;
  const contentH = pageH - opts.margin * 2;

  const pdf = new jsPDF({
    unit: 'mm', // 统一单位，避免旧版那种 mm/pt 混用
    format: [pageW, pageH],
    orientation: opts.orientation,
  });

  for (let i = 0; i < files.length; i++) {
    ctx.throwIfCancelled();
    ctx.progress(i / files.length, `处理第 ${i + 1}/${files.length} 张…`);

    const f = files[i];
    const url = ctx.scope.url(f);
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`无法解析图片：${f.name}`));
      img.src = url;
    });

    if (i > 0) pdf.addPage([pageW, pageH], opts.orientation);

    // 用 canvas 重新编码，避免 jsPDF 对某些格式支持不佳
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const c2d = canvas.getContext('2d');
    if (!c2d) throw new Error('无法创建画布上下文');
    c2d.fillStyle = '#ffffff';
    c2d.fillRect(0, 0, canvas.width, canvas.height);
    c2d.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const boxAspect = contentW / contentH;

    let drawW: number;
    let drawH: number;

    if (opts.fit === 'fill') {
      if (imgAspect > boxAspect) {
        drawH = contentH;
        drawW = contentH * imgAspect;
      } else {
        drawW = contentW;
        drawH = contentW / imgAspect;
      }
    } else {
      if (imgAspect > boxAspect) {
        drawW = contentW;
        drawH = contentW / imgAspect;
      } else {
        drawH = contentH;
        drawW = contentH * imgAspect;
      }
    }

    const x = opts.margin + (contentW - drawW) / 2;
    const y = opts.margin + (contentH - drawH) / 2;
    pdf.addImage(dataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');

    await yieldToUI();
  }

  ctx.progress(1, '完成');
  return pdf.output('blob');
}

/* ============================================================
   文本 → PDF
   ============================================================ */

export type TextToPdfOptions = LayoutOptions & {
  /**
   * canvas = 用 canvas 排版渲染成图嵌入：中文完美、分页准确，但文字不可选中
   * text   = 用 jsPDF 内置字体直接写文字：可选中、体积小，但不支持中文
   */
  mode: 'canvas' | 'text';
  fontSize: number;
  lineHeightFactor: number;
  title?: string;
};

/** 中文用 canvas 渲染 —— 这是浏览器端唯一能保证中文正确显示的做法 */
export async function textToPdfCanvas(
  text: string,
  opts: TextToPdfOptions,
  ctx: TaskContext
): Promise<Blob> {
  const { w: pageW, h: pageH } = effectiveSize(opts);
  const contentW = pageW - opts.margin * 2;
  const contentH = pageH - opts.margin * 2;

  // 渲染分辨率：每 mm 约 8 像素（≈200dpi），中文足够清晰
  const PX_PER_MM = 8;
  const canvasW = Math.round(contentW * PX_PER_MM);
  const canvasH = Math.round(contentH * PX_PER_MM);
  const fontPx = opts.fontSize * (PX_PER_MM / 2.8346); // pt → px
  const lineH = fontPx * opts.lineHeightFactor;

  const pdf = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation: opts.orientation });

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const c2d = canvas.getContext('2d');
  if (!c2d) throw new Error('无法创建画布上下文');

  const fontStack = `${fontPx}px system-ui, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`;

  /** 按可用宽度断行（中英文混排都处理） */
  const wrapLine = (line: string): string[] => {
    c2d.font = fontStack;
    if (!line) return [''];
    const out: string[] = [];
    let cur = '';

    for (const ch of Array.from(line)) {
      const test = cur + ch;
      if (c2d.measureText(test).width > canvasW - fontPx) {
        out.push(cur);
        cur = ch;
      } else {
        cur = test;
      }
    }
    if (cur) out.push(cur);
    return out;
  };

  // 先把全部文本断行，再按页高切分 —— 这样分页一定不会越界
  const allLines: string[] = [];
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    allLines.push(...wrapLine(raw));
  }

  const linesPerPage = Math.max(1, Math.floor((canvasH - fontPx) / lineH));
  const pageCount = Math.max(1, Math.ceil(allLines.length / linesPerPage));

  let pageIndex = 0;
  let rendered = 0;

  // 首页复用主画布
  while (rendered < allLines.length || pageIndex === 0) {
    ctx.throwIfCancelled();
    ctx.progress(0.15 + (pageIndex / pageCount) * 0.7, `排版第 ${pageIndex + 1}/${pageCount} 页…`);

    c2d.fillStyle = '#ffffff';
    c2d.fillRect(0, 0, canvasW, canvasH);
    c2d.font = fontStack;
    c2d.fillStyle = '#000000';
    c2d.textBaseline = 'top';

    let y = fontPx * 0.2;
    for (let i = 0; i < linesPerPage && rendered < allLines.length; i++) {
      c2d.fillText(allLines[rendered], 0, y);
      y += lineH;
      rendered++;
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    if (pageIndex > 0) pdf.addPage([pageW, pageH], opts.orientation);
    pdf.addImage(dataUrl, 'JPEG', opts.margin, opts.margin, contentW, contentH, undefined, 'FAST');

    pageIndex++;
    if (pageIndex > pageCount + 2) break; // 兜底，防死循环
    await yieldToUI();
  }

  ctx.progress(1, '完成');
  return pdf.output('blob');
}

/**
 * 英文/拉丁文本用 jsPDF 内置字体 —— 文字可选中、体积小。
 * 含中文时会明确警告，而不是悄悄输出乱码（旧版就是乱码）。
 */
export function textToPdfText(text: string, opts: TextToPdfOptions): Blob {
  const { w: pageW, h: pageH } = effectiveSize(opts);
  const contentW = pageW - opts.margin * 2;
  const contentH = pageH - opts.margin * 2;

  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) {
    throw new Error(
      '这种模式用的是 PDF 内置字体，不支持中文。请改用「图片渲染」模式（中文完美，但文字不可选中）'
    );
  }

  const pdf = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation: opts.orientation });
  pdf.setFontSize(opts.fontSize);

  const lineH = opts.fontSize * 0.3528 * opts.lineHeightFactor; // pt → mm
  const linesPerPage = Math.max(1, Math.floor(contentH / lineH));

  // 按宽度断行
  const allLines: string[] = [];
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const wrapped = pdf.splitTextToSize(raw, contentW) as string[];
    allLines.push(...wrapped);
  }

  let page = 0;
  for (let i = 0; i < allLines.length; i++) {
    const posInPage = i % linesPerPage;
    if (posInPage === 0 && i > 0) {
      pdf.addPage([pageW, pageH], opts.orientation);
      page++;
    }
    pdf.text(allLines[i], opts.margin, opts.margin + posInPage * lineH + opts.fontSize * 0.3528);
  }

  return pdf.output('blob');
}

/* ============================================================
   表格 → PDF（走 canvas，中文才不会乱码）
   ============================================================ */

export type TableToPdfOptions = LayoutOptions & {
  fontSize: number;
  /** 是否把第一行当表头加底色 */
  header: boolean;
  borderColor: string;
};

export async function tableToPdf(
  rows: string[][],
  opts: TableToPdfOptions,
  ctx: TaskContext
): Promise<Blob> {
  if (!rows.length) throw new Error('没有表格内容');

  const { w: pageW, h: pageH } = effectiveSize(opts);
  const contentW = pageW - opts.margin * 2;
  const contentH = pageH - opts.margin * 2;

  const PX_PER_MM = 8;
  const canvasW = Math.round(contentW * PX_PER_MM);
  const canvasH = Math.round(contentH * PX_PER_MM);
  const fontPx = opts.fontSize * (PX_PER_MM / 2.8346);
  const rowH = fontPx * 1.9;

  const colCount = Math.max(...rows.map((r) => r.length));
  const colW = canvasW / colCount;

  const pdf = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation: opts.orientation });
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const c2d = canvas.getContext('2d');
  if (!c2d) throw new Error('无法创建画布上下文');

  const fontStack = `${fontPx}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`;
  const rowsPerPage = Math.max(1, Math.floor((canvasH - rowH) / rowH));
  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  let rowIndex = 0;
  for (let page = 0; page < pageCount; page++) {
    ctx.throwIfCancelled();
    ctx.progress(0.15 + (page / pageCount) * 0.7, `排版第 ${page + 1}/${pageCount} 页…`);

    c2d.fillStyle = '#ffffff';
    c2d.fillRect(0, 0, canvasW, canvasH);
    c2d.font = fontStack;
    c2d.textBaseline = 'middle';

    let y = 0;
    for (let r = 0; r < rowsPerPage && rowIndex < rows.length; r++, rowIndex++) {
      const row = rows[rowIndex];
      const isHeader = opts.header && rowIndex === 0;

      if (isHeader) {
        c2d.fillStyle = '#f1f5f9';
        c2d.fillRect(0, y, canvasW, rowH);
      }

      // 单元格：超宽就省略号（避免溢出到下一列）
      for (let c = 0; c < colCount; c++) {
        const cell = row[c] ?? '';
        let display = cell;
        while (c2d.measureText(display).width > colW - fontPx * 0.6 && display.length > 1) {
          display = display.slice(0, -1);
        }
        if (display !== cell) display = display.slice(0, -1) + '…';

        c2d.fillStyle = '#111827';
        c2d.fillText(display, c * colW + fontPx * 0.3, y + rowH / 2);
      }

      // 横线
      c2d.strokeStyle = opts.borderColor;
      c2d.lineWidth = 1;
      c2d.beginPath();
      c2d.moveTo(0, y + rowH);
      c2d.lineTo(canvasW, y + rowH);
      c2d.stroke();

      y += rowH;
    }

    // 竖线
    c2d.strokeStyle = opts.borderColor;
    for (let c = 0; c <= colCount; c++) {
      c2d.beginPath();
      c2d.moveTo(c * colW, 0);
      c2d.lineTo(c * colW, y);
      c2d.stroke();
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    if (page > 0) pdf.addPage([pageW, pageH], opts.orientation);
    pdf.addImage(dataUrl, 'JPEG', opts.margin, opts.margin, contentW, contentH, undefined, 'FAST');

    await yieldToUI();
  }

  ctx.progress(1, '完成');
  return pdf.output('blob');
}

/* ============================================================
   OCR
   ============================================================ */

export type OcrProgress = { status: string; progress: number };

/** 图片 OCR（tesseract.js，项目已有） */
export async function ocrImage(
  file: File,
  langs: string,
  onProgress: (p: OcrProgress) => void,
  signal?: AbortSignal
): Promise<{ text: string; confidence: number }> {
  const mod = await import('tesseract.js');
  const Tesseract = (mod as unknown as { default?: typeof import('tesseract.js') }).default ?? mod;

  const url = URL.createObjectURL(file);
  try {
    const result = await Tesseract.recognize(url, langs, {
      logger: (m: { status: string; progress: number }) => {
        if (signal?.aborted) return;
        onProgress({ status: m.status, progress: m.progress });
      },
    });
    return {
      text: result.data.text.trim(),
      confidence: Math.round(result.data.confidence),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ============================================================
   DOCX → HTML（mammoth，项目已有）
   ============================================================ */

export async function docxToHtml(file: File): Promise<{ html: string; text: string; messages: string[] }> {
  const mod = await import('mammoth');
  const mammoth = (mod as unknown as { default?: typeof import('mammoth') }).default ?? mod;

  const arrayBuffer = await file.arrayBuffer();
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer }),
  ]);

  return {
    html: htmlResult.value,
    text: textResult.value,
    messages: htmlResult.messages.map((m) => m.message),
  };
}

/* ============================================================
   工具
   ============================================================ */

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  // 立刻 revoke 在部分浏览器会导致下载失败，延后一点
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

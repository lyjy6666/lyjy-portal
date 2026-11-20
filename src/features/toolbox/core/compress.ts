/**
 * 压缩：图片压缩 + ZIP 打包
 *
 * 修掉旧版的问题：
 *   - 图片压缩一律转 JPEG（PNG 透明丢失）、尺寸写死 1920×1080 横屏框
 *   - 「文档压缩」只是把单个文件塞进 ZIP，体积常常不变甚至更大，
 *     却仍然显示「节省 X%」——现在只显示**真实**增减，变大就如实说
 */

import JSZip from 'jszip';
import type { TaskContext } from './tasks';
import { yieldToUI } from './tasks';
import { IMAGE_FORMATS, canEncode, type ImageFormat } from './imageConvert';

/* ============================================================
   图片压缩
   ============================================================ */

export type ImageCompressOptions = {
  /** 最长边上限（按最长边等比缩放，竖图不会被压扁） */
  maxLongest: number;
  quality: number;
  /** 输出格式；'auto' = 保留原格式（有透明就 PNG，否则 JPEG） */
  target: ImageFormat | 'auto';
};

export type CompressResult = {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
};

export async function compressImage(
  file: File,
  opts: ImageCompressOptions,
  ctx: TaskContext
): Promise<CompressResult> {
  ctx.throwIfCancelled();
  ctx.progress(0.1, '读取图片…');

  const url = ctx.scope.url(file);
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`无法解析图片：${file.name}`));
    img.src = url;
  });

  ctx.throwIfCancelled();
  ctx.progress(0.3, '计算尺寸…');

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longest > opts.maxLongest ? opts.maxLongest / longest : 1;
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  // 选择输出格式：auto 时保留原格式特征
  let format: ImageFormat;
  if (opts.target !== 'auto') {
    format = opts.target;
  } else {
    const srcType = file.type.toLowerCase();
    if (srcType.includes('png')) format = 'png';
    else if (srcType.includes('webp')) format = 'webp';
    else if (srcType.includes('gif')) format = 'png'; // GIF 动图 canvas 处理后会变静图，用 PNG 保留质量
    else format = 'jpeg';
  }

  const fmt = IMAGE_FORMATS.find((f) => f.id === format)!;
  if (!(await canEncode(fmt.mime))) {
    throw new Error(`当前浏览器无法编码 ${fmt.label}，请换一种输出格式`);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c2d = canvas.getContext('2d');
  if (!c2d) throw new Error('无法创建画布上下文');

  // 不支持透明的格式铺白底，避免透明区域变黑
  if (format !== 'png' && format !== 'webp') {
    c2d.fillStyle = '#ffffff';
    c2d.fillRect(0, 0, w, h);
  }
  c2d.imageSmoothingEnabled = true;
  c2d.imageSmoothingQuality = 'high';
  c2d.drawImage(img, 0, 0, w, h);

  ctx.throwIfCancelled();
  ctx.progress(0.6, '编码中…');
  await yieldToUI();

  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, fmt.mime, format === 'png' ? undefined : opts.quality)
  );
  if (!blob) throw new Error('压缩失败：编码返回空');

  ctx.progress(1, '完成');

  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return { blob, filename: `${base}_compressed.${fmt.ext}`, width: w, height: h };
}

/* ============================================================
   ZIP
   ============================================================ */

export type ZipEntry = { name: string; blob: Blob };

export async function createZip(
  entries: ZipEntry[],
  ctx: TaskContext,
  /** 0~9，9 最慢压缩率最高 */
  level = 6
): Promise<Blob> {
  if (!entries.length) throw new Error('没有要打包的文件');

  const zip = new JSZip();
  // 同名文件自动加序号，避免相互覆盖
  const used = new Set<string>();
  for (const e of entries) {
    let name = e.name;
    let n = 1;
    while (used.has(name)) {
      const dot = e.name.lastIndexOf('.');
      name = dot > 0 ? `${e.name.slice(0, dot)}_${n}${e.name.slice(dot)}` : `${e.name}_${n}`;
      n++;
    }
    used.add(name);
    zip.file(name, e.blob);
  }

  ctx.throwIfCancelled();
  ctx.progress(0.15, '打包中…');

  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level },
    },
    (meta) => {
      ctx.progress(0.15 + (meta.percent / 100) * 0.8, `打包中… ${Math.round(meta.percent)}%`);
    }
  );

  ctx.progress(1, '完成');
  return blob;
}

/** 列出 ZIP 内容（不解压，只读目录） */
export async function listZip(
  file: File
): Promise<{ name: string; size: number; compressed: number; dir: boolean }[]> {
  const zip = await JSZip.loadAsync(file);
  const out: { name: string; size: number; compressed: number; dir: boolean }[] = [];
  zip.forEach((path, entry) => {
    const internal = entry as unknown as {
      _data?: { uncompressedSize?: number; compressedSize?: number };
    };
    out.push({
      name: path,
      size: internal._data?.uncompressedSize ?? 0,
      compressed: internal._data?.compressedSize ?? 0,
      dir: entry.dir,
    });
  });
  return out;
}

/** 解压全部（返回文件列表，让调用方自己决定怎么用） */
export async function extractZip(
  file: File,
  ctx: TaskContext
): Promise<{ name: string; blob: Blob }[]> {
  const zip = await JSZip.loadAsync(file);
  const entries: { name: string; entry: JSZip.JSZipObject }[] = [];
  zip.forEach((path, entry) => {
    if (!entry.dir) entries.push({ name: path, entry });
  });

  if (!entries.length) throw new Error('这个 ZIP 里没有文件');

  const out: { name: string; blob: Blob }[] = [];
  for (let i = 0; i < entries.length; i++) {
    ctx.throwIfCancelled();
    ctx.progress(i / entries.length, `解压 ${entries[i].name}（${i + 1}/${entries.length}）`);
    out.push({ name: entries[i].name, blob: await entries[i].entry.async('blob') });
  }

  ctx.progress(1, '完成');
  return out;
}

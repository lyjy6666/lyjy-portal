/**
 * 二维码与条码
 *
 * 修掉旧版最离谱的一个 bug：**「识别条形码」调用的是 jsQR（二维码库）**，
 * 一维条码永远识别不了，只会提示「未识别到条形码」。
 * 现在一维码识别交给 @zxing/library，二维码识别继续用 jsQR。
 */

import QRCode from 'qrcode';
import jsQR from 'jsqr';
import JsBarcode from 'jsbarcode';

/* ============================================================
   二维码
   ============================================================ */

export type QrOptions = {
  size: number;
  margin: number;
  level: 'L' | 'M' | 'Q' | 'H';
  dark: string;
  light: string;
};

export const QR_DEFAULTS: QrOptions = {
  size: 320,
  margin: 2,
  level: 'M',
  dark: '#000000',
  light: '#ffffff',
};

/** 生成二维码 → PNG Blob */
export async function generateQr(text: string, opts: QrOptions): Promise<Blob> {
  if (!text.trim()) throw new Error('请输入要生成二维码的内容');

  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, text, {
    width: opts.size,
    margin: opts.margin,
    errorCorrectionLevel: opts.level,
    color: { dark: opts.dark, light: opts.light },
  });

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) throw new Error('二维码生成失败');
  return blob;
}

/** 生成二维码 → SVG 字符串（矢量，放大会糊） */
export async function generateQrSvg(text: string, opts: QrOptions): Promise<string> {
  if (!text.trim()) throw new Error('请输入要生成二维码的内容');
  return QRCode.toString(text, {
    type: 'svg',
    margin: opts.margin,
    errorCorrectionLevel: opts.level,
    color: { dark: opts.dark, light: opts.light },
  });
}

/** 识别图片里的二维码 */
export async function scanQr(file: File): Promise<string> {
  const { data, width, height } = await fileToImageData(file);
  const result = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
  if (!result) throw new Error('没识别到二维码。试试裁掉多余背景，或提高图片清晰度');
  return result.data;
}

/* ============================================================
   一维条码
   ============================================================ */

export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'MSI' | 'pharmacode' | 'codabar';

export const BARCODE_FORMATS: { id: BarcodeFormat; label: string; hint: string }[] = [
  { id: 'CODE128', label: 'CODE128', hint: '最通用，支持任意 ASCII' },
  { id: 'CODE39', label: 'CODE39', hint: '工业常用，仅大写字母与数字' },
  { id: 'EAN13', label: 'EAN-13', hint: '商品条码，必须 13 位数字' },
  { id: 'EAN8', label: 'EAN-8', hint: '短商品条码，必须 8 位数字' },
  { id: 'UPC', label: 'UPC-A', hint: '北美商品条码，必须 12 位数字' },
  { id: 'ITF14', label: 'ITF-14', hint: '物流箱码，必须 14 位数字' },
  { id: 'MSI', label: 'MSI', hint: '库存管理用' },
  { id: 'pharmacode', label: 'Pharmacode', hint: '药品包装，纯数字' },
  { id: 'codabar', label: 'Codabar', hint: '血库/物流' },
];

export type BarcodeOptions = {
  format: BarcodeFormat;
  width: number;
  height: number;
  displayValue: boolean;
  fontSize: number;
  margin: number;
  lineColor: string;
  background: string;
};

export const BARCODE_DEFAULTS: BarcodeOptions = {
  format: 'CODE128',
  width: 2,
  height: 90,
  displayValue: true,
  fontSize: 18,
  margin: 12,
  lineColor: '#000000',
  background: '#ffffff',
};

/** 各格式对内容的要求 —— 提前校验，给出人话提示 */
export function validateBarcodeContent(value: string, format: BarcodeFormat): string | null {
  const v = value.trim();
  if (!v) return '请输入条码内容';

  switch (format) {
    case 'EAN13':
      if (!/^\d{13}$/.test(v)) return 'EAN-13 需要正好 13 位数字';
      break;
    case 'EAN8':
      if (!/^\d{8}$/.test(v)) return 'EAN-8 需要正好 8 位数字';
      break;
    case 'UPC':
      if (!/^\d{12}$/.test(v)) return 'UPC-A 需要正好 12 位数字';
      break;
    case 'ITF14':
      if (!/^\d{14}$/.test(v)) return 'ITF-14 需要正好 14 位数字';
      break;
    case 'pharmacode': {
      const n = Number(v);
      if (!/^\d+$/.test(v) || n < 3 || n > 131070) return 'Pharmacode 需要 3~131070 的整数';
      break;
    }
    case 'CODE39':
      if (!/^[0-9A-Z\-. $/+%]+$/.test(v)) return 'CODE39 只支持大写字母、数字与 - . $ / + % 空格';
      break;
    case 'MSI':
      if (!/^\d+$/.test(v)) return 'MSI 只支持数字';
      break;
    default:
      break;
  }
  return null;
}

/** 生成条码 → PNG Blob */
export async function generateBarcode(value: string, opts: BarcodeOptions): Promise<Blob> {
  const err = validateBarcodeContent(value, opts.format);
  if (err) throw new Error(err);

  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, value.trim(), {
      format: opts.format,
      width: opts.width,
      height: opts.height,
      displayValue: opts.displayValue,
      fontSize: opts.fontSize,
      margin: opts.margin,
      lineColor: opts.lineColor,
      background: opts.background,
    });
  } catch (e) {
    throw new Error(`条码生成失败：${e instanceof Error ? e.message : '内容与格式不匹配'}`);
  }

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) throw new Error('条码生成失败');
  return blob;
}

/**
 * 识别一维条码 —— 用 @zxing/library，不是二维码库。
 *
 * @zxing 是 CJS/UMD 包且体积较大，所以动态导入，只在用户真的要用时才加载。
 */
export async function scanBarcode(file: File): Promise<{ text: string; format: string }> {
  const { data, width, height } = await fileToImageData(file);

  const mod = await import('@zxing/library');
  const zxing = (mod as unknown as { default?: typeof import('@zxing/library') }).default ?? mod;

  const luminance = new zxing.RGBLuminanceSource(Uint8ClampedArray.from(data), width, height);
  const bitmap = new zxing.BinaryBitmap(new zxing.HybridBinarizer(luminance));
  const reader = new zxing.MultiFormatReader();

  try {
    const result = reader.decode(bitmap);
    return { text: result.getText(), format: String(result.getBarcodeFormat()) };
  } catch {
    // 明确区分「没识别到」和「识别出错」
    throw new Error(
      '没识别到条码。一维条码对图片质量比较敏感，建议：裁掉多余背景只留条码、保证条码横向水平、提高对比度'
    );
  } finally {
    reader.reset();
  }
}

/* ============================================================
   工具
   ============================================================ */

/** 读图并转成 ImageData（超过 2000px 会等比缩小，避免大图卡死主线程） */
async function fileToImageData(file: File): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('无法解析这张图片（可能已损坏或不是图片）'));
      img.src = url;
    });

    const MAX = 2000;
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('无法创建画布上下文');
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    return { data: imgData.data, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

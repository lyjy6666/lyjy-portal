'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, Eraser, Stamp, Loader2 } from 'lucide-react';

// ============ 类型 ============
type Mode = 'add' | 'remove';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function WatermarkTool() {
  const [mode, setMode] = useState<Mode>('remove');
  const [srcUrl, setSrcUrl] = useState<string>('');
  const [outUrl, setOutUrl] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('output');

  // 去水印：框选区域
  const imgRef = useRef<HTMLImageElement>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [curRect, setCurRect] = useState<Rect | null>(null);

  // 加水印：参数
  const [wmText, setWmText] = useState('LYJY');
  const [wmSize, setWmSize] = useState(48);
  const [wmOpacity, setWmOpacity] = useState(0.3);
  const [wmColor, setWmColor] = useState('#ffffff');
  const [wmRotate, setWmRotate] = useState(-30);
  const [wmPosition, setWmPosition] = useState<'tile' | 'center' | 'corner'>('tile');

  // 选文件
  const fileRef = useRef<HTMLInputElement>(null);
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    if (outUrl) URL.revokeObjectURL(outUrl);
    setOutUrl('');
    setRects([]);
    setCurRect(null);
    setSrcUrl(URL.createObjectURL(f));
    setFileName(f.name.replace(/\.[^.]+$/, '') || 'output');
  };

  // 拖拽框选（去水印）
  const onImgMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (mode !== 'remove') return;
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setCurRect({ x, y, w: 0, h: 0 });
  };
  const onImgMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!dragStart) return;
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setCurRect({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      w: Math.abs(x - dragStart.x),
      h: Math.abs(y - dragStart.y),
    });
  };
  const onImgMouseUp = () => {
    if (curRect && curRect.w > 5 && curRect.h > 5) {
      setRects((r) => [...r, curRect]);
    }
    setDragStart(null);
    setCurRect(null);
  };

  // 去水印：基于周围像素的快速修复算法
  const removeWatermark = useCallback(async () => {
    const img = imgRef.current;
    if (!img || rects.length === 0) return;
    setBusy(true);
    try {
      // 限制大图，避免卡死（超过 2000px 的等比缩放）
      const MAX_DIM = 2000;
      let scale = 1;
      if (img.naturalWidth > MAX_DIM || img.naturalHeight > MAX_DIM) {
        scale = MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight);
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(img.naturalWidth * scale);
      canvas.height = Math.floor(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法获取 Canvas');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / img.clientWidth;
      const scaleY = canvas.height / img.clientHeight;

      for (const r of rects) {
        const x = Math.floor(r.x * scaleX);
        const y = Math.floor(r.y * scaleY);
        const w = Math.floor(r.w * scaleX);
        const h = Math.floor(r.h * scaleY);
        inpaintRegionFast(ctx, x, y, w, h);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (blob) {
        if (outUrl) URL.revokeObjectURL(outUrl);
        setOutUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '处理失败');
    } finally {
      setBusy(false);
    }
  }, [rects, outUrl]);

  // 加水印（图片）
  const addWatermarkImage = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法获取 Canvas');
      ctx.drawImage(img, 0, 0);

      ctx.save();
      ctx.globalAlpha = wmOpacity;
      ctx.fillStyle = wmColor;
      ctx.font = `${wmSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (wmPosition === 'tile') {
        const stepX = Math.max(wmSize * 4, 200);
        const stepY = Math.max(wmSize * 2, 100);
        for (let y = 0; y < canvas.height + stepY; y += stepY) {
          for (let x = 0; x < canvas.width + stepX; x += stepX) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((wmRotate * Math.PI) / 180);
            ctx.fillText(wmText, 0, 0);
            ctx.restore();
          }
        }
      } else if (wmPosition === 'center') {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((wmRotate * Math.PI) / 180);
        ctx.fillText(wmText, 0, 0);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(canvas.width - wmSize * 2, canvas.height - wmSize);
        ctx.rotate((wmRotate * Math.PI) / 180);
        ctx.fillText(wmText, 0, 0);
        ctx.restore();
      }
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (blob) {
        if (outUrl) URL.revokeObjectURL(outUrl);
        setOutUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '处理失败');
    } finally {
      setBusy(false);
    }
  }, [wmText, wmSize, wmOpacity, wmColor, wmRotate, wmPosition, outUrl]);

  const handleProcess = () => {
    if (mode === 'remove') removeWatermark();
    else addWatermarkImage();
  };

  useEffect(() => {
    setRects([]);
    setCurRect(null);
    setOutUrl('');
  }, [mode]);

  const displayRects = [...rects];
  if (curRect) displayRects.push(curRect);

  return (
    <div className="space-y-6">
      {/* 模式切换 */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={mode === 'remove' ? 'default' : 'outline'}
          onClick={() => setMode('remove')}
          className={mode === 'remove' ? 'bg-gradient-to-r from-rose-500 to-pink-600' : ''}
        >
          <Eraser className="mr-2 h-4 w-4" />
          去水印
        </Button>
        <Button
          variant={mode === 'add' ? 'default' : 'outline'}
          onClick={() => setMode('add')}
          className={mode === 'add' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : ''}
        >
          <Stamp className="mr-2 h-4 w-4" />
          加水印
        </Button>
      </div>

      {mode === 'remove' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
          <p className="font-semibold">使用说明：</p>
          <p>1. 上传图片 → 2. 用鼠标在图片上拖拽框选水印区域（可框选多个）→ 3. 点击「开始去除」</p>
          <p className="mt-1 text-xs opacity-80">算法会用周围像素自动修复选中区域，复杂背景可能留有痕迹。</p>
        </div>
      )}

      {mode === 'add' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">水印文字</label>
            <input
              value={wmText}
              onChange={(e) => setWmText(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">位置</label>
            <select
              value={wmPosition}
              onChange={(e) => setWmPosition(e.target.value as 'tile' | 'center' | 'corner')}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="tile">平铺（满图）</option>
              <option value="center">居中</option>
              <option value="corner">右下角</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">字号: {wmSize}px</label>
            <input
              type="range"
              min="12"
              max="200"
              value={wmSize}
              onChange={(e) => setWmSize(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">透明度: {Math.round(wmOpacity * 100)}%</label>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={wmOpacity}
              onChange={(e) => setWmOpacity(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">旋转: {wmRotate}°</label>
            <input
              type="range"
              min="-90"
              max="90"
              value={wmRotate}
              onChange={(e) => setWmRotate(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">颜色</label>
            <input
              type="color"
              value={wmColor}
              onChange={(e) => setWmColor(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>
      )}

      {/* 文件选择 */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          className="hidden"
        />
        <Button onClick={() => fileRef.current?.click()} variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          选择图片
        </Button>
        {srcUrl && (
          <Button
            onClick={handleProcess}
            disabled={busy || (mode === 'remove' && rects.length === 0)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {busy ? '处理中...' : mode === 'remove' ? '开始去除' : '开始加水印'}
          </Button>
        )}
        {outUrl && (
          <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-600">
            <a
              href={outUrl}
              download={`${fileName}_${mode === 'remove' ? '去水印' : '加水印'}_${Date.now()}.png`}
            >
              <Download className="mr-2 h-4 w-4" />
              下载结果
            </a>
          </Button>
        )}
      </div>

      {/* 预览区 */}
      {srcUrl && (
        <div className="relative inline-block max-w-full overflow-auto rounded-lg border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
          <div className="relative inline-block select-none">
            <img
              ref={imgRef}
              src={srcUrl}
              alt="预览"
              className="block max-w-full"
              draggable={false}
              onMouseDown={onImgMouseDown}
              onMouseMove={onImgMouseMove}
              onMouseUp={onImgMouseUp}
              onMouseLeave={onImgMouseUp}
              style={{ cursor: mode === 'remove' ? 'crosshair' : 'default' }}
            />
            {mode === 'remove' && displayRects.map((r, i) => (
              <div
                key={i}
                className="absolute border-2 border-rose-500 bg-rose-500/20 pointer-events-none"
                style={{
                  left: r.x,
                  top: r.y,
                  width: r.w,
                  height: r.h,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {outUrl && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">处理结果：</p>
          <img src={outUrl} alt="结果" className="max-w-full rounded-lg border border-slate-300 dark:border-slate-700" />
        </div>
      )}

      {rects.length > 0 && mode === 'remove' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">已选 {rects.length} 个区域</span>
          <Button variant="ghost" size="sm" onClick={() => setRects([])}>
            清空选区
          </Button>
        </div>
      )}
    </div>
  );
}

// ============ 去水印：快速区域修复算法 ============
function inpaintRegionFast(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (w <= 0 || h <= 0) return;
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;

  const pad = 2;
  const topY = Math.max(0, y - pad);
  const bottomY = Math.min(ch - 1, y + h + pad);
  const leftX = Math.max(0, x - pad);
  const rightX = Math.min(cw - 1, x + w + pad);

  const top = topY >= 0 ? ctx.getImageData(x, topY, w, 1).data : null;
  const bottom = bottomY < ch ? ctx.getImageData(x, bottomY, w, 1).data : null;
  const left = leftX >= 0 ? ctx.getImageData(leftX, y, 1, h).data : null;
  const right = rightX < cw ? ctx.getImageData(rightX, y, 1, h).data : null;

  const target = ctx.createImageData(w, h);
  const tData = target.data;

  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const idx = (j * w + i) * 4;
      const ty = h > 1 ? j / (h - 1) : 0.5;
      const tx = w > 1 ? i / (w - 1) : 0.5;

      let r = 0, g = 0, b = 0, count = 0;

      if (top && bottom) {
        const ti = i * 4;
        r += top[ti] * (1 - ty) + bottom[ti] * ty;
        g += top[ti + 1] * (1 - ty) + bottom[ti + 1] * ty;
        b += top[ti + 2] * (1 - ty) + bottom[ti + 2] * ty;
        count++;
      } else if (top) {
        const ti = i * 4;
        r += top[ti]; g += top[ti + 1]; b += top[ti + 2];
        count++;
      } else if (bottom) {
        const ti = i * 4;
        r += bottom[ti]; g += bottom[ti + 1]; b += bottom[ti + 2];
        count++;
      }

      if (left && right) {
        const li = j * 4;
        r += left[li] * (1 - tx) + right[li] * tx;
        g += left[li + 1] * (1 - tx) + right[li + 1] * tx;
        b += left[li + 2] * (1 - tx) + right[li + 2] * tx;
        count++;
      } else if (left) {
        const li = j * 4;
        r += left[li]; g += left[li + 1]; b += left[li + 2];
        count++;
      } else if (right) {
        const li = j * 4;
        r += right[li]; g += right[li + 1]; b += right[li + 2];
        count++;
      }

      if (count > 0) {
        tData[idx] = r / count;
        tData[idx + 1] = g / count;
        tData[idx + 2] = b / count;
        tData[idx + 3] = 255;
      } else {
        tData[idx + 3] = 0;
      }
    }
  }
  ctx.putImageData(target, x, y);
}

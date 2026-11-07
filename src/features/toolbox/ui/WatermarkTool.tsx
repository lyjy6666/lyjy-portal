'use client';

import { useEffect, useRef, useState } from 'react';
import { DropZone, Notice, ResultCard, ToolPanel, ToolProgress } from './primitives';
import { useTask } from './useTask';
import { formatBytes } from '../core/tasks';
import {
  MAX_DIM,
  POSITIONS,
  addImageWatermark,
  addTextWatermark,
  maskRegions,
  type MaskMode,
  type Rect,
  type WatermarkPosition,
} from '../core/watermark';

type Mode = 'text' | 'image' | 'mask';

export default function WatermarkTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mode, setMode] = useState<Mode>('text');

  // 文字水印
  const [text, setText] = useState('© LYJY 2026');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(0.5);
  const [rotate, setRotate] = useState(0);
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [margin, setMargin] = useState(40);
  const [bold, setBold] = useState(true);

  // 图片水印
  const [wmImage, setWmImage] = useState<HTMLImageElement | null>(null);
  const [wmScale, setWmScale] = useState(0.2);

  // 遮挡
  const [rects, setRects] = useState<Rect[]>([]);
  const [maskMode, setMaskMode] = useState<MaskMode>('mosaic');
  const [strength, setStrength] = useState(16);
  const [solidColor, setSolidColor] = useState('#000000');
  const [drawing, setDrawing] = useState<Rect | null>(null);
  const [natSize, setNatSize] = useState({ w: 0, h: 0 });

  const [result, setResult] = useState<{ url: string; blob: Blob; before: number } | null>(null);
  const { state, run, cancel } = useTask();
  const imgRef = useRef<HTMLImageElement>(null);
  const urls = useRef<string[]>([]);

  const release = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
  };
  useEffect(() => release, []);

  const loadFile = (f: File) => {
    release();
    setFile(f);
    setResult(null);
    setRects([]);
    const u = URL.createObjectURL(f);
    urls.current.push(u);
    setPreviewUrl(u);

    const img = new Image();
    img.onload = () => setNatSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = u;
  };

  /** 屏幕坐标 → 原图像素坐标 */
  const toImageCoords = (clientX: number, clientY: number) => {
    const el = imgRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const scaleX = natSize.w / r.width;
    const scaleY = natSize.h / r.height;
    return {
      x: Math.max(0, Math.min(natSize.w, (clientX - r.left) * scaleX)),
      y: Math.max(0, Math.min(natSize.h, (clientY - r.top) * scaleY)),
    };
  };

  const apply = async () => {
    if (!file) return;
    release();
    setResult(null);

    const out = await run(async (ctx) => {
      if (mode === 'text') {
        const r = await addTextWatermark(
          file,
          { text, fontSize, color, opacity, rotate, position, margin, bold },
          ctx
        );
        return r.blob;
      }
      if (mode === 'image') {
        if (!wmImage) throw new Error('请先上传水印图片');
        const r = await addImageWatermark(
          file,
          { image: wmImage, scale: wmScale, opacity, rotate, position, margin },
          ctx
        );
        return r.blob;
      }
      const r = await maskRegions(file, { rects, mode: maskMode, strength, solidColor }, ctx);
      return r.blob;
    });

    if (out) {
      const u = URL.createObjectURL(out);
      urls.current.push(u);
      setResult({ url: u, blob: out, before: file.size });
    }
  };

  return (
    <div className="space-y-5">
      <ToolPanel title="选择图片">
        {!file ? (
          <DropZone accept="image/*" onFiles={(f) => loadFile(f[0])} hint="支持 PNG / JPG / WebP" />
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <span style={{ color: 'var(--muted-foreground)' }}>
              {natSize.w} × {natSize.h} · {formatBytes(file.size)}
            </span>
            <button
              type="button"
              className="tb-btn"
              onClick={() => {
                setFile(null);
                release();
                setPreviewUrl('');
                setResult(null);
              }}
            >
              换一张
            </button>
          </div>
        )}
      </ToolPanel>

      {file && (
        <>
          <ToolPanel title="方式">
            <div className="flex flex-wrap gap-1.5">
              {([
                ['text', '加文字水印', 'fa-font'],
                ['image', '加图片水印', 'fa-image'],
                ['mask', '区域遮挡', 'fa-eye-slash'],
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
          </ToolPanel>

          <div className="grid gap-5 lg:grid-cols-2">
            <ToolPanel title="设置">
              {mode === 'text' && (
                <div className="space-y-4">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] outline-none"
                    style={{
                      border: 'var(--tb-border-w) solid var(--border)',
                      borderRadius: 'var(--tb-panel-radius)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <label>
                      <span className="tb-label mb-1 block">字号 {fontSize}</span>
                      <input type="range" min={8} max={240} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--primary)' }} />
                    </label>
                    <label>
                      <span className="tb-label mb-1 block">透明度 {Math.round(opacity * 100)}%</span>
                      <input type="range" min={5} max={100} value={opacity * 100} onChange={(e) => setOpacity(Number(e.target.value) / 100)} className="w-full" style={{ accentColor: 'var(--primary)' }} />
                    </label>
                    <label>
                      <span className="tb-label mb-1 block">旋转 {rotate}°</span>
                      <input type="range" min={-90} max={90} value={rotate} onChange={(e) => setRotate(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--primary)' }} />
                    </label>
                    <label>
                      <span className="tb-label mb-1 block">边距 {margin}px</span>
                      <input type="range" min={0} max={200} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--primary)' }} />
                    </label>
                  </div>
                  <div className="flex items-center gap-3 text-[12px]">
                    <label className="flex items-center gap-2">
                      <span className="tb-label">颜色</span>
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded" style={{ border: 'var(--tb-border-w) solid var(--border)' }} />
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={bold} onChange={(e) => setBold(e.target.checked)} />
                      加粗
                    </label>
                  </div>
                </div>
              )}

              {mode === 'image' && (
                <div className="space-y-4">
                  <DropZone
                    accept="image/*"
                    icon="fa-image"
                    onFiles={(f) => {
                      const u = URL.createObjectURL(f[0]);
                      urls.current.push(u);
                      const img = new Image();
                      img.onload = () => setWmImage(img);
                      img.src = u;
                    }}
                    hint="建议用透明背景的 PNG"
                  />
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <label>
                      <span className="tb-label mb-1 block">大小 {Math.round(wmScale * 100)}%</span>
                      <input type="range" min={2} max={80} value={wmScale * 100} onChange={(e) => setWmScale(Number(e.target.value) / 100)} className="w-full" style={{ accentColor: 'var(--primary)' }} />
                    </label>
                    <label>
                      <span className="tb-label mb-1 block">透明度 {Math.round(opacity * 100)}%</span>
                      <input type="range" min={5} max={100} value={opacity * 100} onChange={(e) => setOpacity(Number(e.target.value) / 100)} className="w-full" style={{ accentColor: 'var(--primary)' }} />
                    </label>
                  </div>
                </div>
              )}

              {mode === 'mask' && (
                <div className="space-y-4">
                  <Notice tone="warn">
                    <strong>这里做的是遮挡，不是「修复」。</strong>
                    浏览器端做不到内容感知填充 —— 旧版宣称的「智能去水印」实际只是取周围像素插值，
                    复杂背景必留痕。下面三种方式都是把内容盖住。
                  </Notice>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      ['blur', '模糊'],
                      ['mosaic', '马赛克'],
                      ['solid', '纯色覆盖'],
                    ] as const).map(([m, label]) => (
                      <button
                        key={m}
                        type="button"
                        className="tb-btn"
                        onClick={() => setMaskMode(m)}
                        style={{
                          background: maskMode === m ? 'var(--primary)' : undefined,
                          color: maskMode === m ? 'var(--primary-foreground)' : undefined,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {maskMode === 'solid' ? (
                    <label className="flex items-center gap-2 text-[12px]">
                      <span className="tb-label">颜色</span>
                      <input type="color" value={solidColor} onChange={(e) => setSolidColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded" style={{ border: 'var(--tb-border-w) solid var(--border)' }} />
                    </label>
                  ) : (
                    <label className="block text-[12px]">
                      <span className="tb-label mb-1 block">强度 {strength}</span>
                      <input type="range" min={4} max={64} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--primary)' }} />
                    </label>
                  )}
                  <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    在右侧图片上按住拖动即可框选，可框多个。已框选 {rects.length} 个区域。
                  </p>
                  {rects.length > 0 && (
                    <button type="button" className="tb-btn" onClick={() => setRects([])}>
                      清空选区
                    </button>
                  )}
                </div>
              )}

              {mode !== 'mask' && (
                <div className="mt-4">
                  <p className="tb-label mb-2">位置</p>
                  <div className="flex flex-wrap gap-1.5">
                    {POSITIONS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="tb-btn"
                        onClick={() => setPosition(p.id)}
                        style={{
                          background: position === p.id ? 'var(--primary)' : undefined,
                          color: position === p.id ? 'var(--primary-foreground)' : undefined,
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="tb-btn tb-btn-primary mt-5"
                onClick={apply}
                disabled={state.status === 'running'}
              >
                <i className="fa-solid fa-wand-magic-sparkles text-[11px]" />
                应用
              </button>
              <ToolProgress state={state} onCancel={cancel} />
            </ToolPanel>

            <ToolPanel
              title="预览"
              subtitle={mode === 'mask' ? '按住拖动框选要遮挡的区域' : '水印位置会在应用后生效'}
            >
              <div className="relative select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="预览"
                  className="w-full rounded"
                  style={{ border: 'var(--tb-border-w) solid var(--border)', cursor: mode === 'mask' ? 'crosshair' : 'default' }}
                  draggable={false}
                  onMouseDown={(e) => {
                    if (mode !== 'mask') return;
                    const p = toImageCoords(e.clientX, e.clientY);
                    setDrawing({ x: p.x, y: p.y, w: 0, h: 0 });
                  }}
                  onMouseMove={(e) => {
                    if (mode !== 'mask' || !drawing) return;
                    const p = toImageCoords(e.clientX, e.clientY);
                    setDrawing({ ...drawing, w: p.x - drawing.x, h: p.y - drawing.y });
                  }}
                  onMouseUp={() => {
                    if (mode !== 'mask' || !drawing) return;
                    if (Math.abs(drawing.w) > 4 && Math.abs(drawing.h) > 4) {
                      setRects((r) => [
                        ...r,
                        {
                          x: Math.min(drawing.x, drawing.x + drawing.w),
                          y: Math.min(drawing.y, drawing.y + drawing.h),
                          w: Math.abs(drawing.w),
                          h: Math.abs(drawing.h),
                        },
                      ]);
                    }
                    setDrawing(null);
                  }}
                  onMouseLeave={() => setDrawing(null)}
                />
                {/* 选区叠加层：用百分比定位，跟缩放无关 */}
                {natSize.w > 0 &&
                  [...rects, ...(drawing ? [drawing] : [])].map((r, i) => (
                    <div
                      key={i}
                      className="pointer-events-none absolute"
                      style={{
                        left: `${(Math.min(r.x, r.x + r.w) / natSize.w) * 100}%`,
                        top: `${(Math.min(r.y, r.y + r.h) / natSize.h) * 100}%`,
                        width: `${(Math.abs(r.w) / natSize.w) * 100}%`,
                        height: `${(Math.abs(r.h) / natSize.h) * 100}%`,
                        border: '2px solid var(--primary)',
                        background: 'rgba(124,58,237,0.18)',
                      }}
                    />
                  ))}
              </div>
              {natSize.w > MAX_DIM || natSize.h > MAX_DIM ? (
                <p className="mt-2 text-[11px]" style={{ color: 'var(--warn, #c98a12)' }}>
                  注意：图片最长边超过 {MAX_DIM}px，处理时会等比缩小到 {MAX_DIM}px 以内（浏览器画布内存限制）。
                </p>
              ) : null}
            </ToolPanel>
          </div>
        </>
      )}

      {result && (
        <ToolPanel title="处理完成">
          <ResultCard
            url={result.url}
            filename={`${(file?.name ?? 'image').replace(/\.[^.]+$/, '')}_watermarked.${result.blob.type.includes('png') ? 'png' : 'jpg'}`}
            mime={result.blob.type}
            beforeBytes={result.before}
            afterBytes={result.blob.size}
          />
        </ToolPanel>
      )}
    </div>
  );
}

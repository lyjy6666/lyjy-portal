'use client';

import { useEffect, useRef, useState } from 'react';
import { DropZone, Notice, ResultCard, ToolPanel, ToolProgress } from './primitives';
import { useTask } from './useTask';
import { createZip } from '../core/compress';
import {
  RATIOS,
  concatImages,
  cropToRatio,
  sliceGrid,
  stripExif,
  type ConcatOptions,
  type ImageOutput,
  type RatioKey,
} from '../core/imageLayout';

type Sub = 'join' | 'slice' | 'crop' | 'exif';

const SUBS: { id: Sub; name: string; icon: string }[] = [
  { id: 'join', name: '长图拼接', icon: 'fa-link' },
  { id: 'slice', name: '九宫格切图', icon: 'fa-grip' },
  { id: 'crop', name: '固定比例裁剪', icon: 'fa-crop' },
  { id: 'exif', name: 'EXIF 清除', icon: 'fa-shield-halved' },
];

const inputStyle = {
  border: 'var(--tb-border-w) solid var(--border)',
  borderRadius: 'var(--tb-panel-radius)',
  background: 'var(--card)',
  color: 'var(--foreground)',
} as const;

type Result = { url: string; name: string; blob: Blob; width?: number; height?: number };

export default function ImageExtraTool() {
  const [sub, setSub] = useState<Sub>('join');
  const { state, run, cancel } = useTask();

  // 拼接
  const [joinFiles, setJoinFiles] = useState<File[]>([]);
  const [direction, setDirection] = useState<ConcatOptions['direction']>('vertical');
  const [gap, setGap] = useState(12);
  const [background, setBackground] = useState('#ffffff');
  const [outputWidth, setOutputWidth] = useState(0);
  const [columns, setColumns] = useState(3);

  // 切图
  const [sliceFile, setSliceFile] = useState<File | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  // 裁剪
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [ratio, setRatio] = useState<RatioKey>('1:1');

  // EXIF
  const [exifFile, setExifFile] = useState<File | null>(null);
  const [exifFormat, setExifFormat] = useState<'png' | 'jpeg'>('jpeg');
  const [quality, setQuality] = useState(0.92);

  const [result, setResult] = useState<Result | null>(null);
  const urls = useRef<string[]>([]);

  const release = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
  };

  useEffect(
    () => () => {
      release();
    },
    []
  );

  const setOut = (blob: Blob, name: string, width?: number, height?: number) => {
    release();
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    setResult({ url, name, blob, width, height });
  };

  /** 背景色：'transparent' 或空视为保留透明，其余按 CSS 颜色用 */
  const effectiveBackground =
    background.trim() === 'transparent' || background.trim() === ''
      ? 'transparent'
      : background.trim();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {SUBS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="tb-btn"
            onClick={() => {
              setSub(s.id);
              release();
              setResult(null);
            }}
            style={{
              background: sub === s.id ? 'var(--primary)' : undefined,
              color: sub === s.id ? 'var(--primary-foreground)' : undefined,
              borderColor: sub === s.id ? 'var(--primary)' : undefined,
            }}
          >
            <i className={`fa-solid ${s.icon} text-[11px]`} />
            {s.name}
          </button>
        ))}
      </div>

      {sub === 'join' && (
        <ToolPanel
          title="长图拼接"
          subtitle="横向、纵向或网格拼接；间距、背景色与输出宽度可调，输出 PNG 保留透明"
        >
          <DropZone
            accept="image/*"
            multiple
            onFiles={(f) => {
              setJoinFiles(f);
              release();
              setResult(null);
            }}
            hint="至少 2 张，按选择顺序拼接；建议先裁剪好尺寸"
          />
          {joinFiles.length > 0 && (
            <p className="mt-3 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              已选 {joinFiles.length} 张：{joinFiles.map((f) => f.name).slice(0, 3).join('、')}
              {joinFiles.length > 3 ? '…' : ''}
            </p>
          )}
          <p className="tb-label mb-2 mt-4">排列方向</p>
          <div className="flex flex-wrap gap-1.5">
            {([
              ['horizontal', '横向', 'fa-arrow-right'],
              ['vertical', '纵向', 'fa-arrow-down'],
              ['grid', '网格', 'fa-grip'],
            ] as const).map(([v, label, icon]) => (
              <button
                key={v}
                type="button"
                className="tb-btn"
                onClick={() => setDirection(v)}
                style={{
                  background: direction === v ? 'var(--primary)' : undefined,
                  color: direction === v ? 'var(--primary-foreground)' : undefined,
                }}
              >
                <i className={`fa-solid ${icon} text-[11px]`} />
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px]">
            <label className="flex items-center gap-2">
              <span className="tb-label">间距 {gap}px</span>
              <input
                type="range"
                min={0}
                max={80}
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
                style={{ accentColor: 'var(--primary)' }}
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="tb-label">输出宽度</span>
              <input
                type="number"
                min={0}
                step={100}
                value={outputWidth}
                onChange={(e) => setOutputWidth(Math.max(0, Number(e.target.value)))}
                className="w-24 px-2 py-1 text-[12px] outline-none"
                style={inputStyle}
              />
              <span style={{ color: 'var(--muted-foreground)' }}>0 = 原始尺寸</span>
            </label>
            {direction === 'grid' && (
              <label className="flex items-center gap-2">
                <span className="tb-label">列数</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={columns}
                  onChange={(e) => setColumns(Math.max(1, Number(e.target.value)))}
                  className="w-16 px-2 py-1 text-[12px] outline-none"
                  style={inputStyle}
                />
              </label>
            )}
            <label className="flex items-center gap-2">
              <span className="tb-label">背景色</span>
              <input
                type="color"
                value={background === 'transparent' ? '#ffffff' : background}
                onChange={(e) => setBackground(e.target.value)}
                style={{ width: 32, height: 24, padding: 0, border: 'none', background: 'none' }}
              />
              <button
                type="button"
                className="tb-btn"
                onClick={() => setBackground('transparent')}
                title="保留透明背景（输出 PNG）"
              >
                透明
              </button>
            </label>
          </div>
          <button
            type="button"
            className="tb-btn tb-btn-primary mt-4"
            disabled={joinFiles.length < 2 || state.status === 'running'}
            onClick={async () => {
              const out = await run((ctx) =>
                concatImages(
                  joinFiles,
                  { direction, gap, background: effectiveBackground, outputWidth, columns },
                  ctx
                )
              );
              if (out) setOut(out.blob, out.filename, out.width, out.height);
            }}
          >
            <i className="fa-solid fa-link text-[11px]" />
            开始拼接
          </button>
          <ToolProgress state={state} onCancel={cancel} />
        </ToolPanel>
      )}

      {sub === 'slice' && (
        <ToolPanel
          title="九宫格 / 网格切图"
          subtitle="按行列数等分切图，输出多张 PNG 并打包下载；除不尽的边缘像素会舍弃"
        >
          <DropZone
            accept="image/*"
            onFiles={(f) => {
              setSliceFile(f[0]);
              release();
              setResult(null);
            }}
            icon="fa-grip"
          />
          {sliceFile && (
            <p className="mt-3 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              {sliceFile.name}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px]">
            <label className="flex items-center gap-2">
              <span className="tb-label">行数</span>
              <input
                type="number"
                min={1}
                max={12}
                value={rows}
                onChange={(e) => setRows(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 text-[12px] outline-none"
                style={inputStyle}
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="tb-label">列数</span>
              <input
                type="number"
                min={1}
                max={12}
                value={cols}
                onChange={(e) => setCols(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 text-[12px] outline-none"
                style={inputStyle}
              />
            </label>
            <span style={{ color: 'var(--muted-foreground)' }}>九宫格就是 3 × 3，共 {rows * cols} 张</span>
          </div>
          <button
            type="button"
            className="tb-btn tb-btn-primary mt-4"
            disabled={!sliceFile || state.status === 'running'}
            onClick={async () => {
              if (!sliceFile) return;
              const zip = await run(async (ctx) => {
                const parts = await sliceGrid(sliceFile, rows, cols, ctx);
                return createZip(parts, ctx);
              });
              if (zip) setOut(zip, `sliced_${rows}x${cols}.zip`);
            }}
          >
            <i className="fa-solid fa-grip text-[11px]" />
            切图并下载 ZIP
          </button>
          <ToolProgress state={state} onCancel={cancel} />
        </ToolPanel>
      )}

      {sub === 'crop' && (
        <ToolPanel title="固定比例裁剪" subtitle="居中裁剪为 1:1 / 4:3 / 16:9 / 9:16，输出 PNG">
          <DropZone
            accept="image/*"
            onFiles={(f) => {
              setCropFile(f[0]);
              release();
              setResult(null);
            }}
            icon="fa-crop"
          />
          {cropFile && (
            <p className="mt-3 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              {cropFile.name}
            </p>
          )}
          <p className="tb-label mb-2 mt-4">裁剪比例</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(RATIOS) as RatioKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className="tb-btn"
                onClick={() => setRatio(key)}
                style={{
                  background: ratio === key ? 'var(--primary)' : undefined,
                  color: ratio === key ? 'var(--primary-foreground)' : undefined,
                }}
              >
                {RATIOS[key].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="tb-btn tb-btn-primary mt-4"
            disabled={!cropFile || state.status === 'running'}
            onClick={async () => {
              if (!cropFile) return;
              const out: ImageOutput | undefined = await run((ctx) => cropToRatio(cropFile, ratio, ctx));
              if (out) setOut(out.blob, out.filename, out.width, out.height);
            }}
          >
            <i className="fa-solid fa-crop text-[11px]" />
            裁剪并下载
          </button>
          <ToolProgress state={state} onCancel={cancel} />
        </ToolPanel>
      )}

      {sub === 'exif' && (
        <ToolPanel
          title="EXIF 清除"
          subtitle="canvas 重绘输出，再回扫输出文件的 Exif 标记确认已去除"
        >
          <div className="mb-3">
            <Notice tone="warn">
              重绘会丢掉<b>全部元数据</b>：EXIF（拍摄参数、时间）、GPS 定位、缩略图、ICC 配置文件等。
              这是不可逆的，请确认不再需要这些信息。
            </Notice>
          </div>
          <DropZone
            accept="image/*"
            onFiles={(f) => {
              setExifFile(f[0]);
              release();
              setResult(null);
            }}
            icon="fa-shield-halved"
          />
          {exifFile && (
            <p className="mt-3 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              {exifFile.name}
            </p>
          )}
          <p className="tb-label mb-2 mt-4">输出格式</p>
          <div className="flex flex-wrap gap-1.5">
            {([
              ['jpeg', 'JPEG（更小，不支持透明）'],
              ['png', 'PNG（支持透明）'],
            ] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                className="tb-btn"
                onClick={() => setExifFormat(v)}
                style={{
                  background: exifFormat === v ? 'var(--primary)' : undefined,
                  color: exifFormat === v ? 'var(--primary-foreground)' : undefined,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {exifFormat === 'jpeg' && (
            <div className="mt-4">
              <Notice tone="info">JPEG 不支持透明，透明区域会铺成白底。输出后仍检测到 Exif 会直接报错，不会交付。</Notice>
              <label className="mt-3 block text-[12px]">
                <span className="tb-label mb-1 block">JPEG 质量 {Math.round(quality * 100)}%</span>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: 'var(--primary)' }}
                />
              </label>
            </div>
          )}
          <button
            type="button"
            className="tb-btn tb-btn-primary mt-4"
            disabled={!exifFile || state.status === 'running'}
            onClick={async () => {
              if (!exifFile) return;
              const out = await run((ctx) => stripExif(exifFile, exifFormat, quality, ctx));
              if (out) setOut(out.blob, out.filename, out.width, out.height);
            }}
          >
            <i className="fa-solid fa-shield-halved text-[11px]" />
            清除元数据并下载
          </button>
          <ToolProgress state={state} onCancel={cancel} />
        </ToolPanel>
      )}

      {result && (
        <ToolPanel title="处理完成">
          <ResultCard
            url={result.url}
            filename={result.name}
            mime={result.blob.type}
            afterBytes={result.blob.size}
            extra={
              result.width && result.height ? (
                <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  尺寸 {result.width} × {result.height}
                </p>
              ) : undefined
            }
          />
        </ToolPanel>
      )}

      <Notice tone="info">
        <strong>全部本地处理：</strong>图片只用 canvas 在当前浏览器里加工，不会上传。
        任务结束后所有临时 URL 都会释放。
      </Notice>
    </div>
  );
}

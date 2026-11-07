'use client';

import { useEffect, useRef, useState } from 'react';
import { DropZone, Notice, ResultCard, ToolPanel, ToolProgress } from './primitives';
import { useTask } from './useTask';
import { formatBytes } from '../core/tasks';
import {
  IMAGE_FORMATS,
  convertImage,
  probeFormats,
  type ImageFormat,
  type ImageOptions,
} from '../core/imageConvert';

type Done = {
  name: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  before: number;
};

export default function ImageTool() {
  const { state, run, cancel } = useTask();
  const [files, setFiles] = useState<File[]>([]);
  const [target, setTarget] = useState<ImageFormat>('webp');
  const [quality, setQuality] = useState(0.85);
  const [resizeMode, setResizeMode] = useState<'none' | 'longest' | 'percent' | 'exact'>('none');
  const [longest, setLongest] = useState(1920);
  const [percent, setPercent] = useState(50);
  const [exact, setExact] = useState({ w: 800, h: 600 });
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [supported, setSupported] = useState<Record<string, boolean> | null>(null);
  const [results, setResults] = useState<Done[]>([]);

  /** 结果 URL 由这里统一管理，换一批结果时先释放旧的 */
  const resultUrls = useRef<string[]>([]);
  const releaseResults = () => {
    resultUrls.current.forEach((u) => URL.revokeObjectURL(u));
    resultUrls.current = [];
  };
  useEffect(() => releaseResults, []);

  // 启动时探测浏览器能编码哪些格式，不支持的直接禁用（而不是静默产出错格式）
  useEffect(() => {
    probeFormats().then(setSupported);
  }, []);

  const addFiles = (list: File[]) => {
    setFiles((prev) => [...prev, ...list]);
    setResults([]);
    releaseResults();
  };

  const buildOptions = (): ImageOptions => ({
    target,
    quality,
    rotate,
    flipH,
    flipV,
    resize:
      resizeMode === 'none'
        ? { mode: 'none' }
        : resizeMode === 'longest'
        ? { mode: 'longest', px: longest }
        : resizeMode === 'percent'
        ? { mode: 'percent', percent }
        : { mode: 'exact', width: exact.w, height: exact.h },
  });

  const start = async () => {
    if (!files.length) return;
    releaseResults();
    setResults([]);

    const out = await run(async (ctx) => {
      const done: Done[] = [];
      const urls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        ctx.throwIfCancelled();
        const f = files[i];
        ctx.progress(i / files.length, `${f.name}（${i + 1}/${files.length}）`);

        const r = await convertImage(f, buildOptions(), ctx);
        const url = URL.createObjectURL(r.blob);
        urls.push(url);
        done.push({
          name: r.filename,
          blob: r.blob,
          url,
          width: r.width,
          height: r.height,
          before: f.size,
        });
      }

      ctx.progress(1, '全部完成');
      resultUrls.current = urls;
      return done;
    });

    if (out) setResults(out);
  };

  const totalBefore = results.reduce((s, r) => s + r.before, 0);
  const totalAfter = results.reduce((s, r) => s + r.blob.size, 0);
  const alphaWarn = (target === 'jpeg' || target === 'bmp') && files.length > 0;

  return (
    <div className="space-y-5">
      <ToolPanel title="选择文件" subtitle="支持批量；图片不会上传，全部在本机处理">
        <DropZone
          accept="image/*"
          multiple
          onFiles={addFiles}
          hint="支持 JPG / PNG / WebP / GIF / BMP / AVIF 等浏览器能解码的格式"
        />

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[12px]">
                已选 <strong>{files.length}</strong> 个文件 · 共 {formatBytes(files.reduce((s, f) => s + f.size, 0))}
              </p>
              <button
                type="button"
                className="text-[11px] underline underline-offset-2"
                style={{ color: 'var(--muted-foreground)' }}
                onClick={() => {
                  setFiles([]);
                  setResults([]);
                  releaseResults();
                }}
              >
                清空
              </button>
            </div>
            <ul className="space-y-1">
              {files.slice(0, 6).map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-[11px]">
                  <i className="fa-solid fa-image" style={{ color: 'var(--primary)' }} />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{formatBytes(f.size)}</span>
                </li>
              ))}
              {files.length > 6 && (
                <li className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  还有 {files.length - 6} 个…
                </li>
              )}
            </ul>
          </div>
        )}
      </ToolPanel>

      <ToolPanel title="转换设置">
        <div className="space-y-5">
          {/* 目标格式 */}
          <div>
            <p className="tb-label mb-2">目标格式</p>
            <div className="flex flex-wrap gap-2">
              {IMAGE_FORMATS.map((f) => {
                const ok = supported ? supported[f.id] : true;
                const active = target === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={!ok}
                    onClick={() => setTarget(f.id)}
                    title={ok ? undefined : `当前浏览器无法编码 ${f.label}`}
                    className="tb-btn"
                    style={{
                      background: active ? 'var(--primary)' : undefined,
                      color: active ? 'var(--primary-foreground)' : undefined,
                      borderColor: active ? 'var(--primary)' : undefined,
                      opacity: ok ? 1 : 0.4,
                      cursor: ok ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {f.label}
                    {!ok && <i className="fa-solid fa-ban text-[10px]" />}
                  </button>
                );
              })}
            </div>
            {supported && Object.values(supported).some((v) => !v) && (
              <p className="mt-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                灰色格式是你的浏览器不支持编码的，已禁用（旧版会悄悄换成 PNG 却仍用原扩展名）
              </p>
            )}
          </div>

          {/* 质量 */}
          {(target === 'jpeg' || target === 'webp') && (
            <div>
              <p className="tb-label mb-2">
                质量 <span className="tabular-nums">{Math.round(quality * 100)}</span>
              </p>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(quality * 100)}
                onChange={(e) => setQuality(Number(e.target.value) / 100)}
                className="w-full"
                style={{ accentColor: 'var(--primary)' }}
              />
            </div>
          )}

          {/* 尺寸 */}
          <div>
            <p className="tb-label mb-2">尺寸</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['none', '保持原尺寸'],
                  ['longest', '限制最长边'],
                  ['percent', '按百分比'],
                  ['exact', '指定宽高'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setResizeMode(id)}
                  className="tb-btn"
                  style={{
                    background: resizeMode === id ? 'var(--primary)' : undefined,
                    color: resizeMode === id ? 'var(--primary-foreground)' : undefined,
                    borderColor: resizeMode === id ? 'var(--primary)' : undefined,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px]">
              {resizeMode === 'longest' && (
                <>
                  <input
                    type="number"
                    value={longest}
                    min={16}
                    max={12000}
                    onChange={(e) => setLongest(Number(e.target.value))}
                    className="w-24 px-2 py-1"
                    style={{
                      border: 'var(--tb-border-w) solid var(--border)',
                      borderRadius: 'var(--tb-panel-radius)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <span style={{ color: 'var(--muted-foreground)' }}>
                    px（按最长边等比缩放，竖图不会被压扁）
                  </span>
                </>
              )}
              {resizeMode === 'percent' && (
                <>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    value={percent}
                    onChange={(e) => setPercent(Number(e.target.value))}
                    className="w-40"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span className="tabular-nums">{percent}%</span>
                </>
              )}
              {resizeMode === 'exact' && (
                <>
                  <input
                    type="number"
                    value={exact.w}
                    min={1}
                    onChange={(e) => setExact((s) => ({ ...s, w: Number(e.target.value) }))}
                    className="w-20 px-2 py-1"
                    style={{
                      border: 'var(--tb-border-w) solid var(--border)',
                      borderRadius: 'var(--tb-panel-radius)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <span style={{ color: 'var(--muted-foreground)' }}>×</span>
                  <input
                    type="number"
                    value={exact.h}
                    min={1}
                    onChange={(e) => setExact((s) => ({ ...s, h: Number(e.target.value) }))}
                    className="w-20 px-2 py-1"
                    style={{
                      border: 'var(--tb-border-w) solid var(--border)',
                      borderRadius: 'var(--tb-panel-radius)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <span style={{ color: 'var(--muted-foreground)' }}>px</span>
                </>
              )}
            </div>
          </div>

          {/* 旋转翻转 */}
          <div>
            <p className="tb-label mb-2">旋转与翻转</p>
            <div className="flex flex-wrap gap-2">
              {([0, 90, 180, 270] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRotate(r)}
                  className="tb-btn"
                  style={{
                    background: rotate === r ? 'var(--primary)' : undefined,
                    color: rotate === r ? 'var(--primary-foreground)' : undefined,
                    borderColor: rotate === r ? 'var(--primary)' : undefined,
                  }}
                >
                  {r}°
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFlipH((v) => !v)}
                className="tb-btn"
                style={{
                  background: flipH ? 'var(--primary)' : undefined,
                  color: flipH ? 'var(--primary-foreground)' : undefined,
                  borderColor: flipH ? 'var(--primary)' : undefined,
                }}
              >
                水平翻转
              </button>
              <button
                type="button"
                onClick={() => setFlipV((v) => !v)}
                className="tb-btn"
                style={{
                  background: flipV ? 'var(--primary)' : undefined,
                  color: flipV ? 'var(--primary-foreground)' : undefined,
                  borderColor: flipV ? 'var(--primary)' : undefined,
                }}
              >
                垂直翻转
              </button>
            </div>
          </div>

          {alphaWarn && (
            <Notice tone="warn">
              {target.toUpperCase()} 不支持透明通道，透明区域会被填成白色（这是格式本身的限制）。
            </Notice>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={!files.length || state.status === 'running'}
            className="tb-btn tb-btn-primary"
            style={{ opacity: files.length ? 1 : 0.5 }}
          >
            <i className="fa-solid fa-wand-magic-sparkles text-[11px]" />
            开始转换{files.length > 1 ? `（${files.length} 个）` : ''}
          </button>
          {state.status === 'running' && (
            <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              处理中，可随时取消
            </span>
          )}
        </div>

        <ToolProgress state={state} onCancel={cancel} />
      </ToolPanel>

      {results.length > 0 && (
        <ToolPanel
          title={`转换完成 · ${results.length} 个文件`}
          subtitle={`合计 ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)}`}
        >
          <div className="space-y-3">
            {results.map((r) => (
              <ResultCard
                key={r.url}
                url={r.url}
                filename={r.name}
                mime={r.blob.type}
                beforeBytes={r.before}
                afterBytes={r.blob.size}
                extra={
                  <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    输出尺寸 {r.width} × {r.height}
                  </p>
                }
              />
            ))}
          </div>
        </ToolPanel>
      )}
    </div>
  );
}

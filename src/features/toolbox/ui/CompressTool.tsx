'use client';

import { useEffect, useRef, useState } from 'react';
import { DropZone, Notice, ResultCard, ToolPanel, ToolProgress } from './primitives';
import { useTask } from './useTask';
import { formatBytes, sizeDelta } from '../core/tasks';
import { IMAGE_FORMATS, type ImageFormat } from '../core/imageConvert';
import { compressImage, createZip, extractZip, type ImageCompressOptions } from '../core/compress';

type Done = { name: string; url: string; blob: Blob; before: number; w: number; h: number };

export default function CompressTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [maxLongest, setMaxLongest] = useState(1920);
  const [quality, setQuality] = useState(0.8);
  const [target, setTarget] = useState<ImageFormat | 'auto'>('auto');
  const [results, setResults] = useState<Done[]>([]);
  const [zipUrl, setZipUrl] = useState('');
  const [zipInfo, setZipInfo] = useState<{ size: number; count: number } | null>(null);
  const [extracted, setExtracted] = useState<{ name: string; url: string; size: number }[]>([]);

  const { state, run, cancel } = useTask();
  const urls = useRef<string[]>([]);

  const release = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
  };
  useEffect(() => release, []);

  const reset = () => {
    release();
    setResults([]);
    setZipUrl('');
    setZipInfo(null);
    setExtracted([]);
  };

  const doCompress = async () => {
    if (!files.length) return;
    reset();

    const out = await run(async (ctx) => {
      const done: Done[] = [];
      const opts: ImageCompressOptions = { maxLongest, quality, target };

      for (let i = 0; i < files.length; i++) {
        ctx.throwIfCancelled();
        ctx.progress(i / files.length, `${files[i].name}（${i + 1}/${files.length}）`);
        const r = await compressImage(files[i], opts, ctx);
        const url = URL.createObjectURL(r.blob);
        urls.current.push(url);
        done.push({ name: r.filename, url, blob: r.blob, before: files[i].size, w: r.width, h: r.height });
      }
      ctx.progress(1, '全部完成');
      return done;
    });

    if (out) setResults(out);
  };

  const doZip = async () => {
    const entries = results.length
      ? results.map((r) => ({ name: r.name, blob: r.blob }))
      : files.map((f) => ({ name: f.name, blob: f }));
    if (!entries.length) return;

    reset();
    const blob = await run(async (ctx) => createZip(entries, ctx));
    if (blob) {
      const u = URL.createObjectURL(blob);
      urls.current.push(u);
      setZipUrl(u);
      setZipInfo({ size: blob.size, count: entries.length });
    }
  };

  const totalBefore = results.reduce((s, r) => s + r.before, 0);
  const totalAfter = results.reduce((s, r) => s + r.blob.size, 0);
  const delta = results.length ? sizeDelta(totalBefore, totalAfter) : null;

  return (
    <div className="space-y-5">
      <ToolPanel title="选择文件" subtitle="图片压缩，或把任意文件打包成 ZIP">
        <DropZone
          accept="*"
          multiple
          onFiles={(list) => {
            setFiles(list);
            reset();
          }}
          hint="图片会按下面的设置压缩；其它文件会被打包进 ZIP"
        />
        {files.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-[12px]">
            <span>
              已选 <strong>{files.length}</strong> 个 · {formatBytes(files.reduce((s, f) => s + f.size, 0))}
            </span>
            <button
              type="button"
              className="underline underline-offset-2"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => {
                setFiles([]);
                reset();
              }}
            >
              清空
            </button>
          </div>
        )}
      </ToolPanel>

      <ToolPanel title="图片压缩设置">
        <div className="space-y-4">
          <div>
            <p className="tb-label mb-2">最长边不超过 {maxLongest}px</p>
            <input
              type="range"
              min={320}
              max={4096}
              step={64}
              value={maxLongest}
              onChange={(e) => setMaxLongest(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--primary)' }}
            />
            <p className="mt-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              按最长边等比缩放 —— 竖图不会被压扁（旧版写死 1920×1080 横屏框，竖图会被压变形）
            </p>
          </div>

          <div>
            <p className="tb-label mb-2">质量 {Math.round(quality * 100)}</p>
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

          <div>
            <p className="tb-label mb-2">输出格式</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className="tb-btn"
                onClick={() => setTarget('auto')}
                style={{
                  background: target === 'auto' ? 'var(--primary)' : undefined,
                  color: target === 'auto' ? 'var(--primary-foreground)' : undefined,
                }}
              >
                保留原格式
              </button>
              {IMAGE_FORMATS.filter((f) => f.id !== 'gif').map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="tb-btn"
                  onClick={() => setTarget(f.id)}
                  style={{
                    background: target === f.id ? 'var(--primary)' : undefined,
                    color: target === f.id ? 'var(--primary-foreground)' : undefined,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              保留原格式时，PNG 会继续输出 PNG（透明通道不丢）；旧版一律转 JPEG，透明会变黑块。
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="tb-btn tb-btn-primary"
            onClick={doCompress}
            disabled={!files.length || state.status === 'running'}
          >
            <i className="fa-solid fa-compress text-[11px]" />
            压缩图片
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={doZip}
            disabled={!files.length || state.status === 'running'}
          >
            <i className="fa-solid fa-file-zipper text-[11px]" />
            打包成 ZIP
          </button>
        </div>

        <ToolProgress state={state} onCancel={cancel} />
      </ToolPanel>

      {results.length > 0 && delta && (
        <ToolPanel
          title={`压缩完成 · ${results.length} 个`}
          subtitle={`合计 ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} · ${delta.label}`}
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
                    输出尺寸 {r.w} × {r.h}
                  </p>
                }
              />
            ))}
          </div>
        </ToolPanel>
      )}

      {zipUrl && zipInfo && (
        <ToolPanel title="ZIP 打包完成">
          <ResultCard
            url={zipUrl}
            filename={`archive_${zipInfo.count}files.zip`}
            mime="application/zip"
            afterBytes={zipInfo.size}
          />
          <div className="mt-3">
            <Notice tone="warn">
              <strong>关于「文档压缩」的真相：</strong>ZIP 只是打包，不是压缩算法意义上的瘦身。
              PDF、DOCX、JPG、MP4 这些**本身已经压缩过**，再打包通常体积不变甚至更大 ——
              上面显示的是真实体积，变大就是变大。旧版无论结果如何都显示「节省 X%」，那是假的。
            </Notice>
          </div>
        </ToolPanel>
      )}

      <ToolPanel title="解压 ZIP" subtitle="列出内容并解压到本地">
        <DropZone
          accept=".zip,application/zip"
          icon="fa-file-zipper"
          onFiles={async (files2) => {
            reset();
            const out = await run(async (ctx) => extractZip(files2[0], ctx));
            if (out) {
              setExtracted(
                out.map((e) => {
                  const u = URL.createObjectURL(e.blob);
                  urls.current.push(u);
                  return { name: e.name, url: u, size: e.blob.size };
                })
              );
            }
          }}
          hint="只支持 ZIP；RAR / 7z 需要额外组件，当前不支持"
        />
        <ToolProgress state={state} onCancel={cancel} />
        {extracted.length > 0 && (
          <div className="mt-4 space-y-2">
            {extracted.map((e) => (
              <div key={e.url} className="flex items-center gap-3 text-[12px]">
                <i className="fa-solid fa-file" style={{ color: 'var(--primary)' }} />
                <span className="min-w-0 flex-1 truncate">{e.name}</span>
                <span style={{ color: 'var(--muted-foreground)' }}>{formatBytes(e.size)}</span>
                <a href={e.url} download={e.name.split('/').pop()} className="tb-btn" style={{ padding: '0.25rem 0.6rem' }}>
                  下载
                </a>
              </div>
            ))}
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

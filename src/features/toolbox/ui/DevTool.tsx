'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CopyButton, DropZone, Notice, ToolPanel, ToolProgress } from './primitives';
import { useTask } from './useTask';
import { formatBytes } from '../core/tasks';
import {
  BARCODE_DEFAULTS,
  BARCODE_FORMATS,
  QR_DEFAULTS,
  generateBarcode,
  generateQr,
  generateQrSvg,
  scanBarcode,
  scanQr,
  validateBarcodeContent,
  type BarcodeFormat,
} from '../core/qrBarcode';
import {
  HASH_ALGOS,
  hashFile,
  hashText,
  type HashAlgo,
} from '../core/hash';
import {
  TIMEZONES,
  base64Decode,
  base64Encode,
  cmykToRgb,
  contrastRatio,
  dateToTimestamp,
  decodeJwt,
  htmlEscape,
  htmlUnescape,
  hslToRgb,
  hsvToRgb,
  nowTimestamps,
  parseHex,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  testRegex,
  textStats,
  timestampToDates,
  unicodeEscape,
  unicodeUnescape,
  urlDecode,
  urlEncode,
  uuidV4,
  uuidV7,
  wcagLevel,
  type TimestampUnit,
} from '../core/devUtils';

type Sub = 'hash' | 'color' | 'qr' | 'barcode' | 'time' | 'text' | 'jwt' | 'regex';

const SUBS: { id: Sub; name: string; icon: string }[] = [
  { id: 'hash', name: '哈希', icon: 'fa-fingerprint' },
  { id: 'color', name: '颜色', icon: 'fa-palette' },
  { id: 'qr', name: '二维码', icon: 'fa-qrcode' },
  { id: 'barcode', name: '条码', icon: 'fa-barcode' },
  { id: 'time', name: '时间戳', icon: 'fa-clock' },
  { id: 'text', name: '文本', icon: 'fa-font' },
  { id: 'jwt', name: 'JWT', icon: 'fa-key' },
  { id: 'regex', name: '正则', icon: 'fa-asterisk' },
];

const inputStyle = {
  border: 'var(--tb-border-w) solid var(--border)',
  borderRadius: 'var(--tb-panel-radius)',
  background: 'var(--card)',
  color: 'var(--foreground)',
} as const;

/* ============================ 哈希 ============================ */

function HashTool() {
  const [text, setText] = useState('hello world');
  const [algo, setAlgo] = useState<HashAlgo>('SHA-256');
  const [single, setSingle] = useState('');
  const [all, setAll] = useState<Record<string, string> | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; hash: string } | null>(null);
  const { state, run, cancel } = useTask();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const h = await hashText(text, algo);
        if (alive) setSingle(h);
      } catch {
        if (alive) setSingle('');
      }
    })();
    return () => {
      alive = false;
    };
  }, [text, algo]);

  const calcAll = async () => {
    const entries = await Promise.all(HASH_ALGOS.map(async (a) => [a.id, await hashText(text, a.id)] as const));
    setAll(Object.fromEntries(entries));
  };

  return (
    <div className="space-y-4">
      <ToolPanel title="文本哈希" subtitle="MD5 是真正的 MD5（旧版那个其实是 SHA-256 的复制）">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="h-24 w-full resize-y p-3 font-mono text-[12px] outline-none"
          style={inputStyle}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {HASH_ALGOS.map((a) => (
            <button
              key={a.id}
              type="button"
              className="tb-btn"
              title={a.note}
              onClick={() => setAlgo(a.id)}
              style={{
                background: algo === a.id ? 'var(--primary)' : undefined,
                color: algo === a.id ? 'var(--primary-foreground)' : undefined,
                borderColor: algo === a.id ? 'var(--primary)' : undefined,
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <code
            className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap p-3 font-mono text-[12px]"
            style={inputStyle}
          >
            {single || '—'}
          </code>
          <CopyButton text={single} />
        </div>
        <button type="button" className="tb-btn mt-3" onClick={calcAll}>
          算出全部算法
        </button>
        {all && (
          <div className="mt-3 space-y-1.5">
            {HASH_ALGOS.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-[11px]">
                <span className="w-20 shrink-0 font-semibold">{a.label}</span>
                <code className="min-w-0 flex-1 truncate font-mono">{all[a.id]}</code>
                <CopyButton text={all[a.id]} label="" />
              </div>
            ))}
          </div>
        )}
      </ToolPanel>

      <ToolPanel title="文件哈希" subtitle="大文件分块读取，不会一次性吃满内存">
        <DropZone
          accept="*"
          onFiles={async (files) => {
            const f = files[0];
            const out = await run(async (ctx) => {
              const h = await hashFile(f, algo, (v) => ctx.progress(v, '读取中…'), ctx.signal);
              return h;
            });
            if (out) setFileInfo({ name: f.name, size: f.size, hash: out });
          }}
          hint={`当前算法：${algo}（文件哈希用 MD5 时是流式的，其它算法需整块读入）`}
          icon="fa-file-shield"
        />
        <ToolProgress state={state} onCancel={cancel} />
        {fileInfo && (
          <div className="mt-4 space-y-1.5">
            <p className="text-[12px]">
              {fileInfo.name} · {formatBytes(fileInfo.size)}
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all p-3 font-mono text-[11px]" style={inputStyle}>
                {fileInfo.hash}
              </code>
              <CopyButton text={fileInfo.hash} />
            </div>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/* ============================ 颜色 ============================ */

function ColorTool() {
  const [hex, setHex] = useState('#3b82f6');
  const [bg, setBg] = useState('#ffffff');

  const rgb = useMemo(() => parseHex(hex), [hex]);
  const contrast = useMemo(() => {
    const b = parseHex(bg);
    return rgb && b ? contrastRatio(rgb, b) : null;
  }, [rgb, bg]);

  const formats = useMemo(() => {
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb);
    const hsv = rgbToHsv(rgb);
    const cmyk = rgbToCmyk(rgb);
    return {
      hex: rgbToHex(rgb, rgb.a),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    };
  }, [rgb]);

  return (
    <div className="space-y-4">
      <ToolPanel title="输入颜色" subtitle="支持 #abc 三位简写、#aabbcc、#aabbccdd（带透明）">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={rgb ? rgbToHex(rgb) : '#000000'}
            onChange={(e) => setHex(e.target.value)}
            className="h-12 w-20 cursor-pointer rounded"
            style={{ border: 'var(--tb-border-w) solid var(--border)' }}
          />
          <input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            spellCheck={false}
            className="w-40 px-3 py-2 font-mono text-[13px] outline-none"
            style={inputStyle}
          />
          {!rgb && <span className="text-[11px]" style={{ color: 'var(--destructive)' }}>HEX 格式不对</span>}
        </div>
      </ToolPanel>

      {formats && rgb && (
        <>
          <ToolPanel title="各格式">
            <div className="space-y-2">
              {Object.entries(formats).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="tb-label w-16 shrink-0">{k}</span>
                  <code className="min-w-0 flex-1 truncate font-mono text-[12px]">{v}</code>
                  <CopyButton text={v} label="" />
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
              {[
                ['RGB', `${rgb.r}, ${rgb.g}, ${rgb.b}`],
                ['HSL', (() => { const h = rgbToHsl(rgb); return `${h.h}°, ${h.s}%, ${h.l}%`; })()],
                ['CMYK', (() => { const c = rgbToCmyk(rgb); return `${c.c}, ${c.m}, ${c.y}, ${c.k}`; })()],
              ].map(([k, v]) => (
                <div key={k} className="p-2" style={{ ...inputStyle, padding: '0.5rem' }}>
                  <p className="tb-label">{k}</p>
                  <p className="mt-1 font-mono">{v}</p>
                </div>
              ))}
            </div>
          </ToolPanel>

          <ToolPanel title="对比度（WCAG）" subtitle="检查文字与背景的可读性是否达标">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[12px]">背景色</span>
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded"
                style={{ border: 'var(--tb-border-w) solid var(--border)' }}
              />
              <input
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="w-32 px-3 py-1.5 font-mono text-[12px] outline-none"
                style={inputStyle}
              />
            </div>
            {contrast !== null && (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div
                  className="flex h-20 flex-1 items-center justify-center rounded"
                  style={{ background: bg, border: 'var(--tb-border-w) solid var(--border)' }}
                >
                  <span style={{ color: formats.hex, fontSize: 18, fontWeight: 600 }}>示例文字 Aa 你好</span>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums">{contrast}:1</p>
                  <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                    正文 {wcagLevel(contrast)}
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                    大字 {wcagLevel(contrast, true)}
                  </p>
                </div>
              </div>
            )}
          </ToolPanel>
        </>
      )}
    </div>
  );
}

/* ============================ 二维码 ============================ */

function QrTool() {
  const [text, setText] = useState('https://example.com');
  const [opts, setOpts] = useState(QR_DEFAULTS);
  const [png, setPng] = useState('');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState('');
  const { state, run, cancel } = useTask();
  const urlRef = useRef('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const blob = await generateQr(text, opts);
        if (!alive) return;
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const u = URL.createObjectURL(blob);
        urlRef.current = u;
        setPng(u);
        setSvg(await generateQrSvg(text, opts));
        setError('');
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : '生成失败');
      }
    })();
    return () => {
      alive = false;
    };
  }, [text, opts]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  return (
    <div className="space-y-4">
      <ToolPanel title="生成二维码">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="h-20 w-full resize-y p-3 text-[13px] outline-none"
          style={inputStyle}
          placeholder="输入网址、文本或任意内容"
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-[12px]">
            <span className="tb-label mb-1 block">尺寸 {opts.size}px</span>
            <input
              type="range"
              min={128}
              max={1024}
              step={32}
              value={opts.size}
              onChange={(e) => setOpts((o) => ({ ...o, size: Number(e.target.value) }))}
              className="w-full"
              style={{ accentColor: 'var(--primary)' }}
            />
          </label>
          <label className="text-[12px]">
            <span className="tb-label mb-1 block">容错级别</span>
            <div className="flex gap-1">
              {(['L', 'M', 'Q', 'H'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className="tb-btn"
                  onClick={() => setOpts((o) => ({ ...o, level: l }))}
                  style={{
                    background: opts.level === l ? 'var(--primary)' : undefined,
                    color: opts.level === l ? 'var(--primary-foreground)' : undefined,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </label>
          <label className="text-[12px]">
            <span className="tb-label mb-1 block">颜色</span>
            <div className="flex gap-2">
              <input
                type="color"
                value={opts.dark}
                onChange={(e) => setOpts((o) => ({ ...o, dark: e.target.value }))}
                className="h-9 w-12 cursor-pointer rounded"
                style={{ border: 'var(--tb-border-w) solid var(--border)' }}
              />
              <input
                type="color"
                value={opts.light}
                onChange={(e) => setOpts((o) => ({ ...o, light: e.target.value }))}
                className="h-9 w-12 cursor-pointer rounded"
                style={{ border: 'var(--tb-border-w) solid var(--border)' }}
              />
            </div>
          </label>
        </div>

        {error ? (
          <div className="mt-4">
            <Notice tone="error">{error}</Notice>
          </div>
        ) : (
          png && (
            <div className="mt-4 flex flex-wrap items-center gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={png} alt="二维码" className="h-40 w-40 rounded" style={{ background: '#fff' }} />
              <div className="flex flex-col gap-2">
                <a href={png} download="qrcode.png" className="tb-btn tb-btn-primary">
                  <i className="fa-solid fa-download text-[11px]" />
                  下载 PNG
                </a>
                <button
                  type="button"
                  className="tb-btn"
                  onClick={() => {
                    const blob = new Blob([svg], { type: 'image/svg+xml' });
                    const u = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = u;
                    a.download = 'qrcode.svg';
                    a.click();
                    URL.revokeObjectURL(u);
                  }}
                >
                  <i className="fa-solid fa-vector-square text-[11px]" />
                  下载 SVG（矢量）
                </button>
              </div>
            </div>
          )
        )}
      </ToolPanel>

      <ToolPanel title="识别二维码" subtitle="上传含二维码的图片">
        <DropZone
          accept="image/*"
          icon="fa-qrcode"
          onFiles={async (files) => {
            setScanResult('');
            const r = await run(async (ctx) => {
              ctx.progress(0.3, '识别中…');
              const t = await scanQr(files[0]);
              ctx.progress(1, '完成');
              return t;
            });
            if (r) setScanResult(r);
          }}
          hint="识别不了的话，试试裁掉多余背景再上传"
        />
        <ToolProgress state={state} onCancel={cancel} />
        {scanResult && (
          <div className="mt-4 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all p-3 text-[12px]" style={inputStyle}>
              {scanResult}
            </code>
            <CopyButton text={scanResult} />
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/* ============================ 条码 ============================ */

function BarcodeTool() {
  const [value, setValue] = useState('LYJY-2026');
  const [opts, setOpts] = useState(BARCODE_DEFAULTS);
  const [png, setPng] = useState('');
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState('');
  const { state, run, cancel } = useTask();
  const urlRef = useRef('');

  const contentError = validateBarcodeContent(value, opts.format);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (contentError) {
        setError(contentError);
        setPng('');
        return;
      }
      try {
        const blob = await generateBarcode(value, opts);
        if (!alive) return;
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const u = URL.createObjectURL(blob);
        urlRef.current = u;
        setPng(u);
        setError('');
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : '生成失败');
      }
    })();
    return () => {
      alive = false;
    };
  }, [value, opts, contentError]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  return (
    <div className="space-y-4">
      <ToolPanel title="生成条码">
        <div className="flex flex-wrap gap-1.5">
          {BARCODE_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="tb-btn"
              title={f.hint}
              onClick={() => setOpts((o) => ({ ...o, format: f.id as BarcodeFormat }))}
              style={{
                background: opts.format === f.id ? 'var(--primary)' : undefined,
                color: opts.format === f.id ? 'var(--primary-foreground)' : undefined,
                borderColor: opts.format === f.id ? 'var(--primary)' : undefined,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          className="mt-4 w-full px-3 py-2 font-mono text-[13px] outline-none"
          style={inputStyle}
          placeholder="条码内容"
        />

        <div className="mt-3 flex flex-wrap gap-4 text-[12px]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={opts.displayValue}
              onChange={(e) => setOpts((o) => ({ ...o, displayValue: e.target.checked }))}
            />
            显示文字
          </label>
          <label className="flex items-center gap-2">
            <span className="tb-label">高度</span>
            <input
              type="range"
              min={40}
              max={200}
              value={opts.height}
              onChange={(e) => setOpts((o) => ({ ...o, height: Number(e.target.value) }))}
              style={{ accentColor: 'var(--primary)' }}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="tb-label">线条</span>
            <input
              type="color"
              value={opts.lineColor}
              onChange={(e) => setOpts((o) => ({ ...o, lineColor: e.target.value }))}
              className="h-8 w-12 cursor-pointer rounded"
              style={{ border: 'var(--tb-border-w) solid var(--border)' }}
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4">
            <Notice tone={contentError ? 'warn' : 'error'}>{error}</Notice>
          </div>
        ) : (
          png && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={png} alt="条码" className="max-w-full rounded" style={{ background: '#fff' }} />
              <a href={png} download="barcode.png" className="tb-btn tb-btn-primary mt-3">
                <i className="fa-solid fa-download text-[11px]" />
                下载 PNG
              </a>
            </div>
          )
        )}
      </ToolPanel>

      <ToolPanel
        title="识别条码"
        subtitle="一维条码用 @zxing 识别（旧版错用了二维码库 jsQR，所以永远识别不了）"
      >
        <DropZone
          accept="image/*"
          icon="fa-barcode"
          onFiles={async (files) => {
            setScanResult('');
            const r = await run(async (ctx) => {
              ctx.progress(0.3, '识别中…');
              const t = await scanBarcode(files[0]);
              ctx.progress(1, '完成');
              return `${t.format} · ${t.text}`;
            });
            if (r) setScanResult(r);
          }}
          hint="一维条码对图片质量敏感：建议只保留条码区域、保证横向水平"
        />
        <ToolProgress state={state} onCancel={cancel} />
        {scanResult && (
          <div className="mt-4 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all p-3 text-[12px]" style={inputStyle}>
              {scanResult}
            </code>
            <CopyButton text={scanResult} />
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/* ============================ 时间戳 ============================ */

function TimeTool() {
  const [ts, setTs] = useState(String(Math.floor(Date.now() / 1000)));
  const [unit, setUnit] = useState<TimestampUnit>('s');
  const [tz, setTz] = useState('Asia/Shanghai');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 19));

  const tsResult = useMemo(() => {
    try {
      return { ok: true as const, ...timestampToDates(ts, unit, tz) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : '转换失败' };
    }
  }, [ts, unit, tz]);

  const dateResult = useMemo(() => {
    try {
      return { ok: true as const, ...dateToTimestamp(dateStr) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : '转换失败' };
    }
  }, [dateStr]);

  const now = nowTimestamps();

  return (
    <div className="space-y-4">
      <ToolPanel title="当前时间" subtitle="点一下即可复制">
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ['秒', now.s],
            ['毫秒', now.ms],
            ['微秒', now.us],
          ] as const).map(([label, v]) => (
            <div key={label} className="p-3" style={inputStyle}>
              <p className="tb-label">{label}</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate font-mono text-[12px]">{v}</code>
                <CopyButton text={String(v)} label="" />
              </div>
            </div>
          ))}
        </div>
      </ToolPanel>

      <ToolPanel title="时间戳 → 时间">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={ts}
            onChange={(e) => setTs(e.target.value)}
            spellCheck={false}
            className="min-w-[12rem] flex-1 px-3 py-2 font-mono text-[13px] outline-none"
            style={inputStyle}
          />
          {(['s', 'ms', 'us'] as const).map((u) => (
            <button
              key={u}
              type="button"
              className="tb-btn"
              onClick={() => setUnit(u)}
              style={{
                background: unit === u ? 'var(--primary)' : undefined,
                color: unit === u ? 'var(--primary-foreground)' : undefined,
              }}
            >
              {u === 's' ? '秒' : u === 'ms' ? '毫秒' : '微秒'}
            </button>
          ))}
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="px-3 py-2 text-[12px] outline-none"
            style={inputStyle}
          >
            {TIMEZONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {tsResult.ok ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="tb-label w-16 shrink-0">本地</span>
              <code className="min-w-0 flex-1 font-mono text-[13px]">{tsResult.formatted}</code>
              <CopyButton text={tsResult.formatted} label="" />
            </div>
            <div className="flex items-center gap-2">
              <span className="tb-label w-16 shrink-0">ISO</span>
              <code className="min-w-0 flex-1 truncate font-mono text-[12px]">{tsResult.iso}</code>
              <CopyButton text={tsResult.iso} label="" />
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <Notice tone="error">{tsResult.error}</Notice>
          </div>
        )}
      </ToolPanel>

      <ToolPanel title="时间 → 时间戳" subtitle="格式建议：2026-10-07T12:00:00">
        <input
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          spellCheck={false}
          className="w-full px-3 py-2 font-mono text-[13px] outline-none"
          style={inputStyle}
        />
        {dateResult.ok ? (
          <div className="mt-3 space-y-2">
            {([
              ['秒', dateResult.s],
              ['毫秒', dateResult.ms],
              ['微秒', dateResult.us],
            ] as const).map(([label, v]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="tb-label w-16 shrink-0">{label}</span>
                <code className="min-w-0 flex-1 font-mono text-[12px]">{v}</code>
                <CopyButton text={String(v)} label="" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <Notice tone="error">{dateResult.error}</Notice>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/* ============================ 文本 ============================ */

function TextTool() {
  const [text, setText] = useState('Hello 你好 🌍');
  const [mode, setMode] = useState<'base64' | 'url' | 'html' | 'unicode'>('base64');
  const [dir, setDir] = useState<'encode' | 'decode'>('encode');

  const output = useMemo(() => {
    try {
      if (dir === 'encode') {
        if (mode === 'base64') return base64Encode(text);
        if (mode === 'url') return urlEncode(text);
        if (mode === 'html') return htmlEscape(text);
        return unicodeEscape(text);
      }
      if (mode === 'base64') return base64Decode(text);
      if (mode === 'url') return urlDecode(text);
      if (mode === 'html') return htmlUnescape(text);
      return unicodeUnescape(text);
    } catch (e) {
      return `⚠ ${e instanceof Error ? e.message : '处理失败'}`;
    }
  }, [text, mode, dir]);

  const stats = textStats(text);

  return (
    <div className="space-y-4">
      <ToolPanel title="编码 / 解码">
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1.5">
            {(['base64', 'url', 'html', 'unicode'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className="tb-btn"
                onClick={() => setMode(m)}
                style={{
                  background: mode === m ? 'var(--primary)' : undefined,
                  color: mode === m ? 'var(--primary-foreground)' : undefined,
                }}
              >
                {m === 'base64' ? 'Base64' : m === 'url' ? 'URL' : m === 'html' ? 'HTML 实体' : 'Unicode'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="tb-btn"
            onClick={() => setDir((d) => (d === 'encode' ? 'decode' : 'encode'))}
          >
            <i className="fa-solid fa-right-left text-[11px]" />
            {dir === 'encode' ? '编码中' : '解码中'}
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="mt-3 h-24 w-full resize-y p-3 font-mono text-[12px] outline-none"
          style={inputStyle}
        />
        <div className="mt-3 flex items-start gap-2">
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            className="h-24 min-w-0 flex-1 resize-y p-3 font-mono text-[12px] outline-none"
            style={inputStyle}
          />
          <CopyButton text={output} />
        </div>
      </ToolPanel>

      <ToolPanel title="文本统计">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {([
            ['字符', stats.chars],
            ['不含空白', stats.charsNoSpace],
            ['词', stats.words],
            ['行', stats.lines],
            ['中文字', stats.cjk],
            ['字节', stats.bytes],
          ] as const).map(([k, v]) => (
            <div key={k} className="p-3 text-center" style={inputStyle}>
              <p className="text-lg font-bold tabular-nums">{v}</p>
              <p className="tb-label">{k}</p>
            </div>
          ))}
        </div>
      </ToolPanel>

      <ToolPanel title="UUID 生成">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="tb-btn"
            onClick={() => setText(uuidV4())}
          >
            UUID v4（随机）
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={() => setText(uuidV7())}
          >
            UUID v7（按时间排序）
          </button>
        </div>
        <p className="mt-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
          v4 完全随机；v7 前 48 位是时间戳，作为数据库主键时索引更友好。生成结果会填到上面的输入框。
        </p>
      </ToolPanel>
    </div>
  );
}

/* ============================ JWT ============================ */

function JwtTool() {
  const [token, setToken] = useState('');

  const result = useMemo(() => {
    if (!token.trim()) return null;
    try {
      return { ok: true as const, data: decodeJwt(token) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : '解析失败' };
    }
  }, [token]);

  return (
    <div className="space-y-4">
      <ToolPanel title="JWT 解码" subtitle="只做解码，不验证签名 —— 签名验证需要密钥">
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
          className="h-28 w-full resize-y p-3 font-mono text-[12px] outline-none"
          style={inputStyle}
          placeholder="粘贴 JWT（eyJhbGci... 三段用 . 分隔）"
        />
        {result && !result.ok && (
          <div className="mt-3">
            <Notice tone="error">{result.error}</Notice>
          </div>
        )}
      </ToolPanel>

      {result?.ok && (
        <>
          {result.data.expiresAt && (
            <Notice tone={result.data.expired ? 'error' : 'success'}>
              {result.data.expired ? '已过期：' : '有效期至：'}
              {result.data.expiresAt.toLocaleString('zh-CN')}
              {result.data.notBefore && ` · 生效于 ${result.data.notBefore.toLocaleString('zh-CN')}`}
            </Notice>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <ToolPanel title="Header">
              <pre className="overflow-auto p-3 font-mono text-[12px]" style={inputStyle}>
                {JSON.stringify(result.data.header, null, 2)}
              </pre>
            </ToolPanel>
            <ToolPanel title="Payload">
              <pre className="max-h-80 overflow-auto p-3 font-mono text-[12px]" style={inputStyle}>
                {JSON.stringify(result.data.payload, null, 2)}
              </pre>
            </ToolPanel>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================ 正则 ============================ */

function RegexTool() {
  const [pattern, setPattern] = useState('(\\w+)@(\\w+)\\.com');
  const [flags, setFlags] = useState('gi');
  const [text, setText] = useState('联系 a@example.com 或 b@test.com');

  const result = useMemo(() => testRegex(pattern, flags, text), [pattern, flags, text]);

  const highlighted = useMemo(() => {
    if (result.error || !result.matches.length) return null;
    const parts: { text: string; match: boolean }[] = [];
    let last = 0;
    for (const m of result.matches) {
      if (m.index > last) parts.push({ text: text.slice(last, m.index), match: false });
      parts.push({ text: m.value, match: true });
      last = m.index + m.value.length;
    }
    if (last < text.length) parts.push({ text: text.slice(last), match: false });
    return parts;
  }, [result, text]);

  return (
    <div className="space-y-4">
      <ToolPanel title="正则测试">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[14px]">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            className="min-w-[14rem] flex-1 px-3 py-2 font-mono text-[13px] outline-none"
            style={inputStyle}
          />
          <span className="font-mono text-[14px]">/</span>
          <input
            value={flags}
            onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
            spellCheck={false}
            className="w-20 px-3 py-2 font-mono text-[13px] outline-none"
            style={inputStyle}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {([
            ['g', '全局'],
            ['i', '忽略大小写'],
            ['m', '多行'],
            ['s', '点匹配换行'],
            ['u', 'Unicode'],
            ['y', '粘性'],
          ] as const).map(([f, label]) => (
            <button
              key={f}
              type="button"
              className="tb-btn"
              title={label}
              onClick={() =>
                setFlags((cur) => (cur.includes(f) ? cur.replace(f, '') : cur + f))
              }
              style={{
                background: flags.includes(f) ? 'var(--primary)' : undefined,
                color: flags.includes(f) ? 'var(--primary-foreground)' : undefined,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {result.error && (
          <div className="mt-3">
            <Notice tone="error">{result.error}</Notice>
          </div>
        )}
      </ToolPanel>

      <ToolPanel
        title="测试文本"
        subtitle={
          result.error
            ? '正则有误'
            : `匹配 ${result.matches.length} 处${result.truncated ? '（已截断，仅显示前 200 处）' : ''}`
        }
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="h-28 w-full resize-y p-3 text-[12px] outline-none"
          style={inputStyle}
        />
        {highlighted && (
          <div className="mt-3 p-3 font-mono text-[12px] leading-relaxed" style={inputStyle}>
            {highlighted.map((p, i) =>
              p.match ? (
                <mark
                  key={i}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: 3,
                    padding: '0 2px',
                  }}
                >
                  {p.text}
                </mark>
              ) : (
                <span key={i}>{p.text}</span>
              )
            )}
          </div>
        )}
      </ToolPanel>

      {result.matches.length > 0 && (
        <ToolPanel title="匹配详情">
          <div className="max-h-72 space-y-2 overflow-auto">
            {result.matches.slice(0, 50).map((m, i) => (
              <div key={i} className="p-3 text-[12px]" style={inputStyle}>
                <div className="flex items-center gap-2">
                  <span className="tb-label shrink-0">#{i + 1}</span>
                  <code className="min-w-0 flex-1 break-all font-mono">{m.value || '(空匹配)'}</code>
                  <span className="shrink-0 tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                    位置 {m.index}
                  </span>
                </div>
                {m.groups.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-2" style={{ color: 'var(--muted-foreground)' }}>
                    {m.groups.map((g, gi) => (
                      <span key={gi}>
                        ${gi + 1} = {g ?? '(未参与)'}
                      </span>
                    ))}
                  </div>
                )}
                {m.named && (
                  <div className="mt-1.5 flex flex-wrap gap-2" style={{ color: 'var(--muted-foreground)' }}>
                    {Object.entries(m.named).map(([k, v]) => (
                      <span key={k}>
                        {k} = {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ToolPanel>
      )}
    </div>
  );
}

/* ============================ 主组件 ============================ */

export default function DevTool() {
  const [sub, setSub] = useState<Sub>('hash');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {SUBS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="tb-btn"
            onClick={() => setSub(s.id)}
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

      {sub === 'hash' && <HashTool />}
      {sub === 'color' && <ColorTool />}
      {sub === 'qr' && <QrTool />}
      {sub === 'barcode' && <BarcodeTool />}
      {sub === 'time' && <TimeTool />}
      {sub === 'text' && <TextTool />}
      {sub === 'jwt' && <JwtTool />}
      {sub === 'regex' && <RegexTool />}
    </div>
  );
}

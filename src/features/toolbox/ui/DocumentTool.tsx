'use client';

import { useState } from 'react';
import { DropZone, Notice, ToolPanel, ToolProgress, CopyButton } from './primitives';
import { useTask } from './useTask';
import { formatBytes } from '../core/tasks';
import { parseCsv } from '../core/dataConvert';
import {
  PAGE_SIZES,
  docxToHtml,
  downloadBlob,
  imagesToPdf,
  ocrImage,
  tableToPdf,
  textToPdfCanvas,
  textToPdfText,
  type LayoutOptions,
  type Orientation,
  type PageSize,
} from '../core/pdf';

type Sub = 'image' | 'text' | 'table' | 'ocr' | 'docx';

const SUBS: { id: Sub; name: string; icon: string }[] = [
  { id: 'image', name: '图片转 PDF', icon: 'fa-images' },
  { id: 'text', name: '文本转 PDF', icon: 'fa-file-lines' },
  { id: 'table', name: '表格转 PDF', icon: 'fa-table' },
  { id: 'ocr', name: '图片识字', icon: 'fa-eye' },
  { id: 'docx', name: 'Word 转网页', icon: 'fa-file-word' },
];

const inputStyle = {
  border: 'var(--tb-border-w) solid var(--border)',
  borderRadius: 'var(--tb-panel-radius)',
  background: 'var(--card)',
  color: 'var(--foreground)',
} as const;

function LayoutPicker({
  value,
  onChange,
}: {
  value: LayoutOptions;
  onChange: (v: LayoutOptions) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[12px]">
      <label className="flex items-center gap-2">
        <span className="tb-label">纸张</span>
        <select
          value={value.size}
          onChange={(e) => onChange({ ...value, size: e.target.value as PageSize })}
          className="px-2 py-1.5 text-[12px] outline-none"
          style={inputStyle}
        >
          {Object.entries(PAGE_SIZES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <span className="tb-label">方向</span>
        <select
          value={value.orientation}
          onChange={(e) => onChange({ ...value, orientation: e.target.value as Orientation })}
          className="px-2 py-1.5 text-[12px] outline-none"
          style={inputStyle}
        >
          <option value="portrait">纵向</option>
          <option value="landscape">横向</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <span className="tb-label">页边距 {value.margin}mm</span>
        <input
          type="range"
          min={0}
          max={40}
          value={value.margin}
          onChange={(e) => onChange({ ...value, margin: Number(e.target.value) })}
          style={{ accentColor: 'var(--primary)' }}
        />
      </label>
    </div>
  );
}

export default function DocumentTool() {
  const [sub, setSub] = useState<Sub>('image');
  const { state, run, cancel } = useTask();
  const [layout, setLayout] = useState<LayoutOptions>({ size: 'a4', orientation: 'portrait', margin: 15 });

  // 图片转 PDF
  const [images, setImages] = useState<File[]>([]);
  const [fit, setFit] = useState<'fit' | 'fill'>('fit');

  // 文本转 PDF
  const [text, setText] = useState('LYJY 导航系统\n\n这是一段中文测试文本。\n\n用于验证 PDF 的中文显示与分页是否正确。');
  const [mode, setMode] = useState<'canvas' | 'text'>('canvas');
  const [fontSize, setFontSize] = useState(12);

  // 表格转 PDF
  const [csv, setCsv] = useState('姓名,科目,分数\n张三,数学,95\n李四,语文,88\n王五,英语,92');

  // OCR
  const [ocrText, setOcrText] = useState('');
  const [ocrConf, setOcrConf] = useState<number | null>(null);
  const [ocrLang, setOcrLang] = useState('chi_sim+eng');

  // DOCX
  const [docxHtml, setDocxHtml] = useState('');
  const [docxMsgs, setDocxMsgs] = useState<string[]>([]);

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

      {sub === 'image' && (
        <ToolPanel title="图片转 PDF" subtitle="多张图片合成一个 PDF，每张一页">
          <DropZone accept="image/*" multiple onFiles={setImages} hint="可多选，按选择顺序排页" />
          {images.length > 0 && (
            <ul className="mt-3 space-y-1 text-[11px]">
              {images.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                    第 {i + 1} 页
                  </span>
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{formatBytes(f.size)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <LayoutPicker value={layout} onChange={setLayout} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            {([
              ['fit', '完整放入（不裁切）'],
              ['fill', '铺满页面（可能裁切）'],
            ] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                className="tb-btn"
                onClick={() => setFit(v)}
                style={{ background: fit === v ? 'var(--primary)' : undefined, color: fit === v ? 'var(--primary-foreground)' : undefined }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="tb-btn tb-btn-primary mt-4"
            disabled={!images.length || state.status === 'running'}
            onClick={async () => {
              const blob = await run(async (ctx) => imagesToPdf(images, { ...layout, fit }, ctx));
              if (blob) downloadBlob(blob, 'images.pdf');
            }}
          >
            <i className="fa-solid fa-file-pdf text-[11px]" />
            生成 PDF
          </button>
          <ToolProgress state={state} onCancel={cancel} />
        </ToolPanel>
      )}

      {sub === 'text' && (
        <ToolPanel title="文本转 PDF">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="tb-btn"
              onClick={() => setMode('canvas')}
              style={{ background: mode === 'canvas' ? 'var(--primary)' : undefined, color: mode === 'canvas' ? 'var(--primary-foreground)' : undefined }}
            >
              图片渲染（中文完美）
            </button>
            <button
              type="button"
              className="tb-btn"
              onClick={() => setMode('text')}
              style={{ background: mode === 'text' ? 'var(--primary)' : undefined, color: mode === 'text' ? 'var(--primary-foreground)' : undefined }}
            >
              文字版（可选中，仅英文）
            </button>
          </div>

          <div className="mt-3">
            <Notice tone={mode === 'canvas' ? 'info' : 'warn'}>
              {mode === 'canvas' ? (
                <>
                  <strong>图片渲染：</strong>用 canvas 逐页排版后嵌入 PDF。中文显示完美、分页准确，
                  但 PDF 里的文字<b>不可选中、不可搜索</b>，体积也更大。
                </>
              ) : (
                <>
                  <strong>文字版：</strong>用 PDF 内置字体直接写文字，体积小、可选中可搜索，
                  但内置字体<b>不含中文</b> —— 输入中文会直接报错（而不是像旧版那样悄悄输出乱码）。
                </>
              )}
            </Notice>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-3 h-48 w-full resize-y p-3 text-[13px] outline-none"
            style={inputStyle}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[12px]">
              <span className="tb-label">字号 {fontSize}pt</span>
              <input type="range" min={6} max={28} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ accentColor: 'var(--primary)' }} />
            </label>
          </div>
          <div className="mt-3">
            <LayoutPicker value={layout} onChange={setLayout} />
          </div>
          <button
            type="button"
            className="tb-btn tb-btn-primary mt-4"
            disabled={state.status === 'running'}
            onClick={async () => {
              if (mode === 'text') {
                try {
                  downloadBlob(textToPdfText(text, { ...layout, mode: 'text', fontSize, lineHeightFactor: 1.5 }), 'text.pdf');
                } catch (e) {
                  alert(e instanceof Error ? e.message : '生成失败');
                }
                return;
              }
              const blob = await run(async (ctx) =>
                textToPdfCanvas(text, { ...layout, mode: 'canvas', fontSize, lineHeightFactor: 1.6 }, ctx)
              );
              if (blob) downloadBlob(blob, 'text.pdf');
            }}
          >
            <i className="fa-solid fa-file-pdf text-[11px]" />
            生成 PDF
          </button>
          <ToolProgress state={state} onCancel={cancel} />
        </ToolPanel>
      )}

      {sub === 'table' && (
        <ToolPanel title="表格转 PDF" subtitle="用 canvas 渲染 —— 旧版用 pdf.text() 导致中文全是乱码">
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            className="h-40 w-full resize-y p-3 font-mono text-[12px] outline-none"
            style={inputStyle}
            placeholder="粘贴 CSV，第一行会被当作表头"
          />
          <div className="mt-3">
            <LayoutPicker value={layout} onChange={setLayout} />
          </div>
          <button
            type="button"
            className="tb-btn tb-btn-primary mt-4"
            disabled={state.status === 'running'}
            onClick={async () => {
              try {
                const rows = parseCsv(csv, ',');
                if (!rows.length) throw new Error('表格内容为空');
                const blob = await run(async (ctx) =>
                  tableToPdf(rows, { ...layout, fontSize: 10, header: true, borderColor: '#cbd5e1' }, ctx)
                );
                if (blob) downloadBlob(blob, 'table.pdf');
              } catch (e) {
                alert(e instanceof Error ? e.message : '生成失败');
              }
            }}
          >
            <i className="fa-solid fa-file-pdf text-[11px]" />
            生成 PDF
          </button>
          <ToolProgress state={state} onCancel={cancel} />
        </ToolPanel>
      )}

      {sub === 'ocr' && (
        <ToolPanel title="图片识字（OCR）" subtitle="基于 tesseract.js，首次使用需要下载语言包">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {[
              ['chi_sim+eng', '中文 + 英文'],
              ['eng', '仅英文'],
              ['chi_sim', '仅中文'],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                className="tb-btn"
                onClick={() => setOcrLang(v)}
                style={{ background: ocrLang === v ? 'var(--primary)' : undefined, color: ocrLang === v ? 'var(--primary-foreground)' : undefined }}
              >
                {label}
              </button>
            ))}
          </div>
          <DropZone
            accept="image/*"
            icon="fa-eye"
            onFiles={async (files) => {
              setOcrText('');
              setOcrConf(null);
              const out = await run(async (ctx) => {
                ctx.progress(0.05, '加载语言包…');
                const r = await ocrImage(
                  files[0],
                  ocrLang,
                  (p) => ctx.progress(Math.min(0.95, p.progress), `${p.status}…`),
                  ctx.signal
                );
                return r;
              });
              if (out) {
                setOcrText(out.text || '（没识别到文字，试试更清晰的图片）');
                setOcrConf(out.confidence);
              }
            }}
            hint="识别在本地进行，图片不会上传"
          />
          <ToolProgress state={state} onCancel={cancel} />
          {ocrText && (
            <div className="mt-4">
              {ocrConf !== null && (
                <p className="mb-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  识别置信度 {ocrConf}%
                </p>
              )}
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                className="h-40 w-full resize-y p-3 text-[12px] outline-none"
                style={inputStyle}
              />
              <div className="mt-2">
                <CopyButton text={ocrText} label="复制文字" />
              </div>
            </div>
          )}
        </ToolPanel>
      )}

      {sub === 'docx' && (
        <ToolPanel title="Word 转网页" subtitle="把 .docx 转成 HTML 或纯文本">
          <DropZone
            accept=".docx"
            icon="fa-file-word"
            onFiles={async (files) => {
              setDocxHtml('');
              setDocxMsgs([]);
              const out = await run(async (ctx) => {
                ctx.progress(0.3, '解析中…');
                const r = await docxToHtml(files[0]);
                ctx.progress(1, '完成');
                return r;
              });
              if (out) {
                setDocxHtml(out.html);
                setDocxMsgs(out.messages);
              }
            }}
            hint="仅支持 .docx（.doc 老格式不支持）"
          />
          <ToolProgress state={state} onCancel={cancel} />
          {docxMsgs.length > 0 && (
            <div className="mt-3">
              <Notice tone="warn">
                转换过程中有 {docxMsgs.length} 条提示（部分样式可能丢失）：{docxMsgs.slice(0, 3).join('；')}
              </Notice>
            </div>
          )}
          {docxHtml && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <CopyButton text={docxHtml} label="复制 HTML" />
                <button
                  type="button"
                  className="tb-btn"
                  onClick={() => {
                    const blob = new Blob([docxHtml], { type: 'text/html;charset=utf-8' });
                    downloadBlob(blob, 'converted.html');
                  }}
                >
                  <i className="fa-solid fa-download text-[11px]" />
                  下载 HTML
                </button>
              </div>
              <div className="p-3 text-[12px]" style={inputStyle}>
                <p className="tb-label mb-2">预览</p>
                <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
              </div>
            </div>
          )}
        </ToolPanel>
      )}

      <Notice tone="info">
        <strong>关于 PDF 操作的范围：</strong>当前支持「生成 PDF」（图片 / 文本 / 表格）。
        PDF 的<b>合并、拆分、旋转、转图片</b>需要 pdf-lib 与 pdfjs-dist 两个库，当前未安装，
        所以界面上没有这些入口 —— 不做假按钮。
      </Notice>
    </div>
  );
}

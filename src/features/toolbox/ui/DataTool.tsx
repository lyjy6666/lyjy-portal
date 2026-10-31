'use client';

import { useMemo, useState } from 'react';
import { CopyButton, Notice, ToolPanel } from './primitives';
import {
  DATA_FORMATS,
  DataError,
  formatData,
  minifyData,
  parseData,
  stringifyData,
  type DataFormat,
} from '../core/dataConvert';

const SAMPLE = `{
  "name": "LYJY",
  "version": 6,
  "features": ["导航", "工具箱", "作业管理"],
  "server": { "host": "localhost", "port": 8080 }
}`;

export default function DataTool() {
  const [from, setFrom] = useState<DataFormat>('json');
  const [to, setTo] = useState<DataFormat>('yaml');
  const [input, setInput] = useState(SAMPLE);

  /** 转换结果：成功给输出，失败给错误信息（不静默） */
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, out: '', parsed: null };
    try {
      const parsed = parseData(input, from);
      return { ok: true as const, out: stringifyData(parsed, to), parsed };
    } catch (e) {
      return {
        ok: false as const,
        out: '',
        error: e instanceof DataError ? e.message : e instanceof Error ? e.message : '转换失败',
      };
    }
  }, [input, from, to]);

  const preview = useMemo(() => {
    if (!result.ok || !result.parsed) return null;
    try {
      return JSON.stringify(result.parsed, null, 1).slice(0, 260);
    } catch {
      return null;
    }
  }, [result]);

  const apply = (fn: (t: string, f: DataFormat) => string) => {
    try {
      setInput(fn(input, from));
    } catch (e) {
      /* 失败时保持原样，错误已在下方显示 */
      void e;
    }
  };

  return (
    <div className="space-y-5">
      <ToolPanel title="格式选择" subtitle="两边选好后自动转换；解析失败会明确告诉你哪里不对">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="tb-label mb-2">从</p>
            <div className="flex flex-wrap gap-1.5">
              {DATA_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="tb-btn"
                  onClick={() => setFrom(f.id)}
                  style={{
                    background: from === f.id ? 'var(--primary)' : undefined,
                    color: from === f.id ? 'var(--primary-foreground)' : undefined,
                    borderColor: from === f.id ? 'var(--primary)' : undefined,
                  }}
                  title={f.hint}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="tb-btn"
            title="交换"
            onClick={() => {
              setFrom(to);
              setTo(from);
              if (result.ok && result.out) setInput(result.out);
            }}
            style={{ marginTop: 22 }}
          >
            <i className="fa-solid fa-right-left text-[11px]" />
          </button>

          <div>
            <p className="tb-label mb-2">到</p>
            <div className="flex flex-wrap gap-1.5">
              {DATA_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="tb-btn"
                  onClick={() => setTo(f.id)}
                  style={{
                    background: to === f.id ? 'var(--primary)' : undefined,
                    color: to === f.id ? 'var(--primary-foreground)' : undefined,
                    borderColor: to === f.id ? 'var(--primary)' : undefined,
                  }}
                  title={f.hint}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ToolPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <ToolPanel
          title="输入"
          subtitle={`${DATA_FORMATS.find((f) => f.id === from)?.label} · ${input.length} 字符`}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="h-72 w-full resize-y p-3 font-mono text-[12px] leading-relaxed outline-none"
            style={{
              border: 'var(--tb-border-w) solid var(--border)',
              borderRadius: 'var(--tb-panel-radius)',
              background: 'var(--card)',
              color: 'var(--foreground)',
            }}
            placeholder={`在这里粘贴 ${DATA_FORMATS.find((f) => f.id === from)?.label} 内容`}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="tb-btn" onClick={() => setInput(SAMPLE)}>
              示例
            </button>
            <button type="button" className="tb-btn" onClick={() => setInput('')}>
              清空
            </button>
            <button type="button" className="tb-btn" onClick={() => apply(formatData)}>
              <i className="fa-solid fa-align-left text-[11px]" />
              格式化
            </button>
            <button type="button" className="tb-btn" onClick={() => apply(minifyData)}>
              <i className="fa-solid fa-compress text-[11px]" />
              压缩
            </button>
          </div>
        </ToolPanel>

        <ToolPanel
          title="输出"
          subtitle={
            result.ok
              ? `${DATA_FORMATS.find((f) => f.id === to)?.label} · ${result.out.length} 字符`
              : '解析失败'
          }
        >
          {result.ok ? (
            <>
              <textarea
                value={result.out}
                readOnly
                spellCheck={false}
                className="h-72 w-full resize-y p-3 font-mono text-[12px] leading-relaxed outline-none"
                style={{
                  border: 'var(--tb-border-w) solid var(--border)',
                  borderRadius: 'var(--tb-panel-radius)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                }}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CopyButton text={result.out} label="复制结果" />
                <button
                  type="button"
                  className="tb-btn"
                  onClick={() => {
                    const blob = new Blob([result.out], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `converted.${to}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <i className="fa-solid fa-download text-[11px]" />
                  下载
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <Notice tone="error">{result.error}</Notice>
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                输出区不会给出半成品 —— 解析不了就直接报错，避免拿到看起来对其实错的内容。
              </p>
            </div>
          )}
        </ToolPanel>
      </div>

      {preview && (
        <ToolPanel title="解析预览" subtitle="确认解析结果符合预期再拿去用">
          <pre
            className="max-h-52 overflow-auto p-3 font-mono text-[11px] leading-relaxed"
            style={{
              border: 'var(--tb-border-w) solid var(--border)',
              borderRadius: 'var(--tb-panel-radius)',
              color: 'var(--muted-foreground)',
            }}
          >
            {preview}
          </pre>
        </ToolPanel>
      )}

      <Notice tone="info">
        <strong>关于精度：</strong>CSV / TSV 里所有内容都按字符串处理，
        所以 <code>007</code>、手机号、邮编不会丢前导零或变成科学计数。
        YAML / TOML 则遵循各自规范 —— 未加引号的 <code>007</code> 在 YAML 里就是整数 7，
        需要保留原样请加引号。
      </Notice>
    </div>
  );
}

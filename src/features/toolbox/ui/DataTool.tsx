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
import {
  DEFAULT_BATCH_OPTIONS,
  applyTextBatch,
  textStats,
  type TextBatchOptions,
} from '../core/textBatch';

const SAMPLE = `{
  "name": "LYJY",
  "version": 6,
  "features": ["导航", "工具箱", "作业管理"],
  "server": { "host": "localhost", "port": 8080 }
}`;

const BATCH_SAMPLE = `apple
banana
apple

cherry
Date
  grape  
`;

export default function DataTool() {
  const [sub, setSub] = useState<'convert' | 'batch'>('convert');
  const [from, setFrom] = useState<DataFormat>('json');
  const [to, setTo] = useState<DataFormat>('yaml');
  const [input, setInput] = useState(SAMPLE);

  // 文本批处理
  const [batchInput, setBatchInput] = useState(BATCH_SAMPLE);
  const [batchOpts, setBatchOpts] = useState<TextBatchOptions>(DEFAULT_BATCH_OPTIONS);

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

  const setReplace = (patch: Partial<TextBatchOptions['replace']>) =>
    setBatchOpts((o) => ({ ...o, replace: { ...o.replace, ...patch } }));

  /** 预览与下载共用同一份结果；非法正则明确报错 */
  const batchResult = useMemo(() => {
    try {
      return { ok: true as const, ...applyTextBatch(batchInput, batchOpts) };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : '处理失败',
        text: '',
        stats: textStats(''),
      };
    }
  }, [batchInput, batchOpts]);

  const batchStats = batchResult.stats;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {([
          ['convert', '格式互转', 'fa-right-left'],
          ['batch', '文本批处理', 'fa-broom'],
        ] as const).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            className="tb-btn"
            onClick={() => setSub(id)}
            style={{
              background: sub === id ? 'var(--primary)' : undefined,
              color: sub === id ? 'var(--primary-foreground)' : undefined,
              borderColor: sub === id ? 'var(--primary)' : undefined,
            }}
          >
            <i className={`fa-solid ${icon} text-[11px]`} />
            {label}
          </button>
        ))}
      </div>

      {sub === 'convert' && (
        <>
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
        </>
      )}

      {sub === 'batch' && (
        <div className="space-y-5">
          <ToolPanel
            title="文本输入"
            subtitle="逐行处理；所有操作都在本地浏览器完成，文本不会上传"
          >
            <textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              spellCheck={false}
              className="h-52 w-full resize-y p-3 font-mono text-[12px] leading-relaxed outline-none"
              style={{
                border: 'var(--tb-border-w) solid var(--border)',
                borderRadius: 'var(--tb-panel-radius)',
                background: 'var(--card)',
                color: 'var(--foreground)',
              }}
              placeholder="每行一段文本"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="tb-btn" onClick={() => setBatchInput(BATCH_SAMPLE)}>
                示例
              </button>
              <button type="button" className="tb-btn" onClick={() => setBatchInput('')}>
                清空
              </button>
            </div>
          </ToolPanel>

          <ToolPanel title="处理选项" subtitle="按顺序执行：替换 → 去重 → 去空行 → 修剪 → 排序 → 大小写 → 前后缀">
            <div className="space-y-4 text-[12px]">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={batchOpts.replace.enabled}
                    onChange={(e) => setReplace({ enabled: e.target.checked })}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>正则批量替换</span>
                </label>
                {batchOpts.replace.enabled && (
                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="tb-label">查找</span>
                      <input
                        value={batchOpts.replace.pattern}
                        onChange={(e) => setReplace({ pattern: e.target.value })}
                        className="w-40 px-2 py-1.5 font-mono text-[12px] outline-none"
                        style={{
                          border: 'var(--tb-border-w) solid var(--border)',
                          borderRadius: 'var(--tb-panel-radius)',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                        }}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="tb-label">替换为</span>
                      <input
                        value={batchOpts.replace.replacement}
                        onChange={(e) => setReplace({ replacement: e.target.value })}
                        className="w-40 px-2 py-1.5 font-mono text-[12px] outline-none"
                        style={{
                          border: 'var(--tb-border-w) solid var(--border)',
                          borderRadius: 'var(--tb-panel-radius)',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="tb-btn"
                      onClick={() => setReplace({ literal: !batchOpts.replace.literal })}
                      title="字面量：查找内容按普通文本处理；正则：可用捕获组等语法"
                    >
                      {batchOpts.replace.literal ? '字面量' : '正则'}
                    </button>
                    <label className="flex flex-col gap-1">
                      <span className="tb-label">flags</span>
                      <input
                        value={batchOpts.replace.flags}
                        onChange={(e) => setReplace({ flags: e.target.value })}
                        className="w-16 px-2 py-1.5 font-mono text-[12px] outline-none"
                        style={{
                          border: 'var(--tb-border-w) solid var(--border)',
                          borderRadius: 'var(--tb-panel-radius)',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                        }}
                        placeholder="gi"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={batchOpts.replace.global}
                        onChange={(e) => setReplace({ global: e.target.checked })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>全局</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                {([
                  ['dedupe', '行去重（保留首次）'],
                  ['removeEmpty', '去空行'],
                  ['trimLines', '修剪首尾空白'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={batchOpts[key]}
                      onChange={(e) => setBatchOpts((o) => ({ ...o, [key]: e.target.checked }))}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="tb-label">排序</span>
                  <select
                    value={batchOpts.sort}
                    onChange={(e) => setBatchOpts((o) => ({ ...o, sort: e.target.value as TextBatchOptions['sort'] }))}
                    className="px-2 py-1.5 text-[12px] outline-none"
                    style={{
                      border: 'var(--tb-border-w) solid var(--border)',
                      borderRadius: 'var(--tb-panel-radius)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <option value="none">不排序</option>
                    <option value="asc">字典序 ↑</option>
                    <option value="desc">字典序 ↓</option>
                    <option value="len-asc">长度 ↑</option>
                    <option value="len-desc">长度 ↓</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="tb-label">大小写</span>
                  <select
                    value={batchOpts.caseMode}
                    onChange={(e) => setBatchOpts((o) => ({ ...o, caseMode: e.target.value as TextBatchOptions['caseMode'] }))}
                    className="px-2 py-1.5 text-[12px] outline-none"
                    style={{
                      border: 'var(--tb-border-w) solid var(--border)',
                      borderRadius: 'var(--tb-panel-radius)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <option value="none">不变</option>
                    <option value="upper">全大写</option>
                    <option value="lower">全小写</option>
                    <option value="title">每行首字母大写</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="tb-label">前缀</span>
                  <input
                    value={batchOpts.prefix}
                    onChange={(e) => setBatchOpts((o) => ({ ...o, prefix: e.target.value }))}
                    className="w-28 px-2 py-1.5 text-[12px] outline-none"
                    style={{
                      border: 'var(--tb-border-w) solid var(--border)',
                      borderRadius: 'var(--tb-panel-radius)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="tb-label">后缀</span>
                  <input
                    value={batchOpts.suffix}
                    onChange={(e) => setBatchOpts((o) => ({ ...o, suffix: e.target.value }))}
                    className="w-28 px-2 py-1.5 text-[12px] outline-none"
                    style={{
                      border: 'var(--tb-border-w) solid var(--border)',
                      borderRadius: 'var(--tb-panel-radius)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                  />
                </label>
              </div>
            </div>
          </ToolPanel>

          <ToolPanel
            title="实时预览"
            subtitle={`共 ${batchStats.lines} 行 · ${batchStats.chars} 字符 · ${batchStats.uniqueLines} 个唯一行 · ${batchStats.emptyLines} 个空行`}
          >
            {batchResult.ok ? (
              <>
                <textarea
                  value={batchResult.text}
                  readOnly
                  spellCheck={false}
                  className="h-64 w-full resize-y p-3 font-mono text-[12px] leading-relaxed outline-none"
                  style={{
                    border: 'var(--tb-border-w) solid var(--border)',
                    borderRadius: 'var(--tb-panel-radius)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <CopyButton text={batchResult.text} label="复制结果" />
                  <button
                    type="button"
                    className="tb-btn"
                    onClick={() => {
                      const blob = new Blob([batchResult.text], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'batch-result.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <i className="fa-solid fa-download text-[11px]" />
                    下载 txt
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Notice tone="error">{batchResult.error}</Notice>
                <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  输出区不会给出半成品 —— 参数不对就直接报错。
                </p>
              </div>
            )}
          </ToolPanel>
        </div>
      )}
    </div>
  );
}

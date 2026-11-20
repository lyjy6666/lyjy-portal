'use client';

import { useMemo, useState } from 'react';
import { CopyButton, Notice, ToolPanel, ToolProgress } from './primitives';
import { useTask } from './useTask';
import { formatJsLike, formatMarkup, formatCss } from '../core/codeFormat';
import { minifyCode, type MinifyLang } from '../core/minify';

type Lang = 'js' | 'ts' | 'json' | 'html' | 'css' | 'xml';

const LANGS: { id: Lang; label: string; sample: string }[] = [
  {
    id: 'js',
    label: 'JavaScript',
    sample: `function greet(name){const url="http://example.com/"+name;if(name){return \`Hello, \${name}!\`}else{return "Hi"}}\nconst re=/[/]/gi;\nconsole.log(greet("world"));`,
  },
  {
    id: 'ts',
    label: 'TypeScript',
    sample: `interface User { id: number; name: string }\nfunction find(users: User[], id: number): User | undefined { return users.find(u => u.id === id) }\nconst list: User[] = [{ id: 1, name: "a" }];\nconsole.log(find(list, 1));`,
  },
  {
    id: 'json',
    label: 'JSON',
    sample: `{"name":"demo","tags":["a","b"],"nested":{"x":1,"y":true}}`,
  },
  {
    id: 'html',
    label: 'HTML',
    sample: `<div class="wrap">\n  <!-- 卡片 -->\n  <p>a < b 是合法正文</p>\n  <pre>  保留   空白</pre>\n  <script>if(a<b){console.log("x")}</script>\n</div>`,
  },
  {
    id: 'css',
    label: 'CSS',
    sample: `.card { width: calc(100% + 10px); content: "a;b"; color : red ; }\n.card:hover{ opacity:.8 }`,
  },
  {
    id: 'xml',
    label: 'XML',
    sample: `<?xml version="1.0"?>\n<root><item id="1">a &amp; b</item><item id="2">c</item></root>`,
  },
];

/** 按语言选对应的格式化器 */
function format(code: string, lang: Lang): string {
  switch (lang) {
    case 'js':
    case 'ts':
    case 'json':
      return formatJsLike(code);
    case 'html':
    case 'xml':
      return formatMarkup(code);
    case 'css':
      return formatCss(code);
  }
}

/** 压缩：JS/TS 走 terser（异步），其余走 tokenizer */
async function runMinify(code: string, lang: Lang): Promise<string> {
  if (lang === 'js' || lang === 'ts') {
    const r = await minifyCode(code, lang as MinifyLang);
    return r.code;
  }
  if (lang === 'html' || lang === 'css') {
    const r = await minifyCode(code, lang);
    return r.code;
  }
  // JSON 压缩用原生，最稳
  return JSON.stringify(JSON.parse(code));
}

export default function CodeTool() {
  const [lang, setLang] = useState<Lang>('js');
  const [input, setInput] = useState(LANGS[0].sample);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const { state, run, cancel } = useTask();

  const current = LANGS.find((l) => l.id === lang)!;

  const ratio = useMemo(() => {
    if (!output || !input) return null;
    const pct = ((input.length - output.length) / input.length) * 100;
    return pct;
  }, [input, output]);

  const doFormat = () => {
    setError('');
    try {
      setOutput(format(input, lang));
    } catch (e) {
      setOutput('');
      setError(e instanceof Error ? e.message : '格式化失败');
    }
  };

  const doMinify = async () => {
    setError('');
    setOutput('');
    const out = await run(async () => runMinify(input, lang));
    if (out !== undefined) setOutput(out);
  };

  const switchLang = (id: Lang) => {
    setLang(id);
    const s = LANGS.find((l) => l.id === id)!;
    setInput(s.sample);
    setOutput('');
    setError('');
  };

  return (
    <div className="space-y-5">
      <ToolPanel title="语言" subtitle="格式化与压缩都按所选语言处理">
        <div className="flex flex-wrap gap-1.5">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              className="tb-btn"
              onClick={() => switchLang(l.id)}
              style={{
                background: lang === l.id ? 'var(--primary)' : undefined,
                color: lang === l.id ? 'var(--primary-foreground)' : undefined,
                borderColor: lang === l.id ? 'var(--primary)' : undefined,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </ToolPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <ToolPanel title="输入" subtitle={`${input.length} 字符`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="h-80 w-full resize-y p-3 font-mono text-[12px] leading-relaxed outline-none"
            style={{
              border: 'var(--tb-border-w) solid var(--border)',
              borderRadius: 'var(--tb-panel-radius)',
              background: 'var(--card)',
              color: 'var(--foreground)',
            }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="tb-btn tb-btn-primary" onClick={doFormat}>
              <i className="fa-solid fa-align-left text-[11px]" />
              格式化
            </button>
            <button type="button" className="tb-btn" onClick={doMinify} disabled={state.status === 'running'}>
              <i className="fa-solid fa-compress text-[11px]" />
              压缩
            </button>
            <button type="button" className="tb-btn" onClick={() => switchLang(lang)}>
              重置示例
            </button>
          </div>
          <ToolProgress state={state} onCancel={cancel} />
        </ToolPanel>

        <ToolPanel
          title="结果"
          subtitle={
            output
              ? ratio !== null && ratio > 0
                ? `${output.length} 字符 · 减少 ${ratio.toFixed(1)}%`
                : `${output.length} 字符`
              : '尚未处理'
          }
        >
          {error ? (
            <Notice tone="error">{error}</Notice>
          ) : output ? (
            <>
              <textarea
                value={output}
                readOnly
                spellCheck={false}
                className="h-80 w-full resize-y p-3 font-mono text-[12px] leading-relaxed outline-none"
                style={{
                  border: 'var(--tb-border-w) solid var(--border)',
                  borderRadius: 'var(--tb-panel-radius)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                }}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={output} label="复制结果" />
                <button type="button" className="tb-btn" onClick={() => setInput(output)}>
                  <i className="fa-solid fa-arrow-up text-[11px]" />
                  作为输入
                </button>
              </div>
            </>
          ) : (
            <div
              className="flex h-80 items-center justify-center text-[12px]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              点上面的「格式化」或「压缩」
            </div>
          )}
        </ToolPanel>
      </div>

      <Notice tone="info">
        <strong>这里做了什么：</strong>格式化和压缩都基于<b>逐字符词法扫描</b>，
        能正确区分字符串、模板串、注释与正则字面量。所以
        <code>&quot;http://x&quot;</code> 里的 <code>//</code> 不会被当注释删掉，
        <code>a - -b</code> 不会被压成 <code>a--b</code>，字符串里的空白也不会被动。
        JS/TS 的压缩交给 terser 做真正的语法树级处理。
      </Notice>
      <Notice tone="warn">
        <strong>已知限制：</strong>不做变量改名、不做死代码消除（那需要完整的语义分析，
        浏览器端容易出错）。压缩率因此不如命令行工具，但不会压坏代码。
        TS 的压缩请先转成 JS 再压。
      </Notice>
    </div>
  );
}

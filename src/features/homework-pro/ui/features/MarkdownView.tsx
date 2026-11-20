'use client';

import type { ReactNode } from 'react';

/**
 * AI 回答的轻量 Markdown 渲染。
 *
 * 项目没有 react-markdown / KaTeX，也不想为此引入一整套依赖和 CDN（jsdelivr 已挂过），
 * 所以这里自己处理 AI 回答里最常见的几种结构：代码块、公式、标题、列表、粗体、行内代码。
 * 全程生成 React 元素，不用 dangerouslySetInnerHTML，模型输出什么都不会执行。
 *
 * 重点解决用户反馈的「一堆反斜杠符号看不清」：把常见 LaTeX 命令转成可读 Unicode，
 * 并把残留的括号 / 花括号收干净。
 */

const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ',
  lambda: 'λ', mu: 'μ', pi: 'π', sigma: 'σ', phi: 'φ', omega: 'ω',
  Delta: 'Δ', Sigma: '∑', Omega: 'Ω',
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓',
  le: '≤', ge: '≥', ne: '≠', approx: '≈', equiv: '≡',
  infty: '∞', sum: '∑', int: '∫', sqrt: '√', partial: '∂',
  rightarrow: '→', Rightarrow: '⇒', to: '→', forall: '∀', exists: '∃',
};

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/** 把 \frac{a}{b}、\times、^{2} 这类原式换成可读文本；认不出的保留原样但去掉反斜杠噪音 */
export function cleanMath(input: string): string {
  let s = input;
  s = s.replace(/\\\(|\\\)|\\\[|\\\]/g, '');
  s = s.replace(/\\(?:d?frac)\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  s = s.replace(/\\(?:sqrt)\{([^{}]*)\}/g, '√($1)');
  s = s.replace(/\\(?:text|mathrm|mathbf)\{([^{}]*)\}/g, '$1');
  s = s.replace(/\\([A-Za-z]+)/g, (whole, name: string) => GREEK[name] ?? (name === 'left' || name === 'right' ? '' : name));
  s = s.replace(/\^\{([^{}]*)\}/g, (_, v: string) => sup(v));
  s = s.replace(/\^(\d)/g, (_, v: string) => sup(v));
  s = s.replace(/_\{([^{}]*)\}/g, '($1)');
  s = s.replace(/_([A-Za-z0-9])/g, '($1)');
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\\\\/g, ' ').replace(/\s{2,}/g, ' ');
  return s.trim();
}

function sup(v: string): string {
  if (/^\d+$/.test(v)) return v.split('').map((c) => SUP[c] ?? `^${c}`).join('');
  return `^${v}`;
}

/** 行内：代码 / 公式 / 粗体 / 斜体 */
function renderInline(text: string, prefix: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\$[^$\n]+\$|\*\*[^*]+\*\*|\*[^*\n]+\*)/g).filter(Boolean);
  return parts.map((p, i) => {
    const key = `${prefix}-${i}`;
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={key} className="hw-md-code">{p.slice(1, -1)}</code>;
    }
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
      return <span key={key} className="hw-md-math">{cleanMath(p.slice(1, -1))}</span>;
    }
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={key}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={key}>{p.slice(1, -1)}</em>;
    return <span key={key}>{cleanMath(p)}</span>;
  });
}

type Block = { type: 'code' | 'text' | 'math'; content: string; lang?: string };

function splitBlocks(src: string): Block[] {
  const out: Block[] = [];
  const re = /```([\w+#-]*)\n?([\s\S]*?)```|\$\$([\s\S]*?)\$\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ type: 'text', content: src.slice(last, m.index) });
    if (m[2] !== undefined) {
      out.push({ type: 'code', content: m[2].replace(/\n$/, ''), lang: m[1] || 'text' });
    } else {
      out.push({ type: 'math', content: m[3] ?? '' });
    }
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ type: 'text', content: src.slice(last) });
  return out;
}

function renderTextBlock(src: string, prefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let n = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{renderInline(it, `${prefix}-li${n}-${i}`)}</li>);
    out.push(list.ordered
      ? <ol key={`${prefix}-ol${n}`} className="hw-md-list">{items}</ol>
      : <ul key={`${prefix}-ul${n}`} className="hw-md-list">{items}</ul>);
    list = null; n += 1;
  };
  const flushPara = () => {
    if (!para.length) return;
    out.push(<p key={`${prefix}-p${n}`} className="hw-md-p">{renderInline(para.join(' '), `${prefix}-p${n}`)}</p>);
    para = []; n += 1;
  };

  for (const raw of src.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushList(); flushPara(); continue; }

    const h = line.match(/^\s*#{1,4}\s+(.*)$/);
    if (h) { flushList(); flushPara(); out.push(<p key={`${prefix}-h${n}`} className="hw-md-h">{renderInline(h[1], `${prefix}-h${n}`)}</p>); n += 1; continue; }

    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const ordered = Boolean(ol);
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push((ul || ol)![1]);
      continue;
    }

    flushList();
    para.push(line.trim());
  }
  flushList();
  flushPara();
  return out;
}

export function MarkdownView({ text }: { text: string }) {
  const blocks = splitBlocks(String(text ?? ''));
  return (
    <div className="hw-md">
      {blocks.map((b, i) => {
        if (b.type === 'code') {
          return (
            <pre key={i} className="hw-md-pre" data-lang={b.lang}>
              <span className="hw-md-lang">{b.lang}</span>
              <code>{b.content}</code>
            </pre>
          );
        }
        if (b.type === 'math') {
          return <div key={i} className="hw-md-math-block">{cleanMath(b.content)}</div>;
        }
        return <div key={i}>{renderTextBlock(b.content, `b${i}`)}</div>;
      })}
    </div>
  );
}

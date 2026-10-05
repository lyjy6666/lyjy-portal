'use client';

import type { ReactNode } from 'react';

/**
 * 客服回复的轻量 Markdown 渲染。
 *
 * 不引第三方库：模型实际只会用到加粗、标题、有序/无序列表、行内代码这几种，
 * 用一个小解析器就够了，也避免给项目增加依赖。
 * 处理不了的内容一律按纯文本输出，不会丢内容。
 */

/** 行内元素：**加粗** 与 `行内代码` */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith('**')) {
      out.push(
        <strong key={`${keyPrefix}-b${k++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      out.push(
        <code
          key={`${keyPrefix}-c${k++}`}
          className="rounded bg-white/10 px-1 py-0.5 font-mono text-[12px] text-sky-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    last = m.index + token.length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (list) {
      blocks.push({ kind: list.ordered ? 'ol' : 'ul', items: list.items });
      list = null;
    }
  };

  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+$/, '');

    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', text: heading[1] });
      continue;
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    const numbered = line.match(/^\s*(\d+)[.、)]\s+(.*)$/);
    if (numbered) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[2]);
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    flush();
    blocks.push({ kind: 'p', text: line });
  }

  flush();
  return blocks;
}

export default function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {blocks.map((b, i) => {
        if (b.kind === 'heading') {
          return (
            <p key={i} className="font-semibold text-white">
              {renderInline(b.text, `h${i}`)}
            </p>
          );
        }
        if (b.kind === 'ul') {
          return (
            <ul key={i} className="space-y-1">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                  <span className="min-w-0">{renderInline(it, `u${i}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.kind === 'ol') {
          return (
            <ol key={i} className="space-y-1">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2">
                  <span className="shrink-0 tabular-nums opacity-60">{j + 1}.</span>
                  <span className="min-w-0">{renderInline(it, `o${i}-${j}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{renderInline(b.text, `p${i}`)}</p>;
      })}
    </div>
  );
}

/**
 * 代码压缩 —— JS/TS 用 terser，HTML/CSS 用 tokenizer 做保守压缩
 *
 * 旧版用正则做压缩，把 `"http://x"` 里的 `//` 当注释删掉、
 * 把 `a - -b` 压成 `a--b`、把字符串里的空白压掉 —— 直接改变代码语义。
 *
 * 现在：
 *   - JS/TS 交给 terser（业界标准，真正的 AST 级压缩）
 *   - HTML/CSS 用 tokenizer 保守处理（只删注释 + 折叠受保护区间外的空白），
 *     因为 HTML/CSS 没有合适的浏览器端压缩库，而正则一定会出错
 *
 * 原则：宁可不压，不可压错。
 */

import type { TaskContext } from './tasks';

export type MinifyLang = 'js' | 'ts' | 'html' | 'css';

export type MinifyResult = {
  code: string;
  before: number;
  after: number;
};

/* ============================================================
   JS / TS —— terser
   ============================================================ */

export async function minifyJs(code: string, isTs = false): Promise<string> {
  // terser 是 CJS 包，动态导入并兼容 default
  const mod = await import('terser');
  const terser = (mod as unknown as { default?: typeof import('terser') }).default ?? mod;

  const result = await terser.minify(code, {
    // 不做变量改名 —— 改名虽然压得更狠，但会让人看不懂，
    // 而且对「我贴进来只是想压一下体积」的场景没必要
    mangle: false,
    compress: {
      // 保守：只做安全的优化
      dead_code: true,
      drop_debugger: true,
      conditionals: true,
      evaluate: true,
      booleans: true,
      unused: false, // 不删「未使用」的变量，避免误删有副作用的代码
      side_effects: false,
    },
    format: {
      comments: false,
      // 保留必要换行，避免 ASI 问题
      semicolons: true,
    },
    // TS 语法 terser 不认，需要先由调用方处理；这里只处理 JS
    parse: { bare_returns: true },
  });

  // 注意：terser 的异步 API 出错时是**抛异常**，不是返回 error 字段
  if (!result.code) throw new Error('压缩失败：没有输出');
  return result.code;
}

/* ============================================================
   HTML —— 保守压缩（tag 级扫描，不用正则）
   ============================================================ */

/** 这些标签内的内容一个字都不能动 */
const PRESERVE_CONTENT = new Set(['pre', 'textarea', 'script', 'style']);

export function minifyHtml(code: string): string {
  const out: string[] = [];
  let i = 0;
  const n = code.length;

  while (i < n) {
    // 注释整块删掉（保留条件注释，IE 兼容场景还有人用）
    if (code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i);
      const stop = end === -1 ? n : end + 3;
      const comment = code.slice(i, stop);
      if (/^<!--\s*\[if/.test(comment)) out.push(comment); // 条件注释保留
      i = stop;
      continue;
    }

    if (code[i] === '<') {
      // 找到标签结束的 > （跳过属性值里的引号）
      let j = i + 1;
      let quote: string | null = null;
      while (j < n) {
        const c = code[j];
        if (quote) {
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'") {
          quote = c;
        } else if (c === '>') {
          break;
        }
        j++;
      }
      const tag = code.slice(i, Math.min(n, j + 1));
      // 标签内部的多余空白可以折叠，但引号内不能动
      out.push(collapseTagWhitespace(tag));

      const nameMatch = tag.match(/^<\s*\/?\s*([A-Za-z][\w:-]*)/);
      const name = nameMatch ? nameMatch[1].toLowerCase() : '';
      const isClosing = /^<\s*\//.test(tag);
      const selfClosing = /\/\s*>$/.test(tag);

      i = j + 1;

      // pre / textarea / script / style 的内容原样保留
      if (!isClosing && !selfClosing && PRESERVE_CONTENT.has(name)) {
        const closeRe = new RegExp(`</\\s*${name}\\s*>`, 'i');
        const rest = code.slice(i);
        const m = rest.match(closeRe);
        if (m && m.index !== undefined) {
          out.push(rest.slice(0, m.index)); // 原样
          i += m.index;
        }
      }
      continue;
    }

    // 文本节点：折叠连续空白（HTML 语义上等价）
    let j = i;
    while (j < n && code[j] !== '<') j++;
    const text = code.slice(i, j);
    out.push(text.replace(/\s+/g, ' '));
    i = j === i ? i + 1 : j;
  }

  // 标签之间的空白整体去掉
  return out.join('').replace(/>\s+</g, '><').trim();
}

/** 折叠标签内的空白，但不动引号内的内容 */
function collapseTagWhitespace(tag: string): string {
  let out = '';
  let quote: string | null = null;
  let pendingSpace = false;

  for (const c of tag) {
    if (quote) {
      out += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      if (pendingSpace && out && !out.endsWith(' ')) out += ' ';
      pendingSpace = false;
      quote = c;
      out += c;
      continue;
    }
    if (/\s/.test(c)) {
      pendingSpace = true;
      continue;
    }
    if (pendingSpace && out && !out.endsWith(' ') && !out.endsWith('<')) out += ' ';
    pendingSpace = false;
    out += c;
  }
  return out;
}

/* ============================================================
   CSS —— 保守压缩
   ============================================================ */

export function minifyCss(code: string): string {
  const out: string[] = [];
  let i = 0;
  const n = code.length;
  /** 括号函数深度：calc()/clamp()/min()/max() 里 + - 两侧的空格有意义，不能动 */
  let fnDepth = 0;
  let pendingSpace = false;

  /** 这些符号后面不该有空格 */
  const NO_SPACE_AFTER = new Set(['{', '}', ';', ':', ',']);

  const flushSpace = () => {
    if (pendingSpace) {
      const last = out[out.length - 1];
      if (last && !NO_SPACE_AFTER.has(last)) out.push(' ');
    }
    pendingSpace = false;
  };

  while (i < n) {
    const c = code[i];

    // 注释删掉（但保留 /*! 开头的授权注释）
    if (code.startsWith('/*', i)) {
      const end = code.indexOf('*/', i);
      const stop = end === -1 ? n : end + 2;
      if (code.startsWith('/*!', i)) out.push(code.slice(i, stop));
      i = stop;
      continue;
    }

    // 字符串原样
    if (c === '"' || c === "'") {
      flushSpace();
      let j = i + 1;
      while (j < n) {
        if (code[j] === '\\') j += 2;
        else if (code[j] === c) { j++; break; }
        else j++;
      }
      out.push(code.slice(i, j));
      i = j;
      continue;
    }

    if (c === '(') {
      fnDepth++;
      out.push('(');
      i++;
      continue;
    }
    if (c === ')') {
      fnDepth = Math.max(0, fnDepth - 1);
      out.push(')');
      i++;
      continue;
    }

    // 函数内部（calc 等）保持原样 —— 这里的空格有语义
    if (fnDepth > 0) {
      out.push(c);
      i++;
      continue;
    }

    if (/\s/.test(c)) {
      pendingSpace = true;
      i++;
      continue;
    }

    // 这些符号周围的空白无意义，直接去掉
    if (c === '{' || c === '}' || c === ';' || c === ',' || c === ':') {
      pendingSpace = false;
      out.push(c);
      i++;
      continue;
    }

    flushSpace();
    out.push(c);
    i++;
  }

  // 收尾：删掉 } 前多余的分号
  return out
    .join('')
    .replace(/;\s*}/g, '}')
    .trim();
}

/* ============================================================
   统一入口
   ============================================================ */

export async function minifyCode(
  code: string,
  lang: MinifyLang,
  ctx?: TaskContext
): Promise<MinifyResult> {
  ctx?.throwIfCancelled();
  ctx?.progress(0.2, '压缩中…');

  let result: string;
  switch (lang) {
    case 'js':
    case 'ts':
      result = await minifyJs(code, lang === 'ts');
      break;
    case 'html':
      result = minifyHtml(code);
      break;
    case 'css':
      result = minifyCss(code);
      break;
  }

  ctx?.throwIfCancelled();
  ctx?.progress(1, '完成');

  return { code: result, before: code.length, after: result.length };
}

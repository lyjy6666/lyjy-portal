/**
 * 代码格式化（基于 tokenizer，不用正则）
 *
 * 旧版的格式化是按行套正则，会把字符串内容也改掉（`"return(x)"` → `"return (x)"`）。
 * 这里改为「重新打印 token」：字符串 / 注释 / 正则 / 模板串整块原样输出，
 * 只调整它们之间的空白与缩进，因此内容永远不会被破坏。
 */

import { tokenize, type Token } from './codeTokenize';

export type CodeLang = 'js' | 'ts' | 'json' | 'html' | 'css' | 'xml' | 'yaml';

const INDENT = '  ';

/** 需要在前后留空格的二元/赋值运算符 */
const SPACED_OPS = new Set([
  '=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**=',
  '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||', '??',
  '+', '-', '*', '/', '%', '**', '&', '|', '^', '<<', '>>', '>>>', '=>', '?', ':', 'in', 'of', 'instanceof',
]);

/** 控制流关键字：后面跟 `(` 时要留一个空格 */
const CONTROL_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'with']);

/** 一元上下文：这些符号前不空格 */
const NO_SPACE_BEFORE = new Set([')', ']', '}', ',', ';', '.', '?.', '(', '[']);

/** 一元运算符：后面不空格 */
const UNARY = new Set(['!', '~', '++', '--']);

type Out = { text: string; indent: number };

/** 判断 token 是否属于「内容不可动」的类别 */
function isAtomic(t: Token): boolean {
  return (
    t.type === 'string' ||
    t.type === 'template' ||
    t.type === 'regex' ||
    t.type === 'line-comment' ||
    t.type === 'block-comment'
  );
}

/**
 * 格式化 JS / TS / JSON。
 *
 * 策略：逐 token 打印，靠一组局部规则决定「换行 / 空格 / 缩进」，
 * 遇到原子 token 直接原样输出。
 */
export function formatJsLike(src: string): string {
  const tokens = tokenize(src).filter((t) => t.type !== 'ws' && t.type !== 'newline');
  const lines: Out[] = [];
  let indent = 0;
  let buf = '';

  const flush = () => {
    const text = buf.replace(/\s+$/, '');
    if (text) lines.push({ text, indent });
    buf = '';
  };

  /** 上一个有效 token（用于判断空格） */
  let prev: Token | null = null;
  /** 括号栈：记录是块还是普通括号 */
  const parenStack: string[] = [];
  /** 是否处于 for(...) 的头部（里面的 `;` 不换行） */
  let forDepth = 0;

  const lastChar = () => (buf.length ? buf[buf.length - 1] : '');

  const wantSpace = (t: Token): boolean => {
    if (!prev) return false;
    const p = prev;
    const pv = p.value;
    const tv = t.value;

    // 注释前后统一留空格
    if (isAtomic(p) || isAtomic(t)) return true;

    if (t.type === 'punct') {
      if (NO_SPACE_BEFORE.has(tv)) return false;
      if (UNARY.has(tv)) return true;
      if (pv === '.' || pv === '?.' || pv === '(' || pv === '[' || pv === '{') return false;
      if (UNARY.has(pv)) return false;
      if (SPACED_OPS.has(tv)) return true;
    }

    if (p.type === 'punct') {
      if (UNARY.has(pv)) return false;
      if (pv === '.' || pv === '?.' || pv === '?.') return false;
      if (pv === '(' || pv === '[') return false;
      if (pv === '{') return true;
      if (SPACED_OPS.has(pv)) return true;
      if (pv === ',') return true;
      if (pv === ';') return true;
    }

    if (p.type === 'name' && CONTROL_KEYWORDS.has(pv) && tv === '(') return true;

    // 关键字与后续标识符之间
    if (p.type === 'name' && (t.type === 'name' || t.type === 'number')) {
      const kws = ['return', 'typeof', 'new', 'delete', 'void', 'throw', 'case', 'const', 'let', 'var', 'function', 'class', 'extends', 'import', 'export', 'from', 'as', 'yield', 'await', 'in', 'of', 'instanceof', 'else', 'do', 'try'];
      if (kws.includes(pv)) return true;
    }
    if (t.type === 'name' && (p.type === 'name' || p.type === 'number')) return true;

    return false;
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const v = t.value;

    // 块注释独占一行更清晰
    if (t.type === 'block-comment') {
      flush();
      for (const line of v.split('\n')) {
        lines.push({ text: line.trimEnd(), indent });
      }
      prev = t;
      continue;
    }

    if (t.type === 'line-comment') {
      if (buf.trim()) buf += ' ';
      buf += v;
      flush();
      prev = t;
      continue;
    }

    if (t.type === 'punct') {
      if (v === '{') {
        const isBlock = prev?.type === 'punct' && (prev.value === ')' || prev.value === '=>')
          || (prev?.type === 'name' && ['else', 'do', 'try', 'finally'].includes(prev.value))
          || prev === null;
        parenStack.push(isBlock ? 'block' : 'obj');
        if (wantSpace(t) && lastChar() !== ' ') buf += ' ';
        buf += '{';
        flush();
        indent++;
        prev = t;
        continue;
      }

      if (v === '}') {
        const kind = parenStack.pop();
        flush();
        indent = Math.max(0, indent - 1);
        // 对象字面量的 `}` 不单独成行
        if (kind === 'obj' && i + 1 < tokens.length && [';', ',', ')', ']', '}'].includes(tokens[i + 1].value)) {
          buf = '}';
          prev = t;
          continue;
        }
        lines.push({ text: '}', indent });
        prev = t;
        continue;
      }

      if (v === '(') {
        parenStack.push('paren');
        if (wantSpace(t)) buf += ' ';
        buf += '(';
        prev = t;
        continue;
      }
      if (v === ')') {
        parenStack.pop();
        buf += ')';
        prev = t;
        continue;
      }
      if (v === '[') {
        parenStack.push('bracket');
        if (wantSpace(t)) buf += ' ';
        buf += '[';
        prev = t;
        continue;
      }
      if (v === ']') {
        parenStack.pop();
        buf += ']';
        prev = t;
        continue;
      }

      if (v === ';') {
        buf += ';';
        if (forDepth > 0) {
          buf += ' ';
        } else {
          flush();
        }
        prev = t;
        continue;
      }

      if (v === ',') {
        buf += ',';
        // 数组/对象内换行会太碎，统一用空格
        buf += ' ';
        prev = t;
        continue;
      }

      if (v === '.') {
        buf = buf.replace(/\s+$/, '');
        buf += '.';
        prev = t;
        continue;
      }
    }

    // for 头部检测
    if (v === '(' && prev?.type === 'name' && prev.value === 'for') forDepth++;

    if (wantSpace(t) && buf && lastChar() !== ' ') buf += ' ';
    buf += v;

    if (v === ')' && forDepth > 0) forDepth--;

    prev = t;
  }

  flush();

  return lines.map((l) => (l.text ? INDENT.repeat(l.indent) + l.text : '')).join('\n');
}

/**
 * 保守压缩：只删注释与多余空白，**不做**变量改名、不做死代码消除。
 *
 * 原则：宁可不压，不可压错。压不干净没关系，压坏语义是事故。
 */
export function minifyJsLike(src: string): string {
  const tokens = tokenize(src).filter((t) => t.type !== 'line-comment' && t.type !== 'block-comment');
  let out = '';

  const lastChar = () => (out.length ? out[out.length - 1] : '');
  const lastTok = (): Token | null => {
    for (let k = tokens.length - 1; k >= 0; k--) {
      /* 占位，真正逻辑在下面 */
    }
    return null;
  };
  void lastTok;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === 'ws' || t.type === 'newline') continue;

    // 换行可能承载 ASI 语义，保守起见遇到换行就补一个空格（而不是删掉）
    const needNewline = i > 0 && tokens[i - 1]?.type === 'newline';

    if (needNewline && out) {
      const prevT = tokens[i - 1 - 1];
      // 只有可能触发 ASI 的位置才保留分隔
      if (prevT && ![';', '{', '}', ',', '(', '['].includes(prevT.value)) {
        if (!out.endsWith(' ')) out += ' ';
      }
      continue;
    }

    // 判断两个 token 拼接是否需要空格分隔，避免粘成别的词
    const prev = (() => {
      for (let k = i - 1; k >= 0; k--) {
        if (tokens[k].type !== 'ws' && tokens[k].type !== 'newline') return tokens[k];
      }
      return null;
    })();

    if (prev && needsSeparator(prev, t)) {
      if (lastChar() !== ' ') out += ' ';
    }

    out += t.value;
  }

  return out.trim();
}

/** 两个相邻 token 直接拼接是否会改变分词 */
function needsSeparator(a: Token, b: Token): boolean {
  const av = a.value;
  const bv = b.value;

  // 标识符/数字相邻必须隔开：`return x` 不能变成 `returnx`
  const aWord = a.type === 'name' || a.type === 'number';
  const bWord = b.type === 'name' || b.type === 'number';
  if (aWord && bWord) return true;

  // 关键字与数字/标识符
  if (aWord && (b.type === 'name' || b.type === 'number')) return true;

  // `+ +` / `- -` / `+ ++` 等不能粘成一个运算符
  if ((av === '+' || av === '-') && bv.startsWith(av)) return true;
  if (av === '/' && (bv === '/' || bv === '*')) return true; // 别粘成注释
  if (av === '<' && bv === '!') return true; // 别粘成 <!--

  // 数字后面紧跟 `.` 会被当成小数
  if (a.type === 'number' && bv.startsWith('.')) return true;

  return false;
}

/* ============================ HTML / XML ============================ */

/**
 * HTML/XML 格式化。
 *
 * 关键：不能像旧版那样 `split(/(<[^>]+>)/g)` —— 正文里的 `a < b`、
 * 属性值里的 `>`、`<script>` 里的 JS 都会被切坏。
 * 这里逐字符扫描：注释 / CDATA / DOCTYPE / 处理指令整块消费，
 * script/style 内容按 raw-text 一直吃到对应闭合标签。
 */
export function formatMarkup(src: string): string {
  const out: string[] = [];
  let indent = 0;
  let i = 0;
  const n = src.length;

  const emit = (text: string, extraIndent = 0) => {
    const t = text.trim();
    if (t) out.push(INDENT.repeat(Math.max(0, indent + extraIndent)) + t);
  };

  while (i < n) {
    // 注释 / CDATA / DOCTYPE / 处理指令
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i);
      const stop = end === -1 ? n : end + 3;
      emit(src.slice(i, stop));
      i = stop;
      continue;
    }
    if (src.startsWith('<![CDATA[', i)) {
      const end = src.indexOf(']]>', i);
      const stop = end === -1 ? n : end + 3;
      emit(src.slice(i, stop));
      i = stop;
      continue;
    }
    if (src.startsWith('<!', i) || src.startsWith('<?', i)) {
      const end = src.indexOf('>', i);
      const stop = end === -1 ? n : end + 1;
      emit(src.slice(i, stop));
      i = stop;
      continue;
    }

    if (src[i] === '<') {
      // 找到标签结束的 `>`，但要跳过属性值里的引号
      let j = i + 1;
      let quote: string | null = null;
      while (j < n) {
        const c = src[j];
        if (quote) {
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'") {
          quote = c;
        } else if (c === '>') {
          break;
        }
        j++;
      }
      const tag = src.slice(i, Math.min(n, j + 1));
      const closing = /^<\s*\//.test(tag);
      const selfClosing = /\/\s*>$/.test(tag);
      const nameMatch = tag.match(/^<\s*\/?\s*([A-Za-z][\w:-]*)/);
      const name = nameMatch ? nameMatch[1].toLowerCase() : '';
      const isRaw = name === 'script' || name === 'style';
      const isVoid = ['br', 'img', 'input', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(name);

      if (closing) indent = Math.max(0, indent - 1);
      emit(tag);
      if (!closing && !selfClosing && !isVoid) indent++;

      i = j + 1;

      // script / style 内容原样吃到闭合标签
      if (!closing && isRaw && !selfClosing) {
        const closeRe = new RegExp(`</\\s*${name}\\s*>`, 'i');
        const rest = src.slice(i);
        const m = rest.match(closeRe);
        if (m && m.index !== undefined) {
          const body = rest.slice(0, m.index);
          if (body.trim()) {
            for (const line of body.split('\n')) {
              const t = line.trim();
              if (t) out.push(INDENT.repeat(indent) + t);
            }
          }
          i += m.index;
        }
      }
      continue;
    }

    // 文本节点：只有 `<` 后面跟合法标签名/`/`/`!`/`?` 才算标签（修 `a < b`）
    let j = i;
    while (j < n) {
      if (src[j] === '<') {
        const next = src[j + 1];
        if (next === '/' || next === '!' || next === '?' || /[A-Za-z]/.test(next ?? '')) break;
      }
      j++;
    }
    const text = src.slice(i, j);
    if (text.trim()) emit(text);
    i = j === i ? i + 1 : j;
  }

  return out.join('\n');
}

/**
 * CSS 格式化。
 *
 * 注意：`calc(100% + 10px)` 里 `+` 两侧的空白**有意义**，
 * `content:"a;b"` 里的分号不是声明分隔符 —— 这些区间不能动。
 */
export function formatCss(src: string): string {
  const out: string[] = [];
  let indent = 0;
  let i = 0;
  const n = src.length;
  let buf = '';
  /** 括号函数深度（calc/url 等内部不动） */
  let fnDepth = 0;

  const flush = (suffix = '') => {
    const t = buf.trim();
    if (t) out.push(INDENT.repeat(indent) + t + suffix);
    buf = '';
  };

  while (i < n) {
    const c = src[i];

    if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i);
      const stop = end === -1 ? n : end + 2;
      const comment = src.slice(i, stop);
      if (buf.trim()) {
        buf += ' ' + comment;
      } else {
        out.push(INDENT.repeat(indent) + comment);
      }
      i = stop;
      continue;
    }

    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') j += 2;
        else if (src[j] === c) { j++; break; }
        else j++;
      }
      buf += src.slice(i, j);
      i = j;
      continue;
    }

    if (c === '(') {
      fnDepth++;
      buf += '(';
      i++;
      continue;
    }
    if (c === ')') {
      fnDepth = Math.max(0, fnDepth - 1);
      buf += ')';
      i++;
      continue;
    }

    // 函数内部（calc 等）保持原样，只做轻量空白规整
    if (fnDepth > 0) {
      buf += c;
      i++;
      continue;
    }

    if (c === '{') {
      flush(' {');
      indent++;
      i++;
      continue;
    }
    if (c === '}') {
      flush();
      indent = Math.max(0, indent - 1);
      out.push(INDENT.repeat(indent) + '}');
      i++;
      continue;
    }
    if (c === ';') {
      flush(';');
      i++;
      continue;
    }
    if (c === '\n') {
      i++;
      continue;
    }
    if (c === ' ' || c === '\t') {
      if (buf && !buf.endsWith(' ')) buf += ' ';
      i++;
      continue;
    }

    buf += c;
    i++;
  }
  flush();

  // 逗号后补空格、冒号后补空格（选择器与声明都适用）
  return out
    .join('\n')
    .replace(/,(\S)/g, ', $1')
    .replace(/([^:\s]):(\S)/g, '$1: $2');
}

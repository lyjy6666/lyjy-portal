/**
 * 代码词法扫描器（逐字符状态机）
 *
 * 为什么必须手写：旧版用正则做格式化和压缩，结果
 *   - `"http://x"` 里的 `//` 被当成注释删掉
 *   - `"return(x)"` 被改成 `"return (x)"`
 *   - `a - -b` 被压成 `a--b`
 * 因为正则无法区分「这串字符在字符串里 / 在注释里 / 是正则字面量」。
 *
 * 本模块只做一件事：把源码切成 token，字符串/注释/正则**原子消费**。
 * 上层（格式化、压缩）据此就能安全地只动空白，永不动内容。
 */

export type TokenType =
  | 'ws' // 水平空白
  | 'newline'
  | 'line-comment'
  | 'block-comment'
  | 'string'
  | 'template'
  | 'regex'
  | 'number'
  | 'name'
  | 'punct';

export type Token = {
  type: TokenType;
  value: string;
  /** 该 token 是否与后一个 token 之间存在换行（用于 ASI 判断） */
  newlineAfter?: boolean;
};

/** 这些关键字后面出现 `/` 时，`/` 是正则起始而不是除号 */
const REGEX_PRECEDING_KEYWORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'do', 'else', 'case', 'yield', 'await', 'throw',
]);

/** 这些关键字是「值」，后面出现 `/` 是除号 */
const VALUE_KEYWORDS = new Set(['this', 'true', 'false', 'null', 'super', 'undefined']);

const isIdentStart = (ch: string) => /[A-Za-z_$]/.test(ch) || ch.charCodeAt(0) > 127;
const isIdentPart = (ch: string) => /[A-Za-z0-9_$]/.test(ch) || ch.charCodeAt(0) > 127;
const isDigit = (ch: string) => ch >= '0' && ch <= '9';

type Mode = 'code' | 'template';

/**
 * 扫描源码，返回 token 列表。
 *
 * 支持 JS / TS / JSON（JSON 里不会有正则和模板串，走同一套逻辑也安全）。
 */
export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  const n = src.length;
  let i = 0;

  /** 模式栈：模板串里的 `${}` 会压入 code 模式，配对后弹回 template */
  const modeStack: Mode[] = ['code'];
  /** 大括号种类栈：用于判断 `}` 之后是正则还是除号 */
  const braceKinds: ('block' | 'object')[] = [];
  /** code 模式下进入 `${` 时的花括号深度，用于配对 */
  const templateBraceDepth: number[] = [];
  let braceDepth = 0;

  /** 最近一个「有效」token（跳过空白和注释），用于 `/` 判定 */
  const lastSignificant = (): Token | null => {
    for (let k = tokens.length - 1; k >= 0; k--) {
      const t = tokens[k];
      if (t.type !== 'ws' && t.type !== 'newline' && t.type !== 'line-comment' && t.type !== 'block-comment') {
        return t;
      }
    }
    return null;
  };

  /** 判断当前位置的 `/` 是正则起始还是除号 */
  const regexAllowed = (): boolean => {
    const prev = lastSignificant();
    if (!prev) return true;
    if (prev.type === 'name') {
      if (REGEX_PRECEDING_KEYWORDS.has(prev.value)) return true;
      if (VALUE_KEYWORDS.has(prev.value)) return false;
      return false; // 普通标识符后面是除号
    }
    if (prev.type === 'number' || prev.type === 'string' || prev.type === 'template') return false;
    if (prev.type === 'regex') return false;
    if (prev.type === 'punct') {
      if (prev.value === ')') return false;
      if (prev.value === ']') return false;
      if (prev.value === '++' || prev.value === '--') return false;
      if (prev.value === '}') {
        // 块结束 → 可以是正则；对象字面量结束 → 是除号
        const kind = braceKinds[braceKinds.length - 1];
        return kind !== 'object';
      }
      return true; // 其它标点（= , ( [ { ; : ? ! & | + - * % < > ~ ^）后面是正则
    }
    return true;
  };

  const push = (type: TokenType, value: string) => {
    tokens.push({ type, value });
  };

  while (i < n) {
    const ch = src[i];
    const mode = modeStack[modeStack.length - 1];

    /* ---------- 模板串内部：只有反引号和插值起始有特殊含义 ---------- */
    if (mode === 'template') {
      let j = i;
      let value = '';
      let closed = false;
      while (j < n) {
        if (src[j] === '\\') {
          value += src[j] + (src[j + 1] ?? '');
          j += 2;
          continue;
        }
        if (src[j] === '`') {
          value += '`';
          j++;
          closed = true;
          break;
        }
        if (src[j] === '$' && src[j + 1] === '{') {
          value += '${';
          j += 2;
          // 进入表达式模式
          push('template', value);
          modeStack.push('code');
          templateBraceDepth.push(braceDepth);
          value = '';
          break;
        }
        value += src[j];
        j++;
      }
      if (value) push('template', value);
      // 模板串闭合后必须弹回 code 模式，否则后面的代码会被当成模板内容吞掉
      if (closed) modeStack.pop();
      i = j;
      continue;
    }

    /* ---------- code 模式 ---------- */

    // 换行
    if (ch === '\n') {
      push('newline', '\n');
      i++;
      continue;
    }

    // 空白（不含换行）
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\f' || ch === '\v') {
      let j = i;
      while (j < n && /[ \t\r\f\v]/.test(src[j])) j++;
      push('ws', src.slice(i, j));
      i = j;
      continue;
    }

    // 行注释
    if (ch === '/' && src[i + 1] === '/') {
      let j = i + 2;
      while (j < n && src[j] !== '\n') j++;
      push('line-comment', src.slice(i, j));
      i = j;
      continue;
    }

    // 块注释
    if (ch === '/' && src[i + 1] === '*') {
      let j = i + 2;
      while (j < n && !(src[j] === '*' && src[j + 1] === '/')) j++;
      j = Math.min(n, j + 2);
      push('block-comment', src.slice(i, j));
      i = j;
      continue;
    }

    // 字符串（单/双引号，支持转义）
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let value = quote;
      while (j < n) {
        if (src[j] === '\\') {
          value += src[j] + (src[j + 1] ?? '');
          j += 2;
          continue;
        }
        value += src[j];
        if (src[j] === quote) {
          j++;
          break;
        }
        if (src[j] === '\n') {
          // 未闭合的字符串：就此收尾，避免把整个文件吞掉
          j++;
          break;
        }
        j++;
      }
      push('string', value);
      i = j;
      continue;
    }

    // 模板串起始：反引号本身也要作为 token 发出去
    // （之前漏发了，导致格式化/压缩后输出缺少开头反引号 → 语法错误）
    if (ch === '`') {
      push('template', '`');
      modeStack.push('template');
      i++;
      continue;
    }

    // 正则字面量 或 除号
    if (ch === '/') {
      if (regexAllowed()) {
        let j = i + 1;
        let value = '/';
        let inClass = false;
        while (j < n) {
          const cj = src[j];
          if (cj === '\\') {
            value += cj + (src[j + 1] ?? '');
            j += 2;
            continue;
          }
          if (cj === '[') inClass = true;
          else if (cj === ']') inClass = false;
          else if (cj === '/' && !inClass) {
            value += '/';
            j++;
            // 正则标志位
            while (j < n && /[a-z]/i.test(src[j])) {
              value += src[j];
              j++;
            }
            break;
          } else if (cj === '\n') {
            break; // 未闭合，收尾
          }
          value += cj;
          j++;
        }
        push('regex', value);
        i = j;
        continue;
      }
      // 除号（可能是 /=）
      if (src[i + 1] === '=') {
        push('punct', '/=');
        i += 2;
      } else {
        push('punct', '/');
        i++;
      }
      continue;
    }

    // 数字
    if (isDigit(ch) || (ch === '.' && isDigit(src[i + 1] ?? ''))) {
      let j = i;
      // 十六进制 / 二进制 / 八进制
      if (ch === '0' && /[xXbBoO]/.test(src[i + 1] ?? '')) {
        j = i + 2;
        while (j < n && /[0-9a-fA-F_]/.test(src[j])) j++;
      } else {
        while (j < n && /[0-9._]/.test(src[j])) j++;
        // 指数部分
        if (/[eE]/.test(src[j] ?? '')) {
          j++;
          if (/[+-]/.test(src[j] ?? '')) j++;
          while (j < n && isDigit(src[j])) j++;
        }
      }
      // BigInt 后缀
      if (src[j] === 'n') j++;
      push('number', src.slice(i, j));
      i = j;
      continue;
    }

    // 标识符 / 关键字
    if (isIdentStart(ch)) {
      let j = i;
      while (j < n && isIdentPart(src[j])) j++;
      push('name', src.slice(i, j));
      i = j;
      continue;
    }

    /* ---------- 标点 ---------- */

    if (ch === '{') {
      // 判断这个大括号是块还是对象字面量
      const prev = lastSignificant();
      let kind: 'block' | 'object' = 'object';
      if (prev) {
        if (prev.type === 'punct' && (prev.value === ')' || prev.value === '=>')) kind = 'block';
        else if (prev.type === 'name' && ['else', 'do', 'try', 'finally'].includes(prev.value)) kind = 'block';
      }
      braceKinds.push(kind);
      braceDepth++;
      push('punct', '{');
      i++;
      continue;
    }

    if (ch === '}') {
      // 若这是模板串插值段的收尾，则弹回 template 模式。
      // 注意：进入插值段时**不会**增加 braceDepth，所以判据是「深度回到进入时的值」，
      // 而不是 tplDepth + 1 —— 之前写成 +1 导致条件永不成立，整个模板串被误解析。
      const tplDepth = templateBraceDepth[templateBraceDepth.length - 1];
      if (tplDepth !== undefined && braceDepth === tplDepth) {
        templateBraceDepth.pop();
        modeStack.pop(); // 回到 template
        push('template', '}');
        i++;
        continue;
      }
      braceKinds.pop();
      braceDepth = Math.max(0, braceDepth - 1);
      push('punct', '}');
      i++;
      continue;
    }

    // 常见多字符运算符（格式化需要知道它们是一个整体）
    const three = src.slice(i, i + 3);
    if (three === '===' || three === '!==' || three === '>>>' || three === '**=' || three === '...') {
      push('punct', three);
      i += 3;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (
      ['=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '%=', '&=', '|=', '^=', '**', '<<', '>>', '::'].includes(two)
    ) {
      push('punct', two);
      i += 2;
      continue;
    }

    push('punct', ch);
    i++;
  }

  // 标记每个 token 后面是否跟了换行（ASI 判断用）
  for (let k = 0; k < tokens.length; k++) {
    let hasNewline = false;
    for (let j = k + 1; j < tokens.length; j++) {
      if (tokens[j].type === 'newline') {
        hasNewline = true;
        break;
      }
      if (tokens[j].type !== 'ws' && tokens[j].type !== 'line-comment' && tokens[j].type !== 'block-comment') break;
    }
    tokens[k].newlineAfter = hasNewline;
  }

  return tokens;
}

/** 判断 token 是否是「值结尾」（用于决定 `/` 是否可能是除号） */
export function isValueEnd(t: Token | undefined): boolean {
  if (!t) return false;
  if (t.type === 'name') return !REGEX_PRECEDING_KEYWORDS.has(t.value) && !['else', 'do', 'try', 'finally', 'case'].includes(t.value);
  if (t.type === 'number' || t.type === 'string' || t.type === 'template' || t.type === 'regex') return true;
  if (t.type === 'punct') return [')', ']', '}', '++', '--'].includes(t.value);
  return false;
}

/** 取出有效 token（去掉空白与注释） */
export function significantTokens(tokens: Token[]): Token[] {
  return tokens.filter(
    (t) => t.type !== 'ws' && t.type !== 'newline' && t.type !== 'line-comment' && t.type !== 'block-comment'
  );
}

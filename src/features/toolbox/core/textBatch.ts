/**
 * 文本批处理（纯函数，无 DOM 依赖）
 *
 * 顺序固定：替换 → 去重 → 去空行 → 修剪 → 排序 → 大小写 → 前后缀 → 统计。
 * 每一步都是确定性的，预览与下载用同一份结果。
 */

export type ReplaceOptions = {
  enabled: boolean;
  pattern: string;
  replacement: string;
  /** true = 按字面量匹配；false = 按正则 */
  literal: boolean;
  /** 用户输入的 flags（会过滤非法字符） */
  flags: string;
  /** 是否全局替换 */
  global: boolean;
};

export type SortMode = 'none' | 'asc' | 'desc' | 'len-asc' | 'len-desc';
export type CaseMode = 'none' | 'upper' | 'lower' | 'title';

export type TextBatchOptions = {
  replace: ReplaceOptions;
  dedupe: boolean;
  removeEmpty: boolean;
  trimLines: boolean;
  sort: SortMode;
  caseMode: CaseMode;
  prefix: string;
  suffix: string;
};

export type TextStats = {
  lines: number;
  chars: number;
  uniqueLines: number;
  emptyLines: number;
};

export const DEFAULT_BATCH_OPTIONS: TextBatchOptions = {
  replace: {
    enabled: false,
    pattern: '',
    replacement: '',
    literal: true,
    flags: '',
    global: true,
  },
  dedupe: false,
  removeEmpty: false,
  trimLines: false,
  sort: 'none',
  caseMode: 'none',
  prefix: '',
  suffix: '',
};

/** 统一换行符后按行切开；空串得到空数组 */
export function splitLines(text: string): string[] {
  if (!text) return [];
  return text.replace(/\r\n?/g, '\n').split('\n');
}

export function textStats(text: string): TextStats {
  const lines = splitLines(text);
  return {
    lines: lines.length,
    chars: text.length,
    uniqueLines: new Set(lines).size,
    emptyLines: lines.filter((l) => l === '').length,
  };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 替换：非法正则明确报错，不吞掉 */
export function applyReplace(text: string, opts: ReplaceOptions): string {
  if (!opts.enabled || !opts.pattern) return text;

  const flags = Array.from(new Set(
    `${opts.global ? 'g' : ''}${opts.flags}`.split('').filter((c) => 'gimsuy'.includes(c))
  )).join('');

  const pattern = opts.literal ? escapeRegExp(opts.pattern) : opts.pattern;
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (e) {
    throw new Error(`正则表达式无效：${e instanceof Error ? e.message : '语法错误'}`);
  }

  // 字面量模式下 replacement 也按字面处理，避免 $1 被当成捕获组
  const replacement = opts.literal ? opts.replacement.replace(/\$/g, '$$$$') : opts.replacement;
  return text.replace(re, replacement);
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function applyCase(line: string, mode: CaseMode): string {
  switch (mode) {
    case 'upper':
      return line.toUpperCase();
    case 'lower':
      return line.toLowerCase();
    case 'title':
      // 每行首字母大写
      return line ? line[0].toUpperCase() + line.slice(1) : line;
    case 'none':
    default:
      return line;
  }
}

/** 执行整套批处理，返回最终文本与针对最终文本的统计 */
export function applyTextBatch(input: string, opts: TextBatchOptions): { text: string; stats: TextStats } {
  let lines = splitLines(applyReplace(input, opts.replace));

  if (opts.trimLines) lines = lines.map((l) => l.trim());

  if (opts.dedupe) {
    const seen = new Set<string>();
    lines = lines.filter((l) => {
      if (seen.has(l)) return false;
      seen.add(l);
      return true;
    });
  }

  if (opts.removeEmpty) lines = lines.filter((l) => l !== '');

  switch (opts.sort) {
    case 'asc':
      lines = [...lines].sort(compare);
      break;
    case 'desc':
      lines = [...lines].sort((a, b) => compare(b, a));
      break;
    case 'len-asc':
      lines = [...lines].sort((a, b) => a.length - b.length || compare(a, b));
      break;
    case 'len-desc':
      lines = [...lines].sort((a, b) => b.length - a.length || compare(a, b));
      break;
    case 'none':
    default:
      break;
  }

  lines = lines.map((l) => `${opts.prefix}${applyCase(l, opts.caseMode)}${opts.suffix}`);
  const text = lines.join('\n');
  return { text, stats: textStats(text) };
}

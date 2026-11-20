/**
 * 开发工具集的核心逻辑（纯函数，可单测）
 *
 * 修掉旧版的问题：
 *   - CMYK 纯黑除零得 NaN（(c-k)/(1-k) 在 k=1 时炸）
 *   - HEX 只支持 6 位，3 位简写返回 {0,0,0}
 *   - 时间戳只支持秒、无范围校验、时区硬编码
 */

/* ============================================================
   颜色
   ============================================================ */

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };
export type HSV = { h: number; s: number; v: number };
export type CMYK = { c: number; m: number; y: number; k: number };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * 解析 HEX。支持 3 位简写（#abc）、4 位（#abcd 带 alpha）、6 位、8 位。
 * 旧版只认 6 位，`#abc` 会返回 {0,0,0}。
 */
export function parseHex(input: string): (RGB & { a: number }) | null {
  let hex = input.trim().replace(/^#/, '');

  if (!/^[0-9a-fA-F]+$/.test(hex)) return null;

  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length !== 6 && hex.length !== 8) return null;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;

  return { r, g, b, a };
}

export function rgbToHex({ r, g, b }: RGB, alpha = 1): string {
  const h = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  const base = `#${h(r)}${h(g)}${h(b)}`;
  return alpha < 1 ? base + h(alpha * 255) : base;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
    }
  }

  return { h: round(h, 1), s: round(s * 100, 1), l: round(l * 100, 1) };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (hn < 60) [r, g, b] = [c, x, 0];
  else if (hn < 120) [r, g, b] = [x, c, 0];
  else if (hn < 180) [r, g, b] = [0, c, x];
  else if (hn < 240) [r, g, b] = [0, x, c];
  else if (hn < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }

  return {
    h: round(h, 1),
    s: round((max === 0 ? 0 : d / max) * 100, 1),
    v: round(max * 100, 1),
  };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const vn = clamp(v, 0, 100) / 100;

  const c = vn * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = vn - c;

  let r = 0;
  let g = 0;
  let b = 0;
  if (hn < 60) [r, g, b] = [c, x, 0];
  else if (hn < 120) [r, g, b] = [x, c, 0];
  else if (hn < 180) [r, g, b] = [0, c, x];
  else if (hn < 240) [r, g, b] = [0, x, c];
  else if (hn < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * RGB → CMYK。
 *
 * 旧版写的是 `(c - k) / (1 - k)`，纯黑时 k = 1 → 除零 → NaN。
 * 正确做法：k = 1 时 CMYK 就是 (0, 0, 0, 100)，直接短路返回。
 */
export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const k = 1 - Math.max(rn, gn, bn);

  // 纯黑：除零保护
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };

  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);

  return { c: round(c * 100, 1), m: round(m * 100, 1), y: round(y * 100, 1), k: round(k * 100, 1) };
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const cn = clamp(c, 0, 100) / 100;
  const mn = clamp(m, 0, 100) / 100;
  const yn = clamp(y, 0, 100) / 100;
  const kn = clamp(k, 0, 100) / 100;

  return {
    r: Math.round(255 * (1 - cn) * (1 - kn)),
    g: Math.round(255 * (1 - mn) * (1 - kn)),
    b: Math.round(255 * (1 - yn) * (1 - kn)),
  };
}

/** 相对亮度（WCAG） */
export function relativeLuminance({ r, g, b }: RGB): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG 对比度（1~21） */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return round((hi + 0.05) / (lo + 0.05), 2);
}

/** WCAG 等级 */
export function wcagLevel(ratio: number, large = false): string {
  if (large) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return '不达标';
  }
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return '不达标';
}

/* ============================================================
   时间戳
   ============================================================ */

export const TIMEZONES: { id: string; label: string }[] = [
  { id: 'UTC', label: 'UTC 协调世界时' },
  { id: 'Asia/Shanghai', label: '北京 / 上海 (UTC+8)' },
  { id: 'Asia/Tokyo', label: '东京 (UTC+9)' },
  { id: 'Asia/Kolkata', label: '新德里 (UTC+5:30)' },
  { id: 'Europe/London', label: '伦敦 (UTC+0/+1)' },
  { id: 'Europe/Paris', label: '巴黎 (UTC+1/+2)' },
  { id: 'America/New_York', label: '纽约 (UTC-5/-4)' },
  { id: 'America/Los_Angeles', label: '洛杉矶 (UTC-8/-7)' },
  { id: 'Australia/Sydney', label: '悉尼 (UTC+10/+11)' },
];

export type TimestampUnit = 's' | 'ms' | 'us';

/**
 * 时间戳 → 各时区时间。
 * 旧版只支持秒且无范围校验，超范围会得到 "Invalid Date" 却不报错。
 */
export function timestampToDates(value: string, unit: TimestampUnit, timezone: string): {
  iso: string;
  local: string;
  formatted: string;
} {
  const raw = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error('时间戳必须是数字');
  }

  const num = Number(raw);
  const ms = unit === 's' ? num * 1000 : unit === 'us' ? num / 1000 : num;

  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    throw new Error('时间戳超出可表示范围');
  }

  // 年份超出合理区间就明确提示，而不是给出一个荒谬的结果
  const year = date.getUTCFullYear();
  if (year < 1 || year > 9999) {
    throw new Error(`时间戳对应年份 ${year}，超出常规范围（1~9999）`);
  }

  const formatted = new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);

  return { iso: date.toISOString(), local: date.toString(), formatted };
}

/** 日期时间字符串 → 各精度时间戳 */
export function dateToTimestamp(input: string): { s: number; ms: number; us: number } {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error('日期格式无法识别，建议用 2026-10-07T12:00:00 这种写法');
  const ms = d.getTime();
  return { s: Math.floor(ms / 1000), ms, us: ms * 1000 };
}

/** 当前时间戳 */
export function nowTimestamps(): { s: number; ms: number; us: number } {
  const ms = Date.now();
  return { s: Math.floor(ms / 1000), ms, us: ms * 1000 };
}

/* ============================================================
   文本工具
   ============================================================ */

export function base64Encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export function base64Decode(b64: string): string {
  const bin = atob(b64.trim().replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function urlEncode(text: string, component = true): string {
  return component ? encodeURIComponent(text) : encodeURI(text);
}

export function urlDecode(text: string, component = true): string {
  try {
    return component ? decodeURIComponent(text) : decodeURI(text);
  } catch {
    throw new Error('URL 编码格式不正确');
  }
}

export function htmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 纯字符串实现（不用 DOM，便于单测；同时支持数字实体） */
export function htmlUnescape(text: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00a0',
  };
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, ent: string) => {
    if (ent.startsWith('#')) {
      const isHex = ent[1] === 'x' || ent[1] === 'X';
      const cp = isHex ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      if (Number.isNaN(cp) || cp < 0 || cp > 0x10ffff) return whole;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return whole;
      }
    }
    return named[ent] ?? whole;
  });
}

export function unicodeEscape(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const cp = ch.codePointAt(0)!;
      if (cp <= 0xffff) return '\\u' + cp.toString(16).padStart(4, '0');
      // 增补平面用代理对表示
      const hi = Math.floor((cp - 0x10000) / 0x400) + 0xd800;
      const lo = ((cp - 0x10000) % 0x400) + 0xdc00;
      return '\\u' + hi.toString(16) + '\\u' + lo.toString(16);
    })
    .join('');
}

export function unicodeUnescape(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

export type TextStats = {
  chars: number;
  charsNoSpace: number;
  words: number;
  lines: number;
  bytes: number;
  cjk: number;
};

export function textStats(text: string): TextStats {
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    chars: Array.from(text).length,
    charsNoSpace: Array.from(text.replace(/\s/g, '')).length,
    words,
    lines: text ? text.split('\n').length : 0,
    bytes: new TextEncoder().encode(text).length,
    cjk,
  };
}

/** UUID v4 */
export function uuidV4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * UUID v7（按时间排序，索引友好）
 * 前 48 位是毫秒时间戳，第 7 字节高 4 位是版本号 7。
 */
export function uuidV7(): string {
  const ms = Date.now();
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  bytes[0] = Math.floor(ms / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ms / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(ms / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(ms / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(ms / 2 ** 8) & 0xff;
  bytes[5] = ms & 0xff;

  bytes[6] = (bytes[6] & 0x0f) | 0x70; // 版本 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* ============================================================
   JWT
   ============================================================ */

export type JwtParts = {
  header: unknown;
  payload: unknown;
  signature: string;
  /** 过期时间（有 exp 时） */
  expiresAt: Date | null;
  expired: boolean;
  notBefore: Date | null;
};

export function decodeJwt(token: string): JwtParts {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('JWT 应由三段组成（用 . 分隔）');

  const decode = (s: string) => {
    // base64url → base64
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    try {
      const bin = atob(padded);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new Error('JWT 内容不是合法的 base64url JSON');
    }
  };

  const header = decode(parts[0]);
  const payload = decode(parts[1]) as Record<string, unknown>;

  const exp = typeof payload.exp === 'number' ? new Date(payload.exp * 1000) : null;
  const nbf = typeof payload.nbf === 'number' ? new Date(payload.nbf * 1000) : null;

  return {
    header,
    payload,
    signature: parts[2],
    expiresAt: exp,
    expired: exp ? exp.getTime() < Date.now() : false,
    notBefore: nbf,
  };
}

/* ============================================================
   正则测试
   ============================================================ */

export type RegexMatch = {
  index: number;
  value: string;
  groups: (string | undefined)[];
  named: Record<string, string> | undefined;
};

export function testRegex(
  pattern: string,
  flags: string,
  text: string,
  maxMatches = 200
): { matches: RegexMatch[]; error: string | null; truncated: boolean } {
  if (!pattern) return { matches: [], error: null, truncated: false };

  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  } catch (e) {
    return { matches: [], error: e instanceof Error ? e.message : '正则表达式不合法', truncated: false };
  }

  const matches: RegexMatch[] = [];
  let m: RegExpExecArray | null;
  let truncated = false;

  while ((m = re.exec(text)) !== null) {
    matches.push({
      index: m.index,
      value: m[0],
      groups: m.slice(1),
      named: m.groups ? { ...m.groups } as Record<string, string> : undefined,
    });
    // 空匹配会让 exec 原地踏步，必须手动前进，否则死循环
    if (m[0] === '') re.lastIndex++;
    if (matches.length >= maxMatches) {
      truncated = true;
      break;
    }
  }

  return { matches, error: null, truncated };
}

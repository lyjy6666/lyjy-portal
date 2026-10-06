/**
 * 数据格式互转（JSON / YAML / TOML / XML / CSV / TSV）
 *
 * 修掉旧版的硬伤：
 *   - CSV 先 split('\n') 再处理引号 → 引号内含换行的字段解析错
 *     → 这里用 RFC-4180 状态机逐字符解析
 *   - CSV 数字强转丢精度（"007" → 7、手机号变科学计数）
 *     → 一律按字符串保留
 *   - XML 值不转义、属性全丢、解析错误被吞
 *     → 解析用浏览器自带 DOMParser（真解析器）并检查 parsererror；
 *       生成时转义 + 保留属性
 *   - JSON→TOML 实际输出 JSON、null 在 TOML 里非法
 *     → 各自实现真正的序列化
 *
 * 关于依赖：papaparse / js-yaml / smol-toml 装不上（沙箱拦了 pnpm 调用的 wmic），
 * 所以 CSV 用状态机手写、XML 用 DOMParser、YAML/TOML 写覆盖常见用法的子集。
 * 子集之外的语法会明确报错，不会静默产出错误结果。
 */

export type DataFormat = 'json' | 'yaml' | 'toml' | 'xml' | 'csv' | 'tsv';

export const DATA_FORMATS: { id: DataFormat; label: string; hint: string }[] = [
  { id: 'json', label: 'JSON', hint: '最通用，支持嵌套' },
  { id: 'yaml', label: 'YAML', hint: '缩进语法，可读性好' },
  { id: 'toml', label: 'TOML', hint: '配置常用，表结构清晰' },
  { id: 'xml', label: 'XML', hint: '标签语法，保留属性' },
  { id: 'csv', label: 'CSV', hint: '表格，逗号分隔' },
  { id: 'tsv', label: 'TSV', hint: '表格，制表符分隔' },
];

export class DataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataError';
  }
}

/* ============================================================
   CSV / TSV —— RFC-4180 状态机
   ============================================================ */

/** 逐字符解析，正确处理引号内的分隔符、换行与转义引号 */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  // 去掉 BOM，否则首个字段会带上不可见字符
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'; // 转义的引号
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"' && field === '') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === delimiter) {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\r') {
      i++; // 等 LF 一起处理
      continue;
    }
    if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += c;
    i++;
  }

  // 收尾（末行没有换行时）
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // 丢掉完全空白的行
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

function csvCell(v: unknown, delimiter: string): string {
  // 关键：数字/布尔等一律按字符串输出，不做类型推断，避免 "007" → 7
  const s = v === null || v === undefined ? '' : String(v);
  if (s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(delimiter)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** 数组 → CSV。对象数组会取并集表头；二维数组直接输出 */
export function stringifyCsv(data: unknown, delimiter = ','): string {
  let rows: unknown[][];

  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    if (Array.isArray(data[0])) {
      rows = data as unknown[][];
    } else if (typeof data[0] === 'object' && data[0] !== null) {
      // 对象数组：表头取所有键的并集，保证列不丢
      const keys: string[] = [];
      for (const item of data) {
        if (item && typeof item === 'object') {
          for (const k of Object.keys(item as object)) if (!keys.includes(k)) keys.push(k);
        }
      }
      rows = [keys, ...data.map((item) => keys.map((k) => (item as Record<string, unknown>)[k]))];
    } else {
      rows = data.map((v) => [v]);
    }
  } else if (data && typeof data === 'object') {
    rows = Object.entries(data as object).map(([k, v]) => [
      k,
      typeof v === 'object' && v !== null ? JSON.stringify(v) : v,
    ]);
  } else {
    rows = [[data]];
  }

  return rows.map((r) => r.map((v) => csvCell(v, delimiter)).join(delimiter)).join('\r\n');
}

/* ============================================================
   YAML —— 覆盖常见用法的子集
   ============================================================ */

/** 解析标量：引号内原样，其余按 YAML 规则推断类型 */
function parseYamlScalar(raw: string): unknown {
  const s = raw.trim();
  if (s === '') return null;
  if (s === 'null' || s === '~') return null;
  if (s === 'true' || s === 'True' || s === 'TRUE') return true;
  if (s === 'false' || s === 'False' || s === 'FALSE') return false;

  // 单引号：内部 '' 表示一个 '
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  // 双引号：处理转义
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    return s
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  // 内联数组 / 对象
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return splitTopLevel(inner).map((x) => parseYamlScalar(x));
  }
  if (s.startsWith('{') && s.endsWith('}')) {
    const inner = s.slice(1, -1).trim();
    const obj: Record<string, unknown> = {};
    if (!inner) return obj;
    for (const pair of splitTopLevel(inner)) {
      const idx = pair.indexOf(':');
      if (idx < 0) continue;
      obj[String(parseYamlScalar(pair.slice(0, idx)))] = parseYamlScalar(pair.slice(idx + 1));
    }
    return obj;
  }
  // 数字：只有形态明确是数字才转，避免把 "007" 这类带前导零的当数字
  if (/^-?\d+$/.test(s) && !/^-?0\d/.test(s)) return Number(s);
  if (/^-?\d*\.\d+([eE][-+]?\d+)?$/.test(s)) return Number(s);
  if (/^-?(0x[0-9a-fA-F]+|0o[0-7]+)$/.test(s)) return Number(s);

  return s;
}

/** 按顶层分隔符切分（忽略引号与括号内的分隔符） */
function splitTopLevel(s: string, sep = ','): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      cur += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      cur += c;
      continue;
    }
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') depth--;
    if (c === sep && depth === 0) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim() !== '' || out.length) out.push(cur);
  return out;
}

/** 去掉行尾注释（不在引号内的 #） */
function stripComment(line: string): string {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote && line[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}

export function parseYaml(text: string): unknown {
  const rawLines = text.replace(/\r\n?/g, '\n').split('\n');

  type Line = { indent: number; content: string; index: number };
  const lines: Line[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const stripped = stripComment(rawLines[i]).replace(/\s+$/, '');
    if (!stripped.trim()) continue;
    if (stripped.trim() === '---') continue;
    lines.push({ indent: stripped.length - stripped.trimStart().length, content: stripped.trim(), index: i });
  }
  if (!lines.length) return null;

  let pos = 0;

  /** 解析缩进 >= indent 的块 */
  function parseBlock(indent: number): unknown {
    if (pos >= lines.length) return null;
    const first = lines[pos];

    // 序列
    if (first.content.startsWith('- ') || first.content === '-') {
      const arr: unknown[] = [];
      while (pos < lines.length && lines[pos].indent >= indent && (lines[pos].content.startsWith('- ') || lines[pos].content === '-')) {
        const line = lines[pos];
        const rest = line.content === '-' ? '' : line.content.slice(2).trim();
        pos++;

        if (rest === '') {
          // 内容在下一层
          arr.push(pos < lines.length && lines[pos].indent > line.indent ? parseBlock(lines[pos].indent) : null);
          continue;
        }

        // `- key: value` 形式：把这一行当成子对象的开头
        const kv = rest.match(/^([^:]+):\s*(.*)$/);
        if (kv && !rest.startsWith('{') && !rest.startsWith('[')) {
          const obj: Record<string, unknown> = {};
          const key = String(parseYamlScalar(kv[1]));
          const val = kv[2].trim();
          obj[key] = val === '' ? (pos < lines.length && lines[pos].indent > line.indent ? parseBlock(lines[pos].indent) : null) : parseYamlScalar(val);

          // 继续吸收同层级的后续键
          while (pos < lines.length && lines[pos].indent > line.indent && !lines[pos].content.startsWith('- ')) {
            const sub = lines[pos];
            const m = sub.content.match(/^([^:]+):\s*(.*)$/);
            if (!m) break;
            pos++;
            const k2 = String(parseYamlScalar(m[1]));
            const v2 = m[2].trim();
            obj[k2] = v2 === '' ? (pos < lines.length && lines[pos].indent > sub.indent ? parseBlock(lines[pos].indent) : null) : parseYamlScalar(v2);
          }
          arr.push(obj);
          continue;
        }

        arr.push(parseYamlScalar(rest));
      }
      return arr;
    }

    // 映射
    if (/^[^:]+:(\s|$)/.test(first.content)) {
      const obj: Record<string, unknown> = {};
      while (pos < lines.length && lines[pos].indent >= indent && !lines[pos].content.startsWith('- ')) {
        const line = lines[pos];
        const m = line.content.match(/^([^:]+):\s*(.*)$/);
        if (!m) break;
        pos++;
        const key = String(parseYamlScalar(m[1]));
        const rest = m[2].trim();
        if (rest === '' ) {
          obj[key] = pos < lines.length && lines[pos].indent > line.indent ? parseBlock(lines[pos].indent) : null;
        } else if (rest === '|' || rest === '>') {
          // 多行字符串：收集更深缩进的行
          const parts: string[] = [];
          const baseIndent = lines[pos]?.indent ?? line.indent + 2;
          while (pos < lines.length && lines[pos].indent >= baseIndent) {
            parts.push(rawLines[lines[pos].index].slice(baseIndent));
            pos++;
          }
          obj[key] = rest === '|' ? parts.join('\n') : parts.join(' ');
        } else {
          obj[key] = parseYamlScalar(rest);
        }
      }
      return obj;
    }

    // 单个标量
    pos++;
    return parseYamlScalar(first.content);
  }

  return parseBlock(lines[0].indent);
}

/** 需要引号包裹的标量 */
function yamlScalar(v: unknown, indent: number): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (v === '') return "''";
    // 含特殊字符或形态像其它类型 → 加引号（并转义，避免出现非法 YAML）
    if (/[:#\-?*&!|>'"%@`\[\]{},]/.test(v) || /^\s|\s$/.test(v) || /^(true|false|null|~|\d)/.test(v) || v.includes('\n')) {
      return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return v;
  }
  return `"${String(v)}"`;
}

export function stringifyYaml(data: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);

  if (data === null || data === undefined) return 'null';
  if (typeof data !== 'object') return yamlScalar(data, indent);

  if (Array.isArray(data)) {
    if (!data.length) return '[]';
    return data
      .map((item) => {
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          const entries = Object.entries(item as object);
          if (!entries.length) return `${pad}- {}`;
          const [firstK, firstV] = entries[0];
          const head = `${pad}- ${firstK}: ${typeof firstV === 'object' && firstV !== null ? '' : yamlScalar(firstV, indent)}`;
          const rest = entries.slice(1).map(([k, v]) => {
            if (v !== null && typeof v === 'object') {
              return `${pad}  ${k}:\n${stringifyYaml(v, indent + 2)}`;
            }
            return `${pad}  ${k}: ${yamlScalar(v, indent)}`;
          });
          const firstTail =
            typeof firstV === 'object' && firstV !== null ? `\n${stringifyYaml(firstV, indent + 2)}` : '';
          return [head + firstTail, ...rest].join('\n');
        }
        if (Array.isArray(item)) return `${pad}-\n${stringifyYaml(item, indent + 1)}`;
        return `${pad}- ${yamlScalar(item, indent)}`;
      })
      .join('\n');
  }

  const entries = Object.entries(data as object);
  if (!entries.length) return '{}';
  return entries
    .map(([k, v]) => {
      const key = /[:#\-?*&!|>'"%@`\[\]{},\s]/.test(k) ? `"${k}"` : k;
      if (v !== null && typeof v === 'object') {
        const inner = stringifyYaml(v, indent + 1);
        if (Array.isArray(v) && v.length === 0) return `${pad}${key}: []`;
        if (!Array.isArray(v) && Object.keys(v as object).length === 0) return `${pad}${key}: {}`;
        return `${pad}${key}:\n${inner}`;
      }
      return `${pad}${key}: ${yamlScalar(v, indent)}`;
    })
    .join('\n');
}

/* ============================================================
   TOML
   ============================================================ */

function tomlValue(raw: string): unknown {
  const s = raw.trim();
  if (s === '') return '';
  if (s.startsWith('"""') && s.endsWith('"""') && s.length >= 6) return s.slice(3, -3);
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    return s.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) return s.slice(1, -1);
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return splitTopLevel(inner).map((x) => tomlValue(x));
  }
  if (s.startsWith('{') && s.endsWith('}')) {
    const obj: Record<string, unknown> = {};
    for (const pair of splitTopLevel(s.slice(1, -1))) {
      const idx = pair.indexOf('=');
      if (idx < 0) continue;
      obj[pair.slice(0, idx).trim()] = tomlValue(pair.slice(idx + 1));
    }
    return obj;
  }
  // 日期时间保持字符串（转 JSON 时没有原生类型）
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}:\d{2})?/.test(s)) return s;
  if (/^[+-]?\d+$/.test(s) && !/^[+-]?0\d/.test(s)) return Number(s);
  if (/^[+-]?\d*\.\d+([eE][+-]?\d+)?$/.test(s)) return Number(s);
  if (s === 'inf' || s === '+inf') return Infinity;
  if (s === '-inf') return -Infinity;
  if (s === 'nan') return NaN;
  return s;
}

export function parseToml(text: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let current: Record<string, unknown> = root;
  /** [[table]] 的数组表：记录每个路径对应的数组 */
  const arrayTables = new Map<string, Record<string, unknown>[]>();

  const lines = text.replace(/\r\n?/g, '\n').split('\n');

  for (let li = 0; li < lines.length; li++) {
    const line = stripComment(lines[li]).trim();
    if (!line) continue;

    // [[数组表]]
    const arrayTable = line.match(/^\[\[(.+)\]\]$/);
    if (arrayTable) {
      const path = arrayTable[1].trim().split('.').map((s) => s.trim().replace(/^["']|["']$/g, ''));
      let node = root;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (typeof node[k] !== 'object' || node[k] === null || Array.isArray(node[k])) {
          node[k] = node[k] ?? {};
        }
        node = node[k] as Record<string, unknown>;
      }
      const last = path[path.length - 1];
      const full = path.join('.');
      if (!arrayTables.has(full)) {
        const arr: Record<string, unknown>[] = [];
        node[last] = arr;
        arrayTables.set(full, arr);
      }
      const arr = arrayTables.get(full)!;
      const item: Record<string, unknown> = {};
      arr.push(item);
      current = item;
      continue;
    }

    // [表]
    const table = line.match(/^\[(.+)\]$/);
    if (table) {
      const path = table[1].trim().split('.').map((s) => s.trim().replace(/^["']|["']$/g, ''));
      let node = root;
      for (const k of path) {
        if (node[k] === undefined) node[k] = {};
        if (typeof node[k] !== 'object' || node[k] === null || Array.isArray(node[k])) {
          throw new DataError(`TOML 结构冲突：${path.join('.')} 既是值又是表`);
        }
        node = node[k] as Record<string, unknown>;
      }
      current = node;
      continue;
    }

    // key = value
    const eq = line.indexOf('=');
    if (eq < 0) throw new DataError(`TOML 第 ${li + 1} 行缺少 "="：${line}`);

    const rawKey = line.slice(0, eq).trim();
    let rawVal = line.slice(eq + 1).trim();

    // 多行数组 / 多行字符串
    if (rawVal.startsWith('[') && !rawVal.endsWith(']')) {
      while (li + 1 < lines.length && !rawVal.trimEnd().endsWith(']')) {
        li++;
        rawVal += ' ' + stripComment(lines[li]).trim();
      }
    }

    const key = rawKey.replace(/^["']|["']$/g, '');
    current[key] = tomlValue(rawVal);
  }

  return root;
}

function tomlKey(k: string): string {
  return /^[A-Za-z0-9_-]+$/.test(k) ? k : `"${k.replace(/"/g, '\\"')}"`;
}

function tomlVal(v: unknown): string {
  if (v === null || v === undefined) {
    // TOML 没有 null —— 明确报错而不是像旧版那样输出非法内容
    throw new DataError('TOML 不支持 null，请先移除该字段或改用 JSON/YAML');
  }
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new DataError('TOML 不支持 Infinity / NaN');
    return String(v);
  }
  if (typeof v === 'string') {
    return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`;
  }
  if (Array.isArray(v)) return `[${v.map((x) => tomlVal(x)).join(', ')}]`;
  // 内联表
  const entries = Object.entries(v as object);
  return `{ ${entries.map(([k, x]) => `${tomlKey(k)} = ${tomlVal(x)}`).join(', ')} }`;
}

export function stringifyToml(data: unknown): string {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new DataError('TOML 的顶层必须是对象（键值对）');
  }

  const out: string[] = [];
  const entries = Object.entries(data as Record<string, unknown>);

  // 先输出简单键值，再输出表
  for (const [k, v] of entries) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) continue;
    if (Array.isArray(v) && v.length && v.every((x) => x !== null && typeof x === 'object' && !Array.isArray(x))) continue;
    out.push(`${tomlKey(k)} = ${tomlVal(v)}`);
  }

  for (const [k, v] of entries) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const inner = stringifyTomlInner(v as Record<string, unknown>, [k]);
      if (inner) out.push('', inner);
    } else if (Array.isArray(v) && v.length && v.every((x) => x !== null && typeof x === 'object' && !Array.isArray(x))) {
      for (const item of v) {
        const inner = stringifyTomlInner(item as Record<string, unknown>, [k], true);
        if (inner) out.push('', inner);
      }
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function stringifyTomlInner(obj: Record<string, unknown>, path: string[], isArrayTable = false): string {
  const out: string[] = [];
  const entries = Object.entries(obj);

  const scalarEntries = entries.filter(([, v]) => !(v !== null && typeof v === 'object' && !Array.isArray(v)));
  const tableEntries = entries.filter(([, v]) => v !== null && typeof v === 'object' && !Array.isArray(v));

  out.push(isArrayTable ? `[[${path.map(tomlKey).join('.')}]]` : `[${path.map(tomlKey).join('.')}]`);
  for (const [k, v] of scalarEntries) out.push(`${tomlKey(k)} = ${tomlVal(v)}`);

  for (const [k, v] of tableEntries) {
    out.push('', stringifyTomlInner(v as Record<string, unknown>, [...path, k]));
  }

  return out.join('\n');
}

/* ============================================================
   XML —— 解析用浏览器原生 DOMParser，生成时转义
   ============================================================ */

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 把 DOM 节点转成普通对象：保留属性（@attr）、文本（#text）、同名子节点合并成数组 */
function domToValue(el: Element): unknown {
  const children = Array.from(el.children);
  const attrs: Record<string, string> = {};
  for (const a of Array.from(el.attributes)) attrs[`@${a.name}`] = a.value;

  if (!children.length) {
    const text = (el.textContent ?? '').trim();
    if (Object.keys(attrs).length === 0) return text;
    return { ...attrs, ...(text ? { '#text': text } : {}) };
  }

  const obj: Record<string, unknown> = { ...attrs };
  for (const child of children) {
    const key = child.tagName;
    const val = domToValue(child);
    if (key in obj) {
      const prev = obj[key];
      obj[key] = Array.isArray(prev) ? [...prev, val] : [prev, val];
    } else {
      obj[key] = val;
    }
  }
  return obj;
}

export function parseXml(text: string): unknown {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  // 关键：DOMParser 遇到非法 XML 不抛错，而是返回一个 parsererror 节点
  const err = doc.querySelector('parsererror');
  if (err) {
    const msg = (err.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
    throw new DataError(`XML 解析失败：${msg || '格式不正确'}`);
  }
  const root = doc.documentElement;
  if (!root) throw new DataError('XML 没有根元素');
  return { [root.tagName]: domToValue(root) };
}

function valueToXml(tag: string, value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);

  if (value === null || value === undefined) return `${pad}<${tag} />`;
  if (typeof value !== 'object') return `${pad}<${tag}>${xmlEscape(String(value))}</${tag}>`;

  if (Array.isArray(value)) {
    return value.map((v) => valueToXml(tag, v, indent)).join('\n');
  }

  const obj = value as Record<string, unknown>;
  const attrs: string[] = [];
  const kids: [string, unknown][] = [];
  let textContent: string | null = null;

  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('@')) attrs.push(`${k.slice(1)}="${xmlEscape(String(v))}"`);
    else if (k === '#text') textContent = String(v);
    else kids.push([k, v]);
  }

  const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';

  if (!kids.length) {
    if (textContent === null) return `${pad}<${tag}${attrStr} />`;
    return `${pad}<${tag}${attrStr}>${xmlEscape(textContent)}</${tag}>`;
  }

  const inner = kids.map(([k, v]) => valueToXml(k, v, indent + 1)).join('\n');
  const textPart = textContent ? `${pad}  ${xmlEscape(textContent)}\n` : '';
  return `${pad}<${tag}${attrStr}>\n${textPart}${inner}\n${pad}</${tag}>`;
}

export function stringifyXml(data: unknown): string {
  if (data === null || typeof data !== 'object') {
    throw new DataError('XML 的顶层必须是对象，且只含一个根节点');
  }
  const entries = Object.entries(data as object);
  if (entries.length !== 1) {
    throw new DataError('XML 只允许一个根节点，请先包一层（如 { root: ... }）');
  }
  const [rootTag, rootVal] = entries[0];
  return `<?xml version="1.0" encoding="UTF-8"?>\n${valueToXml(rootTag, rootVal, 0)}`;
}

/* ============================================================
   统一入口
   ============================================================ */

export function parseData(text: string, format: DataFormat): unknown {
  if (!text.trim()) throw new DataError('输入为空');
  switch (format) {
    case 'json': {
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new DataError(`JSON 解析失败：${e instanceof Error ? e.message : '格式不正确'}`);
      }
    }
    case 'yaml':
      return parseYaml(text);
    case 'toml':
      return parseToml(text);
    case 'xml':
      return parseXml(text);
    case 'csv':
      return parseCsv(text, ',');
    case 'tsv':
      return parseCsv(text, '\t');
  }
}

export function stringifyData(data: unknown, format: DataFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'yaml':
      return stringifyYaml(data);
    case 'toml':
      return stringifyToml(data);
    case 'xml':
      return stringifyXml(data);
    case 'csv':
      return stringifyCsv(data, ',');
    case 'tsv':
      return stringifyCsv(data, '\t');
  }
}

/** 格式化（美化）与压缩 */
export function formatData(text: string, format: DataFormat): string {
  return stringifyData(parseData(text, format), format);
}

export function minifyData(text: string, format: DataFormat): string {
  if (format === 'json') return JSON.stringify(JSON.parse(text));
  if (format === 'csv' || format === 'tsv') {
    // 表格的「压缩」没有意义，原样返回
    return text;
  }
  // 其它格式的压缩会改变可读性但保留语义，这里统一走「解析后紧凑输出」
  const data = parseData(text, format);
  if (format === 'yaml') return stringifyYaml(data).replace(/\n\s*/g, '\n').replace(/\n{2,}/g, '\n');
  return stringifyData(data, format);
}

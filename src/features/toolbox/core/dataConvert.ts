/**
 * 数据格式互转（JSON / YAML / TOML / XML / CSV / TSV）
 *
 * 使用专业库而非手写解析器：
 *   papaparse        CSV —— RFC-4180 完整实现，含引号内换行、转义引号、编码探测
 *   js-yaml          YAML —— 完整规范（锚点、别名、标签、复杂折叠都支持）
 *   smol-toml        TOML —— 完整规范
 *   fast-xml-parser  XML  —— 保留属性与顺序
 *
 * 修掉旧版的硬伤：
 *   - CSV 先 split('\n') 再处理引号 → 引号内含换行的字段解析错
 *   - CSV 数字强转丢精度（"007" → 7、手机号变科学计数）→ 全程不做类型推断
 *   - XML 值不转义、属性全丢、解析错误被吞 → 现在转义 + 保留属性 + 明确报错
 *   - JSON→TOML 实际输出 JSON、null 在 TOML 里非法 → 各自实现真正的序列化
 */

import Papa from 'papaparse';
// js-yaml v5 起 load/dump 是**具名导出**，不再挂在默认导出上
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import { parse as parseTomlLib, stringify as stringifyTomlLib } from 'smol-toml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

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
   CSV / TSV —— papaparse
   ============================================================ */

export function parseCsv(text: string, delimiter = ','): string[][] {
  const result = Papa.parse<string[]>(text, {
    delimiter,
    // 关键：不做类型推断，"007" / 手机号 / 邮编才不会被转成数字丢精度
    dynamicTyping: false,
    skipEmptyLines: 'greedy',
    header: false,
  });

  const fatal = result.errors.filter((e) => e.type === 'Quotes' || e.code === 'UndetectableDelimiter');
  if (fatal.length) {
    throw new DataError(`CSV 解析失败：${fatal[0].message}（第 ${(fatal[0].row ?? 0) + 1} 行）`);
  }

  return (result.data as unknown as string[][]).map((row) =>
    (Array.isArray(row) ? row : [String(row)]).map((c) => (c === null || c === undefined ? '' : String(c)))
  );
}

function csvCell(v: unknown, delimiter: string): string {
  // 一律按字符串输出，不做类型推断
  const s = v === null || v === undefined ? '' : String(v);
  if (s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(delimiter)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** 数组 → CSV。对象数组取键的并集当表头；二维数组直接输出 */
export function stringifyCsv(data: unknown, delimiter = ','): string {
  let rows: unknown[][];

  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    if (Array.isArray(data[0])) {
      rows = data as unknown[][];
    } else if (typeof data[0] === 'object' && data[0] !== null) {
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
   YAML —— js-yaml
   ============================================================ */

export function parseYaml(text: string): unknown {
  try {
    return yamlLoad(text) ?? null;
  } catch (e) {
    const msg = e instanceof Error ? e.message.split('\n')[0] : '格式不正确';
    throw new DataError(`YAML 解析失败：${msg}`);
  }
}

export function stringifyYaml(data: unknown): string {
  try {
    return yamlDump(data, {
      indent: 2,
      lineWidth: -1, // 不自动折行，避免长字符串被切碎
      noRefs: true, // 不输出锚点/别名，输出更直观
    });
  } catch (e) {
    throw new DataError(`YAML 生成失败：${e instanceof Error ? e.message : '未知错误'}`);
  }
}

/* ============================================================
   TOML —— smol-toml
   ============================================================ */

export function parseToml(text: string): Record<string, unknown> {
  try {
    return parseTomlLib(text) as Record<string, unknown>;
  } catch (e) {
    const msg = e instanceof Error ? e.message.split('\n')[0] : '格式不正确';
    throw new DataError(`TOML 解析失败：${msg}`);
  }
}

/** 递归检查 null —— TOML 没有 null，必须明确报错而不是输出非法内容 */
function assertNoNull(value: unknown, path = ''): void {
  if (value === null) {
    throw new DataError(
      `TOML 不支持 null${path ? `（位置：${path}）` : ''}。请改用 JSON/YAML，或先移除该字段。`
    );
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoNull(v, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as object)) {
      assertNoNull(v, path ? `${path}.${k}` : k);
    }
  }
}

export function stringifyToml(data: unknown): string {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new DataError('TOML 的顶层必须是对象（键值对）');
  }
  assertNoNull(data);
  try {
    return stringifyTomlLib(data as Record<string, unknown>);
  } catch (e) {
    throw new DataError(`TOML 生成失败：${e instanceof Error ? e.message : '未知错误'}`);
  }
}

/* ============================================================
   XML —— fast-xml-parser
   ============================================================ */

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@', // 与 JSON 互转时属性用 @name 表示
  textNodeName: '#text',
  parseAttributeValue: false, // 属性保持字符串，避免丢精度
  parseTagValue: false, // 文本也保持字符串，避免 "007" → 7
  trimValues: true,
  allowBooleanAttributes: true,
  isArray: () => false,
});

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
  suppressBooleanAttributes: false,
});

export function parseXml(text: string): unknown {
  // 先做一次结构检查：fast-xml-parser 默认容错，非法 XML 也会「成功」解析
  if (!/^\s*(<\?xml[^>]*\?>\s*)?<[^>]+>/.test(text)) {
    throw new DataError('XML 解析失败：找不到根元素');
  }
  try {
    const parsed = xmlParser.parse(text) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || !Object.keys(parsed).length) {
      throw new DataError('XML 解析失败：内容为空');
    }
    return parsed;
  } catch (e) {
    if (e instanceof DataError) throw e;
    const msg = e instanceof Error ? e.message : '格式不正确';
    throw new DataError(`XML 解析失败：${msg}`);
  }
}

export function stringifyXml(data: unknown): string {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new DataError('XML 的顶层必须是对象，且只含一个根节点');
  }
  const entries = Object.entries(data as object);
  if (entries.length !== 1) {
    throw new DataError('XML 只允许一个根节点，请先包一层（如 { root: ... }）');
  }
  try {
    const body = xmlBuilder.build(data as Record<string, unknown>);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误';
    throw new DataError(`XML 生成失败：${msg}`);
  }
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

export function formatData(text: string, format: DataFormat): string {
  return stringifyData(parseData(text, format), format);
}

export function minifyData(text: string, format: DataFormat): string {
  if (format === 'json') return JSON.stringify(JSON.parse(text));
  if (format === 'csv' || format === 'tsv') return text; // 表格压缩无意义
  const data = parseData(text, format);
  if (format === 'yaml') {
    return yamlDump(data, { indent: 2, lineWidth: -1, noRefs: true, flowLevel: 0 }).trimEnd();
  }
  return stringifyData(data, format);
}

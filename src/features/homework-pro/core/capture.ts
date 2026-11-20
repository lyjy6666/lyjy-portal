import { toUtcIso, localDayKey } from './date';
import { extractSubject, normalizeSubjectPrefix } from './subject';

/** 纯前端本地分点：接口不可用／离线时的降级，不依赖任何后端 */
export function localSplit(text: string): string[] {
  const clean = text.trim();
  if (!clean) return [];
  let items = clean.split(/[\n\r]+/).map((s) => s.trim()).filter(Boolean);
  if (items.length === 1) {
    // 注意包含全角逗号「，」——旧版只写了半角，中文作业一句话拆不开
    items = clean.split(/[,，;；、。]+(?=[^,，;；、。]*?[作业练习试卷习题])/).map((s) => s.trim()).filter(Boolean);
    if (items.length === 1) items = clean.split(/[,，;；、。]/).map((s) => s.trim()).filter(Boolean);
  }
  return items.map(normalizeSubjectPrefix);
}

export type DueHint = { iso: string | null; label: string };

const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'];

function at(day: Date, hh = 23, mm = 59): string | null {
  const p = (n: number) => String(n).padStart(2, '0');
  return toUtcIso(`${localDayKey(day)}T${p(hh)}:${p(mm)}`);
}

/**
 * 从自然语言里推断截止时间。
 * 支持：今天/今晚、明天/明早、后天、大后天、周X/下周X、
 *       N月N日、N/N、N号、以及「下课前/放学」等模糊词（回退当天）。
 * 纯函数，可单测。
 */
export function inferDueDate(text: string, now = new Date()): DueHint {
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const relative: [RegExp, number, string][] = [
    [/大后天/, 3, '大后天'],
    [/后天/, 2, '后天'],
    [/明天|明早|明晚|次日/, 1, '明天'],
    [/今天|今晚|今早|当天/, 0, '今天'],
  ];
  for (const [re, delta, label] of relative) {
    if (!re.test(text)) continue;
    const d = new Date(base);
    d.setDate(d.getDate() + delta);
    return { iso: at(d, label === '今天' ? 23 : 20, 0), label };
  }

  // 下周X / 本周X / 周X
  const weekMatch = /(下下周|下周|这周|本周)?\s*[周星期]\s*([一二三四五六日天1-7])/.exec(text);
  if (weekMatch) {
    const prefix = weekMatch[1] ?? '';
    const raw = weekMatch[2];
    const target = raw === '日' || raw === '天' || raw === '7' ? 0
      : raw === '一' || raw === '1' ? 1 : raw === '二' || raw === '2' ? 2
      : raw === '三' || raw === '3' ? 3 : raw === '四' || raw === '4' ? 4
      : raw === '五' || raw === '5' ? 5 : 6;
    const delta = (target - base.getDay() + 7) % 7 + (prefix === '下周' ? 7 : prefix === '下下周' ? 14 : 0);
    const d = new Date(base);
    d.setDate(d.getDate() + (delta === 0 && !prefix ? 7 : delta));
    return { iso: at(d, 20), label: `${prefix || ''}周${WEEKDAY_CN[target]}` };
  }

  // N月N日 / N/N / N号
  const md = /(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]/.exec(text);
  const slash = /(\d{1,2})\s*\/\s*(\d{1,2})/.exec(text);
  const dayOnly = /(\d{1,2})\s*[日号]/.exec(text);
  const m = md ?? slash;
  if (m) {
    const month = Number(m[1]) - 1;
    const day = Number(m[2]);
    let year = base.getFullYear();
    const d = new Date(year, month, day);
    if (d < base) { year += 1; d.setFullYear(year); }
    if (d.getMonth() === month && d.getDate() === day) {
      return { iso: at(d), label: `${month + 1}月${day}日` };
    }
  } else if (dayOnly) {
    const day = Number(dayOnly[1]);
    const d = new Date(base.getFullYear(), base.getMonth(), day);
    if (d < base) d.setMonth(d.getMonth() + 1);
    if (d.getDate() === day) return { iso: at(d), label: `${d.getMonth() + 1}月${day}日` };
  }

  return { iso: null, label: '未识别到时间' };
}

/** 预览项：结构化结果 */
export type CaptureItem = {
  id: string;
  text: string;
  subject: string;
  dueDate: string | null;
  dueLabel: string;
  checked: boolean;
};

export function toCaptureItems(lines: string[], now = new Date()): CaptureItem[] {
  return lines.map((line, i) => {
    const text = line.trim();
    const hint = inferDueDate(text, now);
    return {
      id: `cap-${Date.now()}-${i}`,
      text,
      subject: extractSubject(text),
      dueDate: hint.iso,
      dueLabel: hint.label,
      checked: true,
    };
  }).filter((item) => item.text.length > 0);
}

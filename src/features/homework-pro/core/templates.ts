import type { Subtask, Template } from './types';

/** 常用作业模板：解决「每天都要重打一遍英语单词抄写」的重复输入 */
export const DEFAULT_TEMPLATES: Template[] = [
  { id: 'tpl-correct', name: '订正错题', text: '订正错题', estimateMin: 20 },
  { id: 'tpl-recite', name: '背诵课文', text: '背诵课文并默写', estimateMin: 25 },
  { id: 'tpl-copy', name: '单词抄写', text: '英语单词抄写', subject: '英语', estimateMin: 15 },
  { id: 'tpl-paper', name: '完成试卷', text: '完成试卷', estimateMin: 60 },
  { id: 'tpl-review', name: '复习预习', text: '复习今日内容，预习明日新课', estimateMin: 30 },
];

let seq = 0;
export function newLocalId(prefix = 'id'): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}`;
}

/**
 * 把一段长作业拆成检查清单。
 * 例：「数学试卷一张 + 订正 + 背诵公式」→ 三个子步骤。
 * 只做轻量拆分，不调 AI，保证离线可用。
 */
export function splitIntoChecklist(text: string): Subtask[] {
  const clean = text.trim();
  if (!clean) return [];

  const parts = clean
    .split(/[+＋、,，;；]|\s+然后\s+|\s+再\s+|\s+以及\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // 拆不动时退化为「整体 + 订正」两步，仍然有帮助
  const steps = parts.length > 1 ? parts : [clean, '订正与检查'];
  return steps.slice(0, 8).map((s) => ({ id: newLocalId('sub'), text: s, done: false }));
}

export function subtaskProgress(subtasks: Subtask[] | undefined): { done: number; total: number; ratio: number } {
  const list = subtasks ?? [];
  const done = list.filter((s) => s.done).length;
  return { done, total: list.length, ratio: list.length ? done / list.length : 0 };
}

export function applyTemplate(tpl: Template, variables: Record<string, string> = {}): string {
  let out = tpl.text;
  for (const [key, value] of Object.entries(variables)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out;
}

export function normalizeTemplates(custom: Template[] | undefined): Template[] {
  const list = Array.isArray(custom) ? custom.filter((t) => t && typeof t.text === 'string') : [];
  return [...DEFAULT_TEMPLATES, ...list];
}

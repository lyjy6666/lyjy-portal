import type { ProTask } from './types';
import { formatDateTime, localDayKey } from './date';
import { subjectOf } from './grouping';

export type ExportFormat = 'txt' | 'md' | 'doc' | 'print';

export const EXPORT_LABELS: Record<ExportFormat, { name: string; hint: string; ext: string }> = {
  txt: { name: '纯文本 TXT', hint: '最轻，任何设备都能打开', ext: 'txt' },
  md: { name: 'Markdown', hint: '适合笔记软件 / 导入其它工具', ext: 'md' },
  doc: { name: 'Word 文档', hint: '可用 WPS / Word 打开编辑', ext: 'doc' },
  print: { name: '打印 / 存为 PDF', hint: '打开打印窗口，可另存为 PDF', ext: 'html' },
};

/** 文档导入：按行切分，5000 字上限（与旧版一致，但明确报错而非静默） */
export function parseImportText(text: string, limit = 5000): { lines: string[]; error?: string } {
  const clean = (text ?? '').replace(/\r\n/g, '\n').trim();
  if (!clean) return { lines: [], error: '文件内容为空' };
  if (clean.length > limit) return { lines: [], error: `内容超过 ${limit} 字，请精简后再导入` };
  const lines = clean.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return { lines: [], error: '没有可导入的作业' };
  return { lines: lines.slice(0, 200) };
}

function statusMark(task: ProTask): string {
  return task.completed ? '✓' : '○';
}

function metaLine(task: ProTask): string {
  const bits: string[] = [];
  if (task.dueDate) bits.push(`截止 ${formatDateTime(task.dueDate)}`);
  if (task.meta.priority && task.meta.priority !== 'normal') bits.push(`优先级 ${task.meta.priority}`);
  if (task.meta.estimateMin) bits.push(`预计 ${task.meta.estimateMin} 分钟`);
  if (task.meta.tags?.length) bits.push(`标签 ${task.meta.tags.join('、')}`);
  return bits.length ? `  （${bits.join(' · ')}）` : '';
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] ?? c));
}

function buildWordHtml(tasks: ProTask[], now: Date): string {
  const groups = new Map<string, ProTask[]>();
  for (const t of tasks) {
    const k = subjectOf(t);
    const list = groups.get(k) ?? [];
    list.push(t);
    groups.set(k, list);
  }
  const sections = [...groups.entries()].map(([subject, list]) => `
    <h2>${escapeHtml(subject)}</h2>
    <ul>${list.map((t) => `<li>${statusMark(t)} ${escapeHtml(t.text)}${escapeHtml(metaLine(t))}</li>`).join('')}</ul>
  `).join('');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>作业清单</title>
<style>body{font-family:"Microsoft YaHei",sans-serif;font-size:11pt;line-height:1.7;color:#222}
h1{font-size:18pt;border-bottom:1px solid #999;padding-bottom:6px}h2{font-size:13pt;margin-top:18px;color:#333}
li{margin-bottom:4px}.foot{margin-top:24px;color:#888;font-size:9pt}</style></head>
<body><h1>作业清单</h1><p>导出时间：${escapeHtml(formatDateTime(now.toISOString()))} ｜ 共 ${tasks.length} 项</p>
${sections}<p class="foot">由 LYJY 作业管理系统 Pro 版导出</p></body></html>`;
}

export function buildExport(
  format: ExportFormat,
  tasks: ProTask[],
  now: Date = new Date(),
): { content: string; mime: string; filename: string; print: boolean } {
  const day = localDayKey(now);
  const filename = `作业清单_${day}`;
  const head = `作业清单（${day} · 共 ${tasks.length} 项）\n`;

  if (format === 'txt') {
    const content = head + tasks.map((t) => `${statusMark(t)} ${t.text}${metaLine(t)}`).join('\n');
    return { content, mime: 'text/plain;charset=utf-8', filename: `${filename}.txt`, print: false };
  }

  if (format === 'md') {
    const content =
      `# 作业清单\n\n> ${day} · 共 ${tasks.length} 项\n\n` +
      tasks.map((t) => `- [${t.completed ? 'x' : ' '}] ${t.text}${metaLine(t)}`).join('\n') +
      '\n';
    return { content, mime: 'text/markdown;charset=utf-8', filename: `${filename}.md`, print: false };
  }

  const html = buildWordHtml(tasks, now);
  return {
    content: html,
    mime: format === 'doc' ? 'application/msword;charset=utf-8' : 'text/html;charset=utf-8',
    filename: format === 'doc' ? `${filename}.doc` : `${filename}.html`,
    print: format === 'print',
  };
}

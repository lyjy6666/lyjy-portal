import { describe, it, expect } from 'vitest';
import { parseImportText, buildExport, EXPORT_LABELS } from './importExport';
import type { ProTask } from './types';
import { toUtcIso } from './date';

const tasks: ProTask[] = [
  {
    id: 1, text: '数学试卷 <script> & 符号', completed: false,
    dueDate: toUtcIso('2026-11-06T20:00'), isPinned: false,
    createdAt: '2026-11-01T00:00:00.000Z', updatedAt: null,
    meta: { estimateMin: 60, tags: ['考试'], rev: 1 },
  },
  {
    id: 2, text: '英语单词抄写', completed: true, dueDate: null, isPinned: false,
    createdAt: '2026-11-01T00:00:00.000Z', updatedAt: null, meta: { rev: 1 },
  },
];

describe('parseImportText', () => {
  it('按行切分、去空行、统一 CRLF', () => {
    expect(parseImportText('语文背诵\r\n\n  数学试卷  \r\n英语听力')).toEqual({
      lines: ['语文背诵', '数学试卷', '英语听力'],
    });
  });

  it('空内容 / 超长内容明确报错', () => {
    expect(parseImportText('   ').error).toBeTruthy();
    expect(parseImportText('x'.repeat(5001)).error).toContain('5000');
  });

  it('超过 200 行截断，避免一次灌爆清单', () => {
    const text = Array.from({ length: 250 }, (_, i) => `作业${i}`).join('\n');
    expect(parseImportText(text).lines).toHaveLength(200);
  });
});

describe('buildExport', () => {
  const now = new Date(2026, 10, 6, 12, 0);

  it('txt 与 md 包含作业文本且勾选状态正确', () => {
    const txt = buildExport('txt', tasks, now);
    expect(txt.content).toContain('数学试卷');
    expect(txt.content).toContain('✓ 英语单词抄写');
    expect(txt.filename).toBe('作业清单_2026-11-06.txt');

    const md = buildExport('md', tasks, now);
    expect(md.content).toContain('- [x] 英语单词抄写');
    expect(md.content).toContain('- [ ] 数学试卷');
  });

  it('doc / print 生成 Word 兼容 HTML 并转义危险字符', () => {
    const doc = buildExport('doc', tasks, now);
    expect(doc.content).toContain('urn:schemas-microsoft-com:office:word');
    expect(doc.content).not.toContain('<script>');
    expect(doc.content).toContain('&lt;script&gt;');
    expect(doc.print).toBe(false);

    const print = buildExport('print', tasks, now);
    expect(print.print).toBe(true);
  });

  it('每种格式都有中文名与扩展名', () => {
    for (const f of Object.keys(EXPORT_LABELS) as (keyof typeof EXPORT_LABELS)[]) {
      expect(EXPORT_LABELS[f].name).toBeTruthy();
      expect(buildExport(f, tasks, now).filename).toContain('.');
    }
  });
});

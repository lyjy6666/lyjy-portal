'use client';

import { Printer, BookOpenCheck } from 'lucide-react';
import { usePro } from '../../hooks/ProContext';
import { reviewGroups } from '../../core/stats';
import { EmptyState, subjectStyle } from '../common/bits';
import { formatDateTime } from '../../core/date';

/** 考前复习清单：纯派生视图，勾选了 reviewList 的作业按科目聚合 */
export function ReviewView() {
  const { tasks, setView } = usePro();
  const groups = reviewGroups(tasks);
  const total = groups.reduce((s, g) => s + g.tasks.length, 0);

  const print = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const html = `<html><head><meta charset="utf-8"><title>考前复习清单</title>
<style>body{font-family:"Microsoft YaHei",sans-serif;padding:24px;line-height:1.8}
h1{font-size:20pt;border-bottom:1px solid #999;padding-bottom:8px}h2{font-size:14pt;margin-top:20px}
li{margin-bottom:4px}.meta{color:#888;font-size:9pt}</style></head><body>
<h1>考前复习清单</h1><p class="meta">${formatDateTime(new Date().toISOString())} ｜ 共 ${total} 项</p>
${groups.map((g) => `<h2>${g.subject}</h2><ul>${g.tasks.map((t) =>
  `<li>${t.completed ? '✓' : '○'} ${t.text.replace(/[&<>]/g, '')}${t.meta.note ? `（${t.meta.note.replace(/[&<>]/g, '')}）` : ''}</li>`
).join('')}</ul>`).join('')}
</body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    // 用户可能在这 300ms 内手动关掉打印窗口
    window.setTimeout(() => { if (!win.closed) win.print(); }, 300);
  };

  return (
    <div className="space-y-3">
      <div className="hw-panel flex flex-wrap items-center gap-2 p-3">
        <BookOpenCheck size={17} />
        <span className="hw-title text-base">考前复习清单</span>
        <span className="hw-chip">共 {total} 项</span>
        <button type="button" className="hw-btn ml-auto" onClick={print}><Printer size={14} /> 打印 / 存为 PDF</button>
        <button type="button" className="hw-btn" onClick={() => setView('list')}>返回清单勾选</button>
      </div>

      {total === 0 ? (
        <EmptyState
          title="还没有勾选复习项"
          hint="在作业行点 ☆，或在多选浮层里「加入复习」，勾好后这里会按科目自动汇总。"
        />
      ) : (
        groups.map((group) => (
          <section key={group.subject} className="hw-panel overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--hw-rule)' }}>
              <span className="hw-subject-bar" style={{ ...subjectStyle(group.subject), height: 16 }} />
              <span className="hw-title text-sm">{group.subject}</span>
              <span className="hw-label hw-num">{group.tasks.length}</span>
            </div>
            <ul className="p-3 pl-7 text-sm" style={{ listStyle: 'disc' }}>
              {group.tasks.map((t) => (
                <li key={t.id} className="py-0.5">
                  {t.text}
                  {t.meta.note && <span className="hw-label"> — {t.meta.note}</span>}
                  {t.dueDate && <span className="hw-label hw-num"> （{formatDateTime(t.dueDate)}）</span>}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

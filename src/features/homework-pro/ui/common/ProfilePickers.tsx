'use client';

import { Check, GraduationCap, Target, X } from 'lucide-react';

/**
 * 学习画像选择器：年级 + 薄弱项。
 *
 * 注册、进周计划（GradeGate）、个人中心、AI 排期页四处共用同一套控件，
 * 保证「一个账号只有一份画像」，AI 用时推测 / 批改都读这份。
 *
 * 视觉：年级做成三张可点选的大卡（图标 + 名称 + 适用说明 + 选中勾），
 * 薄弱项做成网格勾选块 + 已选计数，比原来一排小 chip 清楚得多。
 */

export const GRADE_OPTIONS = [
  { id: '小学', desc: '节奏快，作业量少', detail: '低年级作业以抄写背诵为主' },
  { id: '初中', desc: '默认基准', detail: '覆盖大多数作业与试卷' },
  { id: '高中', desc: '节奏慢，题量大', detail: '大题与综合卷按更长时间算' },
] as const;

/** 与作业科目表对齐，只保留常见学科 */
export const WEAK_SUBJECT_OPTIONS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '科学', '信息技术'];

export function GradePicker({
  value, onChange, dense = false,
}: { value: string; onChange: (grade: string) => void; dense?: boolean }) {
  // 紧凑版（弹窗顶部、排期页）：一排胶囊，够用不占地方
  if (dense) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {GRADE_OPTIONS.map((g) => {
          const active = value === g.id;
          return (
            <button key={g.id} type="button" className="hw-pill-opt"
              data-active={active ? 'true' : undefined} onClick={() => onChange(g.id)}>
              {active && <Check size={12} />} {g.id}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {GRADE_OPTIONS.map((g) => {
        const active = value === g.id;
        return (
          <button key={g.id} type="button" className="hw-grade-card"
            data-active={active ? 'true' : undefined} onClick={() => onChange(g.id)}>
            <span className="hw-grade-ico"><GraduationCap size={18} /></span>
            <span className="min-w-0">
              <span className="hw-title block text-sm">{g.id}</span>
              <span className="hw-label block">{g.desc}</span>
              <span className="hw-label mt-0.5 block opacity-80">{g.detail}</span>
            </span>
            {active && <span className="hw-grade-check"><Check size={11} /></span>}
          </button>
        );
      })}
    </div>
  );
}

export function WeakSubjectPicker({
  value, onChange,
}: { value: string[]; onChange: (list: string[]) => void }) {
  const toggle = (subject: string) => {
    onChange(value.includes(subject) ? value.filter((s) => s !== subject) : [...value, subject]);
  };

  return (
    <div>
      <div className="hw-weak-grid">
        {WEAK_SUBJECT_OPTIONS.map((s) => {
          const active = value.includes(s);
          return (
            <button key={s} type="button" className="hw-weak-item"
              data-active={active ? 'true' : undefined} aria-pressed={active}
              onClick={() => toggle(s)}>
              <span className="hw-weak-box">{active && <Check size={11} />}</span>
              <span className="truncate">{s}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="hw-label">
          {value.length ? `已选 ${value.length} 项：${value.join('、')}` : '可以多选，也可以先跳过'}
        </span>
        {value.length > 0 && (
          <button type="button" className="hw-chip" onClick={() => onChange([])}>
            <X size={11} /> 清空
          </button>
        )}
      </div>

      <p className="hw-label mt-1 flex items-start gap-1">
        <Target size={12} style={{ marginTop: 3, flex: 'none' }} />
        选中的科目，AI 会多留 15~25% 时间；批改这些科目时也会把基础步骤讲得更细。
      </p>
    </div>
  );
}

'use client';

import { useEffect, useState, type RefObject } from 'react';
import { Mic, MicOff, Plus, Sparkles, BookOpen, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { toUtcIso } from '../../core/date';
import { DEFAULT_TEMPLATES, splitIntoChecklist } from '../../core/templates';
import { SUBJECTS } from '../../core/subject';
import { isComposing } from '../common/interaction';
import { AiBadge } from '../common/AiFeature';
import { readScoped, writeScoped, KEYS } from '../../core/storage';
import type { Priority, ProMeta, RepeatRule } from '../../core/types';

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'urgent', label: '紧急' }, { id: 'high', label: '高' },
  { id: 'normal', label: '普通' }, { id: 'low', label: '低' },
];
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 创建作业：主输入可自动增高、Enter 换行、Ctrl+Enter 提交。
 * 「更多设置」里把详情弹窗能改的常用字段全部前移到创建时，一次写入，
 * 不再需要「先创建 → 再点开详情 → 逐项补」。
 */
export function QuickAddBar({ inputRef }: { inputRef: RefObject<HTMLTextAreaElement | null> }) {
  const { addTask, offline, groupBy, setGroupBy, user } = usePro();
  const uid = user?.id ?? 'guest';
  const [text, setText] = useState('');
  const [dueLocal, setDueLocal] = useState('');
  const [extraOpen, setExtraOpen] = useState(() => readScoped<boolean>(uid, KEYS.createPanel, false));
  const [submitting, setSubmitting] = useState(false);

  // 创建时可设置的字段
  const [priority, setPriority] = useState<Priority>('normal');
  const [subject, setSubject] = useState(''); // 空 = 按文字自动推断
  const [estimateMin, setEstimateMin] = useState('');
  const [notifyLeadMin, setNotifyLeadMin] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [checklist, setChecklist] = useState('');
  const [repeatRule, setRepeatRule] = useState<RepeatRule['rule'] | 'none'>('none');
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]);
  const [repeatUntil, setRepeatUntil] = useState('');

  const voice = useVoiceInput((chunk) => setText((prev) => (prev ? `${prev}${chunk}` : chunk)));

  // 主输入框随内容长高，长段落不再只露 1 行
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 76), 240)}px`;
  }, [text, inputRef]);

  const toggleExtra = () => setExtraOpen((v) => {
    writeScoped(uid, KEYS.createPanel, !v);
    return !v;
  });

  const collectMeta = (): Partial<ProMeta> => {
    const meta: Partial<ProMeta> = { priority };
    if (subject) meta.subject = subject;
    if (estimateMin !== '') meta.estimateMin = Math.max(0, Number(estimateMin) || 0);
    if (notifyLeadMin !== '') meta.notifyLeadMin = Math.max(0, Number(notifyLeadMin) || 0);
    if (note.trim()) meta.note = note.trim();
    if (tags.length) meta.tags = tags;
    const items = checklist.split('\n').map((s) => s.trim()).filter(Boolean);
    if (items.length) {
      meta.subtasks = items.map((t, i) => ({ id: `new-${Date.now()}-${i}`, text: t, done: false }));
    }
    if (repeatRule !== 'none') {
      const repeat: RepeatRule = { rule: repeatRule };
      if (repeatRule === 'custom') repeat.weekdays = weekdays.length ? weekdays : [1, 3, 5];
      if (repeatUntil) repeat.until = repeatUntil;
      meta.repeat = repeat;
    }
    return meta;
  };

  // 内容类字段每次清空；偏好类字段（优先级/耗时/提醒/重复）保留，下次添加沿用
  const resetForm = () => {
    setText(''); setDueLocal(''); setNote(''); setTags([]);
    setTagDraft(''); setChecklist(''); setSubject('');
  };

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      // 失败时保留原文和所有已填字段，用户可以直接重试
      const ok = await addTask(text, toUtcIso(dueLocal), collectMeta());
      if (!ok) return;
      resetForm();
      toast.success('已添加作业');
    } finally {
      setSubmitting(false);
    }
  };

  const addTemplate = async (tplText: string, tplMin?: number, tplSubject?: string) => {
    const meta: Partial<ProMeta> = {
      ...collectMeta(),
      estimateMin: tplMin ?? (estimateMin === '' ? undefined : Number(estimateMin)),
      subject: tplSubject ?? (subject || undefined),
      subtasks: splitIntoChecklist(tplText),
    };
    const ok = await addTask(tplText, toUtcIso(dueLocal) ?? null, meta);
    if (ok) toast.success('已按模板添加，并拆成检查清单');
  };

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, '');
    if (!t) return;
    setTags((prev) => [...new Set([...prev, t])]);
    setTagDraft('');
  };

  const filledCount = [
    dueLocal, subject, estimateMin, notifyLeadMin, note.trim(),
    tags.length, checklist.trim(), repeatRule !== 'none',
    priority !== 'normal',
  ].filter(Boolean).length;

  return (
    <section className="hw-panel hw-addbar mb-4" data-tour="input">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <AiBadge>AI 记作业</AiBadge>
        <span className="hw-label">一整天段话直接粘贴，AI 自动拆成多条并补上科目；也可以拍照或说一句话</span>
      </div>
      <div className="flex items-start gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (isComposing(e)) return; // 中文输入法选词
            // Enter 保留换行，Ctrl/⌘+Enter 才提交，避免整段文字被拆坏
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void submit(); }
          }}
          placeholder={'输入一条作业，可粘贴一整段自动拆条；Enter 换行，Ctrl + Enter 添加'}
          rows={2}
          className="hw-input min-h-[76px] flex-1 resize-y py-2.5"
          style={{ overflowY: 'auto' }}
        />
        <div className="flex shrink-0 flex-col gap-2">
          <button type="button" data-tour="voice" onClick={voice.toggle}
            className={`hw-btn ${voice.recording ? 'hw-overdue' : ''}`}
            title={voice.supported ? '语音输入（持续录音）' : '当前浏览器不支持语音，请用键盘输入'}
            aria-label="语音输入">
            {voice.recording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button type="button" className="hw-btn" data-variant="primary"
            onClick={() => void submit()} disabled={submitting || !text.trim()}>
            <Plus size={16} /> <span className="hidden sm:inline">{submitting ? '添加中…' : '添加作业'}</span>
          </button>
        </div>
      </div>

      {voice.recording && voice.interim && <p className="mt-1 text-xs hw-label">正在识别：{voice.interim}</p>}
      {!voice.supported && <p className="mt-1 text-xs hw-label">当前浏览器不支持语音识别，已自动降级为键盘输入。</p>}
      {offline && <p className="mt-1 text-xs hw-overdue">离线中 · 改动会暂存，联网后自动同步</p>}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className="hw-chip" onClick={toggleExtra} aria-expanded={extraOpen}>
          <SlidersHorizontal size={12} />
          创建时设置：科目 / 优先级 / 截止时间 / 耗时 / 标签 / 提醒 / 重复…
          {filledCount > 0 && <span className="hw-num">{filledCount} 项已填</span>}
          <ChevronDown size={12} style={{ transform: extraOpen ? 'rotate(180deg)' : undefined }} />
        </button>
      </div>

      {extraOpen && (
        <div className="hw-addbar-extra space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="hw-label block">截止时间
              <input type="datetime-local" value={dueLocal}
                onChange={(e) => setDueLocal(e.target.value)}
                className="hw-input mt-1" aria-label="截止时间" />
            </label>
            <label className="hw-label block">科目（留空自动推断）
              <select className="hw-input mt-1" value={subject}
                onChange={(e) => setSubject(e.target.value)}>
                <option value="">自动推断</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="hw-label block">预计耗时（分钟）
              <input type="number" min={0} className="hw-input mt-1" value={estimateMin}
                onChange={(e) => setEstimateMin(e.target.value)} placeholder="不填则不预估" />
            </label>
          </div>

          <div>
            <span className="hw-label">优先级</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button key={p.id} type="button" className="hw-chip"
                  data-active={priority === p.id ? 'true' : undefined}
                  onClick={() => setPriority(p.id)}>{p.label}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="hw-label block">提前提醒（分钟，留空用默认）
              <input type="number" min={0} step={5} className="hw-input mt-1" value={notifyLeadMin}
                onChange={(e) => setNotifyLeadMin(e.target.value)} placeholder="默认 30" />
            </label>
            <label className="hw-label block">重复作业
              <select className="hw-input mt-1" value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value as RepeatRule['rule'] | 'none')}>
                <option value="none">不重复</option>
                <option value="daily">每天</option>
                <option value="weekly">每周同一天</option>
                <option value="custom">自定义星期</option>
              </select>
            </label>
          </div>

          {repeatRule === 'custom' && (
            <div className="hw-panel p-3">
              <span className="hw-label">选择重复的星期</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WEEKDAYS.map((label, i) => (
                  <button key={i} type="button" className="hw-chip"
                    data-active={weekdays.includes(i) ? 'true' : undefined}
                    onClick={() => setWeekdays((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}>
                    周{label}
                  </button>
                ))}
              </div>
              <label className="hw-label mt-2 block">结束日期（可选）
                <input type="date" className="hw-input mt-1" value={repeatUntil}
                  onChange={(e) => setRepeatUntil(e.target.value)} />
              </label>
            </div>
          )}

          <div>
            <span className="hw-label">标签</span>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <span key={t} className="hw-chip">
                  #{t}
                  <button type="button" className="ml-1" aria-label={`移除标签 ${t}`}
                    onClick={() => setTags((prev) => prev.filter((x) => x !== t))}><X size={11} /></button>
                </span>
              ))}
              <input className="hw-input w-40" value={tagDraft} placeholder="输入标签后回车"
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (isComposing(e)) return;
                  if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                }} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="hw-label block">备注 / 补充要求
              <textarea className="hw-input mt-1" rows={2} value={note}
                onChange={(e) => setNote(e.target.value)} placeholder="页码、注意事项…" />
            </label>
            <label className="hw-label block">检查清单（每行一条）
              <textarea className="hw-input mt-1" rows={2} value={checklist}
                onChange={(e) => setChecklist(e.target.value)} placeholder={'第一题\n第二题\n背诵第三段'} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-2" style={{ borderColor: 'var(--hw-rule)' }}>
            <span className="hw-label">清单分组</span>
            {(['time', 'subject', 'priority'] as const).map((g) => (
              <button key={g} type="button" className="hw-chip"
                onClick={() => setGroupBy(g)} data-active={groupBy === g ? 'true' : undefined}>
                {{ time: '按时间', subject: '按科目', priority: '按优先级' }[g]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="hw-label mr-1 flex items-center gap-1"><BookOpen size={12} /> 常用模板</span>
            {DEFAULT_TEMPLATES.slice(0, 5).map((tpl) => (
              <button key={tpl.id} type="button" className="hw-chip hover:opacity-80"
                onClick={() => void addTemplate(tpl.text, tpl.estimateMin, tpl.subject)}
                title="点击按模板添加（自动拆成检查清单）">
                <Sparkles size={11} /> {tpl.name}
              </button>
            ))}
          </div>
          <p className="hw-label">
            <span className="hw-kbd">Ctrl</span> + <span className="hw-kbd">Enter</span> 添加 ·
            优先级 / 耗时 / 提醒 / 重复会沿用，展开状态也会记住
          </p>
        </div>
      )}
    </section>
  );
}

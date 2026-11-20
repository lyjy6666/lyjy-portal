'use client';

import { useState } from 'react';
import { Sparkles, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { ProDialog } from '../common/bits';
import { GradePicker, WeakSubjectPicker } from '../common/ProfilePickers';

/**
 * 学习画像门禁：进周计划 / 用 AI 推测前，强制先选年级并保存。
 * 年级必选（AI 推测的基准），薄弱项可选但同一屏里一起收集，避免二次打扰。
 * 不允许直接关掉；提供「返回清单」避免把用户锁死。
 */
export function GradeGate() {
  const { view, settings, setSettings, setView, user } = usePro();
  const needGrade = view === 'week' && Boolean(user) && !settings.grade;
  const [draftGrade, setDraftGrade] = useState(settings.grade);
  const [draftWeak, setDraftWeak] = useState<string[]>(() => settings.weakSubjects ?? []);

  const save = () => {
    if (!draftGrade) { toast.error('先选一个年级，AI 才有估算基准'); return; }
    setSettings({ ...settings, grade: draftGrade, weakSubjects: draftWeak });
    toast.success(`已保存画像：${draftGrade}${draftWeak.length ? ` · 薄弱 ${draftWeak.join('/')}` : ''}`);
  };

  return (
    <ProDialog
      open={needGrade}
      onOpenChange={() => undefined}
      title="先建立学习画像"
      desc="AI 需要年级作为基准、薄弱项作为加权，才能把用时估准。按账号自动保存。"
      className="sm:max-w-[560px]"
    >
      <div className="space-y-4">
        <section className="hw-ai-hero p-4">
          <span className="hw-ai-tag"><Sparkles size={13} /> 本站 AI 特色</span>
          <p className="hw-ai-title mt-2 text-base">年级 + 薄弱项 + 作业内容，三件事一起算用时</p>
          <p className="hw-ai-desc mt-1">
            普通工具只按条数估；这里按你的年级定基准速度，再把薄弱科目的作业自动加 15~25% 时间，
            排出来的这一周才是真的写得完。
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="hw-ai-pill"><Check size={12} /> 年级定基准</span>
            <span className="hw-ai-pill"><Check size={12} /> 薄弱项加权</span>
            <span className="hw-ai-pill"><Check size={12} /> 一键排到每天</span>
          </div>
        </section>

        <div className="space-y-2">
          <span className="hw-title block text-sm">① 你现在读几年级？</span>
          <GradePicker value={draftGrade} onChange={setDraftGrade} />
        </div>

        <div className="space-y-2">
          <span className="hw-title block text-sm">② 哪些科目比较薄弱？（可多选，也可跳过）</span>
          <WeakSubjectPicker value={draftWeak} onChange={setDraftWeak} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="hw-btn" data-variant="primary" disabled={!draftGrade} onClick={save}>
            <Check size={14} /> 保存画像并继续
          </button>
          <button type="button" className="hw-btn" onClick={() => setView('list')}>
            <ArrowLeft size={14} /> 暂不使用周计划
          </button>
        </div>
      </div>
    </ProDialog>
  );
}

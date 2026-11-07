'use client';

import type { ReactNode } from 'react';
import { Sparkles, Camera, Gauge, CalendarRange } from 'lucide-react';

/**
 * 「本站 AI 特色」主视觉卡。
 *
 * 用户反馈过两次「AI 特色没有凸显」——原来只是一行 hw-eyebrow 小字，
 * 视觉上跟普通说明没区别。这里做成整块高亮卡：渐变底 + 主色双线边框 +
 * 实心 AI 徽标 + 大字标题 + 能力清单，进页面第一眼就能看到。
 *
 * 只使用主题变量，三套皮肤（手账 / 俏皮 / 晨白）都不会跑色。
 */
export function AiFeatureCard({
  title = '按年级 + 作业内容，自动推测每项用时',
  desc,
  actions,
  compact = false,
}: {
  title?: string;
  desc?: ReactNode;
  actions?: ReactNode;
  /** 紧凑版：用在弹窗里，少一行能力清单 */
  compact?: boolean;
}) {
  return (
    <section className={compact ? 'hw-ai-hero hw-ai-hero-compact p-3' : 'hw-ai-hero p-4'}>
      <div className="relative flex flex-wrap items-center gap-2">
        <span className="hw-ai-tag">
          <Sparkles size={13} /> 本站 AI 特色
        </span>
        {!compact && <span className="hw-ai-tag-ghost">年级 + 内容 双维度</span>}
      </div>

      <p className={compact ? 'hw-ai-title mt-2 text-sm' : 'hw-ai-title mt-2 text-lg'}>{title}</p>

      {desc && <p className="hw-ai-desc mt-1">{desc}</p>}

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="hw-ai-pill"><Camera size={13} /> 拍照 / 语音记作业</span>
          <span className="hw-ai-pill"><Gauge size={13} /> 逐条推测完成用时</span>
          <span className="hw-ai-pill"><CalendarRange size={13} /> 自动均衡到每一天</span>
        </div>
      )}

      {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
    </section>
  );
}

/** 行内小徽标：用在「记作业」输入框、拍照弹窗标题旁，一眼标明这是 AI 能力 */
export function AiBadge({ children = 'AI' }: { children?: ReactNode }) {
  return <span className="hw-ai-badge"><Sparkles size={11} /> {children}</span>;
}

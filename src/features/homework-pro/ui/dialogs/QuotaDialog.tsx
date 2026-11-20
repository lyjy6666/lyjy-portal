'use client';

import { Check, Sparkles, Zap } from 'lucide-react';
import { usePro } from '../../hooks/ProContext';
import { DAILY_BUDGET, USAGE_PROMO_DETAIL } from '../../hooks/useAiUsage';
import { ProDialog } from '../common/bits';
import { BorderBeam } from '@/components/fx/Fx';

/**
 * 购买 AI 用量额度（纯展示）。
 * 价格与额度都是拟定价，支付通道暂未开放；不改变现有 DAILY_BUDGET 与任何额度计算。
 */
const FREE_FEATURES = [
  '拍照 / 语音记作业',
  'AI 批改',
  'AI 用时推测',
  'AI 智能排期',
  'AI 问答',
];

export function QuotaDialog() {
  const { dialog, closeDialog } = usePro();

  return (
    <ProDialog
      open={dialog === 'quota'}
      onOpenChange={(v) => { if (!v) closeDialog(); }}
      title="购买 AI 用量额度"
      desc="以下为拟定价，支付通道暂未开放。当前所有 AI 能力仍可免费使用。"
      className="sm:max-w-[820px]"
    >
      <div className="hw-quota-grid">
        {/* 免费版 */}
        <section className="hw-quota-card" data-current="true">
          <div className="flex items-center justify-between gap-2">
            <p className="hw-eyebrow">免费版</p>
            <span className="hw-chip" data-active="true">当前使用</span>
          </div>
          <p className="hw-quota-price">¥0</p>
          <p className="hw-label">
            模型 A {DAILY_BUDGET.A.toLocaleString()} / 模型 B {DAILY_BUDGET.B.toLocaleString()} tokens 每日
          </p>
          <p className="hw-label opacity-80">{USAGE_PROMO_DETAIL}</p>
          <ul className="hw-quota-list">
            {FREE_FEATURES.map((f) => (
              <li key={f}><Check size={12} /> {f}</li>
            ))}
          </ul>
          <button type="button" className="hw-btn mt-auto" data-variant="ghost" disabled>
            当前方案
          </button>
        </section>

        {/* Pro 版 */}
        <section className="hw-quota-card">
          <div className="flex items-center justify-between gap-2">
            <p className="hw-eyebrow">Pro 版</p>
            <Zap size={15} />
          </div>
          <p className="hw-quota-price">¥10<span className="hw-label"> / 拟定价</span></p>
          <p className="hw-label hw-num">100,000 tokens</p>
          <p className="hw-label opacity-80">一次性额度包，用完为止，不与每日额度叠加计算。</p>
          <ul className="hw-quota-list">
            <li><Check size={12} /> 免费版全部能力</li>
            <li><Check size={12} /> 额外 10 万 tokens 额度</li>
            <li><Check size={12} /> 可用于 AI 问答与深度思考</li>
          </ul>
          <button type="button" className="hw-btn mt-auto" data-variant="primary" disabled>
            暂未开放
          </button>
        </section>

        {/* Max 版：边缘流光 */}
        <section className="hw-quota-card" data-featured="true">
          <BorderBeam color="var(--primary)" duration={4} />
          <span className="hw-quota-badge"><Sparkles size={11} /> 推荐</span>
          <div className="flex items-center justify-between gap-2">
            <p className="hw-eyebrow">Max 版</p>
            <Zap size={15} />
          </div>
          <p className="hw-quota-price">¥20<span className="hw-label"> / 拟定价</span></p>
          <p className="hw-label hw-num">200,000 <span style={{ color: 'var(--primary)' }}>+ 50,000</span> tokens</p>
          <p className="hw-label opacity-80">5 万为加赠额度，合计 25 万 tokens。</p>
          <ul className="hw-quota-list">
            <li><Check size={12} /> 免费版全部能力</li>
            <li><Check size={12} /> 额外 20 万 tokens 额度</li>
            <li><Check size={12} /> 再加赠 5 万 tokens</li>
          </ul>
          <button type="button" className="hw-btn mt-auto" data-variant="primary" disabled>
            暂未开放
          </button>
        </section>
      </div>

      <p className="hw-label mt-3 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
        额度数字仅用于展示方案，本站目前没有计费、支付或额度扣除逻辑；每日用量仍是原来的估算展示。
      </p>
    </ProDialog>
  );
}

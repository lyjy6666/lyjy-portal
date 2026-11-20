'use client';

import { ProProvider, usePro } from '../../hooks/ProContext';
import { SkinProvider } from '../../skins/skin';
import { Brand } from '../layouts/parts';
import { AiBadge } from '../common/AiFeature';
import { PlannerBoard } from '../features/PlannerBoard';
import { FloatingActions } from '../layout/FloatingActions';
import { GradeGate } from '../features/GradeGate';
import { IntroDialogs } from '../dialogs/IntroDialogs';
import { ArrowLeft } from 'lucide-react';

/**
 * AI 智能排期独立页 /homework/pro/planner。
 *
 * 从弹窗搬出来后空间够用：输入、AI 估时、参数、预览可以一屏排开，
 * 不再挤在 720px 的弹窗里分两栏硬塞。
 */
export default function PlannerPage() {
  return (
    <ProProvider>
      <WithSkin />
    </ProProvider>
  );
}

function WithSkin() {
  const { user } = usePro();
  return (
    <SkinProvider uid={user?.id ?? 'guest'}>
      <Shell />
    </SkinProvider>
  );
}

function Shell() {
  return (
    <div className="relative z-[1]">
      <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-4 lg:px-8">
        <header className="hw-topbar">
          <Brand compact />
          <span className="hw-eyebrow" style={{ marginLeft: 4 }}>AI 智能排期</span>
          <AiBadge>AI 估时</AiBadge>
          <a href="/homework/pro" className="hw-btn ml-auto shrink-0">
            <ArrowLeft size={14} /> 返回工作台
          </a>
        </header>

        <div className="mt-3">
          <PlannerBoard />
        </div>
      </div>
      <FloatingActions />
      <GradeGate />
      <IntroDialogs />
    </div>
  );
}

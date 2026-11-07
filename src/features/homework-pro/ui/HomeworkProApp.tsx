'use client';

import { useEffect, useRef } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { ProProvider, usePro } from '../hooks/ProContext';
import { SkinProvider, useSkin } from '../skins/skin';
import { useTour } from '../hooks/useTour';
import { useNotifications } from '../hooks/useNotifications';
import { LayoutA, LayoutB } from './layouts/Layouts';
import { TaskDetail } from './task/TaskDetail';
import { SelectionBar } from './task/SelectionBar';
import { AIGraderDialog } from './dialogs/AIGraderDialog';
import { ProfileDialog } from './dialogs/ProfileDialog';
import { IntroDialogs } from './dialogs/IntroDialogs';
import { BasicDialogs } from './dialogs/BasicDialogs';
import { TourOverlay } from './dialogs/TourOverlay';
import { SmartCapture } from './features/SmartCapture';
import { FocusTimer } from './features/FocusTimer';
import { FloatingActions } from './layout/FloatingActions';
import { GradeGate } from './features/GradeGate';
import { IntroSplash } from './layout/IntroSplash';
import type { ViewMode } from '../core/types';

export default function HomeworkProApp() {
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
      <MotionConfig reducedMotion="user">
        {/* 开屏层与 Shell 同级：不落在 framer-motion 的 transform 容器里，fixed 才能真正全屏 */}
        <IntroSplash />
        <Shell />
      </MotionConfig>
    </SkinProvider>
  );
}

const DEFAULT_VIEW: Record<string, ViewMode> = { A: 'list', B: 'list' };

function Shell() {
  const pro = usePro();
  const { motion: motionEnabled } = useSkin();
  const uid = pro.user?.id ?? 'guest';
  const searchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tour = useTour(uid);
  const lastLayout = useRef(pro.layout);

  useEffect(() => {
    if (lastLayout.current !== pro.layout) {
      lastLayout.current = pro.layout;
      pro.setView(DEFAULT_VIEW[pro.layout] ?? 'list');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pro.layout]);

  useNotifications(pro.tasks, uid, pro.settings);

  const tourVisible = (tour.open && Boolean(pro.user?.token)) || pro.dialog === 'tour';
  const props = { searchRef, inputRef };

  return (
    // SkinProvider 已渲染唯一一层 .hw-root；再套一层会让纹理/渐变画两遍
    <div className="relative z-[1]">
      <motion.div
        key={pro.layout}
        initial={motionEnabled ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-[1]"
      >
        {pro.layout === 'A' && <LayoutA {...props} />}
        {pro.layout === 'B' && <LayoutB {...props} />}
      </motion.div>

      <SelectionBar />
      <FocusTimer />
      <FloatingActions />

      <TaskDetail />
      <SmartCapture />
      <AIGraderDialog />
      <ProfileDialog />
      <IntroDialogs />
      <BasicDialogs />
      <GradeGate />
      <TourOverlay
        open={tourVisible}
        onFinish={(completed) => { tour.finish(completed); pro.closeDialog(); }}
      />
    </div>
  );
}

'use client';

import type { RefObject } from 'react';
import { QuickAddBar } from '../task/QuickAddBar';
import {
  TopBar, MainNav, ViewHeading,
  GlancePanel, ToolDock, ContentRouter, Footer,
} from './parts';
import { AIAskDock } from '../features/AIAsk';

type LayoutProps = {
  searchRef: RefObject<HTMLInputElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

/** 两套布局共用同一套骨架，差异只在导航位置、内容宽度与右侧速览栏 */
function Content({ inputRef }: { inputRef: RefObject<HTMLTextAreaElement | null> }) {
  return (
    <>
      <ViewHeading />
      <QuickAddBar inputRef={inputRef} />
      <ContentRouter />
    </>
  );
}

/* ============================================================ B 速览 · 双栏 */
export function LayoutB({ searchRef, inputRef }: LayoutProps) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 lg:px-8">
      <TopBar searchRef={searchRef} />
      <div className="pb-10 pt-5">
        <MainNav />
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(260px,1fr)]">
          {/* 窄屏下把工具区提到正文上方（顶栏已有「记作业」主按钮），
              速览卡只在桌面右栏出现，免得手机上把输入框压到屏幕外 */}
          <aside className="order-1 min-w-0 space-y-4 lg:order-2">
            <div className="hidden lg:block"><GlancePanel /></div>
            <ToolDock />
            <AIAskDock />
          </aside>
          <div className="order-2 min-w-0 lg:order-1"><Content inputRef={inputRef} /></div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

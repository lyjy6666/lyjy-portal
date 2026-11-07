'use client';

import type { RefObject } from 'react';
import { QuickAddBar } from '../task/QuickAddBar';
import {
  Brand, TopBar, MainNav, ViewHeading, ToolMenu, StatusLine,
  GlancePanel, ToolDock, ContentRouter, Footer,
} from './parts';
import { LayoutPicker } from './LayoutPicker';

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

/* ============================================================ A 侧栏 · 工作台 */
export function LayoutA({ searchRef, inputRef }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside
        className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-3 overflow-y-auto border-r p-3 hw-scroll md:flex"
        style={{ borderColor: 'var(--hw-rule)' }}
      >
        <Brand compact />
        <div className="hw-hr" />
        <p className="hw-eyebrow">视图</p>
        <MainNav vertical />
        <ToolDock vertical />
        <div className="mt-auto space-y-2 pt-4">
          <StatusLine />
          <LayoutPicker />
          {/* 「前往原版」「退出登录」已经在 ToolMenu 里，这里不再重复放一份 */}
          <ToolMenu vertical />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 lg:px-8">
        <TopBar searchRef={searchRef} minimal showBrand={false} />
        <div className="hw-shell max-w-[1080px] pb-10 pt-5">
          <div className="mb-4 md:hidden"><MainNav /></div>
          {/* 侧栏在窄屏隐藏，工具区移到正文上方，否则手机上摸不到智能排期 / AI 批改 */}
          <div className="mb-4 md:hidden"><ToolDock /></div>
          <Content inputRef={inputRef} />
          <Footer />
        </div>
      </main>
    </div>
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
          </aside>
          <div className="order-2 min-w-0 lg:order-1"><Content inputRef={inputRef} /></div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

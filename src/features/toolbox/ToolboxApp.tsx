'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SkinProvider, useSkin, SKIN_META, SKIN_ORDER, type SkinId } from './skins/skin';
import { fontClassNames } from './skins/fonts';

export type ToolTab = {
  id: string;
  name: string;
  icon: string;
  desc: string;
};

export const TABS: ToolTab[] = [
  { id: 'image', name: '图片', icon: 'fa-image', desc: '格式互转、缩放、旋转、批量、压缩' },
  { id: 'document', name: '文档', icon: 'fa-file-lines', desc: '图片/文本/表格转 PDF、PDF 处理、OCR' },
  { id: 'data', name: '文本数据', icon: 'fa-table', desc: 'JSON / YAML / TOML / XML / CSV 互转' },
  { id: 'code', name: '代码', icon: 'fa-code', desc: '格式化与安全压缩' },
  { id: 'media', name: '音视频', icon: 'fa-film', desc: '真实转码、提取音频、裁剪、抽帧' },
  { id: 'compress', name: '压缩', icon: 'fa-file-zipper', desc: '图片压缩、ZIP 打包' },
  { id: 'watermark', name: '水印', icon: 'fa-droplet', desc: '加文字/图片水印，区域遮挡' },
  { id: 'dev', name: '开发工具', icon: 'fa-screwdriver-wrench', desc: '哈希、颜色、二维码、条码、时间戳…' },
  { id: 'about', name: '说明', icon: 'fa-circle-info', desc: '能力边界与已知限制' },
];

/* ============================ 皮肤选择器 ============================ */

function SkinPicker() {
  const { skin, setSkin } = useSkin();
  const [open, setOpen] = useState(false);
  const meta = SKIN_META[skin];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tb-btn"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {/* 用三个代表色做预览 */}
        <span className="flex overflow-hidden" style={{ borderRadius: 2 }}>
          {meta.swatch.map((c) => (
            <span key={c} style={{ background: c, width: 7, height: 14 }} />
          ))}
        </span>
        <span className="hidden sm:inline">{meta.name}</span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-[10px] opacity-60`} />
      </button>

      {open && (
        <>
          {/* 点击遮罩关闭 */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="tb-panel absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] p-2"
            style={{ boxShadow: 'var(--tb-shadow)' }}
          >
            <p className="tb-label px-2 py-1.5">选择外观 · {SKIN_ORDER.length} 种</p>
            <div className="max-h-[60vh] overflow-y-auto">
              {SKIN_ORDER.map((id) => {
                const m = SKIN_META[id];
                const active = id === skin;
                return (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setSkin(id);
                      setOpen(false);
                    }}
                    className="flex w-full items-start gap-3 px-2 py-2.5 text-left transition-colors"
                    style={{
                      background: active ? 'var(--accent)' : 'transparent',
                      borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                    }}
                  >
                    <span className="mt-0.5 flex shrink-0 overflow-hidden" style={{ borderRadius: 2 }}>
                      {m.swatch.map((c) => (
                        <span key={c} style={{ background: c, width: 9, height: 18 }} />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold">{m.name}</span>
                        <span
                          className="rounded-sm px-1 py-px text-[10px]"
                          style={{
                            background: 'var(--muted)',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          {m.tone === 'dark' ? '深色' : '浅色'}
                        </span>
                      </span>
                      <span
                        className="mt-0.5 block text-[11px] leading-snug"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {m.desc}
                      </span>
                    </span>
                    {active && (
                      <i
                        className="fa-solid fa-check mt-1 shrink-0 text-[11px]"
                        style={{ color: 'var(--primary)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================ 标签内容（P2~P6 分批接入） ============================ */

function TabContent({ tab }: { tab: string }) {
  const meta = TABS.find((t) => t.id === tab);
  return (
    <div className="tb-panel flex flex-col items-center justify-center py-16 text-center">
      <i
        className={`fa-solid ${meta?.icon ?? 'fa-cube'} mb-4 text-3xl`}
        style={{ color: 'var(--primary)' }}
      />
      <p className="tb-title text-base">{meta?.name} · 施工中</p>
      <p className="mt-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {meta?.desc}
      </p>
    </div>
  );
}

/* ============================ 外壳 ============================ */

function Shell() {
  const { skin } = useSkin();
  const [tab, setTab] = useState('image');
  const meta = SKIN_META[skin];
  const current = TABS.find((t) => t.id === tab);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center"
            style={{
              background: 'var(--primary)',
              borderRadius: 'var(--tb-panel-radius)',
            }}
          >
            <i className="fa-solid fa-atom" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <div>
            <h1 className="tb-title text-[17px] leading-tight">格式转换工具箱</h1>
            <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              全部处理在浏览器本地完成 · 文件不上传
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SkinPicker />
          <Link href="/toolbox" className="tb-btn" title="回到旧版工具箱对照">
            <i className="fa-solid fa-clock-rotate-left text-[11px]" />
            <span className="hidden sm:inline">旧版</span>
          </Link>
          <Link
            href="/"
            className="tb-btn"
            title="返回导航首页"
            style={{ padding: '0.5rem 0.65rem' }}
          >
            <i className="fa-solid fa-house text-[11px]" />
          </Link>
        </div>
      </header>

      {/* 标签栏 */}
      <nav className="mb-6 flex flex-wrap gap-x-1 gap-y-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`tb-tab ${t.id === tab ? 'tb-tab-active' : ''}`}
          >
            <i className={`fa-solid ${t.icon} text-[11px]`} />
            {t.name}
          </button>
        ))}
      </nav>

      <main className="flex-1">
        {/* 当前工具的标题区，让每个标签有明确的落点 */}
        <div className="mb-4">
          <h2 className="tb-title text-xl">{current?.name}</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {current?.desc}
          </p>
        </div>
        <TabContent tab={tab} />
      </main>

      <footer className="mt-10 pb-2">
        <hr className="tb-hr mb-4" />
        <div
          className="flex flex-wrap items-center justify-between gap-2 text-[11px]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <span>所有转换均在本地浏览器完成，文件不会上传服务器</span>
          <span>
            {meta.name} · {meta.tone === 'dark' ? '深色' : '浅色'}主题
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function ToolboxApp() {
  return (
    <div className={fontClassNames}>
      <SkinProvider>
        <Shell />
      </SkinProvider>
    </div>
  );
}

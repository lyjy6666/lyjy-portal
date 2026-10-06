'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SkinProvider, useSkin, SKIN_META, type SkinId } from './skins/skin';

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

/** 皮肤切换器 —— 只有 B/C 两版，功能完全相同 */
function SkinSwitcher() {
  const { skin, setSkin } = useSkin();

  return (
    <div
      className="flex items-center gap-1 rounded-md border p-1"
      style={{ borderColor: 'var(--border)', background: 'var(--tb-panel)' }}
    >
      {(Object.keys(SKIN_META) as SkinId[]).map((id) => {
        const m = SKIN_META[id];
        const active = skin === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setSkin(id)}
            title={`${m.name} · ${m.desc}`}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-all"
            style={{
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              boxShadow: active ? 'var(--tb-glow)' : 'none',
            }}
          >
            <i className={`fa-solid ${m.icon}`} />
            <span className="hidden sm:inline">{m.short}</span>
            <span className="sm:hidden">{id.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

/** 每个 Tab 的内容由这里分发；P2~P6 分批接入真实工具 */
function TabContent({ tab }: { tab: string }) {
  const meta = TABS.find((t) => t.id === tab);
  return (
    <div className="tb-panel p-8 text-center">
      <i
        className={`fa-solid ${meta?.icon ?? 'fa-cube'} mb-3 text-3xl`}
        style={{ color: 'var(--primary)' }}
      />
      <p className="text-sm">{meta?.name} · 施工中</p>
      <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {meta?.desc}
      </p>
    </div>
  );
}

function Shell() {
  const { skin } = useSkin();
  const [tab, setTab] = useState('image');
  const meta = SKIN_META[skin];

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
      {/* 顶栏 */}
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-md"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--tb-accent-2))',
              boxShadow: 'var(--tb-glow)',
            }}
          >
            <i className="fa-solid fa-atom text-lg" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <div>
            <h1 className="tb-title text-lg font-bold">格式转换工具箱</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {meta.name} · 全部处理在你的浏览器本地完成
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SkinSwitcher />
          <Link
            href="/toolbox"
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            title="回到旧版工具箱对照"
          >
            <i className="fa-solid fa-clock-rotate-left" />
            <span className="hidden sm:inline">旧版</span>
          </Link>
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-md border"
            style={{ borderColor: 'var(--border)' }}
            title="返回导航首页"
          >
            <i className="fa-solid fa-house text-xs" />
          </Link>
        </div>
      </header>

      {/* 标签栏 */}
      <nav className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs transition-all"
              style={{
                borderColor: active ? 'var(--primary)' : 'var(--border)',
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: active ? 'var(--tb-glow)' : 'none',
              }}
            >
              <i className={`fa-solid ${t.icon}`} />
              {t.name}
            </button>
          );
        })}
      </nav>

      {/* 内容 */}
      <main className="flex-1">
        <TabContent tab={tab} />
      </main>

      {/* 页脚 */}
      <footer className="mt-8 text-center text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
        <hr className="tb-hr mb-4" />
        所有转换均在本地浏览器完成，文件不会上传服务器 · 当前皮肤：{meta.name}
      </footer>
    </div>
  );
}

export default function ToolboxApp() {
  return (
    <SkinProvider>
      <Shell />
    </SkinProvider>
  );
}

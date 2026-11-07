'use client';

import { useState } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { usePro } from '../../hooks/ProContext';
import { useSkin } from '../../skins/skin';
import { ProDialog } from '../common/bits';
import { THEME_META, THEME_ORDER, LAYOUT_META, LAYOUT_ORDER, type LayoutId } from '../../skins/theme';
import type { SkinId } from '../../core/types';

/** 2 种布局 × 3 套主题，点击即时切换，顶栏常驻显示当前组合 */
export function LayoutPicker() {
  const { layout, setLayout } = usePro();
  const { skin, setSkin } = useSkin();
  const [open, setOpen] = useState(false);
  const theme = THEME_META[skin];
  const currentLayout = LAYOUT_META[layout];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="hw-btn shrink-0"
        title={`当前：布局${currentLayout.index} ${currentLayout.name} · 主题${theme.index} ${theme.name}`}
        style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
        <SlidersHorizontal size={15} />
        <span className="hw-num">{currentLayout.index} · {theme.index}</span>
      </button>

      <ProDialog open={open} onOpenChange={setOpen} title="外观设置"
        desc="布局 ①② 与主题 ①②③，编号即当前排列顺序，点击即时生效。" className="sm:max-w-[720px]">
        <div className="space-y-5">
          <section>
            <p className="hw-eyebrow">布局</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {LAYOUT_ORDER.map((id: LayoutId) => {
                const meta = LAYOUT_META[id];
                const active = layout === id;
                return (
                  <button key={id} type="button" onClick={() => setLayout(id)}
                    className="hw-panel p-3 text-left"
                    style={active ? { borderColor: 'var(--primary)', borderWidth: 2 } : undefined}>
                    <div className="flex items-center gap-2">
                      <span className="hw-display hw-num text-xl">{meta.index}</span>
                      <span className="hw-title text-sm">{meta.name}</span>
                      {active && <Check size={14} className="ml-auto" style={{ color: 'var(--primary)' }} />}
                    </div>
                    <p className="hw-label mt-1">{meta.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="hw-eyebrow">视觉主题</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {THEME_ORDER.map((id: SkinId) => {
                const meta = THEME_META[id];
                const active = skin === id;
                return (
                  <button key={id} type="button" onClick={() => setSkin(id)}
                    className="hw-panel p-3 text-left"
                    style={active ? { borderColor: 'var(--primary)', borderWidth: 2 } : undefined}>
                    <div className="flex items-center gap-2">
                      <span className="hw-title text-lg">{meta.index}</span>
                      <span className="hw-title text-sm">{meta.name}</span>
                      {active && <Check size={14} className="ml-auto" style={{ color: 'var(--primary)' }} />}
                    </div>
                    <div className="mt-2 flex gap-1">
                      {meta.swatch.map((c) => (
                        <span key={c} className="h-5 flex-1 rounded" style={{ background: c }} />
                      ))}
                    </div>
                    <p className="hw-label mt-2">{meta.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <p className="hw-label border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
            当前：布局 <span className="hw-num hw-title">{currentLayout.index} {currentLayout.name}</span>
            {' · '}主题 <span className="hw-num hw-title">{theme.index} {theme.name}</span>
          </p>
        </div>
      </ProDialog>
    </>
  );
}

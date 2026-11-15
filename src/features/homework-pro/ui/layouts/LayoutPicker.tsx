'use client';

import { useState } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { useSkin } from '../../skins/skin';
import { ProDialog } from '../common/bits';
import { THEME_META, THEME_ORDER } from '../../skins/theme';
import type { SkinId } from '../../core/types';

/** 单一双栏布局 × 4 套视觉主题，点击即时切换 */
export function LayoutPicker() {
  const { skin, setSkin } = useSkin();
  const [open, setOpen] = useState(false);
  const theme = THEME_META[skin];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="hw-btn shrink-0"
        title={`当前：速览 · 双栏 · 主题${theme.index} ${theme.name}`}
        style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
        <SlidersHorizontal size={15} />
        <span className="hw-num">{theme.index}</span>
      </button>

      <ProDialog open={open} onOpenChange={setOpen} title="外观设置"
        desc="速览 · 双栏布局，搭配 ①②③④ 四套视觉主题，点击即时生效。" className="sm:max-w-[720px]">
        <div className="space-y-5">
          <section>
            <p className="hw-eyebrow">视觉主题</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
            当前：布局 <span className="hw-num hw-title">① 速览 · 双栏</span>
            {' · '}主题 <span className="hw-num hw-title">{theme.index} {theme.name}</span>
          </p>
        </div>
      </ProDialog>
    </>
  );
}

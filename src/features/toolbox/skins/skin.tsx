'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';

/**
 * 皮肤上下文。
 *
 * 只承载 CSS 变量表达不了的东西（当前皮肤 id、动效强度）。
 * 颜色/字体/边框/阴影/圆角全部走 skins/tokens.css 里的 CSS 变量 ——
 * 组件树只有一份，换肤不产生第二套 UI。
 *
 * 每个皮肤是一套**不同的设计语言**（字体、形态、空间节奏都不同），
 * 不只是换颜色。
 */

export type SkinId = 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type SkinMeta = {
  name: string;
  short: string;
  desc: string;
  /** 预览用：三个代表色 */
  swatch: [string, string, string];
  /** 明暗，用于列表分组 */
  tone: 'dark' | 'light';
};

export const SKIN_META: Record<SkinId, SkinMeta> = {
  b: {
    name: 'HUD 控制台',
    short: '深色科幻',
    desc: '深空底 + 青色霓虹 + 玻璃面板。早期版本，保留对照',
    swatch: ['#060a12', '#22d3ee', '#8b5cf6'],
    tone: 'dark',
  },
  c: {
    name: '星舰控制台',
    short: '重度科幻',
    desc: '在 HUD 基础上加网格背景、扫描线、切角面板。早期版本',
    swatch: ['#03060d', '#00e5ff', '#ff2d95'],
    tone: 'dark',
  },
  d: {
    name: '瑞士精密',
    short: '瑞士精密',
    desc: '冷白纸面、严格网格、发丝分隔线、零阴影，全界面只用一种信号红',
    swatch: ['#f7f7f5', '#141414', '#e5352b'],
    tone: 'light',
  },
  e: {
    name: '编辑部',
    short: '编辑排版',
    desc: '奶油纸底、大号衬线标题、首字下沉、发丝分隔，像一本印刷物',
    swatch: ['#fbf8f1', '#1a1714', '#b3341a'],
    tone: 'light',
  },
  f: {
    name: '新粗野',
    short: '新粗野主义',
    desc: '3px 纯黑描边、硬偏移阴影、酸性黄配电蓝，按键按下去会真的位移',
    swatch: ['#fffdf5', '#0037ff', '#ffe600'],
    tone: 'light',
  },
  g: {
    name: '有机纸感',
    short: '有机自然',
    desc: '暖纸底、纸纹噪点、四角不等的圆角、陶土橙与鼠尾草绿',
    swatch: ['#f3ede3', '#b5623a', '#7d8f69'],
    tone: 'light',
  },
  h: {
    name: '工程蓝图',
    short: '技术制图',
    desc: '图纸深蓝、制图网格、虚线标注、编号角标，像一张机械图纸',
    swatch: ['#0b2545', '#ffd166', '#8fd3ff'],
    tone: 'dark',
  },
};

export const SKIN_ORDER: SkinId[] = ['d', 'e', 'f', 'g', 'h', 'b', 'c'];

const STORAGE_KEY = 'toolbox_skin';

type SkinContextValue = {
  skin: SkinId;
  setSkin: (s: SkinId) => void;
  motion: boolean;
};

const SkinContext = createContext<SkinContextValue>({
  skin: 'd',
  setSkin: () => {},
  motion: true,
});

export function useSkin() {
  return useContext(SkinContext);
}

export function SkinProvider({
  children,
  initial = 'd',
}: {
  children: ReactNode;
  initial?: SkinId;
}) {
  const [skin, setSkinState] = useState<SkinId>(initial);
  const [motion, setMotion] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in SKIN_META) setSkinState(saved as SkinId);
    } catch {
      /* 忽略 */
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMotion(!mq.matches);
    const onChange = () => setMotion(!mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setSkin = useCallback((s: SkinId) => {
    setSkinState(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* 忽略 */
    }
  }, []);

  return (
    <SkinContext.Provider value={{ skin, setSkin, motion }}>
      <div
        data-skin={skin}
        className="relative min-h-screen overflow-x-hidden"
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div className="relative z-[2]">{children}</div>
      </div>
    </SkinContext.Provider>
  );
}

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

export type SkinId = 'i' | 'g' | 'm' | 'k' | 'c' | 'n' | 'o';

export type SkinMeta = {
  name: string;
  short: string;
  desc: string;
  /** 预览用：三个代表色 */
  swatch: [string, string, string];
  /** 明暗，用于列表分组 */
  tone: 'dark' | 'light';
  /** 分组标题 */
  group: string;
};

export const SKIN_META: Record<SkinId, SkinMeta> = {
  i: {
    name: '柔光极光',
    short: '粉紫渐变',
    desc: '粉紫到薄荷的多层柔和渐变底 + 毛玻璃卡片，原版语言的精修版',
    swatch: ['#e9d5ff', '#db2777', '#f59e0b'],
    tone: 'light',
    group: '渐变家族',
  },
  g: {
    name: '有机纸感',
    short: '暖橙手作',
    desc: '暖橙纸面、纸纹噪点、四角不等的圆角，标题用衬线体',
    swatch: ['#fdf4e7', '#d97706', '#a16207'],
    tone: 'light',
    group: '渐变家族',
  },
  m: {
    name: '暮色渐变',
    short: '深色渐变',
    desc: '深靛蓝到紫罗兰的暮色渐变，同族的深色版，不是霓虹黑',
    swatch: ['#8b5cf6', '#f0abfc', '#7dd3fc'],
    tone: 'dark',
    group: '渐变家族',
  },
  k: {
    name: '薄荷汽水',
    short: '清爽渐变',
    desc: '薄荷绿到天蓝的冷色渐变，干净通透，看久了不累',
    swatch: ['#99f6e4', '#0d9488', '#0ea5e9'],
    tone: 'light',
    group: '渐变家族',
  },
  c: {
    name: '星舰控制台',
    short: '深色科幻',
    desc: '深空底、网格背景、切角面板。早期版本，保留对照',
    swatch: ['#03060d', '#00e5ff', '#ff2d95'],
    tone: 'dark',
    group: '早期版本',
  },
  n: {
    name: '柔和马赛克',
    short: '粉彩拼贴',
    desc: '浅灰底、无边框、大圆角、极淡柔光阴影，靠粉彩色域分层',
    swatch: ['#f0f0f0', '#ffffff', '#3f6b3a'],
    tone: 'light',
    group: '新学三版',
  },
  o: {
    name: '液态玻璃',
    short: '磨砂玻璃',
    desc: '深青大气背景 + 半透明磨砂面板，白字，层次靠模糊与高光',
    swatch: ['#0e2a33', '#ffffff', '#7dd3c0'],
    tone: 'dark',
    group: '新学三版',
  },
};

export const SKIN_ORDER: SkinId[] = ['i', 'g', 'm', 'k', 'n', 'o', 'c'];

const STORAGE_KEY = 'toolbox_skin';

type SkinContextValue = {
  skin: SkinId;
  setSkin: (s: SkinId) => void;
  motion: boolean;
};

const SkinContext = createContext<SkinContextValue>({
  skin: 'i',
  setSkin: () => {},
  motion: true,
});

export function useSkin() {
  return useContext(SkinContext);
}

export function SkinProvider({
  children,
  initial = 'i',
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
        // 只设颜色，**不要用 background 简写** —— 简写会把 background-image 重置为 none，
        // 那样 CSS 里定义的渐变底就全被盖掉了
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div className="relative z-[2]">{children}</div>
      </div>
    </SkinContext.Provider>
  );
}

'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';

/**
 * 皮肤上下文。
 *
 * 只承载 CSS 变量表达不了的东西（当前皮肤 id、装饰层开关、动效强度）。
 * 颜色/圆角/阴影/辉光全部走 skins/tokens.css 里的 CSS 变量 ——
 * 组件树只有一份，换肤不产生第二套 UI。
 */

export type SkinId = 'b' | 'c';

export const SKIN_META: Record<SkinId, { name: string; short: string; desc: string; icon: string }> = {
  b: {
    name: 'HUD 控制台',
    short: '中度科幻',
    desc: '深空底色、青紫霓虹描边、玻璃面板与柔光晕，克制耐看',
    icon: 'fa-satellite-dish',
  },
  c: {
    name: '星舰控制台',
    short: '重度科幻',
    desc: '在 HUD 基础上加动态网格、扫描线、切角面板与更强辉光',
    icon: 'fa-rocket',
  },
};

const STORAGE_KEY = 'toolbox_skin';

type SkinContextValue = {
  skin: SkinId;
  setSkin: (s: SkinId) => void;
  /** 是否开启动效（尊重系统「减少动态效果」偏好） */
  motion: boolean;
};

const SkinContext = createContext<SkinContextValue>({
  skin: 'b',
  setSkin: () => {},
  motion: true,
});

export function useSkin() {
  return useContext(SkinContext);
}

export function SkinProvider({
  children,
  initial = 'b',
}: {
  children: ReactNode;
  initial?: SkinId;
}) {
  const [skin, setSkinState] = useState<SkinId>(initial);
  const [motion, setMotion] = useState(true);

  // 记忆上次选择 + 读取系统的减少动效偏好
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'b' || saved === 'c') setSkinState(saved);
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
        {/* 内容要压在装饰层之上（C 的网格/扫描线是 fixed 伪元素，z-index 0/1） */}
        <div className="relative z-[2]">{children}</div>
      </div>
    </SkinContext.Provider>
  );
}

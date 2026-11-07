'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * V7.0 preview「尝鲜通道」。
 *
 * 默认进站一律是 V6.5 界面（首屏 SSR 也是 V6.5，不会 hydration 不一致）；
 * 只有用户在更新记录里点了「尝鲜」才写入本地，之后每次进站都直接是 V7.0。
 */
export const PREVIEW_OPT_IN_KEY = 'lyjy_v7_preview_opt_in';

type PreviewValue = {
  isPreview: boolean;
  optIn: () => void;
  /** 退出尝鲜，回到 V6.5 界面 */
  optOut: () => void;
};

const PreviewContext = createContext<PreviewValue>({
  isPreview: false,
  optIn: () => undefined,
  optOut: () => undefined,
});

export function PreviewProvider({ children }: { children: ReactNode }) {
  // 首帧固定 false，读 localStorage 放到 effect 里，避免 SSR / hydration 文本不一致
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    try {
      setIsPreview(localStorage.getItem(PREVIEW_OPT_IN_KEY) === '1');
    } catch {
      /* 隐私模式下 localStorage 不可用，保持 V6.5 */
    }
  }, []);

  const optIn = useCallback(() => {
    try {
      localStorage.setItem(PREVIEW_OPT_IN_KEY, '1');
    } catch {
      /* 忽略：本次会话仍可切换 */
    }
    setIsPreview(true);
  }, []);

  const optOut = useCallback(() => {
    try {
      localStorage.removeItem(PREVIEW_OPT_IN_KEY);
    } catch {
      /* 忽略：本次会话仍可切换 */
    }
    setIsPreview(false);
  }, []);

  return <PreviewContext.Provider value={{ isPreview, optIn, optOut }}>{children}</PreviewContext.Provider>;
}

export function usePreview(): PreviewValue {
  return useContext(PreviewContext);
}

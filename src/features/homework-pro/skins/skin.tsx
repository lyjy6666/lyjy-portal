'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import type { SkinId } from '../core/types';
import { readScoped, writeScoped, KEYS } from '../core/storage';
import { SKIN_FONTS } from './fonts';
import { SKIN_META } from './theme';

// 统一再导出，供方案选择器与设置面板引用
export { SKIN_META, SKIN_ORDER, THEME_META, THEME_ORDER, LAYOUT_META, LAYOUT_ORDER } from './theme';
export type { ThemeId, LayoutId } from './theme';

/**
 * 主题上下文。
 *
 * 3 套皮肤是 3 种**设计语言**（字体、形态、空间节奏、装饰语言都不同），
 * 全部由 skins/tokens.css 的 CSS 变量 + pro.css 的主题专属类驱动。
 *
 * 作用域隔离：只写 [data-theme] / [data-theme='x']，绝不写 :root/body/*。
 * globals.css 的 @theme inline 用 var(--background) 引用而非拷贝，
 * 覆盖同名变量即可让 Tailwind 工具类在子树内生效，其它页面零影响。
 * ProPortalHost 挂在 body 上也带 data-theme，弹层变量不会丢。
 */

type SkinValue = {
  skin: SkinId;
  setSkin: (s: SkinId) => void;
  motion: boolean;
  /** Radix Portal 容器（挂在 body 上、自带 data-theme） */
  portalEl: HTMLElement | null;
};

const SkinContext = createContext<SkinValue>({
  skin: 'clarity', setSkin: () => {}, motion: true, portalEl: null,
});

export function useSkin(): SkinValue { return useContext(SkinContext); }
export const useTheme = useSkin;

export function SkinProvider({ children, uid }: { children: ReactNode; uid: number | string }) {
  const [skin, setSkinState] = useState<SkinId>('journal');
  const [motion, setMotion] = useState(true);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // 已下线的旧主题读到后统一落回默认主题
    const saved = readScoped<SkinId>(uid, KEYS.skin, 'journal');
    let next: SkinId = saved in SKIN_META ? saved : 'journal';
    if (!(saved in SKIN_META)) writeScoped(uid, KEYS.skin, next);
    // 一次性重置到新默认主题（① 手账纸感）：用户要求默认换成这一套。
    // skinV2 是上一轮重置用过的标志，老账号已经写过，所以这里必须用 skinV3。
    if (!readScoped<boolean>(uid, 'skinV3', false)) {
      next = 'journal';
      writeScoped(uid, 'skinV3', true);
      writeScoped(uid, KEYS.skin, 'journal');
    }
    setSkinState(next);
  }, [uid]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setMotion(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // ProPortalHost：Radix 弹层默认挂 document.body，会脱离 [data-theme] 子树丢变量
  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-hw-portal', '');
    el.className = SKIN_FONTS.portalClass;
    document.body.appendChild(el);
    setPortalEl(el);
    return () => { el.remove(); };
  }, []);

  useEffect(() => {
    portalEl?.setAttribute('data-theme', skin);
  }, [portalEl, skin]);

  const setSkin = useCallback((next: SkinId) => {
    setSkinState(next);
    writeScoped(uid, KEYS.skin, next);
  }, [uid]);

  const value = useMemo<SkinValue>(
    () => ({ skin, setSkin, motion, portalEl }),
    [skin, setSkin, motion, portalEl],
  );

  return (
    <SkinContext.Provider value={value}>
      <div
        data-theme={skin}
        className={`hw-root ${SKIN_FONTS.portalClass}`}
        // 只设颜色；用 background 简写会把主题渐变重置掉
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        {children}
      </div>
    </SkinContext.Provider>
  );
}

/** 传给 shadcn 弹层组件的 portalContainer */
export function usePortalContainer(): HTMLElement | null {
  return useSkin().portalEl;
}

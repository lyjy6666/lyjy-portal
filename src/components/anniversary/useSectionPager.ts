'use client';

import { useEffect, type RefObject } from 'react';

/**
 * 累积式整屏滚动（星图用）
 *
 * 手感来自产品下载页的 ScrollPager：
 *   · 滚轮多转几下才动一段（攒够阈值），不是一滑就跳
 *   · 滚动后有一段冷却，避免连跳
 *   · 触控板/触摸不硬拦，窄屏与「减少动效」直接不启用
 *
 * 与产品页的区别：这里作用于一个内部滚动容器（.scroller），
 * 而不是整页；所以用 ref 传入，并按容器内的 section 计算落点。
 */

/** 累积到多少才滚一段。鼠标滚轮一格约 100，即 2~3 格 */
const THRESHOLD = 240;
/** 一次滚动后的冷却 */
const COOLDOWN = 640;

export function useSectionPager(
  containerRef: RefObject<HTMLElement | null>,
  sectionSelector = ':scope > section',
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 窄屏 / 矮屏 / 减少动效：交回原生滚动
    const mq = window.matchMedia('(max-width: 860px), (max-height: 620px), (prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const sections = () => Array.from(el.querySelectorAll<HTMLElement>(sectionSelector));
    const tops = () => sections().map((s) => Math.max(0, s.offsetTop));

    let acc = 0;
    let locked = false;
    let resetTimer = 0;

    /** 光标下是否有可滚动子元素（长列表等）：有就放行 */
    const insideScrollable = (target: EventTarget | null): boolean => {
      let node = target as HTMLElement | null;
      while (node && node !== el) {
        const cs = getComputedStyle(node);
        if (/(auto|scroll)/.test(cs.overflowY) && node.scrollHeight > node.clientHeight + 4) return true;
        node = node.parentElement;
      }
      return false;
    };

    /** 滚到的那一屏直接点亮，不依赖 IO 是否及时回调 */
    const light = (top: number) => {
      const target = sections().find((s) => Math.abs(s.offsetTop - top) < 6);
      if (!target) return;
      target.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    };

    const goto = (dir: 1 | -1) => {
      const list = tops();
      if (!list.length) return;
      const cur = el.scrollTop;

      let next: number;
      if (dir > 0) {
        next = list.find((t) => t > cur + 8) ?? list[list.length - 1];
      } else {
        const before = [...list].reverse().find((t) => t < cur - 8);
        next = before ?? 0;
      }

      locked = true;
      el.scrollTo({ top: next, behavior: 'smooth' });
      light(next);
      window.setTimeout(() => light(next), 380);
      light(next);
      window.setTimeout(() => light(next), 380);
      window.setTimeout(() => {
        locked = false;
      }, COOLDOWN);
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (insideScrollable(e.target)) return;

      const atTop = el.scrollTop <= 0 && e.deltaY < 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2 && e.deltaY > 0;
      if (atTop || atBottom) return;

      // 关键：拦下原生滚动，攒够阈值才走
      e.preventDefault();

      if (locked) {
        acc = 0;
        return;
      }

      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      acc += e.deltaY * unit;

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        acc = 0;
      }, 320);

      if (Math.abs(acc) >= THRESHOLD) {
        const dir: 1 | -1 = acc > 0 ? 1 : -1;
        acc = 0;
        goto(dir);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!['PageDown', 'ArrowDown', 'PageUp', 'ArrowUp', ' ', 'Home', 'End'].includes(e.key)) return;

      if (e.key === 'Home') {
        e.preventDefault();
        el.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        return;
      }
      e.preventDefault();
      if (locked) return;
      goto(e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === ' ' ? 1 : -1);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(resetTimer);
    };
  }, [containerRef, sectionSelector]);
}

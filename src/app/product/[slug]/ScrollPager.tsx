'use client';

import { useEffect } from 'react';

/**
 * 累积式整段滚动（产品页专用）
 *
 * 用户要的手感：
 *   · **滚轮多转几下才动** —— 转一下就滚一大屏太突兀
 *   · **每段距离要短** —— 一下滑老远会晕
 *
 * CSS 的 scroll-snap 做不到这两点（它是一滑就跳、且跳距 = 区块高）。
 * 所以这里拦截 wheel 事件自己累积：攒够阈值才滚到下一段，并把每段的高度
 * 压到内容自然高度（见 product-themes.css），跳距自然就短了。
 *
 * 刻意不做的事：
 *   · 不劫持触控板/触摸（它们的 deltaY 特征不同，硬拦会很难受）
 *   · 不劫持页面内可滚动子元素（代码块、长列表要能自己滚）
 *   · 屏幕矮 / 窄 / 用户要求减少动效时，整个不启用
 */

/** 累积到多少才滚一段。鼠标滚轮一格通常 100，所以约 2~3 格 */
const THRESHOLD = 260;
/** 一次滚动后的冷却，避免连跳几段 */
const COOLDOWN = 620;
/** 顶栏高度，吸附时留出的偏移 */
const HEADER = 52;

export default function ScrollPager() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-ptheme]');
    if (!el) return;

    // 这些情况下不启用：窄屏、矮屏、用户要求减少动效
    const mq = window.matchMedia('(max-width: 860px), (max-height: 620px), (prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const sections = () =>
      Array.from(el.querySelectorAll<HTMLElement>(':scope > main > section'));

    const snapTops = () => sections().map((s) => Math.max(0, s.offsetTop - HEADER));

    let acc = 0;
    let locked = false;
    let resetTimer = 0;

    /** 页面内是否有可滚动的子元素在光标下 —— 有的话不拦，让它自己滚 */
    const insideScrollable = (target: EventTarget | null): boolean => {
      let node = target as HTMLElement | null;
      while (node && node !== el) {
        const cs = getComputedStyle(node);
        const canScroll = /(auto|scroll)/.test(cs.overflowY);
        if (canScroll && node.scrollHeight > node.clientHeight + 4) return true;
        node = node.parentElement;
      }
      return false;
    };

    const goto = (dir: 1 | -1) => {
      const tops = snapTops();
      if (!tops.length) return;
      const cur = el.scrollTop;

      let next: number;
      if (dir > 0) {
        next = tops.find((t) => t > cur + 6) ?? tops[tops.length - 1];
      } else {
        const before = [...tops].reverse().find((t) => t < cur - 6);
        next = before ?? 0;
      }

      locked = true;
      el.scrollTo({ top: next, behavior: 'smooth' });
      window.setTimeout(() => {
        locked = false;
      }, COOLDOWN);
    };

    const onWheel = (e: WheelEvent) => {
      // 触控板横滑、页面内可滚动区域：放行
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (insideScrollable(e.target)) return;
      // 已经贴顶/贴底且还想往外滚：放行，避免卡住
      const atTop = el.scrollTop <= 0 && e.deltaY < 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2 && e.deltaY > 0;
      if (atTop || atBottom) return;

      // 关键：拦下原生滚动，改由累积决定何时滚
      e.preventDefault();

      if (locked) {
        acc = 0;
        return;
      }

      // 不同 deltaMode 换算成像素（0=像素 1=行 2=页）
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      acc += e.deltaY * unit;

      // 停下来一会儿就清零，避免慢慢攒着突然跳
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

    // 键盘同样按「一段」走，而不是原生的一大段
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (['PageDown', 'ArrowDown', 'PageUp', 'ArrowUp', ' ', 'Home', 'End'].includes(e.key)) {
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
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(resetTimer);
    };
  }, []);

  return null;
}

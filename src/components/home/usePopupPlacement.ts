import { useCallback, useRef, useState } from 'react';

export type PopupPlacement = { left: number; top: number; side: string };

const GAP = 12; // 浮层与触发元素的间距
const MARGIN = 8; // 与视口边缘的安全距离

type Box = { l: number; t: number; r: number; b: number };

/** 元素（或其祖先）是否处于不可见状态 */
function isHidden(el: HTMLElement | null): boolean {
  let cur: HTMLElement | null = el;
  let depth = 0;
  while (cur && depth < 12) {
    const cs = getComputedStyle(cur);
    if (cs.visibility === 'hidden' || cs.display === 'none') return true;
    cur = cur.parentElement;
    depth++;
  }
  return false;
}

/**
 * 收集障碍物：页面上所有可见的可交互元素。
 * 排除：浮层自身、触发元素及其子树、其它浮层内部（避免把隐藏的 tooltip 当成障碍）。
 */
function collectObstacles(popup: HTMLElement | null, trigger: HTMLElement | null): DOMRect[] {
  const out: DOMRect[] = [];
  const nodes = document.querySelectorAll<HTMLElement>('button, a[href], [role="button"]');
  nodes.forEach((el) => {
    if (popup && popup.contains(el)) return;
    if (trigger && (trigger === el || trigger.contains(el))) return;
    if (el.closest('[data-popup-layer]')) return;
    if (isHidden(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) out.push(r);
  });
  return out;
}

function overlapArea(a: Box, rect: DOMRect): number {
  const ox = Math.max(0, Math.min(a.r, rect.right) - Math.max(a.l, rect.left));
  const oy = Math.max(0, Math.min(a.b, rect.bottom) - Math.max(a.t, rect.top));
  return ox * oy;
}

/**
 * 浮层定位：在 8 个候选方位里挑一个
 *   1) 不与任何其它按钮相交
 *   2) 完全在视口内
 * 都没有就取重叠面积最小的那个。
 *
 * 返回的是【视口坐标】。调用方若把浮层放在 transformed 祖先里（position:absolute），
 * 需要自行减去 containing block 的 rect 转成局部坐标。
 */
export function usePopupPlacement(preferred: string[] = []) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const popupRef = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState<PopupPlacement | null>(null);

  const place = useCallback(() => {
    const t = triggerRef.current?.getBoundingClientRect();
    const p = popupRef.current?.getBoundingClientRect();
    if (!t || !p || !p.width || !p.height) return;

    const W = p.width;
    const H = p.height;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const obstacles = collectObstacles(popupRef.current, triggerRef.current);
    // 触发按钮本身也算障碍：卡片不能盖住自己要点的按钮
    if (t.width > 0 && t.height > 0) obstacles.push(t);

    const tcx = t.left + t.width / 2;
    const tcy = t.top + t.height / 2;
    // 每个方位再试几档距离：贴着放不下就往外挪，直到找到不碰任何按钮的位置
    const GAPS = [GAP, GAP + 32, GAP + 76, GAP + 140];
    const cand: Record<string, { l: number; t: number }> = {};
    for (const g of GAPS) {
      const s = g === GAP ? '' : '-' + g;
      cand['top' + s] = { l: tcx - W / 2, t: t.top - g - H };
      cand['bottom' + s] = { l: tcx - W / 2, t: t.bottom + g };
      cand['left' + s] = { l: t.left - g - W, t: tcy - H / 2 };
      cand['right' + s] = { l: t.right + g, t: tcy - H / 2 };
      cand['top-left' + s] = { l: tcx - W, t: t.top - g - H };
      cand['top-right' + s] = { l: tcx, t: t.top - g - H };
      cand['bottom-left' + s] = { l: tcx - W, t: t.bottom + g };
      cand['bottom-right' + s] = { l: tcx, t: t.bottom + g };
    }

    const keys = Object.keys(cand);
    // 首选方位的所有距离档优先，然后才是其它方位
    const prefExpanded: string[] = [];
    for (const p of preferred) {
      for (const k of keys) if (k === p || k.startsWith(p + '-')) prefExpanded.push(k);
    }
    const order = [...prefExpanded, ...keys.filter((k) => !prefExpanded.includes(k))];

    let best: { score: number; left: number; top: number; side: string } | null = null;
    for (const name of order) {
      const c = cand[name];
      // 夹进视口
      const l = Math.min(Math.max(MARGIN, c.l), Math.max(MARGIN, vw - W - MARGIN));
      const top = Math.min(Math.max(MARGIN, c.t), Math.max(MARGIN, vh - H - MARGIN));
      const box: Box = { l, t: top, r: l + W, b: top + H };

      let overlap = 0;
      for (const o of obstacles) overlap += overlapArea(box, o);
      const clamped = Math.abs(l - c.l) + Math.abs(top - c.t); // 越界位移量
      // 零重叠绝对优先：任何不碰按钮的位置都胜过碰按钮的位置，
      // 越界只在同等重叠时作为次要排序依据（clamp 后卡片仍在视口内，不影响可读性）
      const score = overlap * 1000 + clamped;

      if (!best || score < best.score) best = { score, left: l, top, side: name };
      if (overlap === 0 && clamped === 0) break; // 完美位置，直接用
    }

    if (best) setPos({ left: best.left, top: best.top, side: best.side });
  }, [preferred.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { triggerRef, popupRef, pos, place };
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { ServiceItem } from '@/data/services';
import { ServiceAction, ServiceBadges, ServiceIcon, accentStyle } from './shared';
import { usePopupPlacement } from './usePopupPlacement';

type ServiceNodeProps = {
  service: ServiceItem;
  index: number;
  angle: number;
  /** idle：常态 / active：所属分类被选中 / dim：其他分类被选中 */
  state?: 'idle' | 'active' | 'dim';
};

export default function ServiceNode({ service, index, angle, state = 'idle' }: ServiceNodeProps) {
  const radius = 46;
  const rad = (angle * Math.PI) / 180;
  const left = `calc(50% + ${radius}% * ${Math.cos(rad).toFixed(4)})`;
  const top = `calc(50% + ${radius}% * ${Math.sin(rad).toFixed(4)})`;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const unavailable = Boolean(service.soon || service.unavailable);

  // 首选方位：沿半径朝圆环外侧展开（左下方的节点就往左下弹，右上的往右上弹），
  // 具体落点交给碰撞检测，遇到其它按钮会自动换边
  const preferred = useMemo(() => {
    const down = sin > 0.3;
    const up = sin < -0.3;
    const right = cos > 0.3;
    const left = cos < -0.3;
    if (down && left) return ['bottom-left', 'bottom', 'left'];
    if (down && right) return ['bottom-right', 'bottom', 'right'];
    if (up && left) return ['top-left', 'top', 'left'];
    if (up && right) return ['top-right', 'top', 'right'];
    if (right) return ['right', 'top', 'bottom'];
    if (left) return ['left', 'top', 'bottom'];
    return ['bottom', 'top'];
  }, [sin, cos]);

  const { triggerRef, popupRef, pos, place } = usePopupPlacement(preferred);

  // hook 返回的是视口坐标，这里换算成浮层 containing block 的局部坐标
  // 同时记下按钮中心与卡片尺寸，用来画"悬停走廊"
  const [local, setLocal] = useState<{ left: number; top: number } | null>(null);
  const [bridge, setBridge] = useState<{ bx: number; by: number; nx: number; ny: number } | null>(null);
  useEffect(() => {
    if (!pos || !popupRef.current) return;
    const cb = popupRef.current.offsetParent as HTMLElement | null;
    const r = cb?.getBoundingClientRect();
    const ox = r?.left ?? 0;
    const oy = r?.top ?? 0;
    const W = popupRef.current.offsetWidth;
    const H = popupRef.current.offsetHeight;
    const left = pos.left - ox;
    const top = pos.top - oy;
    setLocal({ left, top });

    const tr = triggerRef.current?.getBoundingClientRect();
    if (tr) {
      const bx = tr.left + tr.width / 2 - ox;
      const by = tr.top + tr.height / 2 - oy;
      // 走廊终点取卡片矩形上离按钮最近的点
      const nx = Math.min(Math.max(bx, left), left + W);
      const ny = Math.min(Math.max(by, top), top + H);
      setBridge({ bx, by, nx, ny });
    }
  }, [pos, popupRef, triggerRef]);

  // 入场动画未结束时量到的锚点是错的，悬停后再补算一次（并顺带覆盖窗口尺寸变化）
  const settleRef = useRef<number | null>(null);

  // 卡片显隐由 JS 管理，不用 CSS :hover：
  // 碰撞检测可能把卡片放到离按钮较远的位置，中间的空隙不属于任何元素，
  // 纯 :hover 会在鼠标穿过空隙时断开。这里加一段延迟关闭窗口，移到卡片上即取消。
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = (ms: number) => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), ms);
  };

  const handleOpen = () => {
    cancelClose();
    setOpen(true);
    place();
    if (settleRef.current) window.clearTimeout(settleRef.current);
    settleRef.current = window.setTimeout(() => place(), 450);
  };

  useEffect(
    () => () => {
      if (settleRef.current) window.clearTimeout(settleRef.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  const openService = () => {
    if (unavailable) {
      toast(service.unavailable ?? '正在筹备中，敬请期待');
      return;
    }
    if (service.external) {
      window.open(service.url, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.href = service.url;
  };

  return (
    <motion.div
      className={`group absolute -translate-x-1/2 -translate-y-1/2 ${open ? 'z-50' : 'z-20'} ${state === 'active' ? 'portal-node-active' : ''}`}
      style={{ left, top, ...accentStyle(service.color) }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: state === 'dim' ? 0.22 : 1, scale: 1 }}
      transition={{ delay: index * 0.045, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseLeave={() => scheduleClose(450)}
      onBlur={(e) => {
        // 焦点离开整个节点（按钮 + 卡片）才关闭，键盘 Tab 进卡片不会闪断
        if (!e.currentTarget.contains(e.relatedTarget as Node)) scheduleClose(0);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          cancelClose();
          setOpen(false);
        }
      }}
    >
      <div className={`flex w-20 flex-col items-center sm:w-24 md:w-28 ${unavailable ? 'portal-node-soon' : ''}`}>
        <div className="relative flex justify-center">
          <span className="portal-node-beam" style={{ '--beam-angle': `${angle + 180}deg` } as React.CSSProperties} />
          <span className="portal-node-pulse" />
          <button
            type="button"
            ref={triggerRef as React.RefObject<HTMLButtonElement>}
            className="portal-node"
            onClick={openService}
            onMouseEnter={handleOpen}
            onFocus={handleOpen}
            aria-label={`${service.name}，${service.desc}`}
          >
            <ServiceIcon icon={service.icon} size={22} />
          </button>
        </div>
        <div className="mt-2 max-w-20 truncate text-center text-[9px] text-slate-300 transition-colors duration-200 group-hover:text-white sm:max-w-24 sm:text-[10px] md:max-w-28 md:text-[11px]">
          {service.shortName ?? service.name}
        </div>
        <div
          ref={popupRef as React.RefObject<HTMLDivElement>}
          data-popup-layer
          data-open={open ? 'true' : 'false'}
          className={`absolute z-50 w-56 transition-opacity duration-150 ${
            open ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0'
          }`}
          style={{ left: local?.left ?? -9999, top: local?.top ?? -9999 }}
          onMouseEnter={cancelClose}
          onMouseLeave={() => scheduleClose(180)}
          onFocus={cancelClose}
        >
          <div className="portal-tooltip">
            {service.categoryName && (
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--service-accent)' }}>
                {service.categoryName}
              </div>
            )}
            <div className="text-sm font-semibold text-white">{service.name}</div>
            <div className="mt-1 text-xs leading-relaxed text-slate-400">{service.desc}</div>
            <ServiceBadges service={service} />
            {service.upgradeHref && (
              <Link href={service.upgradeHref} className="mt-1.5 block text-[10px] text-slate-500 hover:text-slate-300">
                {service.oldLabel ?? '返回旧版'}
              </Link>
            )}
            <div className="mt-2.5">
              <ServiceAction service={service} />
            </div>
          </div>
        </div>

        {/* 悬停走廊：卡片被碰撞检测推到远处时，鼠标穿过空隙也不会掉出悬停区域。
            视觉上完全透明，只在 stroke 上接收指针事件，不遮挡任何内容。 */}
        {open && bridge && (
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden="true">
            <line
              x1={bridge.bx}
              y1={bridge.by}
              x2={bridge.nx}
              y2={bridge.ny}
              stroke="transparent"
              strokeWidth="36"
              strokeLinecap="round"
              style={{ pointerEvents: 'stroke' }}
              onMouseEnter={cancelClose}
              onMouseLeave={() => scheduleClose(200)}
            />
          </svg>
        )}
      </div>
    </motion.div>
  );
}

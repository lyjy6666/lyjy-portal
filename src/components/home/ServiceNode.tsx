'use client';

import Link from 'next/link';
import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ServiceItem } from '@/data/services';
import { ServiceAction, ServiceBadges, ServiceIcon, accentStyle } from './shared';
import { useServiceNav } from './useServiceNav';
import type { RingVariant } from './ringAngles';

type ServiceNodeProps = {
  service: ServiceItem;
  index: number;
  angle: number;
  /** idle：常态 / active：所属分类被选中 / dim：其他分类被选中 */
  state?: 'idle' | 'active' | 'dim';
  /** 布局方案（仅影响标签显隐与尺寸，角度由 RingLayout 决定） */
  variant?: RingVariant;
  /** 是否显示节点自带的悬停卡片（方案 E 由中心面板代替，传 false） */
  showCard?: boolean;
  /** 悬停状态变化回调（方案 E 用来驱动中心详情面板） */
  onHoverChange?: (service: ServiceItem | null) => void;
};

function ServiceNode({
  service,
  index,
  angle,
  state = 'idle',
  variant = 'A',
  showCard = true,
  onHoverChange,
}: ServiceNodeProps) {
  const radius = 46;
  const rad = (angle * Math.PI) / 180;
  const left = `calc(50% + ${radius}% * ${Math.cos(rad).toFixed(4)})`;
  const top = `calc(50% + ${radius}% * ${Math.sin(rad).toFixed(4)})`;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const unavailable = Boolean(service.soon || service.unavailable);
  const open = useServiceNav();

  // 卡片固定弹在节点外侧：按节点在圆环上的方位决定方向，
  // 不再实时计算避让（那是卡顿主因）。左半圆往左、右半圆往右，
  // 正上/正下则往上/下弹。
  const side = cos > 0.35 ? 'right' : cos < -0.35 ? 'left' : sin > 0 ? 'bottom' : 'top';

  // 卡片显隐由 JS 管理：卡片与节点之间有 10px 空隙，
  // 纯 CSS :hover 在鼠标穿过空隙时会断开，这里用一段延迟关闭兜住。
  const [cardOpen, setCardOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = (ms: number) => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setCardOpen(false), ms);
  };

  const handleOpen = () => {
    cancelClose();
    if (showCard) setCardOpen(true);
    onHoverChange?.(service);
  };

  const handleClose = (ms: number) => {
    scheduleClose(ms);
    onHoverChange?.(null);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  return (
    <motion.div
      className={`portal-node-item group absolute -translate-x-1/2 -translate-y-1/2 ${
        cardOpen ? 'z-50' : 'z-20'
      } ${state === 'active' ? 'portal-node-active' : ''}`}
      style={{ left, top, ...accentStyle(service.color) }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: state === 'dim' ? 0.22 : 1, scale: 1 }}
      // 入场才需要错峰延迟；状态变化（分类高亮）不该再延迟，否则看着迟钝
      transition={{ delay: index * 0.045, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseLeave={() => handleClose(150)}
      onBlur={(e) => {
        // 焦点离开整个节点（按钮 + 卡片）才关闭，键盘 Tab 进卡片不会闪断
        if (!e.currentTarget.contains(e.relatedTarget as Node)) handleClose(0);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          cancelClose();
          setCardOpen(false);
        }
      }}
    >
      <div
        className={`portal-node-col flex flex-col items-center ${
          unavailable ? 'portal-node-soon' : ''
        }`}
      >
        <div className="relative flex justify-center">
          <span className="portal-node-beam" style={{ '--beam-angle': `${angle + 180}deg` } as React.CSSProperties} />
          <span className="portal-node-pulse" />
          <button
            type="button"
            className="portal-node"
            onClick={() => open(service)}
            onMouseEnter={handleOpen}
            onFocus={handleOpen}
            aria-label={`${service.name}，${service.desc}`}
          >
            <ServiceIcon icon={service.icon} size={22} />
          </button>
        </div>

        <div className="portal-node-label mt-2 truncate text-center text-[9px] text-slate-300 transition-colors duration-200 group-hover:text-white sm:text-[10px] md:text-[11px]">
          {service.shortName ?? service.name}
        </div>

        <div
          data-popup-layer
          data-open={cardOpen ? 'true' : 'false'}
          data-card-side={side}
          className={`portal-card portal-card--${side} transition-opacity duration-150 ${
            showCard && cardOpen ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0'
          }`}
          onMouseEnter={cancelClose}
          onMouseLeave={() => scheduleClose(120)}
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
      </div>
    </motion.div>
  );
}

// 17 个节点一起渲染，memo 可以避免分类高亮 / 计数动画造成全量重渲
export default memo(ServiceNode);

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { ServiceItem } from '@/data/services';
import { ServiceIcon, accentStyle } from './shared';
import { useServiceNav } from './useServiceNav';

type ServiceNodeProps = {
  service: ServiceItem;
  index: number;
  angle: number;
  /** idle：常态 / active：被选中 / dim：其他节点被选中 */
  state?: 'idle' | 'active' | 'dim';
  /** 悬停状态变化回调（驱动中心的详情面板） */
  onHoverChange?: (service: ServiceItem | null) => void;
  /** 是否允许悬停效果（刚进页面 1 秒内为 false，避免误触发） */
  hoverEnabled?: boolean;
};

function ServiceNode({
  service,
  index,
  angle,
  state = 'idle',
  onHoverChange,
  hoverEnabled = true,
}: ServiceNodeProps) {
  const radius = 46;
  const rad = (angle * Math.PI) / 180;
  const left = `calc(50% + ${radius}% * ${Math.cos(rad).toFixed(4)})`;
  const top = `calc(50% + ${radius}% * ${Math.sin(rad).toFixed(4)})`;
  const unavailable = Boolean(service.soon || service.unavailable);
  const open = useServiceNav();

  // 节点自身不再弹卡片：详情统一由圆环中心的固定面板展示，
  // 这里只把悬停事件上报给 RingLayout。
  const handleEnter = () => {
    // 刚进页面时忽略悬停，避免鼠标恰好落在节点上就弹出效果
    if (!hoverEnabled) return;
    onHoverChange?.(service);
  };

  const handleLeave = () => {
    onHoverChange?.(null);
  };

  return (
    <motion.div
      className={`portal-node-item group absolute -translate-x-1/2 -translate-y-1/2 z-20 ${
        state === 'active' ? 'portal-node-active' : ''
      }`}
      style={{ left, top, ...accentStyle(service.color) }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: state === 'dim' ? 0.22 : 1, scale: 1 }}
      // 入场才需要错峰延迟；状态变化（悬停高亮）不该再延迟，否则看着迟钝
      transition={{ delay: index * 0.045, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseLeave={handleLeave}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) handleLeave();
      }}
    >
      <div className={`portal-node-col flex flex-col items-center ${unavailable ? 'portal-node-soon' : ''}`}>
        <div className="relative flex justify-center">
          <span className="portal-node-beam" style={{ '--beam-angle': `${angle + 180}deg` } as React.CSSProperties} />
          <span className="portal-node-pulse" />
          <button
            type="button"
            className="portal-node"
            onClick={() => open(service)}
            onMouseEnter={handleEnter}
            onFocus={handleEnter}
            aria-label={`${service.name}，${service.desc}`}
          >
            <ServiceIcon icon={service.icon} size={22} />
          </button>
        </div>

        <div className="portal-node-label mt-2 truncate text-center text-[9px] text-slate-300 transition-colors duration-200 group-hover:text-white sm:text-[10px] md:text-[11px]">
          {service.shortName ?? service.name}
        </div>
      </div>
    </motion.div>
  );
}

// 17 个节点一起渲染，memo 可以避免悬停高亮 / 计数动画造成全量重渲
export default memo(ServiceNode);

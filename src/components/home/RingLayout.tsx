'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChartLine, Headset, History, LayoutGrid, Sparkles, X } from 'lucide-react';
import { flattenServices, serviceCategories } from '@/data/services';
import GalaxyRing from './GalaxyRing';
import ServiceNode from './ServiceNode';
import { ServiceIcon, accentStyle, accents, handleNudge } from './shared';
import { anglesForVariant, type RingVariant } from './ringAngles';

const RING_RADIUS = 46;

function polar(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
}

type RingLayoutProps = {
  dynamicNumber: number;
  onOpenStats: () => void;
  onOpenVersion: () => void;
  onSwitchLayout: () => void;
  /** 布局方案：A 标签悬停显示 / B 整体缩放 / C 分类分组 / D 缩放+分组 */
  variant?: RingVariant;
};

export default function RingLayout({
  dynamicNumber,
  onOpenStats,
  onOpenVersion,
  onSwitchLayout,
  variant = 'A',
}: RingLayoutProps) {
  const services = flattenServices();
  const [showGuide, setShowGuide] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // 节点角度：方案 C/D 会按分类分组并留出空隙
  const angles = useMemo(() => anglesForVariant(variant, serviceCategories), [variant]);

  useEffect(() => {
    if (localStorage.getItem('portalLayoutSeen')) return;
    const openTimer = window.setTimeout(() => setShowGuide(true), 800);
    return () => window.clearTimeout(openTimer);
  }, []);

  useEffect(() => {
    if (!showGuide) return;
    // 引导弹窗 10 秒后自动消失，避免遮挡操作
    timerRef.current = window.setTimeout(() => {
      setShowGuide(false);
      localStorage.setItem('portalLayoutSeen', '1');
    }, 10_000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [showGuide]);

  const closeGuide = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setShowGuide(false);
    localStorage.setItem('portalLayoutSeen', '1');
  };

  // 每个分类在圆环上对应一段彩色弧线，弧线中点外侧放分类名。
  // 弧线端点直接取该分类首尾节点的真实角度（方案 C/D 分组后也自动对齐）。
  const segments = useMemo(() => {
    const gap = angles.length > 1 ? Math.abs(angles[1] - angles[0]) * 0.45 : 3;
    let cursor = 0;
    return serviceCategories.map((category) => {
      const startIdx = cursor;
      cursor += category.services.length;
      const endIdx = cursor - 1;
      const from = (angles[startIdx] ?? -90) - gap;
      const to = (angles[endIdx] ?? -90) + gap;
      const a = polar(from, RING_RADIUS);
      const b = polar(to, RING_RADIUS);
      const label = polar((from + to) / 2, RING_RADIUS + 7.5);
      return {
        id: category.id,
        name: category.name,
        color: accents[category.color] ?? accents.blue,
        d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${RING_RADIUS} ${RING_RADIUS} 0 ${Math.abs(to - from) > 180 ? 1 : 0} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
        labelLeft: `${label.x}%`,
        labelTop: `${label.y}%`,
      };
    });
  }, [angles]);

  const nodeState = (categoryId?: string) => {
    if (!activeCategory) return 'idle' as const;
    return categoryId === activeCategory ? 'active' : 'dim';
  };

  return (
    <div className="portal-ring-page">
      <div className="portal-hud portal-hud--top">
        <span className="portal-hud-dot" />
        SYS {String(dynamicNumber).padStart(4, '0')}
      </div>

      <div className="portal-legend" onMouseLeave={() => setActiveCategory(null)}>
        {serviceCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`portal-legend-item ${activeCategory === category.id ? 'portal-legend-item--on' : ''}`}
            style={accentStyle(category.color)}
            onMouseEnter={() => setActiveCategory(category.id)}
            onFocus={() => setActiveCategory(category.id)}
            onBlur={() => setActiveCategory(null)}
          >
            <span className="portal-legend-icon">
              <ServiceIcon icon={category.icon} size={13} />
            </span>
            <span className="portal-legend-name">{category.name}</span>
            <span className="portal-legend-count">{category.services.length}</span>
          </button>
        ))}
      </div>

      <div className={`portal-ring-stage portal-ring-stage--${variant.toLowerCase()}`}>
        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4 }} aria-hidden="true">
          <GalaxyRing />
        </motion.div>

        <svg className="portal-arcs" viewBox="0 0 100 100" aria-hidden="true">
          {segments.map((segment) => (
            <path
              key={segment.id}
              d={segment.d}
              stroke={segment.color}
              strokeWidth={activeCategory === segment.id ? 0.9 : 0.4}
              strokeOpacity={activeCategory && activeCategory !== segment.id ? 0.18 : 0.7}
            />
          ))}
        </svg>

        {segments.map((segment) => (
          <span
            key={`label-${segment.id}`}
            className={`portal-arc-label ${activeCategory === segment.id ? 'portal-arc-label--on' : ''}`}
            style={{ left: segment.labelLeft, top: segment.labelTop, color: segment.color }}
          >
            {segment.name}
          </span>
        ))}

        <div className="absolute inset-0">
          {services.map((service, index) => (
            <ServiceNode
              key={service.id}
              service={service}
              index={index}
              angle={angles[index] ?? -90 + index * (360 / services.length)}
              state={nodeState(service.categoryId)}
              variant={variant}
            />
          ))}
        </div>

        <div className="portal-ring-core">
          <span className="portal-core-halo" aria-hidden="true" />
          <span className="portal-core-ring" aria-hidden="true" />
          <p className="portal-core-eyebrow">Unified Portal</p>
          <h1 className="portal-core-title">LYJY导航系统</h1>
          <span className="portal-core-rule" aria-hidden="true" />
          <p className="portal-core-desc">欢迎使用LYJY导航系统，请选择您需要访问的服务</p>
          <button type="button" onClick={handleNudge} className="portal-nudge">
            <Sparkles size={14} />敬请期待更多功能
          </button>
        </div>
      </div>

      <div className="portal-hud portal-hud--bottom">
        © 2026 LYJY导航系统 ·{' '}
        <button type="button" onClick={onOpenVersion} className="text-sky-300 hover:text-sky-200">V6.0</button>
      </div>

      <div className="fixed bottom-4 right-6 z-40 flex flex-col gap-2">
        <button type="button" onClick={onOpenStats} className="portal-fab" aria-label="查看网站统计数据"><ChartLine size={20} /></button>
        <button type="button" onClick={() => window.open('/cs', '_blank')} className="portal-fab" aria-label="智能客服"><Headset size={20} /></button>
        <button type="button" onClick={onOpenVersion} className="portal-fab" aria-label="更新记录"><History size={20} /></button>
        <button type="button" onClick={onSwitchLayout} className="portal-fab" aria-label="返回旧布局"><LayoutGrid size={20} /></button>
      </div>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            data-popup-layer
            className="portal-guide-pop"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <button type="button" onClick={closeGuide} className="absolute right-2 top-2 text-slate-500 hover:text-slate-300" aria-label="关闭提示">
              <X size={14} />
            </button>
            <p className="text-sm font-medium text-white">不习惯当前布局吗？</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">点右侧的列表按钮随时切回旧版，双向可逆。</p>
            <button
              type="button"
              onClick={() => {
                closeGuide();
                onSwitchLayout();
              }}
              className="portal-guide-action"
            >
              返回旧布局
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

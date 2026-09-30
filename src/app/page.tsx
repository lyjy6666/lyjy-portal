'use client';

import { useEffect, useState } from 'react';
import Background from '@/components/Background';
import StatisticsModal from '@/components/StatisticsModal';
import ListLayout from '@/components/home/ListLayout';
import RingLayout from '@/components/home/RingLayout';
import VersionDialog from '@/components/home/VersionDialog';
import type { RingVariant } from '@/components/home/ringAngles';
import { generateRandomStatsData, type WebsiteStats } from '@/lib/utils';
import { toast } from 'sonner';

type LayoutMode = 'ring' | 'list';

/** 4 版圆环布局方案（临时对比用，选定后固化） */
const RING_VARIANTS: { key: RingVariant; label: string; desc: string }[] = [
  { key: 'A', label: 'A', desc: '标签悬停才显示：列宽收窄，彻底不压字' },
  { key: 'B', label: 'B', desc: '整体随圆环缩放：节点与标签一起变小' },
  { key: 'C', label: 'C', desc: '按分类分组：同类靠拢，分类间留空隙' },
  { key: 'D', label: 'D', desc: '缩放 + 分类分组：两者结合' },
];

export default function PortalHome() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('ring');
  const [ready, setReady] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [statsData, setStatsData] = useState<WebsiteStats[]>([]);
  const [dynamicNumber, setDynamicNumber] = useState(0);
  const [variant, setVariant] = useState<RingVariant>('A');

  useEffect(() => {
    // 布局偏好与视口能力只能在客户端读取，避免 SSR/hydration 不一致
    const stored = localStorage.getItem('portalLayout');
    if (stored === 'list' || stored === 'ring') setLayoutMode(stored);

    const query = window.matchMedia('(min-width: 480px)');
    const syncViewport = () => setIsCompact(!query.matches);
    syncViewport();
    query.addEventListener('change', syncViewport);

    const storedVariant = localStorage.getItem('portalRingVariant');
    if (storedVariant === 'A' || storedVariant === 'B' || storedVariant === 'C' || storedVariant === 'D') {
      setVariant(storedVariant);
    }

    setReady(true);
    return () => query.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    // 生成统计数据并持久化
    localStorage.removeItem('websiteStatsData');
    const newData = generateRandomStatsData();
    localStorage.setItem('websiteStatsData', JSON.stringify(newData));
    setStatsData(newData);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('oldSiteNoticeShown')) return;
    const timer = window.setTimeout(() => {
      toast('如果想前往过去的网站，请访问 lyjyold.netlify.app', {
        position: 'bottom-right',
        duration: 8000,
        className: 'bg-black/80 text-white border-none',
        action: { label: '前往', onClick: () => window.open('https://lyjyold.netlify.app', '_blank') },
      });
      localStorage.setItem('oldSiteNoticeShown', 'true');
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const duration = 2000;
    const targetNumber = Math.floor(Math.random() * 1000) + 500;
    const startTime = Date.now();
    let frame = 0;

    const updateNumber = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDynamicNumber(Math.floor(easedProgress * targetNumber));
      if (progress < 1) frame = requestAnimationFrame(updateNumber);
    };

    updateNumber();
    return () => cancelAnimationFrame(frame);
  }, []);

  const switchLayout = (mode: LayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('portalLayout', mode);
    toast(mode === 'list' ? '已切换到旧版列表布局，可在右下角切回' : '已切换到圆环布局，可在右下角切回');
  };

  const switchVariant = (next: RingVariant) => {
    setVariant(next);
    localStorage.setItem('portalRingVariant', next);
    const info = RING_VARIANTS.find((v) => v.key === next);
    toast(`布局方案 ${next}：${info?.desc ?? ''}`);
  };

  const sharedProps = {
    dynamicNumber,
    onOpenStats: () => setShowStatsModal(true),
    onOpenVersion: () => setShowVersionModal(true),
  };

  // 极窄屏（<480px）圆环放不下 17 个节点，降级为列表布局；其余宽度一律走圆环
  const renderRing = layoutMode === 'ring' && !isCompact;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background />
      {!ready ? (
        // 布局偏好只能在客户端读取，先用静态圆环骨架占位，避免首屏跳变
        <div className="portal-ring-page" aria-busy="true">
          <div className="portal-ring-stage">
            <span className="portal-orbit portal-orbit--track" aria-hidden="true" />
            <div className="portal-ring-core">
              <span className="portal-core-halo" aria-hidden="true" />
              <p className="portal-core-eyebrow">Unified Portal</p>
              <h1 className="portal-core-title">LYJY导航系统</h1>
              <span className="portal-core-rule" aria-hidden="true" />
              <p className="portal-core-desc">正在载入导航…</p>
            </div>
          </div>
        </div>
      ) : renderRing ? (
        <RingLayout {...sharedProps} variant={variant} onSwitchLayout={() => switchLayout('list')} />
      ) : (
        <ListLayout {...sharedProps} onSwitchLayout={() => switchLayout('ring')} />
      )}

      {/* 临时：4 版圆环布局方案对比切换器（选定方案后删除整块） */}
      {renderRing && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1 rounded-xl border border-fuchsia-400/40 bg-slate-950/85 p-1 backdrop-blur">
          <span className="px-1.5 text-[11px] text-fuchsia-300">布局方案</span>
          {RING_VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => switchVariant(v.key)}
              title={v.desc}
              className={`h-7 w-7 rounded-lg text-xs font-medium transition-all ${
                variant === v.key
                  ? 'bg-fuchsia-600 text-white shadow shadow-fuchsia-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <StatisticsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} data={statsData} />
      <VersionDialog open={showVersionModal} onOpenChange={setShowVersionModal} />
    </div>
  );
}

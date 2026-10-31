'use client';

import { useEffect, useState } from 'react';
import Background from '@/components/Background';
import StatisticsModal from '@/components/StatisticsModal';
import ListLayout from '@/components/home/ListLayout';
import RingLayout from '@/components/home/RingLayout';
import VersionDialog from '@/components/home/VersionDialog';
import { generateRandomStatsData, type WebsiteStats } from '@/lib/utils';
import { toast } from 'sonner';

type LayoutMode = 'ring' | 'list';

export default function PortalHome() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('ring');
  const [ready, setReady] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [statsData, setStatsData] = useState<WebsiteStats[]>([]);
  const [dynamicNumber, setDynamicNumber] = useState(0);

  useEffect(() => {
    // 布局偏好与视口能力只能在客户端读取，避免 SSR/hydration 不一致
    const stored = localStorage.getItem('portalLayout');
    if (stored === 'list' || stored === 'ring') setLayoutMode(stored);

    const query = window.matchMedia('(min-width: 480px)');
    const syncViewport = () => setIsCompact(!query.matches);
    syncViewport();
    query.addEventListener('change', syncViewport);

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

      {/* 全站顶部常驻安全警告：Windows Toolbox 旧版本存在严重漏洞，提醒更新 */}
      <div className="fixed inset-x-0 top-0 z-[70] bg-red-600 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-2">
          <span className="text-[13px] leading-none" aria-hidden="true">⚠</span>
          <p className="text-center text-[0.75rem] font-semibold leading-snug">
            重要通知：Windows Toolbox 旧版本存在严重安全漏洞，请尽快更新至最新版本。
          </p>
        </div>
      </div>
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
        <RingLayout {...sharedProps} onSwitchLayout={() => switchLayout('list')} />
      ) : (
        <ListLayout {...sharedProps} onSwitchLayout={() => switchLayout('ring')} />
      )}

      <StatisticsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} data={statsData} />
      <VersionDialog open={showVersionModal} onOpenChange={setShowVersionModal} />
    </div>
  );
}

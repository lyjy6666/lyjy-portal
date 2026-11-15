'use client';

import { useEffect, useState } from 'react';
import Background from '@/components/Background';
import StatisticsModal from '@/components/StatisticsModal';
import ListLayout from '@/components/home/ListLayout';
import RingLayout from '@/components/home/RingLayout';
import VersionDialog from '@/components/home/VersionDialog';
import UnifiedChangelog from '@/components/changelog/UnifiedChangelog';
import NextVersionDialog from '@/components/home/NextVersionDialog';
import MobileDesktopHint from '@/components/home/MobileDesktopHint';
import AnniversarySplash from '@/components/home/AnniversarySplash';
import MobileNoticeDialog from '@/components/home/MobileNoticeDialog';
import MobileBlockNotice from '@/components/home/MobileBlockNotice';
import { isMobileDevice } from '@/components/home/useIsMobile';
import { generateRandomStatsData, type WebsiteStats } from '@/lib/utils';
import { toast } from 'sonner';

type LayoutMode = 'ring' | 'list';

export default function PortalHome() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('ring');
  const [ready, setReady] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  // 用户手动切过布局时尊重选择：手机默认列表，但点切换按钮仍能进圆环
  const [forceRing, setForceRing] = useState(false);
  const [ringWarnOpen, setRingWarnOpen] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [showNextModal, setShowNextModal] = useState(false);
  const [statsData, setStatsData] = useState<WebsiteStats[]>([]);
  const [dynamicNumber, setDynamicNumber] = useState(0);

  useEffect(() => {
    // 布局偏好与视口能力只能在客户端读取，避免 SSR/hydration 不一致
    const stored = localStorage.getItem('portalLayout');
    if (stored === 'list' || stored === 'ring') setLayoutMode(stored);

    // 圆环需要足够的宽与高：手机竖屏(<768 宽)和横屏/矮屏(<560 高)都退化成列表。
    // 节点最多 22 个，矮屏上弧长不足会压字（CSS 里那套间距是按 17 节点算的）。
    const query = window.matchMedia('(max-width: 767px), (max-height: 559px)');
    const syncViewport = () => setIsCompact(query.matches);
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
    // 手机/矮屏不弹旧站提示：sonner 的 bottom-right toast 会盖住底部工具条和弹窗
    if (window.matchMedia('(max-width: 767px), (max-height: 559px)').matches) return;
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

  // 真正应用布局（跳过确认后调用）
  const applyLayout = (mode: LayoutMode) => {
    setLayoutMode(mode);
    setForceRing(mode === 'ring');
    localStorage.setItem('portalLayout', mode);
    // 手机/矮屏不弹切换提示：sonner 的顶部 toast 会挡住圆环和标题
    if (!window.matchMedia('(max-width: 767px), (max-height: 559px)').matches) {
      toast(mode === 'list' ? '已切换到旧版列表布局，可在右下角切回' : '已切换到圆环布局，可在右下角切回');
    }
  };

  const switchLayout = (mode: LayoutMode) => {
    // 手机上切圆环前先警告：窗口偏差很大，建议电脑版 / 桌面版
    if (mode === 'ring' && isMobileDevice()) {
      setRingWarnOpen(true);
      return;
    }
    applyLayout(mode);
  };

  const sharedProps = {
    dynamicNumber,
    onOpenStats: () => setShowStatsModal(true),
    onOpenVersion: () => setShowVersionModal(true),
    onOpenChangelog: () => setShowChangelogModal(true),
    onOpenNextPreview: () => setShowNextModal(true),
  };

  // 窄屏/矮屏默认用列表；但用户手动切到圆环时以选择为准（刷新后回到默认列表）
  const renderRing = layoutMode === 'ring' && (!isCompact || forceRing);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Background />
      {/* 手机浏览器提示：可关闭；开启浏览器「访问桌面版」后 UA 变化，提示自动消失 */}
      <MobileDesktopHint />
      <AnniversarySplash />

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
      <UnifiedChangelog open={showChangelogModal} onOpenChange={setShowChangelogModal} />
      {/* 全站唯一的「仅电脑版可访问」提示：所有灰显入口被点中时统一弹这一个 */}
      <MobileBlockNotice />
      <MobileNoticeDialog
        open={ringWarnOpen}
        title="手机版圆环显示偏差"
        message="手机版访问圆环，窗口显示会出现严重偏差，强烈建议使用电脑版或访问桌面版。"
        primaryLabel="取消，继续用列表"
        onPrimary={() => setRingWarnOpen(false)}
        secondaryLabel="仍要切换圆环"
        onSecondary={() => { setRingWarnOpen(false); applyLayout('ring'); }}
        onClose={() => setRingWarnOpen(false)}
      />
      <NextVersionDialog open={showNextModal} onOpenChange={setShowNextModal} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import type { ServiceItem } from '@/data/services';
import { MOBILE_BLOCK_EVENT, mobileLimitMessage, type MobileBlockDetail } from './mobileGuard';
import MobileNoticeDialog from './MobileNoticeDialog';

/**
 * 全站唯一的「仅电脑版可访问」提示弹窗。
 *
 * 圆环节点、列表整行/键盘、中心详情面板、导航回调兜底都会派发同一个事件，
 * 这里统一渲染，避免每个入口各弹一层、也避免漏掉某个入口不弹提示。
 * 弹窗只有「我知道了」，没有任何「仍要访问」的口子。
 */
export default function MobileBlockNotice() {
  const [service, setService] = useState<ServiceItem | null>(null);

  useEffect(() => {
    const onBlocked = (event: Event) => {
      const detail = (event as CustomEvent<MobileBlockDetail>).detail;
      if (detail?.service) setService(detail.service);
    };
    window.addEventListener(MOBILE_BLOCK_EVENT, onBlocked);
    return () => window.removeEventListener(MOBILE_BLOCK_EVENT, onBlocked);
  }, []);

  return (
    <MobileNoticeDialog
      open={Boolean(service)}
      title="仅电脑版可访问"
      message={service ? mobileLimitMessage(service) : ''}
      primaryLabel="我知道了"
      onPrimary={() => setService(null)}
      onClose={() => setService(null)}
    />
  );
}

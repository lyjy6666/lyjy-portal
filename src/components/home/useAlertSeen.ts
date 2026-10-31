'use client';

import { useEffect, useState } from 'react';
import { isAlertSeen } from '@/lib/portalAlert';

/**
 * 告警角标的「已读」状态。
 *
 * mounted 用于避免 SSR / hydration 不一致：挂载前不渲染角标，
 * 挂载后再按 localStorage 决定是否显示，避免服务端渲染出角标、
 * 客户端却因已读而不渲染造成的闪烁或 hydration 报错。
 */
export function useAlertSeen(id: string, enabled: boolean) {
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (enabled) setSeen(isAlertSeen(id));
  }, [id, enabled]);

  return { mounted, seen };
}

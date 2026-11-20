'use client';

import { useEffect } from 'react';
import { markAlertSeen } from '@/lib/portalAlert';

/**
 * 进入产品页即把对应服务的告警角标标记为「已读」。
 * 覆盖「直接访问产品页」（非从首页节点点进来）的情况，
 * 让首页角标在任何一次进入后都不再显示。
 */
export default function MarkAlertSeen({ id }: { id: string }) {
  useEffect(() => {
    markAlertSeen(id);
  }, [id]);

  return null;
}

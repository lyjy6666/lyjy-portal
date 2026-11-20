'use client';

import { useEffect, useState } from 'react';
import { useIsMobile } from '@/components/home/useIsMobile';
import MobileNoticeDialog from '@/components/home/MobileNoticeDialog';

/** 本次会话内关过就不再弹 */
const DISMISS_KEY = 'lyjy_pro_mobile_notice';

/**
 * 手机访问作业管理系统 Pro 版时的建议。
 * 原版对手机适配更好；若要继续用 Pro 版，引导用户开启浏览器「访问桌面版」。
 */
export function ProMobileNotice() {
  const mobile = useIsMobile();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!mobile) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* 隐私模式下忽略 */
    }
    setShow(true);
  }, [mobile]);

  const close = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* 忽略 */
    }
    setShow(false);
  };

  return (
    <MobileNoticeDialog
      open={show}
      title="建议使用原版作业管理系统"
      message="原版适配手机度更高，建议使用原版。若要使用 PRO 版，建议在浏览器的「更多」里选择「访问桌面版」，显示会更完整。"
      primaryLabel="前往原版（推荐）"
      onPrimary={() => {
        close();
        window.location.href = '/homework';
      }}
      secondaryLabel="仍用 PRO 版"
      onSecondary={close}
      onClose={close}
    />
  );
}

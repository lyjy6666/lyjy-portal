'use client';

import { useEffect, useState } from 'react';

/**
 * 是否「手机浏览器」——只看 UA，不把窄窗口的桌面浏览器算进去。
 * 用户在浏览器「更多」里开启「访问桌面版 / 桌面网站」后 UA 会变成桌面 UA，
 * 这里随之返回 false，所有手机版提示、置灰与访问拦截都会自动消失。
 *
 * 只认 UA、不再附加 max-width 判断：手机横屏时宽度会到 800+，
 * 若按宽度过滤会误判成桌面，导致灰显项在横屏下又能点进去。
 * 平板 UA（iPad / Android 平板不含 Mobile 字样）本就不在正则内，不受影响。
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android.*Mobile|iPhone|iPod|Windows Phone|IEMobile|Opera Mini|Mobile Safari/i.test(ua);
}

/** 首帧固定 false（SSR 一致），客户端挂载后再判断是否手机 */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(isMobileDevice());
  }, []);
  return mobile;
}

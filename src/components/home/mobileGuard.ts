'use client';

import { ANDROID_CAPABLE_IDS, type ServiceItem } from '@/data/services';
import { isMobileDevice } from './useIsMobile';

/**
 * 手机版访问限制 —— 全站唯一判定口径。
 *
 *  - 趣味应用：全部只允许电脑版 / 浏览器「访问桌面版」进入
 *  - 产品下载：只有带 Android 安装包的产品（AI 聊天）放行，
 *    其余 Windows 程序一律封死
 *
 * 桌面 UA（含手机开启「访问桌面版」后）返回 false，所有灰显与拦截自动消失。
 */
export function isMobileLimited(
  service: ServiceItem,
  mobile: boolean,
  categoryId: string | undefined = service.categoryId,
): boolean {
  if (!mobile) return false;
  return (
    categoryId === 'fun' ||
    (categoryId === 'download' && !ANDROID_CAPABLE_IDS.has(service.id))
  );
}

/** 供导航回调做兜底：不依赖 React state，点击那一刻实时判定设备 */
export function isLimitedOnThisDevice(service: ServiceItem): boolean {
  return isMobileLimited(service, isMobileDevice());
}

/** 灰显项旁边的短说明 */
export function mobileLimitText(service: ServiceItem): string {
  return service.categoryId === 'fun'
    ? '手机版访问受限，建议使用电脑版'
    : 'Windows 程序无法在手机安装，建议用电脑版';
}

/** 点击灰显项 / 直接访问受限页面时的完整说明 */
export function mobileLimitMessage(service: ServiceItem): string {
  return service.categoryId === 'fun'
    ? '该趣味应用在手机版暂不可用，只有电脑版（或在浏览器「更多」里开启「访问桌面版」）才能进入。手机版常见问题是部分网站无法访问、格式出错、乱码等。'
    : '这是 Windows 程序，手机上无法安装或打开，请在电脑上访问本站下载；也可在浏览器「更多」里开启「访问桌面版」。';
}

/** 全局唯一的「仅电脑版可访问」弹窗事件，任何入口被拦截都派发它 */
export const MOBILE_BLOCK_EVENT = 'lyjy:mobile-blocked';
export type MobileBlockDetail = { service: ServiceItem };

export function notifyMobileBlocked(service: ServiceItem): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<MobileBlockDetail>(MOBILE_BLOCK_EVENT, { detail: { service } }),
  );
}

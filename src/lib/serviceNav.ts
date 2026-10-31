import type { ServiceItem } from '@/data/services';

export type NavMode = 'soon' | 'external' | 'download' | 'internal';

export type NavTarget = {
  mode: NavMode;
  /** 真实链接，用于 <a href> —— 这样中键新标签、复制链接仍然可用 */
  href: string;
  /** 卡片按钮文案 */
  label: string;
  /** 不可用时的提示语 */
  message?: string;
};

/**
 * 把一个服务解析成唯一的导航目标。
 *
 * 之前这里有两套逻辑：圆圈点击走 window.location.href（整页刷新），
 * 卡片按钮走 Next <Link>（客户端跳转），导致同样的入口行为不一致。
 * 现在所有入口都先经过这里，再交给 performNav 执行。
 */
export function resolveService(service: ServiceItem): NavTarget {
  if (service.soon || service.unavailable) {
    return {
      mode: 'soon',
      href: '#',
      label: '暂不可用',
      message: service.unavailable ?? '正在筹备中，敬请期待',
    };
  }
  if (service.type === 'download') {
    // 防御：只有当 url 真的指向一个**文件**时才按下载处理。
    //
    // 如果指向的是站内页面（比如 /product/xxx 介绍页），却带着 download 语义，
    // 浏览器会把那个 HTML 页面当文件下载下来 —— 用户打开后看到的就是「又一个下载页」。
    // 强力锁曾经就是这样：url 是 /product/qianglilock 介绍页，却标了 type: 'download'。
    const looksLikeFile = /\.(exe|msi|zip|7z|rar|dmg|pkg|apk|deb|rpm|tar|gz)$/i.test(service.url);
    if (looksLikeFile) {
      return { mode: 'download', href: service.url, label: '下载' };
    }
    // 否则当作普通站内跳转，继续往下走
  }
  if (service.external) {
    return { mode: 'external', href: service.url, label: '访问网站' };
  }
  return { mode: 'internal', href: service.url, label: '进入网站' };
}

export function isNavigable(service: ServiceItem): boolean {
  return resolveService(service).mode !== 'soon';
}

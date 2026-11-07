import type { ServiceItem } from '@/data/services';

/**
 * 原版关停判断（统一从这里出，首页入口 / 原版页遮罩 / Pro 版按钮共用）。
 * 语义：到关停日期**当天 00:00:00（北京时间）**即视为已关停。
 */

export function isSunsetDate(date?: string): boolean {
  if (!date) return false;
  return Date.now() >= new Date(`${date}T00:00:00+08:00`).getTime();
}

export function isSunset(service: ServiceItem): boolean {
  return isSunsetDate(service.sunset);
}

/** 关停日期中文文案，如「10月25日」 */
export function sunsetDateLabel(date?: string): string {
  if (!date) return '';
  const [, m, d] = date.split('-');
  return `${Number(m)}月${Number(d)}日`;
}

export function sunsetLabel(service: ServiceItem): string {
  const d = sunsetDateLabel(service.sunset);
  return d ? `${d}关停服务` : '';
}

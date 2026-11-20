import type { Metadata } from 'next';
import Capsule from '@/components/anniversary/Capsule';
import Preparation from '@/components/anniversary/Preparation';

/** 线上默认关闭：只有显式设置 NEXT_PUBLIC_ANNIVERSARY_OPEN=1 才展示完整内容 */
const opened = process.env.NEXT_PUBLIC_ANNIVERSARY_OPEN === '1';

/** 关闭时连标题一起换，避免占位页露出「星图 / 时光机」的字样 */
export function generateMetadata(): Metadata {
  if (!opened) {
    return {
      title: '500 · 纪念日筹备中',
      description: '此处正在筹备 500 天纪念日，2026.12.18 见。',
    };
  }
  return {
    title: '730 天 · 时间胶囊',
    description: '写给 2027.08.04 的一封信。现在封存，到建站两周年那天自己打开。',
  };
}

export default function CapsuleRoute() {
  return opened ? <Capsule /> : <Preparation />;
}

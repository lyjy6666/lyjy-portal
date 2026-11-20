import type { Metadata } from 'next';
import StarLog from '@/components/anniversary/StarLog';
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
    title: '500 · 星图',
    description: '把 500 天压成一条轨道：36 个存档、4 条产品线、1 次合并、22 个入口。真实数据，不是模拟统计。',
  };
}

export default function AnniversaryRoute() {
  return opened ? <StarLog /> : <Preparation />;
}

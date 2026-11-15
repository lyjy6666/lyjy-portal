import type { Metadata } from 'next';
import TimeMachine from '@/components/anniversary/TimeMachine';
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
    title: '500 · 时光机',
    description: '13 个还能启动的旧存档，加上 V3.0 到 V7.0 的六代线上门户。点一个日期，直接走进那一天。',
  };
}

export default function TimeMachineRoute() {
  return opened ? <TimeMachine /> : <Preparation />;
}

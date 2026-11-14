import type { Metadata } from 'next';
import TimeMachine from '@/components/anniversary/TimeMachine';

export const metadata: Metadata = {
  title: '500 · 时光机',
  description: '13 个还能启动的旧存档，加上 V3.0 到 V7.0 的六代线上门户。点一个日期，直接走进那一天。',
};

export default function TimeMachineRoute() {
  return <TimeMachine />;
}

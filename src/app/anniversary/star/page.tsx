import type { Metadata } from 'next';
import StarLog from '@/components/anniversary/StarLog';

export const metadata: Metadata = {
  title: '500 · 星图',
  description: '把 500 天压成一条轨道：36 个存档、4 条产品线、1 次合并、22 个入口。真实数据，不是模拟统计。',
};

export default function StarLogRoute() {
  return <StarLog />;
}

import type { Metadata } from 'next';
import Capsule from '@/components/anniversary/Capsule';

export const metadata: Metadata = {
  title: '730 天 · 时间胶囊',
  description: '写给 2027.08.04 的一封信。现在封存，到建站两周年那天自己打开。',
};

export default function CapsuleRoute() {
  return <Capsule />;
}

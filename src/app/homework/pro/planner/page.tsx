import type { Metadata } from 'next';
import PlannerPage from '@/features/homework-pro/ui/pages/PlannerPage';
import '@/features/homework-pro/skins/tokens.css';
import '@/features/homework-pro/skins/pro.css';

export const metadata: Metadata = {
  title: 'AI 智能排期 · 作业管理系统 Pro',
  description: '按年级、薄弱项与作业内容估算用时，自动把作业均衡分配到每一天。',
};

export default function HomeworkPlannerPage() {
  return <PlannerPage />;
}

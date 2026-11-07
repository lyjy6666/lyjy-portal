import type { Metadata } from 'next';
import HomeworkProApp from '@/features/homework-pro/ui/HomeworkProApp';
// 换肤样式只作用于 [data-skin] 子树，不写 :root，不会污染首页 / 原版 /homework
import '@/features/homework-pro/skins/tokens.css';
import '@/features/homework-pro/skins/pro.css';

export const metadata: Metadata = {
  title: '作业管理系统 Pro',
  description: '作业管理系统 Pro 版：全新重构、多套换肤、看板与统计、离线可用；新旧两版并存，数据互通。',
};

export default function HomeworkProPage() {
  return <HomeworkProApp />;
}

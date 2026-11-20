import type { Metadata } from 'next';
import { StudyRoom } from '@/features/studyroom/components/StudyRoom';

export const metadata: Metadata = {
  title: 'LYJY 自习室 · 番茄钟',
  description: '全新重构的 LYJY 自习室：专注计时、今日计划、白噪音与专注记录。',
};

export default function PomodoroPage() {
  return <StudyRoom />;
}

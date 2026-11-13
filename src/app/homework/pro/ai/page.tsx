import AiChatApp from '@/features/homework-pro/ui/features/AiChatPage';

export const metadata = {
  title: 'AI 问答 | 作业管理系统 Pro',
  description: 'Pro 版 AI 问答：多会话聊天记录、双模型、学习画像深度分析。',
};

/** AI 问答是独立页面（左右两栏），不再从工作台开浮层 */
export default function AiChatRoute() {
  return <AiChatApp />;
}

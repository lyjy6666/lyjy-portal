import AiChatApp from '@/features/homework-pro/ui/features/AiChatPage';
// 每个 Pro 独立路由都要自己引入换肤样式：只在 /homework/pro/page.tsx 引，
// 新路由会拿不到任何 hw-* 样式，退化成纯文字界面
import '@/features/homework-pro/skins/tokens.css';
import '@/features/homework-pro/skins/pro.css';

export const metadata = {
  title: 'AI 问答 | 作业管理系统 Pro',
  description: 'Pro 版 AI 问答：多会话聊天记录、双模型、学习画像深度分析。',
};

/** AI 问答是独立页面（左右两栏），不再从工作台开浮层 */
export default function AiChatRoute() {
  return <AiChatApp />;
}

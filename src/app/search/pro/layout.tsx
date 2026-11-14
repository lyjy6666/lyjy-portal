import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '搜索页 Pro · LYJY 门户' },
  description:
    '聚合 23 个搜索引擎与 6 个 AI 助手的起始页：搜索历史、本地壁纸、语音输入、快捷键。纯前端拼接 URL 跳转，不经过本站服务器，不需要登录。',
};

export default function SearchProLayout({ children }: { children: React.ReactNode }) {
  return children;
}

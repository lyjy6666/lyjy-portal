import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'LYJY 门户 | 工具箱导航',
    template: '%s | LYJY 门户',
  },
  description:
    'LYJY 门户 - 整合格式转换、搜索、作业管理、番茄钟、语音朗读、视频等工具于一体的统一入口',
  keywords: [
    'LYJY',
    '工具箱',
    '导航',
    '格式转换',
    '搜索',
    '作业管理',
    '番茄钟',
    '语音朗读',
  ],
  authors: [{ name: 'LYJY' }],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/*
          FontAwesome 改为站内自托管：原先走 cdn.jsdelivr.net，该 CDN 在部分网络下
          直接连接失败（返回 000），会导致全站图标字体加载不出来，
          纯图标按钮（如播放器全屏）看起来就像「消失了」。
        */}
        <link rel="stylesheet" href="/vendor/fontawesome/css/all.min.css" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

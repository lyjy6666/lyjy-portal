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
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css"
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

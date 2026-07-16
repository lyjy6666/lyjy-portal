import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 构建时跳过 TypeScript 检查（本地开发仍会提示）
  typescript: {
    ignoreBuildErrors: true,
  },
  // 允许外部图片域名（用于名言背景等）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;

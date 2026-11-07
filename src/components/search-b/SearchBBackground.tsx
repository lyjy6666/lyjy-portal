'use client';

import { motion } from 'framer-motion';

/**
 * 搜索页 B 版背景：纯 CSS 多壁纸系统。
 *
 * 相比 A 版把一张 Coze 临时签名 URL 硬编码进代码（随时可能过期、挂了就纯黑），
 * 这里全部用 CSS 渐变 + 光斑 + 噪点在本地渲染，零外部图片依赖、永不失效，且可切换。
 */

export type Wallpaper = {
  id: string;
  name: string;
  /** 基础背景 CSS */
  base: string;
  blobs: {
    color: string;
    /** 位置与尺寸（Tailwind 类） */
    pos: string;
    duration: number;
    delay: number;
  }[];
};

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'night',
    name: '墨夜',
    base: 'linear-gradient(160deg, #0b1220 0%, #0a0f1c 45%, #070b14 100%)',
    blobs: [
      { color: '#3b82f6', pos: 'left-[6%] top-[10%] h-[42vw] w-[42vw] max-h-[560px] max-w-[560px]', duration: 11, delay: 0 },
      { color: '#8b5cf6', pos: 'right-[4%] bottom-[6%] h-[38vw] w-[38vw] max-h-[500px] max-w-[500px]', duration: 13, delay: 2 },
      { color: '#0ea5e9', pos: 'left-[38%] bottom-[-8%] h-[30vw] w-[30vw] max-h-[420px] max-w-[420px]', duration: 15, delay: 4 },
    ],
  },
  {
    id: 'aurora',
    name: '极光',
    base: 'linear-gradient(155deg, #04141a 0%, #061a1f 50%, #04100f 100%)',
    blobs: [
      { color: '#10b981', pos: 'left-[10%] top-[8%] h-[40vw] w-[40vw] max-h-[540px] max-w-[540px]', duration: 12, delay: 0 },
      { color: '#06b6d4', pos: 'right-[8%] top-[24%] h-[34vw] w-[34vw] max-h-[460px] max-w-[460px]', duration: 14, delay: 1.5 },
      { color: '#a78bfa', pos: 'left-[30%] bottom-[-6%] h-[36vw] w-[36vw] max-h-[480px] max-w-[480px]', duration: 16, delay: 3 },
    ],
  },
  {
    id: 'dusk',
    name: '暮色',
    base: 'linear-gradient(150deg, #1a0f1c 0%, #1c1220 48%, #140b16 100%)',
    blobs: [
      { color: '#f472b6', pos: 'left-[8%] top-[12%] h-[40vw] w-[40vw] max-h-[520px] max-w-[520px]', duration: 13, delay: 0 },
      { color: '#fb923c', pos: 'right-[6%] bottom-[10%] h-[38vw] w-[38vw] max-h-[500px] max-w-[500px]', duration: 12, delay: 2 },
      { color: '#e879f9', pos: 'left-[42%] bottom-[-8%] h-[30vw] w-[30vw] max-h-[420px] max-w-[420px]', duration: 17, delay: 4 },
    ],
  },
  {
    id: 'forest',
    name: '松林',
    base: 'linear-gradient(160deg, #07130d 0%, #0a1a12 50%, #06110c 100%)',
    blobs: [
      { color: '#22c55e', pos: 'left-[10%] top-[10%] h-[38vw] w-[38vw] max-h-[500px] max-w-[500px]', duration: 14, delay: 0 },
      { color: '#14b8a6', pos: 'right-[8%] bottom-[8%] h-[36vw] w-[36vw] max-h-[480px] max-w-[480px]', duration: 15, delay: 2.5 },
    ],
  },
  {
    id: 'mono',
    name: '素墨',
    base: 'linear-gradient(165deg, #101214 0%, #0c0e10 50%, #08090b 100%)',
    blobs: [
      { color: '#64748b', pos: 'left-[16%] top-[16%] h-[34vw] w-[34vw] max-h-[460px] max-w-[460px]', duration: 16, delay: 0 },
      { color: '#475569', pos: 'right-[14%] bottom-[12%] h-[30vw] w-[30vw] max-h-[420px] max-w-[420px]', duration: 18, delay: 3 },
    ],
  },
];

export const DEFAULT_WALLPAPER_ID = 'night';

// 细腻噪点（内联 SVG，无外部请求）
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function SearchBBackground({ wallpaperId }: { wallpaperId: string }) {
  const wp = WALLPAPERS.find((w) => w.id === wallpaperId) ?? WALLPAPERS[0];

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden transition-[background] duration-700"
      style={{ background: wp.base }}
      aria-hidden="true"
    >
      {/* 流动光斑 */}
      {wp.blobs.map((b, i) => (
        <motion.div
          key={`${wp.id}-${i}`}
          className={`absolute rounded-full blur-[90px] ${b.pos}`}
          style={{ backgroundColor: b.color }}
          initial={{ opacity: 0.28, scale: 1 }}
          animate={{ opacity: [0.28, 0.46, 0.28], scale: [1, 1.14, 1] }}
          transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
        />
      ))}

      {/* 极淡网格，增加质感 */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* 噪点颗粒 */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: '160px' }}
      />

      {/* 上下压暗，提升前景文字可读性 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />
    </div>
  );
}

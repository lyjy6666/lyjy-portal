'use client';

/**
 * 「首字 + 品牌色」图标：搜索引擎 / 快速访问 / 应用网格共用。
 * 零外部图标依赖，视觉统一。
 */
export default function AppIcon({
  initial,
  accent,
  size = 40,
  className = '',
}: {
  initial: string;
  accent: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl font-semibold text-white ring-1 ring-white/10 shadow-lg ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: accent,
        fontSize: Math.round(size * 0.42),
      }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

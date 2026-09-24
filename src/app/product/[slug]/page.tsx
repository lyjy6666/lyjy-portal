import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PRODUCTS, getProduct } from '@/data/products';

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

// 每个产品的强调色（用于光晕 / 渐变，让四页各有个性）
const ACCENT: Record<string, { hex: string; glow: string; from: string; to: string }> = {
  blue: { hex: '#3b82f6', glow: 'rgba(59,130,246,0.45)', from: 'from-blue-500/20', to: 'to-blue-600/5' },
  green: { hex: '#22c55e', glow: 'rgba(34,197,94,0.45)', from: 'from-green-500/20', to: 'to-green-600/5' },
  purple: { hex: '#a855f7', glow: 'rgba(168,85,247,0.45)', from: 'from-purple-500/20', to: 'to-purple-600/5' },
  cyan: { hex: '#06b6d4', glow: 'rgba(6,182,212,0.45)', from: 'from-cyan-500/20', to: 'to-cyan-600/5' },
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const accent = ACCENT[product.color] ?? ACCENT.blue;

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0a0c12] text-white">
      {/* 背景：双层强调色光晕 + 细网格 */}
      <div
        className="pointer-events-none absolute -top-40 -right-32 h-[40rem] w-[40rem] rounded-full blur-[120px] opacity-40 animate-float"
        style={{ background: accent.glow }}
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-40 h-[36rem] w-[36rem] rounded-full blur-[130px] opacity-25 animate-float"
        style={{ background: accent.glow, animationDelay: '1.5s' }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        {/* 面包屑 */}
        <nav className="mb-10 flex items-center gap-2 text-sm text-white/45 animate-fade-in-up">
          <Link href="/" className="transition-colors hover:text-white">导航系统</Link>
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
          <span className="text-white/70">下载专区</span>
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
          <span className="text-white">{product.name}</span>
        </nav>

        {/* 英雄区：非对称排版 */}
        <header className="mb-14 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="min-w-0 flex-1">
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: `${accent.hex}55`, color: accent.hex, background: `${accent.hex}14` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent.hex }}></span>
              体积 {product.size} · 官方发布
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              {product.name}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg" style={{ fontWeight: 300 }}>
              {product.tagline}
            </p>
          </div>

          {/* 图标徽章：发光圆环 + 浮动 */}
          <div className="relative flex-shrink-0 animate-float">
            <div
              className="absolute inset-0 rounded-3xl blur-2xl opacity-50"
              style={{ background: accent.glow }}
            />
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-3xl border sm:h-36 sm:w-36"
              style={{ borderColor: `${accent.hex}55`, background: `${accent.hex}1a` }}
            >
              <i className={`fa-solid ${product.icon} text-5xl sm:text-6xl`} style={{ color: accent.hex }}></i>
            </div>
          </div>
        </header>

        {/* 简介：编辑式陈述 */}
        <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative border-l-2 pl-6" style={{ borderColor: accent.hex }}>
            <p className="text-lg leading-relaxed text-white/85 sm:text-xl">
              {product.desc}
            </p>
          </div>
        </section>

        {/* 功能亮点：编号 + hairline，非套娃卡片 */}
        <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">功能亮点</h2>
            <span className="text-sm text-white/40">{product.features.length} 项核心能力</span>
          </div>
          <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {product.features.map((f, i) => (
              <div
                key={f.title}
                className="flex gap-4 border-b border-white/10 py-5"
              >
                <span
                  className="font-mono text-sm font-medium tabular-nums"
                  style={{ color: accent.hex }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <i className="fa-solid fa-circle-check text-sm" style={{ color: accent.hex }}></i>
                    <span className="font-medium text-white">{f.title}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/60">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 注意事项 */}
        {product.note && (
          <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div
              className="flex items-start gap-3 rounded-2xl border p-5"
              style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}
            >
              <i className="fa-solid fa-triangle-exclamation mt-0.5 text-amber-400"></i>
              <div>
                <p className="mb-1 text-sm font-medium text-amber-200">使用须知</p>
                <p className="text-sm leading-relaxed text-amber-100/80">{product.note}</p>
              </div>
            </div>
          </section>
        )}

        {/* 下载 CTA：精致主面板 + 微光按钮 */}
        <section
          className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${accent.from} ${accent.to} p-8 text-center sm:p-12 animate-fade-in-up`}
          style={{ animationDelay: '0.25s', borderColor: `${accent.hex}33` }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ background: `radial-gradient(60% 120% at 50% 0%, ${accent.glow}, transparent)` }} />
          <div className="relative">
            <h3 className="text-xl font-semibold sm:text-2xl">准备好开始了吗？</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
              确认信息无误后，点击下方按钮即可获取 {product.name}。完全免费，无需登录。
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={product.downloadUrl}
                target={product.external ? '_blank' : undefined}
                rel={product.external ? 'noopener noreferrer' : undefined}
                download={product.external ? undefined : ''}
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl px-10 py-4 text-base font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-[1.03]"
                style={{ background: accent.hex }}
              >
                <span className="absolute inset-0 -translate-x-full animate-shimmer group-hover:translate-x-full" style={{ transition: 'transform 0.6s' }}></span>
                <i className="fa-solid fa-download"></i>
                {product.downloadLabel}
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-8 py-4 text-base font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
              >
                <i className="fa-solid fa-arrow-left"></i>
                返回导航
              </Link>
            </div>
            {product.external && (
              <p className="mt-4 text-xs text-white/40">点击后将跳转至外部资源站点获取安装包</p>
            )}
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-white/30">
          LYJY 门户 · 下载专区 · 本站所有工具均免费提供
        </footer>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRODUCTS, getProduct } from '@/data/products';
import { productFontVars } from '../fonts';
import HashCopy from './HashCopy';
import AppPreview from './AppPreview';
import '../product-themes.css';

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} 下载`,
    description: product.tagline,
  };
}

const ICONS: Record<string, React.ReactNode> = {
  qianglilock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  'toolbox-desktop': (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  'windows-toolbox': (
    <>
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
      <path d="M3 7l9 5 9-5" />
      <path d="M12 12v10" />
    </>
  ),
  'windows-tool-web': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.4 3.8 5.4 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3Z" />
    </>
  ),
};

function formatBytes(n?: number) {
  if (!n) return null;
  if (n < 1024) return `${n} 字节`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Icon({ slug, size = 24 }: { slug: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[slug] ?? ICONS['windows-toolbox']}
    </svg>
  );
}

/** 区块标题：左标题 + 右注脚，下面一条分隔线 */
function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[1.0625rem] font-semibold">{children}</h2>
        {hint && <span className="pt-label">{hint}</span>}
      </div>
      <hr className="pt-rule mt-3" />
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const theme = product.theme ?? 'aurora';
  const offline = product.offline === true;
  const sizeText = formatBytes(product.bytes);
  const metaChips = [product.platform, product.size, product.format, product.version].filter(Boolean) as string[];
  /** organic 主题用衬线标题，标题需要稍大的字号补偿 */
  const isSerif = theme === 'organic';

  return (
    <div data-ptheme={theme} className={productFontVars}>
      {/* 顶栏 */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: 'color-mix(in oklab, var(--pt-bg) 82%, transparent)',
          borderBottom: '1px solid var(--pt-line)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[0.8125rem] transition-opacity hover:opacity-70"
            style={{ color: 'var(--pt-ink-dim)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            返回导航
          </Link>
          <span className="pt-label">LYJY 下载专区</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        {/* ============ 头部 + 下载面板 ============ */}
        <section className="grid gap-10 py-14 md:grid-cols-[1fr_19rem] md:py-20">
          <div>
            <div
              className="mb-7 inline-flex h-14 w-14 items-center justify-center"
              style={{
                background: 'var(--pt-chip-bg)',
                border: '1px solid var(--pt-line)',
                borderRadius: 'var(--pt-radius)',
                color: 'var(--pt-ink)',
              }}
            >
              <Icon slug={product.slug} size={26} />
            </div>

            <h1
              className={`${isSerif ? 'text-[2.5rem] sm:text-[3.25rem]' : 'text-[2.25rem] sm:text-[3rem]'} font-bold leading-[1.08]`}
            >
              {product.name}
            </h1>

            <p
              className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed"
              style={{ color: 'var(--pt-ink-dim)' }}
            >
              {product.tagline}
            </p>

            {metaChips.length > 0 && (
              <ul className="mt-7 flex flex-wrap gap-2">
                {metaChips.map((m) => (
                  <li key={m} className="pt-chip">
                    {m}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 下载面板 */}
          <aside className="pt-panel p-6 md:sticky md:top-24 md:self-start">
            {offline ? (
              <>
                <div className="pt-label mb-3">项目状态</div>
                <p className="text-[0.9375rem] font-semibold" style={{ color: 'var(--pt-ink)' }}>
                  已下线
                </p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--pt-ink-dim)' }}>
                  {product.offlineNote ?? '该项目已下线，不再提供下载。'}
                </p>
                <div className="pt-offline mt-5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v5" />
                    <path d="M12 16.5v.01" />
                  </svg>
                  <span>
                    想要格式转换？网页版工具箱一直在维护，功能更全且无需下载。
                  </span>
                </div>
                <Link
                  href="/toolbox/pro"
                  className="pt-btn mt-5"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                  去用网页版工具箱
                </Link>
              </>
            ) : (
              <>
                <div className="pt-label">获取安装包</div>

                {product.fileName ? (
                  <p className="mt-2.5 break-all font-mono text-[0.75rem]" style={{ color: 'var(--pt-ink-dim)' }}>
                    {product.fileName}
                    {sizeText ? ` · ${sizeText}` : ''}
                  </p>
                ) : (
                  product.size && (
                    <p className="mt-2.5 text-[0.8125rem]" style={{ color: 'var(--pt-ink-dim)' }}>
                      {product.size}
                    </p>
                  )
                )}

                <a
                  href={product.downloadUrl}
                  target={product.external ? '_blank' : undefined}
                  rel={product.external ? 'noopener noreferrer' : undefined}
                  /* 用 fileName 作保存名：URL 走 ASCII 更稳，用户拿到的仍是中文名 */
                  download={product.external ? undefined : product.fileName || ''}
                  className="pt-btn mt-5"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                  {product.downloadLabel}
                </a>

                {product.external && (
                  <p className="mt-3 text-[0.75rem] leading-relaxed" style={{ color: 'var(--pt-ink-faint)' }}>
                    将跳转到外部资源站获取安装包
                  </p>
                )}

                <hr className="pt-rule my-5" />

                <dl className="space-y-2.5 text-[0.75rem]">
                  {product.requirement && (
                    <div className="flex gap-3">
                      <dt style={{ color: 'var(--pt-ink-faint)' }} className="w-14 shrink-0">
                        运行环境
                      </dt>
                      <dd className="min-w-0 flex-1">{product.requirement}</dd>
                    </div>
                  )}
                  {product.updatedAt && (
                    <div className="flex gap-3">
                      <dt style={{ color: 'var(--pt-ink-faint)' }} className="w-14 shrink-0">
                        最近更新
                      </dt>
                      <dd className="min-w-0 flex-1">{product.updatedAt}</dd>
                    </div>
                  )}
                  {product.sha256 && (
                    <div className="flex gap-3">
                      <dt style={{ color: 'var(--pt-ink-faint)' }} className="w-14 shrink-0">
                        校验
                      </dt>
                      <dd className="min-w-0 flex-1">
                        <a
                          href="#file-info"
                          className="underline underline-offset-2 transition-opacity hover:opacity-70"
                        >
                          查看 SHA-256
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </>
            )}
          </aside>
        </section>

        {/* ============ 应用界面预览（仅带 preview 的产品） ============ */}
        {product.preview && (
          <section className="py-10">
            <SectionTitle hint="Preview">界面预览</SectionTitle>
            <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-center">
              <AppPreview kind={product.preview} />
              <div>
                <h3 className="text-[1.0625rem] font-semibold">锁屏期间，干扰进不来</h3>
                <p className="mt-3 text-[0.875rem] leading-[1.8]" style={{ color: 'var(--pt-ink-dim)' }}>
                  锁定后整个桌面被覆盖，任务切换与关闭窗口的快捷键一并禁用，
                  屏幕 30 秒后自动变暗。倒计时归零才自动解锁。
                </p>
                <ul className="mt-5 space-y-2.5">
                  {['多档时长：2 分钟到 5 小时', '3 次临时操作机会，每次 20 秒', '不写注册表，退出即还原'].map((t) => (
                    <li key={t} className="flex gap-2.5 text-[0.8125rem]" style={{ color: 'var(--pt-ink-dim)' }}>
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--pt-accent)' }} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[0.6875rem]" style={{ color: 'var(--pt-ink-faint)' }}>
                  上图是按程序界面绘制的示意图，非真实截图。
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ============ 产品简介 ============ */}
        <section className="py-10">
          <SectionTitle hint="About">产品简介</SectionTitle>
          <p
            className="max-w-3xl text-[0.9375rem] leading-[1.85]"
            style={{ color: 'var(--pt-ink-dim)' }}
          >
            {product.desc}
          </p>
        </section>

        {/* ============ 功能特性 ============ */}
        <section className="py-10">
          <SectionTitle hint={`${product.features.length} 项`}>功能特性</SectionTitle>
          <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {product.features.map((f, i) => (
              <div key={f.title} className="flex gap-4">
                {/* 序号当视觉锚点，比图标更克制 */}
                <span
                  className="mt-0.5 shrink-0 font-mono text-[0.6875rem] tabular-nums"
                  style={{ color: 'var(--pt-ink-faint)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[0.9375rem] font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--pt-ink-dim)' }}>
                    {f.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 安装步骤 ============ */}
        {product.steps && product.steps.length > 0 && (
          <section className="py-10">
            <SectionTitle hint="Steps">安装与使用</SectionTitle>
            <ol className="max-w-3xl space-y-0">
              {product.steps.map((s, i) => (
                <li
                  key={s}
                  className="flex gap-4 py-4"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--pt-line)' }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] tabular-nums"
                    style={{ background: 'var(--pt-chip-bg)', color: 'var(--pt-ink-dim)', border: '1px solid var(--pt-line)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[0.875rem] leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ============ 文件校验 ============ */}
        {(product.sha256 || product.bytes || product.fileName) && (
          <section id="file-info" className="scroll-mt-24 py-10">
            <SectionTitle hint="Verification">文件校验</SectionTitle>
            <div className="pt-panel overflow-hidden">
              <dl>
                {product.fileName && (
                  <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-6" style={{ borderBottom: '1px solid var(--pt-line)' }}>
                    <dt className="w-28 shrink-0 text-[0.8125rem]" style={{ color: 'var(--pt-ink-faint)' }}>
                      文件名
                    </dt>
                    <dd className="min-w-0 flex-1 break-all font-mono text-[0.8125rem]">{product.fileName}</dd>
                  </div>
                )}
                {sizeText && (
                  <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-6" style={{ borderBottom: '1px solid var(--pt-line)' }}>
                    <dt className="w-28 shrink-0 text-[0.8125rem]" style={{ color: 'var(--pt-ink-faint)' }}>
                      大小
                    </dt>
                    <dd className="min-w-0 flex-1 text-[0.8125rem]">
                      {sizeText}
                      {product.bytes && (
                        <span className="ml-2 font-mono text-[0.75rem]" style={{ color: 'var(--pt-ink-faint)' }}>
                          ({product.bytes.toLocaleString('en-US')} 字节)
                        </span>
                      )}
                    </dd>
                  </div>
                )}
                {product.sha256 && (
                  <div className="px-5 py-4">
                    <dt className="mb-2.5 text-[0.8125rem]" style={{ color: 'var(--pt-ink-faint)' }}>
                      SHA-256
                    </dt>
                    <dd>
                      <HashCopy value={product.sha256} />
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <p className="mt-3 text-[0.75rem] leading-relaxed" style={{ color: 'var(--pt-ink-faint)' }}>
              下载后可用 <code className="font-mono">certutil -hashfile 文件名 SHA256</code> 核对，
              确认与上方一致再运行。
            </p>
          </section>
        )}

        {/* ============ 常见问题 ============ */}
        {product.faq && product.faq.length > 0 && (
          <section className="py-10">
            <SectionTitle hint="FAQ">常见问题</SectionTitle>
            <div className="max-w-3xl space-y-6">
              {product.faq.map((item) => (
                <div key={item.q}>
                  <h3 className="text-[0.9375rem] font-semibold">{item.q}</h3>
                  <p className="mt-2 text-[0.875rem] leading-relaxed" style={{ color: 'var(--pt-ink-dim)' }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="relative z-10 mx-auto max-w-5xl px-5 pb-12 sm:px-8">
        <hr className="pt-rule mb-5" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="pt-label">LYJY 下载专区</span>
          <Link
            href="/"
            className="text-[0.75rem] transition-opacity hover:opacity-70"
            style={{ color: 'var(--pt-ink-faint)' }}
          >
            返回导航首页
          </Link>
        </div>
      </footer>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRODUCTS, getProduct } from '@/data/products';
import HashCopy from './HashCopy';

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

// Tailwind 只识别字面量类名，所以这里把每个配色的类名写全，不用模板拼接
const ACCENT: Record<string, { tile: string; icon: string; btn: string; chip: string; bar: string }> = {
  blue: {
    tile: 'bg-blue-50 border-blue-100',
    icon: 'text-blue-600',
    btn: 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600',
    chip: 'bg-blue-50 text-blue-700 border-blue-100',
    bar: 'bg-blue-600',
  },
  green: {
    tile: 'bg-emerald-50 border-emerald-100',
    icon: 'text-emerald-600',
    btn: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-emerald-600',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    bar: 'bg-emerald-600',
  },
  purple: {
    tile: 'bg-violet-50 border-violet-100',
    icon: 'text-violet-600',
    btn: 'bg-violet-600 hover:bg-violet-700 focus-visible:outline-violet-600',
    chip: 'bg-violet-50 text-violet-700 border-violet-100',
    bar: 'bg-violet-600',
  },
  cyan: {
    tile: 'bg-cyan-50 border-cyan-100',
    icon: 'text-cyan-600',
    btn: 'bg-cyan-600 hover:bg-cyan-700 focus-visible:outline-cyan-600',
    chip: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    bar: 'bg-cyan-600',
  },
};

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

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{children}</h2>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
      <dt className="w-28 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className={`min-w-0 flex-1 text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>{children}</dd>
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const a = ACCENT[product.color] ?? ACCENT.blue;
  const icon = ICONS[product.slug] ?? ICONS['windows-toolbox'];

  const metaChips = [product.platform, product.size, product.format, product.version].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            返回导航
          </Link>
          <span className="text-sm text-slate-400">LYJY 下载专区</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        {/* 产品头部 + 下载面板 */}
        <section className="grid gap-8 py-12 md:grid-cols-[1fr_20rem] md:py-16">
          <div>
            <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${a.tile}`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={a.icon}>
                {icon}
              </svg>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{product.name}</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">{product.tagline}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {metaChips.map((m) => (
                <li key={m} className={`rounded-full border px-3 py-1 text-xs ${a.chip}`}>
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {/* 下载面板 */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:sticky md:top-20 md:self-start">
            <div className="text-sm font-medium text-slate-900">获取安装包</div>
            {product.fileName ? (
              <p className="mt-1.5 break-all font-mono text-xs text-slate-500">
                {product.fileName}
                {formatBytes(product.bytes) ? ` · ${formatBytes(product.bytes)}` : ''}
              </p>
            ) : (
              product.size && <p className="mt-1.5 text-xs text-slate-500">{product.size}</p>
            )}

            <a
              href={product.downloadUrl}
              target={product.external ? '_blank' : undefined}
              rel={product.external ? 'noopener noreferrer' : undefined}
              download={product.external ? undefined : ''}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition ${a.btn}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              {product.downloadLabel}
            </a>

            {product.external && <p className="mt-3 text-xs leading-relaxed text-slate-500">将跳转到外部资源站获取安装包</p>}

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs">
              {product.requirement && (
                <p className="flex gap-2">
                  <span className="text-slate-400">运行环境</span>
                  <span className="text-slate-700">{product.requirement}</span>
                </p>
              )}
              {product.updatedAt && (
                <p className="flex gap-2">
                  <span className="text-slate-400">最近更新</span>
                  <span className="text-slate-700">{product.updatedAt}</span>
                </p>
              )}
              {product.sha256 && (
                <p className="flex gap-2">
                  <span className="text-slate-400">校验</span>
                  <a href="#file-info" className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500">
                    查看 SHA-256
                  </a>
                </p>
              )}
            </div>

            {product.note && (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">{product.note}</p>
            )}
          </aside>
        </section>

        {/* 产品简介 */}
        <section className="border-t border-slate-200 py-12">
          <SectionTitle>产品简介</SectionTitle>
          <p className="max-w-3xl text-[15px] leading-8 text-slate-700">{product.desc}</p>
        </section>

        {/* 功能特性 */}
        <section className="border-t border-slate-200 py-12">
          <SectionTitle hint={`${product.features.length} 项核心能力`}>功能特性</SectionTitle>
          <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {product.features.map((f) => (
              <li key={f.title} className="flex gap-3.5">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${a.tile}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={a.icon}>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">{f.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 文件信息 */}
        <section id="file-info" className="scroll-mt-20 border-t border-slate-200 py-12">
          <SectionTitle hint="下载后可自行核对">文件信息</SectionTitle>
          <dl className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {product.fileName && (
              <Row label="文件名" mono>
                {product.fileName}
              </Row>
            )}
            {product.bytes && (
              <Row label="文件大小">
                {formatBytes(product.bytes)}
                <span className="ml-2 text-slate-400">（{product.bytes.toLocaleString()} 字节）</span>
              </Row>
            )}
            {product.format && <Row label="文件格式">{product.format}</Row>}
            {product.platform && <Row label="适用系统">{product.platform}</Row>}
            {product.requirement && <Row label="运行要求">{product.requirement}</Row>}
            {product.version && <Row label="版本">{product.version}</Row>}
            {product.updatedAt && <Row label="最近更新">{product.updatedAt}</Row>}
            {product.sha256 ? (
              <Row label="SHA-256">
                <HashCopy value={product.sha256} />
                <p className="mt-2 text-xs text-slate-400">
                  在 Windows 上可用 PowerShell 执行{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">Get-FileHash 文件名 -Algorithm SHA256</code> 对比结果。
                </p>
              </Row>
            ) : (
              <Row label="校验值">
                <span className="text-slate-500">该资源托管在外部网盘，未提供校验值。</span>
              </Row>
            )}
          </dl>
        </section>

        {/* 安装步骤 */}
        {product.steps?.length ? (
          <section className="border-t border-slate-200 py-12">
            <SectionTitle>安装步骤</SectionTitle>
            <ol className="max-w-3xl space-y-4">
              {product.steps.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${a.bar}`}>
                    {i + 1}
                  </span>
                  <p className="text-sm leading-7 text-slate-700">{s}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* 常见问题 */}
        {product.faq?.length ? (
          <section className="border-t border-slate-200 py-12">
            <SectionTitle>常见问题</SectionTitle>
            <div className="max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {product.faq.map((item) => (
                <div key={item.q} className="px-5 py-4">
                  <div className="text-sm font-medium text-slate-900">{item.q}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>LYJY 下载专区 · 所有工具均免费提供，不含任何付费或捆绑内容</span>
          <Link href="/" className="text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500">
            返回导航系统
          </Link>
        </footer>
      </main>
    </div>
  );
}

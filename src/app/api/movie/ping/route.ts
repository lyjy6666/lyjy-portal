import { NextRequest, NextResponse } from 'next/server';

// 测速必须每次都真实打到采集站，不能被静态化或被代理缓存
export const dynamic = 'force-dynamic';

const DEFAULT_COLLECTOR_URL = 'https://cj.lziapi.com/api.php/provide/vod/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * 播放线路测速。
 *
 * 只请求采集站最轻量的 ac=class（分类列表，几 KB），返回服务端到该站的真实耗时。
 * 不读缓存、不写缓存、no-store：否则 /api/movie 的 5 分钟缓存会让第二次测速永远显示极快的值。
 */
export async function GET(request: NextRequest) {
  const collector = request.nextUrl.searchParams.get('collector') || DEFAULT_COLLECTOR_URL;

  // 输入校验：只允许公网 http(s) 地址，避免本路由被当成访问内网的任意 URL 代理
  let host = '';
  try {
    const parsed = new URL(collector);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('protocol');
    host = parsed.hostname;
  } catch {
    return NextResponse.json(
      { ok: false, ms: 0, status: 400, error: '采集站地址不合法' },
      { headers: NO_STORE },
    );
  }
  if (/^(localhost|127\.|192\.168\.|10\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(host)) {
    return NextResponse.json(
      { ok: false, ms: 0, status: 400, error: '不允许测速内网地址' },
      { headers: NO_STORE },
    );
  }

  const target = collector + (collector.includes('?') ? '&' : '?') + 'ac=class';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const started = Date.now();

  try {
    const res = await fetch(target, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    const text = await res.text();
    const ms = Date.now() - started;

    // 有些站返回 200 但其实是 HTML 拦截页，必须校验是 MacCMS V10 的 JSON
    let valid = false;
    try {
      const data = JSON.parse(text);
      valid = Boolean(
        data && typeof data === 'object' && ('class' in data || 'total' in data || 'code' in data),
      );
    } catch {
      valid = false;
    }

    return NextResponse.json(
      { ok: res.ok && valid, ms, status: res.status },
      { headers: NO_STORE },
    );
  } catch {
    return NextResponse.json(
      { ok: false, ms: Date.now() - started, status: 0, error: '超时或不可达' },
      { headers: NO_STORE },
    );
  } finally {
    clearTimeout(timer);
  }
}

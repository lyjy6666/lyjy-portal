import { NextRequest, NextResponse } from 'next/server';

// 采集站 API 默认地址（苹果 CMS V10 标准接口）
// 如失效，前端可在设置里更换为其他同格式采集站
const DEFAULT_COLLECTOR_URL = 'https://cj.lziapi.com/api.php/provide/vod/';

// 运行时缓存（短期，避免同一请求重复打到采集站）
const cache = new Map<string, { data: any; expireAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

function readCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expireAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function writeCache(key: string, data: any) {
  cache.set(key, { data, expireAt: Date.now() + CACHE_TTL });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 采集站地址：优先用前端传来的（用户可自定义），否则用默认
    const collectorUrl = searchParams.get('collector') || DEFAULT_COLLECTOR_URL;

    // 把前端所有查询参数转发给采集站（ac、pg、t、wd、ids 等）
    const forwardParams = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (key === 'collector') continue; // collector 是本路由自定义参数
      forwardParams.append(key, value);
    }

    const targetUrl = collectorUrl + (collectorUrl.includes('?') ? '&' : '?') + forwardParams.toString();

    // 缓存键：基于目标 URL
    const cacheKey = targetUrl;
    const cached = readCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `采集站返回 ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    writeCache(cacheKey, data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Movie API Error:', error);
    const message = error?.name === 'AbortError' ? '采集站请求超时' : '采集站请求失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

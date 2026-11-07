/**
 * 哈希工具
 *
 * 旧版的问题：所谓「MD5」其实是把 SHA-256 的结果复制过去的假实现，
 * 而且界面上还从不显示 md5 字段。这里用 spark-md5 做真 MD5，
 * SHA 系列用浏览器原生 Web Crypto。
 */

import SparkMD5 from 'spark-md5';

export type HashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const HASH_ALGOS: { id: HashAlgo; label: string; note: string }[] = [
  { id: 'MD5', label: 'MD5', note: '校验用，已不安全，勿用于密码' },
  { id: 'SHA-1', label: 'SHA-1', note: '已不推荐，仅兼容旧系统' },
  { id: 'SHA-256', label: 'SHA-256', note: '通用推荐' },
  { id: 'SHA-384', label: 'SHA-384', note: '更长的 SHA-2' },
  { id: 'SHA-512', label: 'SHA-512', note: '最长，最慢' },
];

/** Web Crypto 支持的算法名 */
const WEB_CRYPTO_NAME: Record<Exclude<HashAlgo, 'MD5'>, string> = {
  'SHA-1': 'SHA-1',
  'SHA-256': 'SHA-256',
  'SHA-384': 'SHA-384',
  'SHA-512': 'SHA-512',
};

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 计算文本哈希 */
export async function hashText(text: string, algo: HashAlgo): Promise<string> {
  if (algo === 'MD5') {
    // spark-md5 接受字符串，内部按 UTF-8 处理
    return SparkMD5.hash(text);
  }
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(WEB_CRYPTO_NAME[algo], data);
  return toHex(digest);
}

/** 计算文件哈希（分块读取，大文件不会一次性吃满内存） */
export async function hashFile(
  file: File,
  algo: HashAlgo,
  onProgress?: (v: number) => void,
  signal?: AbortSignal
): Promise<string> {
  const CHUNK = 2 * 1024 * 1024; // 2MB
  const total = Math.max(1, Math.ceil(file.size / CHUNK));

  if (algo === 'MD5') {
    const spark = new SparkMD5.ArrayBuffer();
    for (let i = 0; i < total; i++) {
      if (signal?.aborted) throw new Error('已取消');
      const slice = file.slice(i * CHUNK, Math.min(file.size, (i + 1) * CHUNK));
      spark.append(await slice.arrayBuffer());
      onProgress?.((i + 1) / total);
    }
    return spark.end();
  }

  // Web Crypto 没有流式 API，只能整块读
  // 大文件时明确提示，而不是悄悄卡死
  if (file.size > 256 * 1024 * 1024) {
    throw new Error('文件超过 256MB，浏览器原生摘要接口需要一次性读入内存，建议改用 MD5');
  }
  const buf = await file.arrayBuffer();
  onProgress?.(1);
  const digest = await crypto.subtle.digest(WEB_CRYPTO_NAME[algo], buf);
  return toHex(digest);
}

/** 一次性算多个算法，方便用户对照 */
export async function hashAll(text: string): Promise<Record<HashAlgo, string>> {
  const entries = await Promise.all(
    HASH_ALGOS.map(async (a) => [a.id, await hashText(text, a.id)] as const)
  );
  return Object.fromEntries(entries) as Record<HashAlgo, string>;
}

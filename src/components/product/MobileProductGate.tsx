'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { isMobileDevice } from '@/components/home/useIsMobile';

/**
 * 产品下载页的手机版硬拦截（第二道防线）。
 *
 * 首页灰显项已经封死，但分享链接、直接输网址、搜索收录仍能进到下载页，
 * 所以这里把整页设为 inert（连下载链接的键盘聚焦一起断掉），只留一层说明。
 * 有 Android 安装包的产品（AI 聊天）传 allowed=true 放行；
 * 手机在浏览器「更多」里开启「访问桌面版」后 UA 变为桌面，此层自动消失。
 */
export default function MobileProductGate({ allowed }: { allowed: boolean }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setBlocked(!allowed && isMobileDevice());
  }, [allowed]);

  useEffect(() => {
    if (!blocked) return;
    const page = document.getElementById('pt-page');
    const prevOverflow = document.body.style.overflow;
    page?.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';
    return () => {
      page?.removeAttribute('inert');
      document.body.style.overflow = prevOverflow;
    };
  }, [blocked]);

  if (!blocked || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="仅电脑版可访问"
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', background: 'rgba(6, 12, 20, .97)',
        backdropFilter: 'blur(8px)', color: '#e8eef5',
        font: '14px/1.75 system-ui, "PingFang SC", "Microsoft YaHei", sans-serif',
        textAlign: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '22rem' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24', marginBottom: 12 }}>
          仅电脑版可访问
        </div>
        <p style={{ margin: '0 0 10px' }}>
          这是 Windows 程序，手机上无法安装或打开，只有电脑版才能下载使用。
        </p>
        <p style={{ margin: '0 0 22px', fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
          也可以在浏览器「更多」里开启「访问桌面版 / 桌面网站」。
          手机版常见限制：部分网站无法访问、格式出错、乱码等。
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block', padding: '10px 26px', borderRadius: 999,
            background: 'linear-gradient(90deg,#38bdf8,#22d3ee)', color: '#0f172a',
            fontWeight: 700, textDecoration: 'none',
          }}
        >
          返回导航首页
        </a>
      </div>
    </div>,
    document.body,
  );
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'pomodoro_captcha_passed';

export function CaptchaGate({ children }: { children: ReactNode }) {
  // 三个状态：null=SSR/未就绪（不渲染遮罩），true=已通过，false=待验证
  const [passed, setPassed] = useState<boolean | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // 首次挂载：读取 sessionStorage 判断是否已通过
  useEffect(() => {
    try {
      const ok = sessionStorage.getItem(STORAGE_KEY) === '1';
      setPassed(ok);
    } catch {
      setPassed(false);
    }
  }, []);

  // 监听 iframe 的 postMessage 通知
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'CAPTCHA_PASSED') {
        try {
          sessionStorage.setItem(STORAGE_KEY, '1');
        } catch {}
        setPassed(true);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // SSR 阶段：直接渲染 children（避免 hydration 错误，且不会闪烁遮罩）
  if (passed === null) {
    return <>{children}</>;
  }

  // 已通过：正常显示
  if (passed) {
    return <>{children}</>;
  }

  // 未通过：全屏遮罩 + iframe 加载验证码
  return (
    <>
      {children}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="人机验证"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483647, // 最高层级
          background: 'rgba(10, 10, 20, 0.88)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <iframe
          key={iframeKey}
          src="/captcha.html"
          title="人机验证"
          // 沙箱：允许脚本运行以驱动验证码逻辑，禁止顶层跳转/弹窗
          sandbox="allow-scripts allow-same-origin allow-forms"
          style={{
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            border: 'none',
            background: '#1a1a2e',
          }}
        />
        {/* 调试辅助：手动重置按钮（仅开发可见） */}
        {process.env.NODE_ENV !== 'production' && (
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem(STORAGE_KEY);
              } catch {}
              setPassed(false);
              setIframeKey((k) => k + 1);
            }}
            style={{
              position: 'fixed',
              top: 12,
              right: 12,
              padding: '6px 12px',
              fontSize: 12,
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 6,
              cursor: 'pointer',
              zIndex: 2147483647,
            }}
          >
            重置验证（调试）
          </button>
        )}
      </div>
    </>
  );
}

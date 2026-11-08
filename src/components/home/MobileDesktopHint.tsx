'use client';

import { useEffect, useState } from 'react';
import { Monitor, X } from 'lucide-react';

/** 本次会话内关过就不再弹；新会话重新提示，方便反复测试 */
const DISMISS_KEY = 'lyjy_mobile_hint_dismissed';

/**
 * 手机访问提示。
 *
 * 只用 UA 判断「是否手机浏览器」，不把窄窗口的桌面浏览器算进去；
 * 用户在浏览器「更多」里开启「访问桌面版 / 桌面网站」后 UA 会变成桌面 UA，
 * 提示自动消失——这正是引导用户做的事。
 */
export default function MobileDesktopHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* 隐私模式下 sessionStorage 不可用，照常提示 */
    }

    const ua = navigator.userAgent || '';
    // Android 平板 UA 不含 "Mobile"，用 Android.*Mobile 只匹配手机
    const mobileUA =
      /Android.*Mobile|iPhone|iPod|Windows Phone|IEMobile|Opera Mini|Mobile Safari/i.test(ua);
    const smallScreen = window.matchMedia('(max-width: 767px)').matches;

    if (mobileUA && smallScreen) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* 忽略 */
    }
    setShow(false);
  };

  return (
    <div
      role="status"
      className="fixed bottom-[4.75rem] left-1/2 z-40 w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-sky-400/40 bg-slate-900/95 p-3 text-white shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      <div className="flex items-start gap-2.5">
        <Monitor size={17} className="mt-0.5 shrink-0 text-sky-300" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-sky-100">手机端显示有限，建议用电脑访问</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            导航系统内容较多，电脑上显示更完整。也可以点浏览器「更多」→ 开启
            <span className="font-semibold text-sky-200">「访问桌面版 / 桌面网站」</span>
            ，不用换设备就能切到桌面版布局。
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="关闭提示"
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

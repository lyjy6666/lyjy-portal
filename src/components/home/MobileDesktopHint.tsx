'use client';

import { useEffect, useState } from 'react';
import { Monitor, Wrench, AlertTriangle } from 'lucide-react';
import { useIsMobile } from './useIsMobile';

/** 本次会话内关过就不再弹；新会话重新提示，方便反复测试 */
const DISMISS_KEY = 'lyjy_mobile_intro_dismissed';

/**
 * 手机首次进站的全屏说明。
 * 桌面 UA（含浏览器开启「访问桌面版」后）不会出现。
 */
export default function MobileDesktopHint() {
  const mobile = useIsMobile();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!mobile) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* 隐私模式下 sessionStorage 不可用，照常提示 */
    }
    setShow(true);
  }, [mobile]);

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-5 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="手机版使用说明"
    >
      <div className="w-full max-w-sm rounded-2xl border border-sky-400/40 bg-slate-900 p-6 text-white shadow-2xl shadow-black/60">
        <div className="flex items-center gap-2 text-sky-300">
          <Monitor size={22} />
          <h1 className="text-base font-bold">建议使用电脑版</h1>
        </div>

        <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-slate-200">
          <p>LYJY 导航系统功能较多，电脑上显示更完整、操作也更顺畅。</p>

          <p className="flex items-start gap-2">
            <Wrench size={15} className="mt-0.5 shrink-0 text-sky-300" />
            <span>导航系统也正在积极适配手机版，后续会逐步补齐移动端体验。</span>
          </p>

          <p className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-amber-100">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-300" />
            <span>手机版有部分功能受限，如部分网站无法访问、格式出错、乱码等。</span>
          </p>

          <p className="text-slate-300">
            也可以点浏览器「更多」→ 开启
            <span className="font-semibold text-sky-200">「访问桌面版 / 桌面网站」</span>
            ，不用换设备就能切到桌面版布局。
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-bold text-slate-900 transition hover:brightness-110"
        >
          继续使用手机版
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ShieldOff } from 'lucide-react';
import { isSunsetDate, sunsetDateLabel } from '@/lib/sunset';

/**
 * 原版页到期后的「全屏半透明遮罩」。
 * 已过关停日期时盖住整个原版页面，提示「原版已关停，请前往 Pro 版」，并阻断对底层页面的操作。
 * 用 mounted 门控避免 SSR/hydration 不一致：SSR 与首帧不渲染遮罩，挂载后再判断。
 */
export default function SunsetOverlay({
  date,
  proHref,
  name,
  proLabel = 'Pro 版',
}: {
  /** 关停日期 YYYY-MM-DD */
  date: string;
  /** Pro 版地址 */
  proHref: string;
  /** 服务名，如「格式转换工具箱」 */
  name: string;
  proLabel?: string;
}) {
  const [off, setOff] = useState(false);

  useEffect(() => {
    setOff(isSunsetDate(date));
  }, [date]);

  return (
    <AnimatePresence>
      {off && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
          role="alertdialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-8 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-500/15 text-amber-400">
              <ShieldOff size={28} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">原版已关停</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-300">
              原版{name}已于 <span className="font-semibold text-amber-300">{sunsetDateLabel(date)}</span> 停止服务。
              请前往 {proLabel} 继续使用，功能更全、体验更好。
            </p>
            <a
              href={proHref}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
            >
              前往 {proLabel}
              <ArrowRight size={16} />
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

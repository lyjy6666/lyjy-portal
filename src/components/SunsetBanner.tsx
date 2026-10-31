'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, TriangleAlert, X } from 'lucide-react';

/**
 * 原版页面顶部的「即将下线」提示条。
 * 关停日期前，进入原版时提示用户并引导去 Pro 版；用户点×后按 storageKey 记住、不再弹。
 */
export default function SunsetBanner({
  date,
  proHref,
  proLabel = 'Pro 版',
  storageKey,
}: {
  /** 关停日期文案，如「2026年11月1日」 */
  date: string;
  /** Pro 版地址 */
  proHref: string;
  proLabel?: string;
  /** 记住「已关闭」的 localStorage key */
  storageKey: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) !== '1') setShow(true);
    } catch {
      setShow(true);
    }
  }, [storageKey]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="fixed inset-x-0 top-0 z-[100] flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm text-black shadow-lg"
          role="alert"
        >
          <TriangleAlert size={18} className="shrink-0" />
          <p className="font-medium">
            原版将于 <span className="font-bold">{date}</span> 关停，建议抓紧熟悉并使用{' '}
            <span className="font-bold">{proLabel}</span>
          </p>
          <a
            href={proHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/85 px-3 py-1 text-xs font-semibold text-white transition hover:bg-black"
          >
            前往 {proLabel}
            <ArrowRight size={13} />
          </a>
          <button
            onClick={dismiss}
            aria-label="关闭提示"
            className="shrink-0 rounded-full p-1 text-black/70 transition hover:bg-black/10 hover:text-black"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

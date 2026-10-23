'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import UpdateTimeline, { type Release } from '@/components/UpdateTimeline';

const RELEASES: Release[] = [
  {
    version: 'Pro 版 V1.0',
    date: '2026.10.23',
    tag: '全新重构',
    latest: true,
    items: [
      '整页重写：全新视觉与排版，5 套可切换壁纸，全部本地渲染，不再依赖随时可能失效的外部图片',
      '修复原版搜索失效：知乎、头条等引擎的搜索参数已修正',
      'AI 助手改为点击直接打开对应网站，不再让用户在搜索框白输',
      '图标改用本地 lucide-react，摆脱 FontAwesome CDN 依赖',
      '新增搜索历史、快速访问自定义、快捷键（/ 聚焦、Esc 清空）',
      '时钟拆为独立组件，不再每秒重绘整页；修正标题层级与响应式字号',
    ],
  },
];

export default function ChangelogModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative z-10 max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1220]/95 p-5 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="更新日志"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">更新日志</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <UpdateTimeline releases={RELEASES} tone="dark" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

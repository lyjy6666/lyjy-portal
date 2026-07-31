'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, PartyPopper, Check, Zap, ShieldCheck } from 'lucide-react';
import type { TtsUser } from './types';

interface VipPricingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: TtsUser | null;
  // 试用激活成功后回调（保留接口兼容，内测期间不再使用）
  onTrialActivated: (user: TtsUser) => void;
  // 触发登录（用户未登录时）
  onRequireLogin: () => void;
}

// 内测期可用的全部功能
const BETA_FEATURES = [
  { icon: '🎤', name: '14 种中文神经音色', desc: '普通话/粤语/台湾腔' },
  { icon: '📄', name: '长文本朗读', desc: '万字长文轻松读' },
  { icon: '🖼️', name: '图片识别 (OCR)', desc: '拍照即转文字' },
  { icon: '🎵', name: '音频编辑器', desc: '剪切/合并/淡变/静音' },
  { icon: '🎶', name: '背景音乐', desc: '自定义上传 + 混音' },
  { icon: '📜', name: '生成历史', desc: '随时回看与恢复' },
];

export default function VipPricingDialog({
  isOpen,
  onClose,
  user,
  onRequireLogin,
}: VipPricingDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[95] flex items-center justify-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 rounded-3xl shadow-2xl w-full max-w-2xl my-8 border border-emerald-500/30 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部绿色光晕装饰 */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-10 left-1/4 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute top-20 right-1/4 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative">
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-slate-300 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* 头部 */}
              <div className="pt-8 pb-4 text-center px-6">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 shadow-lg shadow-emerald-500/40 mb-3"
                >
                  <PartyPopper className="h-9 w-9 text-white" />
                </motion.div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 text-xs font-semibold">BETA · 内测阶段</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-lg">
                  内测免费使用
                </h2>
                <p className="text-slate-300/80 text-sm mt-2 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  全部功能免费开放 · 无需付费
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </p>
              </div>

              {/* 内测横幅 */}
              <div className="mx-6 mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-blue-500/15 border border-emerald-400/30 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-20">🎉</div>
                <div className="relative flex items-start gap-3">
                  <Gift className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-emerald-100 text-sm font-semibold mb-1">
                      感谢您参与内测！
                    </p>
                    <p className="text-slate-300/80 text-xs leading-relaxed">
                      内测期间，全部高级功能免费开放使用。支付功能暂未上线，正式上线后将提供更完善的会员服务。
                    </p>
                  </div>
                </div>
              </div>

              {/* 功能清单 */}
              <div className="px-6 pb-5">
                <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  内测期间可免费使用的功能
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {BETA_FEATURES.map((f) => (
                    <div
                      key={f.name}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5"
                    >
                      <span className="text-xl flex-shrink-0">{f.icon}</span>
                      <div className="min-w-0">
                        <p className="text-slate-200 text-xs font-semibold truncate">{f.name}</p>
                        <p className="text-slate-500 text-[10px] truncate">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 行动按钮 */}
              <div className="px-6 pb-6 space-y-2.5">
                {user ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-400 text-white font-bold text-base shadow-lg shadow-emerald-500/40 flex items-center justify-center gap-2 transition-all"
                  >
                    <Check className="w-5 h-5" />
                    已登录，立即免费使用
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRequireLogin}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-400 text-white font-bold text-base shadow-lg shadow-emerald-500/40 flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    登录后免费使用全部功能
                  </motion.button>
                )}

                {/* 信任标识 */}
                <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 内测免费
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" /> 全功能开放
                  </span>
                  <span className="flex items-center gap-1">
                    <Gift className="w-3 h-3" /> 无需付费
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

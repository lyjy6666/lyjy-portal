'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChartLine, Headset, List, Sparkles } from 'lucide-react';
import { serviceCategories, type ServiceItem } from '@/data/services';
import { isNavigable } from '@/lib/serviceNav';
import { ServiceAction, ServiceBadges, ServiceIcon, ProEntry, accentStyle, handleNudge } from './shared';
import { useServiceNav } from './useServiceNav';

type ListLayoutProps = {
  dynamicNumber: number;
  onOpenStats: () => void;
  onOpenVersion: () => void;
  onSwitchLayout: () => void;
};

const colorClasses: Record<string, { bg: string; border: string; text: string; from: string; btn: string; hover: string }> = {
  blue: { bg: 'from-blue-600/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400', from: 'bg-blue-500/20', btn: 'bg-blue-600', hover: 'rgba(59, 130, 246, 0.6)' },
  purple: { bg: 'from-purple-600/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400', from: 'bg-purple-500/20', btn: 'bg-purple-600', hover: 'rgba(139, 92, 246, 0.6)' },
  indigo: { bg: 'from-indigo-600/20 to-indigo-600/10', border: 'border-indigo-500/30', text: 'text-indigo-400', from: 'bg-indigo-500/20', btn: 'bg-indigo-600', hover: 'rgba(99, 102, 241, 0.6)' },
  cyan: { bg: 'from-cyan-600/20 to-cyan-600/10', border: 'border-cyan-500/30', text: 'text-cyan-400', from: 'bg-cyan-500/20', btn: 'bg-cyan-600', hover: 'rgba(6, 182, 212, 0.6)' },
  green: { bg: 'from-green-600/20 to-green-600/10', border: 'border-green-500/30', text: 'text-green-400', from: 'bg-green-500/20', btn: 'bg-green-600', hover: 'rgba(16, 185, 129, 0.6)' },
  orange: { bg: 'from-orange-600/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-400', from: 'bg-orange-500/20', btn: 'bg-orange-600', hover: 'rgba(245, 158, 11, 0.6)' },
  pink: { bg: 'from-pink-600/20 to-pink-600/10', border: 'border-pink-500/30', text: 'text-pink-400', from: 'bg-pink-500/20', btn: 'bg-pink-600', hover: 'rgba(236, 72, 153, 0.6)' },
  red: { bg: 'from-red-600/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400', from: 'bg-red-500/20', btn: 'bg-red-600', hover: 'rgba(239, 68, 68, 0.6)' },
  yellow: { bg: 'from-yellow-600/20 to-yellow-600/10', border: 'border-yellow-500/30', text: 'text-yellow-400', from: 'bg-yellow-500/20', btn: 'bg-yellow-600', hover: 'rgba(234, 179, 8, 0.6)' },
};

function ServiceRow({ service }: { service: ServiceItem }) {
  const c = colorClasses[service.color] ?? colorClasses.blue;
  const open = useServiceNav();
  const navigable = isNavigable(service);

  return (
    <motion.div whileHover={{ scale: 1.02, borderColor: c.hover }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <div
        // 整行都可点击，和圆环「点圆圈即进入」保持一致。
        // 行内已有按钮/链接时让它们自己处理，避免双跳转。
        role={navigable ? 'button' : undefined}
        tabIndex={navigable ? 0 : undefined}
        onClick={(e) => {
          if (!navigable) return;
          if ((e.target as HTMLElement).closest('a, button')) return;
          open(service);
        }}
        onKeyDown={(e) => {
          if (!navigable) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open(service);
          }
        }}
        className={`flex items-center justify-between w-full py-2.5 px-3 bg-gradient-to-r ${c.bg} border ${c.border} rounded-lg overflow-hidden backdrop-blur-sm ${
          navigable ? 'cursor-pointer' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-full ${c.from} flex items-center justify-center ${c.text} flex-shrink-0`}>
            <ServiceIcon icon={service.icon} size={16} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-white text-sm font-medium truncate">{service.name}</span>
              <ServiceBadges service={service} />
            </div>
            <span className="text-[11px] text-slate-400/80 truncate mt-0.5">{service.desc}</span>
          </div>
        </div>
        <div className="ml-2 flex flex-shrink-0 flex-col items-end gap-1">
          {service.soon || service.unavailable ? (
            <span className="bg-slate-500/60 text-slate-300 text-xs px-2.5 py-1 rounded-full">筹备中</span>
          ) : (
            <>
              <ServiceAction service={service} className={`${c.btn} text-white text-xs px-2.5 py-1 rounded-full inline-flex items-center whitespace-nowrap`} />
              <ProEntry service={service} inline />
            </>
          )}
          {service.upgradeHref && <a href={service.upgradeHref} className="text-[10px] text-slate-500 hover:text-slate-300">{service.oldLabel ?? '返回旧版'}</a>}
        </div>
      </div>
    </motion.div>
  );
}

export default function ListLayout({ dynamicNumber, onOpenStats, onOpenVersion, onSwitchLayout }: ListLayoutProps) {
  const [decorationChars, setDecorationChars] = useState<string[]>([]);
  const [decorationStyles, setDecorationStyles] = useState<{ delay: string; duration: string; transform: string }[]>([]);

  useEffect(() => {
    // 装饰栏随机数据仅在客户端生成，避免 hydration 文本不匹配（React #418）
    const chars = Array.from({ length: 20 }, () => Math.random().toString(36).substring(2, 10));
    const styles = Array.from({ length: 20 }, (_, i) => ({
      delay: `${i * 0.1}s`,
      duration: `${5 + Math.random() * 3}s`,
      transform: `translateY(${Math.random() * 500}px)`,
    }));
    setDecorationChars(chars);
    setDecorationStyles(styles);
  }, []);

  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 100 + i * 20, damping: 10 - i * 0.5, delay: 0.2 + i * 0.1, duration: 0.5 } }),
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 z-10">
      <motion.div className="absolute top-8 right-8 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-blue-500/50 text-blue-400 flex items-center gap-2" custom={1} initial="hidden" animate="visible" variants={fadeInUpVariant}>
        <span className="text-sm">系统运行中: {dynamicNumber}</span>
      </motion.div>

      <motion.div className="mb-12 text-center" custom={0} initial="hidden" animate="visible" variants={fadeInUpVariant}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-white">LYJY导航系统</h1>
        <motion.div className="mt-4 h-1 w-32 md:w-48 mx-auto bg-gradient-to-r from-blue-500 to-transparent rounded-full" initial={{ width: 0 }} animate={{ width: '12rem' }} transition={{ duration: 1, delay: 0.7 }} />
      </motion.div>

      <motion.div className="mb-8 text-center max-w-lg px-4" custom={2} initial="hidden" animate="visible" variants={fadeInUpVariant}>
        <div className="bg-black/30 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 shadow-lg shadow-blue-500/10">
          <p className="text-blue-100 text-lg font-light leading-relaxed">欢迎使用LYJY导航系统，请选择您需要访问的服务</p>
        </div>
      </motion.div>

      <motion.div className="absolute -left-20 top-1/3 hidden lg:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}>
        <div className="w-32 h-64 bg-gradient-to-b from-blue-500/10 to-transparent overflow-hidden">
          {decorationChars.map((char, i) => (
            <div key={i} className="text-xs text-blue-400/30 font-mono" style={{ animationDelay: decorationStyles[i]?.delay, animationDuration: decorationStyles[i]?.duration, transform: decorationStyles[i]?.transform }}>
              {char}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div className="w-full max-w-2xl bg-gradient-to-br from-black/60 to-slate-900/60 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-2xl border border-blue-500/30" custom={5} initial="hidden" animate="visible" variants={fadeInUpVariant}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMzY1YTg1MjAiPjwvcmVjdD4KPHBhdGggZD0iTTAgNUw1IDBaTTYgNEw0IDZaTS0xIDFMMSAtMVoiIHN0cm9rZT0iIzMwN2Y5ZDEwIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-30" />
        </div>
        <div className="space-y-6 relative">
          {serviceCategories.map((category, catIndex) => {
            const catColor = colorClasses[category.color] ?? colorClasses.blue;
            return (
              <motion.div key={category.id} custom={catIndex} initial="hidden" animate="visible" variants={fadeInUpVariant}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg ${catColor.from} flex items-center justify-center ${catColor.text}`}>
                    <ServiceIcon icon={category.icon} size={14} />
                  </div>
                  <h2 className={`text-sm font-semibold ${catColor.text} tracking-wide`}>{category.name}</h2>
                  <div className={`flex-1 h-px bg-gradient-to-r ${catColor.bg} opacity-50`}></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.services.map((service) => (
                    <ServiceRow key={service.id} service={service} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div className="mt-16 mb-8 text-center" custom={6} initial="hidden" animate="visible" variants={fadeInUpVariant}>
        <button type="button" onClick={handleNudge} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-md rounded-full shadow-lg border border-blue-500/30 text-white font-medium text-lg">
          <Sparkles size={18} />敬请期待更多功能
        </button>
      </motion.div>

      <footer className="absolute bottom-6 text-center">
        <div className="text-gray-400 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-500/20">
          <p>© 2026 LYJY导航系统 <span className="mx-2">|</span>{' '}
            <button type="button" onClick={onOpenVersion} className="text-blue-400 text-xs hover:text-blue-300 transition-colors underline-offset-2 hover:underline">V6.0</button>
          </p>
        </div>
      </footer>

      <div className="fixed bottom-4 right-6 z-40 flex flex-col gap-2" style={accentStyle('blue')}>
        <button type="button" onClick={onOpenStats} className="portal-fab" aria-label="查看网站统计数据"><ChartLine size={20} /></button>
        <button type="button" onClick={() => window.open('/cs', '_blank')} className="portal-fab" aria-label="智能客服"><Headset size={20} /></button>
        <button type="button" onClick={onOpenVersion} className="portal-fab" aria-label="更新记录"><Sparkles size={20} /></button>
        <button type="button" onClick={onSwitchLayout} className="portal-fab" aria-label="切换圆环布局"><List size={20} /></button>
      </div>

      <div className="fixed bottom-20 left-6 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-500/30 text-xs text-blue-400 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        <span>系统在线</span>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Background from '@/components/Background';
import StatisticsModal from '@/components/StatisticsModal';
import { generateRandomStatsData, type WebsiteStats } from '@/lib/utils';
import { toast } from 'sonner';

const TITLE_TEXT = 'LYJY导航系统';

export default function PortalHome() {
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [statsData, setStatsData] = useState<WebsiteStats[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dynamicNumber, setDynamicNumber] = useState(0);

  useEffect(() => {
    // 生成统计数据并持久化
    const storedData = localStorage.getItem('websiteStatsData');
    localStorage.removeItem('websiteStatsData');
    const newData = generateRandomStatsData();
    localStorage.setItem('websiteStatsData', JSON.stringify(newData));
    setStatsData(newData);
  }, []);

  useEffect(() => {
    // 首次访问提示旧站地址
    if (!localStorage.getItem('oldSiteNoticeShown')) {
      const timer = setTimeout(() => {
        toast('如果想前往过去的网站，请访问 lyjyold.netlify.app', {
          position: 'bottom-right',
          duration: 8000,
          className: 'bg-black/80 text-white border-none',
          action: {
            label: '前往',
            onClick: () => window.open('https://lyjyold.netlify.app', '_blank'),
          },
        });
        localStorage.setItem('oldSiteNoticeShown', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const duration = 2000;
    const targetNumber = Math.floor(Math.random() * 1000) + 500;
    const startTime = Date.now();

    const updateNumber = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentNumber = Math.floor(easedProgress * targetNumber);
      setDynamicNumber(currentNumber);

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    };

    updateNumber();
  }, []);

  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100 + i * 20,
        damping: 10 - i * 0.5,
        delay: 0.2 + i * 0.1,
        duration: 0.5,
      },
    }),
  };

  const buttonVariant = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 15,
        delay: 0.2 + i * 0.15,
        duration: 0.4,
      },
    }),
  };

  const decorationVariant = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { delay: 0.8 + i * 0.2, duration: 1 },
    }),
  };

  // 服务分类
  const serviceCategories = [
    {
      id: 'core',
      name: '核心入口',
      icon: 'fa-compass',
      color: 'blue',
      services: [
        { id: 'home', name: '主页', icon: 'fa-home', color: 'blue', url: '/home', desc: '每日名言、音乐播放器、功能入口' },
        { id: 'search', name: '搜索页', icon: 'fa-search', color: 'purple', url: '/search', desc: '聚合 26+ 搜索引擎' },
      ],
    },
    {
      id: 'tools',
      name: '效率工具',
      icon: 'fa-tools',
      color: 'cyan',
      services: [
        { id: 'toolbox', name: '格式转换工具箱', icon: 'fa-tools', color: 'cyan', url: '/toolbox', desc: '多种格式高效转换', badge: 'Beta' },
        { id: 'homework', name: '作业管理系统', icon: 'fa-clipboard-list', color: 'green', url: '/homework', desc: '语音输入、按科目分组' },
        { id: 'pomodoro', name: '番茄钟', icon: 'fa-clock', color: 'orange', url: '/pomodoro', desc: '专注计时、任务管理、统计' },
        { id: 'tts', name: '语音朗读', icon: 'fa-volume-high', color: 'pink', url: '/tts', desc: 'TTS 语音合成' },
      ],
    },
    {
      id: 'entertainment',
      name: '娱乐休闲',
      icon: 'fa-play',
      color: 'red',
      services: [
        { id: 'video', name: '视频', icon: 'fa-video', color: 'red', url: '/video', desc: '视频播放与浏览' },
        { id: 'radio', name: '城市深夜电台 · 声音星系', icon: 'fa-satellite-dish', color: 'indigo', url: '#', desc: '大项目，正在筹备中，敬请期待', badge: '施工中', soon: true },
      ],
    },
    {
      id: 'fun',
      name: '趣味应用',
      icon: 'fa-gamepad',
      color: 'yellow',
      services: [
        { id: 'doudizhu', name: '斗地主', icon: 'fa-diamond', color: 'red', url: 'https://doudizhu-play.netlify.app', desc: '在线斗地主游戏，经典扑克玩法', external: true },
        { id: 'qianglilock', name: '强力锁', icon: 'fa-lock', color: 'blue', url: '/强力锁.exe', desc: '锁定电脑，更加专注，保护安全', badge: '新增', type: 'download' },
        { id: 'fruit', name: '水果游戏', icon: 'fa-apple-alt', color: 'orange', url: 'https://lyjyfruitgame.netlify.app', desc: '休闲益智类网页小游戏', external: true },
        { id: 'monopoly', name: '大富翁计分器', icon: 'fa-money-bill-wave', color: 'yellow', url: 'https://lyjymonopoly.netlify.app', desc: '桌游大富翁的多人计分工具', external: true },
        { id: 'grandma', name: '老人训练题', icon: 'fa-brain', color: 'pink', url: 'https://grandma-lyjy.netlify.app', desc: '为老人设计的认知训练题库', external: true },
      ],
    },
  ];

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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
      />
      <Background />
      <div
        ref={containerRef}
        className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 z-10"
      >
        {/* 背景网格 */}
        <motion.div
          className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={`v-${i}`}
              className="absolute w-px h-full bg-blue-500/30"
              style={{ left: `${(i * 100) / 6}%` }}
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
            />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={`h-${i}`}
              className="absolute w-full h-px bg-blue-500/30"
              style={{ top: `${(i * 100) / 6}%` }}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
            />
          ))}
        </motion.div>

        {/* 系统运行状态 */}
        <motion.div
          className="absolute top-8 right-8 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-blue-500/50 text-blue-400 flex items-center gap-2"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
        >
          <i className="fa-solid fa-terminal"></i>
          <span className="text-sm">系统运行中: {dynamicNumber}</span>
        </motion.div>

        {/* 标题 */}
        <motion.div
          className="mb-12 text-center"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
        >
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter"
            style={{
              backgroundImage: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd, #3b82f6)',
              backgroundSize: '300% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            {TITLE_TEXT}
          </motion.h1>
          <motion.div
            className="mt-4 h-1 w-32 md:w-48 mx-auto bg-gradient-to-r from-blue-500 to-transparent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '12rem' }}
            transition={{ duration: 1, delay: 0.7 }}
          />
        </motion.div>

        {/* 欢迎语 */}
        <motion.div
          className="mb-8 text-center max-w-lg px-4"
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
        >
          <div className="bg-black/30 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 shadow-lg shadow-blue-500/10">
            <p className="text-blue-100 text-lg font-light leading-relaxed">
              欢迎使用LYJY导航系统，请选择您需要访问的服务
            </p>
          </div>
        </motion.div>

        {/* 左侧装饰 */}
        <motion.div
          className="absolute -left-20 top-1/3 hidden lg:block"
          custom={3}
          initial="hidden"
          animate="visible"
          variants={decorationVariant}
        >
          <div className="w-32 h-64 bg-gradient-to-b from-blue-500/10 to-transparent overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="text-xs text-blue-400/30 font-mono"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${5 + Math.random() * 3}s`,
                  transform: `translateY(${Math.random() * 500}px)`,
                }}
              >
                {Math.random().toString(36).substring(2, 10)}
              </div>
            ))}
          </div>
        </motion.div>

        {/* 主卡片容器 */}
        <motion.div
          className="w-full max-w-2xl bg-gradient-to-br from-black/60 to-slate-900/60 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-2xl border border-blue-500/30"
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMzY1YTg1MjAiPjwvcmVjdD4KPHBhdGggZD0iTTAgNUw1IDBaTTYgNEw0IDZaTS0xIDFMMSAtMVoiIHN0cm9rZT0iIzMwN2Y5ZDEwIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-30"
            />
          </div>

          <div className="space-y-6 relative">
            {serviceCategories.map((category, catIndex) => {
              const catColor = colorClasses[category.color];
              return (
                <motion.div
                  key={category.id}
                  custom={catIndex}
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUpVariant}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg ${catColor.from} flex items-center justify-center ${catColor.text}`}>
                      <i className={`fa-solid ${category.icon} text-sm`}></i>
                    </div>
                    <h2 className={`text-sm font-semibold ${catColor.text} tracking-wide`}>
                      {category.name}
                    </h2>
                    <div className={`flex-1 h-px bg-gradient-to-r ${catColor.bg} opacity-50`}></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.services.map((service, i) => {
                      const c = colorClasses[service.color];
                      const Tag = service.external || service.type === 'download' ? 'a' : Link;
                      const linkProps = service.external
                        ? { href: service.url, target: '_blank', rel: 'noopener noreferrer' }
                        : { href: service.url };
                      return (
                        <motion.div
                          key={service.id}
                          custom={catIndex * 10 + i}
                          initial="hidden"
                          animate="visible"
                          variants={buttonVariant}
                          whileHover={{ scale: 1.02, borderColor: c.hover }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
                        >
                          <Tag
                            {...linkProps}
                            className={`flex items-center justify-between w-full py-2.5 px-3 bg-gradient-to-r ${c.bg} border ${c.border} rounded-lg overflow-hidden group backdrop-blur-sm cursor-pointer`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className={`w-9 h-9 rounded-full ${c.from} flex items-center justify-center ${c.text} flex-shrink-0`}>
                                <i className={`fa-solid ${service.icon} text-sm`}></i>
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white text-sm font-medium truncate">{service.name}</span>
                                  {service.badge && (
                                    <span className={`px-1.5 py-0.5 ${c.from} ${c.text} text-[10px] rounded-full border ${c.border} flex-shrink-0`}>
                                      {service.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400/80 truncate mt-0.5">{service.desc}</span>
                              </div>
                            </div>
                            <motion.span
                              className={`${service.soon ? 'bg-slate-500/60 text-slate-300' : `${c.btn} text-white`} text-xs px-2.5 py-1 rounded-full flex-shrink-0 ml-2`}
                              initial={{ scale: 1 }}
                              whileHover={service.soon ? {} : { scale: 1.1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                              {service.type === 'download' ? '下载' : service.external ? '访问' : '进入'}
                            </motion.span>
                          </Tag>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 敬请期待 */}
        <motion.div
          className="mt-16 mb-8 text-center"
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
        >
          <motion.div
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-md rounded-full shadow-lg border border-blue-500/30 relative overflow-hidden cursor-pointer"
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-shimmer" />
            <span className="text-white font-medium text-lg relative z-10">
              <i className="fa-solid fa-rocket mr-2 text-blue-300"></i>敬请期待更多功能
            </span>
          </motion.div>
        </motion.div>

        {/* 页脚 V4.0 - 点击弹出介绍窗口 */}
        <motion.footer
          className="absolute bottom-6 text-center"
          custom={7}
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
        >
          <div className="text-gray-400 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-500/20">
            <p>
              © 2026 LYJY导航系统 <span className="mx-2">|</span>{' '}
              <button
                type="button"
                onClick={() => setShowVersionModal(true)}
                className="text-blue-400 text-xs cursor-pointer hover:text-blue-300 transition-colors underline-offset-2 hover:underline"
              >
                V5.0
              </button>
            </p>
          </div>
        </motion.footer>

        {/* 版本介绍弹窗 */}
        <Dialog open={showVersionModal} onOpenChange={setShowVersionModal}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-2">
                  <i className="fa-solid fa-rocket text-white"></i>
                </div>
                版本更新记录
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* V5.0 - 当前版本 */}
              <div className="rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-5 shadow-xl shadow-blue-500/20 dark:border-blue-500 dark:from-blue-950/50 dark:via-purple-950/50 dark:to-pink-950/50">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      🎉 当前版本
                    </span>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                      V5.0
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">2026.7.11</span>
                </div>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🔐</span>
                    <span className="font-semibold">新增强力锁、城市深夜电台 · 声音星系</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🎨</span>
                    <span className="font-semibold">优化排版布局，分类展示更清晰</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🏠</span>
                    <span className="font-semibold">统一子站返回首页按钮样式</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🐛</span>
                    <span className="font-semibold">修复部分已知问题</span>
                  </div>
                </div>
              </div>

              {/* V4.0 - 历史版本 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-md dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">V4.0</h3>
                  <span className="text-xs text-slate-600 dark:text-slate-400">2026.6.29</span>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <span>🎉</span>
                    <span>全新统一门户系统上线，多站整合到单一域名</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✨</span>
                    <span>新增多个子站模块</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>📊</span>
                    <span>访问统计升级</span>
                  </div>
                </div>
              </div>

              {/* V3.0 - 历史版本 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-md dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">V3.0</h3>
                  <span className="text-xs text-slate-600 dark:text-slate-400">历史版本</span>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>✨</span>
                    <span>导航系统换新升级，整个页面更加美观科幻</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 访问统计按钮 */}
        <motion.button
          onClick={() => setShowStatsModal(true)}
          className="fixed bottom-20 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg transition-colors duration-200 z-40 border border-blue-500/50 cursor-pointer"
          custom={8}
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
          aria-label="查看网站统计数据"
        >
          <i className="fa-solid fa-chart-line text-xl"></i>
        </motion.button>

        {/* 智能客服按钮 */}
        <motion.button
          onClick={() => window.open('/cs', '_blank')}
          className="fixed bottom-4 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg transition-colors duration-200 z-40 border border-purple-500/50 cursor-pointer group"
          custom={9}
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
          aria-label="智能客服"
        >
          <i className="fa-solid fa-headset text-xl"></i>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            智能客服
          </span>
        </motion.button>

        {/* 系统在线指示器 */}
        <motion.div
          className="fixed bottom-20 left-6 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-500/30 text-xs text-blue-400 flex items-center gap-1"
          custom={9}
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span>系统在线</span>
        </motion.div>

        {/* 统计弹窗 */}
        <StatisticsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          data={statsData}
        />
      </div>
    </div>
  );
}

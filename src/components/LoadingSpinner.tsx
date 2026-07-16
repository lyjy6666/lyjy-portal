'use client';

import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  onComplete?: () => void;
  duration?: number;
}

export default function LoadingSpinner({ onComplete, duration = 2000 }: LoadingSpinnerProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 transition-opacity duration-300"
      style={{ opacity: progress === 100 ? 0 : 1 }}
    >
      <div className="w-full max-w-md space-y-8 p-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-xl"></div>
            <div className="relative rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-6 shadow-2xl shadow-blue-500/30">
              <svg
                className="h-16 w-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            lyjy 格式转换工具箱
          </h2>
          <p className="text-slate-600 dark:text-slate-400">正在加载格式转换工具，请稍候...</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              {progress < 30 ? '初始化...' : progress < 60 ? '加载组件...' : progress < 90 ? '准备就绪...' : '完成！'}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{progress}%</span>
          </div>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

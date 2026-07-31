'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Lock, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TtsUser } from './types';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: TtsUser) => void;
  title?: string;
  subtitle?: string;
}

export default function AuthDialog({
  isOpen,
  onClose,
  onSuccess,
  title = '登录后即可使用',
  subtitle = '所有功能需要登录后才能使用',
}: AuthDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 每次打开时重置
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setMode('login');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/tts/auth/login' : '/api/tts/auth/register';
      const body =
        mode === 'login'
          ? { username, password }
          : { username, password, confirmPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.user) {
        throw new Error(data.message || (mode === 'login' ? '登录失败' : '注册失败'));
      }

      // 持久化到 localStorage
      try {
        localStorage.setItem('tts_user', JSON.stringify(data.user));
      } catch {}
      onSuccess(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl shadow-2xl w-full max-w-md border border-purple-500/30 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部装饰条 */}
            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                    {title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 切换标签 */}
              <div className="flex p-1 bg-black/30 rounded-xl border border-white/10">
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  登录
                </button>
                <button
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'register'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  注册
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">用户名</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="3-20 个字符"
                      autoComplete="username"
                      className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="至少 6 个字符"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">确认密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入密码"
                        autoComplete="new-password"
                        className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-xs text-center">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      立即登录
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      注册并登录
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-[11px] text-slate-500">
                {mode === 'login' ? '没有账号？点击上方"注册"' : '已有账号？点击上方"登录"'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Lock,
  Home,
  Plus,
  Trash2,
  Loader2,
  LogOut,
  Video as VideoIcon,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const ADMIN_PASSWORD = 'lyjy6666';
const STORAGE_KEY = 'video-admin-auth';

interface Video {
  id: number;
  title: string;
  url: string;
  description: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function VideoAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  const [videos, setVideos] = useState<Video[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [form, setForm] = useState({ title: '', url: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 恢复登录状态
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      setAuthed(true);
    }
  }, []);

  const loadVideos = useCallback(() => {
    setListLoading(true);
    fetch('/api/video')
      .then((res) => res.json())
      .then((data) => {
        setVideos(data.videos || []);
        setListLoading(false);
      })
      .catch(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (authed) loadVideos();
  }, [authed, loadVideos]);

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem(STORAGE_KEY, '1');
      setAuthError(false);
      setPassword('');
    } else {
      setAuthError(true);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setVideos([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) {
      setMessage({ type: 'error', text: '请填写标题和视频 URL' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    fetch('/api/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage({ type: 'error', text: data.error });
        } else {
          setMessage({ type: 'success', text: '视频添加成功' });
          setForm({ title: '', url: '', description: '' });
          loadVideos();
        }
        setSubmitting(false);
      })
      .catch(() => {
        setMessage({ type: 'error', text: '添加失败，请重试' });
        setSubmitting(false);
      });
  }

  function handleDelete(id: number) {
    if (!confirm('确定删除这个视频吗？')) return;

    setDeletingId(id);
    fetch(`/api/video/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage({ type: 'error', text: data.error });
        } else {
          setVideos((prev) => prev.filter((v) => v.id !== id));
          setMessage({ type: 'success', text: '视频已删除' });
        }
        setDeletingId(null);
      })
      .catch(() => {
        setMessage({ type: 'error', text: '删除失败，请重试' });
        setDeletingId(null);
      });
  }

  // 未登录 - 密码校验
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <Card className="relative w-full max-w-sm border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg shadow-cyan-500/30">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl text-slate-100">管理后台登录</CardTitle>
            <CardDescription className="text-slate-400">
              请输入管理员密码以继续
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="请输入密码"
                  className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50"
                  autoFocus
                />
                {authError && (
                  <p className="flex items-center gap-1.5 text-sm text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    密码错误，请重试
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                登录
              </Button>
            </form>
          </CardContent>
        </Card>

        <Link href="/">
          <Button
            className="fixed bottom-8 left-8 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-0 shadow-2xl shadow-cyan-500/30 transition-all duration-300 hover:scale-110"
            size="icon"
          >
            <Home className="h-6 w-6 text-white" />
          </Button>
        </Link>
      </div>
    );
  }

  // 已登录 - 管理界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl [animation-delay:1s]" />
      </div>

      <div className="relative container mx-auto max-w-4xl px-4 py-10">
        {/* 头部 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5 shadow-lg shadow-cyan-500/30">
              <VideoIcon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">视频管理后台</h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出
          </Button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* 添加视频表单 */}
        <Card className="mb-8 border-white/10 bg-slate-900/60 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
              <Plus className="h-5 w-5 text-cyan-400" />
              添加视频
            </CardTitle>
            <CardDescription className="text-slate-400">
              通过 URL 引用外部视频，无需上传文件
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">
                  标题 <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="输入视频标题"
                  className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-slate-300">
                  视频 URL <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                  className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">
                  描述
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="输入视频描述（可选）"
                  rows={3}
                  className="resize-none border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中…
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    添加视频
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 视频列表管理 */}
        <Card className="border-white/10 bg-slate-900/60 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
              <VideoIcon className="h-5 w-5 text-cyan-400" />
              视频列表
              {videos.length > 0 && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-slate-400">
                  {videos.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : videos.length === 0 ? (
              <p className="py-12 text-center text-slate-500">暂无视频</p>
            ) : (
              <div className="space-y-2">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/video/${video.id}`}
                        className="block truncate font-medium text-slate-200 hover:text-cyan-300"
                      >
                        {video.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(video.createdAt)}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(video.id)}
                      disabled={deletingId === video.id}
                      className="h-9 w-9 shrink-0 border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
                    >
                      {deletingId === video.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 返回首页按钮 */}
        <Link
          href="/"
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center"
          title="返回首页"
        >
          <i className="fa-solid fa-house text-white"></i>
        </Link>
      </div>

    </div>
  );
}

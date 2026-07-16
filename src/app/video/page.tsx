'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Video as VideoIcon,
  Play,
  Home,
  Settings,
  Calendar,
  Loader2,
  Film,
  AlertCircle,
} from 'lucide-react';

interface Video {
  id: number;
  title: string;
  url: string;
  description: string;
  createdAt: string;
}

const THUMBNAIL_GRADIENTS = [
  'from-blue-500/30 to-purple-600/30',
  'from-cyan-500/30 to-blue-600/30',
  'from-purple-500/30 to-pink-600/30',
  'from-emerald-500/30 to-teal-600/30',
  'from-amber-500/30 to-orange-600/30',
  'from-rose-500/30 to-red-600/30',
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function VideoListPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/video')
      .then((res) => {
        if (!res.ok) throw new Error('请求失败');
        return res.json();
      })
      .then((data) => {
        setVideos(data.videos || []);
        setLoading(false);
      })
      .catch(() => {
        setError('加载视频列表失败，请稍后重试');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* 动态背景光效 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/15 blur-3xl [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-cyan-500/10 blur-3xl [animation-delay:0.5s]" />
      </div>

      <div className="relative container mx-auto px-4 py-10">
        {/* 头部 */}
        <header className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 shadow-xl shadow-cyan-500/30">
            <VideoIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
            视频中心
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            在线视频浏览平台 · 点击卡片即可播放
          </p>
          {videos.length > 0 && !loading && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm text-slate-400 ring-1 ring-white/10">
              <Film className="h-4 w-4 text-cyan-400" />
              <span>共 {videos.length} 个视频</span>
            </div>
          )}
        </header>

        {/* 内容区 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
            <p className="mt-4 text-slate-400">正在加载视频列表…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <p className="mt-4 text-slate-400">{error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Film className="h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-500">暂无视频内容</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video, index) => (
              <Link key={video.id} href={`/video/${video.id}`} className="group">
                <Card className="h-full overflow-hidden rounded-xl border-white/10 bg-slate-900/60 p-0 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/20">
                  {/* 缩略图区域 */}
                  <div
                    className={`relative flex aspect-video items-center justify-center rounded-t-xl bg-gradient-to-br ${
                      THUMBNAIL_GRADIENTS[index % THUMBNAIL_GRADIENTS.length]
                    }`}
                  >
                    <div className="absolute inset-0 bg-slate-950/40" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/30 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-500/30 group-hover:ring-cyan-400/60">
                      <Play className="ml-1 h-7 w-7 fill-white text-white" />
                    </div>
                  </div>

                  <CardContent className="space-y-3 p-5">
                    <h3 className="line-clamp-1 text-lg font-bold text-slate-100 transition-colors group-hover:text-cyan-300">
                      {video.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-slate-400">
                      {video.description || '暂无描述'}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(video.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* 管理入口 */}
        <div className="mt-12 text-center">
          <Link href="/video/admin">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-105 rounded-lg"
            >
              <Settings className="mr-2 h-4 w-4" />
              管理后台
            </Button>
          </Link>
        </div>

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

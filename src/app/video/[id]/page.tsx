'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Home,
  Calendar,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';

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

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/video/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error('视频不存在');
        if (!res.ok) throw new Error('请求失败');
        return res.json();
      })
      .then((data) => {
        setVideo(data.video);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || '加载视频失败');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="mt-4 text-slate-400">正在加载视频…</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center">
          <AlertCircle className="h-10 w-10 text-rose-400" />
          <p className="mt-4 text-slate-400">{error || '视频不存在'}</p>
          <Link href="/video" className="mt-6">
            <Button variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* 动态背景光效 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl [animation-delay:1s]" />
      </div>

      <div className="relative container mx-auto max-w-4xl px-4 py-8">
        {/* 顶部导航 */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/video')}
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <Home className="mr-2 h-4 w-4" />
              首页
            </Button>
          </Link>
        </div>

        {/* 视频播放器 */}
        <Card className="overflow-hidden border-white/10 bg-slate-900/60 p-0 shadow-2xl backdrop-blur-sm">
          <div className="bg-black">
            <video
              className="aspect-video w-full"
              src={video.url}
              controls
              autoPlay
              playsInline
              preload="metadata"
            >
              您的浏览器不支持视频播放。
            </video>
          </div>

          <CardContent className="space-y-4 p-6">
            <h1 className="text-2xl font-bold text-slate-100">{video.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(video.createdAt)}</span>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <LinkIcon className="h-4 w-4 shrink-0" />
                <span className="truncate text-xs text-slate-600">{video.url}</span>
              </div>
            </div>

            {video.description && (
              <div className="border-t border-white/5 pt-4">
                <h2 className="mb-2 text-sm font-semibold text-slate-300">简介</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                  {video.description}
                </p>
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

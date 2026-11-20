'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import UpdateTimeline, { type Release } from '@/components/UpdateTimeline';

/** 番茄钟的版本历史（越靠前越新） */
const POMODORO_RELEASES: Release[] = [
  {
    version: 'V2.0', date: '2026.11.20', latest: true, tag: '全新重构',
    items: [
      '全新重构为 LYJY 自习室：深色暖光界面、今日目标与快捷键。',
      '计时改用绝对时间，切后台不漂移；统计按真实模式时长入账。',
      '白噪音随专注 / 休息自动启停，任务和统计与原版数据互通。',
    ],
  },
  { version: 'v1.0', date: '2026.4.3', items: ['番茄钟上线了'] },
];

export function UpdateRecords() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none shadow-lg text-white z-40"
        >
          <Clock className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-4.5 w-4.5 text-red-500" />
            更新记录
          </DialogTitle>
          <p className="text-[11px] tracking-wide text-slate-500 dark:text-slate-400">番茄钟 · 版本历史</p>
        </DialogHeader>
        <div className="py-2">
          <UpdateTimeline releases={POMODORO_RELEASES} tone="light" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

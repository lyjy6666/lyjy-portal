'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UpdateTimeline, { type Release } from '@/components/UpdateTimeline';

/**
 * 各子站通用的「更新记录」悬浮入口。
 * 只负责弹窗外壳，版本数据由各页面传入。
 */
export function VersionHistoryDialog({
  releases,
  subtitle,
  tone = 'light',
  position = 'bottom-right',
  buttonClassName = '',
}: {
  releases: Release[];
  subtitle: string;
  tone?: 'dark' | 'light';
  position?: 'bottom-right' | 'bottom-left';
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const dark = tone === 'dark';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="打开更新记录"
        className={
          buttonClassName ||
          `fixed bottom-4 z-40 h-11 w-11 rounded-full border-none shadow-lg text-white ${
            position === 'bottom-right' ? 'right-4' : 'left-4'
          } ${
            dark
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
          }`
        }
      >
        <Clock className="h-5 w-5" />
      </Button>
      <DialogContent
        className={`max-h-[80vh] max-w-lg overflow-y-auto ${
          dark ? 'bg-slate-900 text-white border-white/10' : 'bg-white text-slate-900'
        }`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className={`h-4 w-4 ${dark ? 'text-sky-400' : 'text-cyan-600'}`} />
            更新记录
          </DialogTitle>
          <p className={`text-[11px] tracking-wide ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
            {subtitle}
          </p>
        </DialogHeader>
        <div className="py-2">
          <UpdateTimeline releases={releases} tone={tone} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

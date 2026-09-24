'use client';

import { History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function VersionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <History size={18} className="text-sky-300" />
            更新记录
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto py-4">
          <div className="rounded-xl border border-dashed border-sky-400/50 bg-sky-500/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sky-200">当前版本 V6.0</span>
              <span className="text-xs text-slate-500">待发布</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">内容待补充 · 保留位置</p>
          </div>
          {[
            { version: 'V5.0', date: '2026.7.11', items: ['新增强力锁、城市深夜电台 · 声音星系', '优化排版布局，分类展示更清晰', '统一子站返回首页按钮样式'] },
            { version: 'V4.0', date: '2026.6.29', items: ['全新统一门户系统上线，多站整合到单一域名', '新增多个子站模块', '访问统计升级'] },
            { version: 'V3.0', date: '历史版本', items: ['导航系统换新升级，整个页面更加美观科幻'] },
          ].map((release) => (
            <div key={release.version} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{release.version}</span>
                <span className="text-xs text-slate-500">{release.date}</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-400">
                {release.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

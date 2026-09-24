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
          <div className="rounded-xl border border-sky-400/40 bg-sky-500/[0.07] p-4 shadow-[0_0_24px_-8px_rgba(56,189,248,0.5)]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-sky-200">
                当前版本 V6.0
                <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-normal text-sky-300">最新</span>
              </span>
              <span className="text-xs text-slate-500">2026.9.24</span>
            </div>
            <ul className="mt-2.5 space-y-1 text-xs text-slate-300">
              <li>新增银河圆环布局：17 个服务节点环绕分布，按分类绘制弧线，支持悬停查看详情</li>
              <li>下载专区界面重做：4 个产品各自独立介绍页，补齐文件大小、运行环境与 SHA-256 校验值</li>
              <li>访问统计重做：服务热度星环 + 30 天每日趋势，可悬停查看单项数据</li>
              <li>新增浮层碰撞检测，悬浮卡片不再遮挡其它按钮，也不会移出可点击范围</li>
              <li>圆环 / 列表双布局，右下角按钮一键切换并记住选择</li>
            </ul>
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

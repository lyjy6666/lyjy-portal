'use client';

import { History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UpdateTimeline, { type Release } from '@/components/UpdateTimeline';

/** 站点版本历史（越靠前越新） */
const SITE_RELEASES: Release[] = [
  {
    version: 'V6.5',
    date: '2026.10-11',
    latest: true,
    items: [
      '搜索页、格式转换工具箱全面升级 Pro 版，原版同步关停服务',
      '强力锁等产品下载页全面重构',
      '新增「校园助手」「试卷批注」两款产品',
      '下架「格式转换工具箱（桌面版）」与「视频播放器」两个版本',
      '彩蛋预告：7.0 将上线作业管理系统 Pro 版（新旧两版并存，请放心使用），语音朗读系统也有望升级',
    ],
  },
  {
    version: 'V6.0',
    date: '2026.9.24',
    items: [
      '新增银河圆环布局：17 个服务节点环绕分布，按分类绘制弧线',
      '悬停任意节点，中心区域固定展示该服务的介绍与进入按钮',
      '下载专区界面重做：4 个产品各自独立介绍页，补齐文件大小、运行环境与 SHA-256 校验值',
      '访问统计重做：服务热度星环 + 30 天每日趋势，可悬停查看单项数据',
      '圆环 / 列表双布局，右下角按钮一键切换并记住选择',
    ],
  },
  {
    version: 'V5.0',
    date: '2026.7.11',
    items: ['新增强力锁、城市深夜电台 · 声音星系', '优化排版布局，分类展示更清晰', '统一子站返回首页按钮样式'],
  },
  {
    version: 'V4.0',
    date: '2026.6.29',
    items: ['全新统一门户系统上线，多站整合到单一域名', '新增多个子站模块', '访问统计升级'],
  },
  {
    version: 'V3.0',
    date: '历史版本',
    items: ['导航系统换新升级，整个页面更加美观科幻'],
  },
];

export default function VersionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-slate-900/95 text-white border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* 顶部高光条 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <History size={17} className="text-sky-400" />
            更新记录
          </DialogTitle>
          <p className="text-[11px] tracking-wide text-slate-500">LYJY导航系统 · 版本历史</p>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto py-3 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <UpdateTimeline releases={SITE_RELEASES} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

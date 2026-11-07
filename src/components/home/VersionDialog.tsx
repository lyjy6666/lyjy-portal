'use client';

import { History, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { usePreview } from './PreviewContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UpdateTimeline, { type Release } from '@/components/UpdateTimeline';

/** 站点版本历史（越靠前越新） */
const SITE_RELEASES: Release[] = [
  {
    version: 'V7.0 preview',
    date: '2026.11.07',
    latest: true,
    tag: '四项上新',
    items: [
      '作业管理系统 PRO 版：深度融合 AI，支持拍照 / 语音记作业、按年级与薄弱项估时、AI 批改和独立整页的智能排期，另有双布局三主题与离线同步。',
      '自动签到助手：Windows 源码包，定时用截图模板匹配自动点签到，跑完还能延迟关机（可取消）。',
      'AI 聊天：Flutter 跨平台客户端，提供 Windows 免安装版与 Android APK，自配任意 OpenAI 兼容接口即可使用。',
      '垂直管制：站内点开即玩的电梯调度模拟器，含值班闯关、自由沙盒与第一人称单人驾驶三种模式。',
      'V7.0 正式版预计 11 月 14~15 号上线，届时会合并本轮 preview 的全部内容。',
    ],
  },
  {
    version: 'V6.5',
    date: '2026.10-11',
    items: [
      '搜索页、格式转换工具箱全面升级 Pro 版，原版同步关停服务',
      '强力锁等产品下载页全面重构',
      '新增「校园助手」「试卷批注」两款产品',
      '下架「格式转换工具箱（桌面版）」与「视频播放器」两个版本',
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
  const { isPreview, optIn, optOut } = usePreview();

  const tryPreview = () => {
    optIn();
    onOpenChange(false);
    toast.success('已开启 V7.0 preview，新版内容已解锁');
  };

  const leavePreview = () => {
    optOut();
    onOpenChange(false);
    toast('已退出尝鲜，回到 V6.5 界面');
  };

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

        {isPreview ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">尝鲜中</span>
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-300">当前是 V7.0 preview 界面，想回 V6.5 可随时退出。</p>
            <button
              type="button"
              onClick={leavePreview}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-rose-400/40 hover:text-rose-200"
            >
              取消尝鲜 · 返回 V6.5
            </button>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-sky-400/40 bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-transparent p-4">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl" />
            <div className="relative flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky-400 px-2 py-0.5 text-[10px] font-bold text-slate-900">有新版本</span>
              <span className="text-sm font-semibold text-white">V7.0 preview 已就绪</span>
            </div>
            <p className="relative mt-2 text-xs leading-relaxed text-slate-300">
              作业管理系统 PRO 版、自动签到助手、AI 聊天、垂直管制，共 4 项新内容等着你。当前首页仍是 V6.5，尝鲜后才会解锁。
            </p>
            <button
              type="button"
              onClick={tryPreview}
              className="relative mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-900 transition hover:brightness-110"
            >
              <Sparkles size={14} /> 尝鲜 · 立即体验
            </button>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto py-3 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <UpdateTimeline releases={SITE_RELEASES} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

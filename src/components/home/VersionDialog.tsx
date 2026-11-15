'use client';

import { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Release } from '@/components/UpdateTimeline';

/** 折叠进 V7.0 的历史 preview 内容（四项上新原文） */
const PREVIEW_ITEMS = [
  '作业管理系统 PRO 版：深度融合 AI，支持拍照 / 语音记作业、按年级与薄弱项估时、AI 批改和独立整页的智能排期，另有双布局三主题与离线同步。',
  '自动签到助手：Windows 源码包，定时用截图模板匹配自动点签到，跑完还能延迟关机（可取消）。',
  'AI 聊天：Flutter 跨平台客户端，提供 Windows 免安装版与 Android APK，自配任意 OpenAI 兼容接口即可使用。',
  '垂直管制：站内点开即玩的电梯调度模拟器，含值班闯关、自由沙盒与第一人称单人驾驶三种模式。',
];

/**
 * V7.0 preview 不再单独占一个版本框，折叠进 V7.0 条目里。
 * 只用 span / button（phrasing content），保证能安全嵌在条目的 span 里。
 */
function PreviewFold() {
  const [open, setOpen] = useState(false);
  return (
    <span className="mt-2 block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-sky-400/40 hover:text-sky-200"
      >
        {open ? '收起' : '展开'} v7.0preview
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <span className="mt-2 block rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-slate-400">
          <span className="mb-1.5 block font-semibold text-slate-300">V7.0 preview · 2026.11.07 · 四项上新</span>
          {PREVIEW_ITEMS.map((text) => (
            <span key={text} className="mt-1 block">· {text}</span>
          ))}
          <span className="mt-2 block text-slate-500">上述内容已于 2026.11.13 合并进 V7.0 正式版。</span>
        </span>
      )}
    </span>
  );
}

/** 站点版本历史（越靠前越新） */
const SITE_RELEASES: Release[] = [
  {
    version: 'V7.0',
    date: '2026.11.13',
    latest: true,
    tag: '正式版',
    items: [
      <>
        <span className="block font-semibold text-slate-200">作业管理系统 PRO 版</span>
        <span className="mt-1 block">
          <span className="text-sky-300">（v0.1）</span>
          深度融合 AI，支持拍照 / 语音记作业、按年级与薄弱项估时、AI 批改和独立整页的智能排期，另有双布局三主题与离线同步。
        </span>
        <span className="mt-1 block">
          <span className="text-sky-300">（v0.2）</span>
          新增 AI 问答独立聊天页：左右两栏多会话记录、模型 A / B 可选，发送前平台审核，可开启按学段与薄弱项的深度分析，回答按 Markdown 排版；Pro 版刚发布用量狂欢，基础 1 万 / 3 万 tokens 翻三倍为 3 万 / 9 万。
        </span>
      </>,
      '自动签到助手：Windows 源码包，定时用截图模板匹配自动点签到，跑完还能延迟关机（可取消）。',
      'AI 聊天：Flutter 跨平台客户端，提供 Windows 免安装版与 Android APK，自配任意 OpenAI 兼容接口即可使用。',
      '垂直管制：站内点开即玩的电梯调度模拟器，含值班闯关、自由沙盒与第一人称单人驾驶三种模式。',
      '手机端访问体验优化：自动识别手机并给出「建议使用电脑版 / 访问桌面版」全屏说明，补齐圆环与 Pro 版访问提醒、弹窗滚动与列表布局；趣味应用及无安卓版的产品下载统一置灰并彻底拦截，避免显示错位、乱码与无法安装。',
      <PreviewFold key="preview" />,
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
  // 默认只展开最新的 V7.0，旧版本点开才看
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set([SITE_RELEASES[0].version]));

  const toggle = (version: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  };
  const allOpen = openSet.size === SITE_RELEASES.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-black/50 backdrop-blur-xl sm:max-w-[620px]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <History size={17} className="text-sky-400" />
            更新记录
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[11px] tracking-wide text-slate-500">LYJY导航系统 · 当前 V7.0 正式版（2026.11.13）</p>
            <button
              type="button"
              onClick={() => setOpenSet(allOpen ? new Set() : new Set(SITE_RELEASES.map((r) => r.version)))}
              className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 transition hover:border-sky-400/40 hover:text-sky-200"
            >
              {allOpen ? '收起全部' : '展开全部'}
            </button>
          </div>
        </DialogHeader>

        <div className="max-h-[62vh] space-y-2 overflow-y-auto py-1 pr-1 [scrollbar-width:thin]">
          {SITE_RELEASES.map((release) => {
            const isOpen = openSet.has(release.version);
            return (
              <section
                key={release.version}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  release.latest
                    ? 'border-sky-400/25 bg-sky-500/[0.06]'
                    : 'border-white/[0.07] bg-white/[0.02]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(release.version)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition hover:bg-white/[0.03]"
                >
                  <span className={`text-sm font-semibold ${release.latest ? 'text-white' : 'text-slate-300'}`}>
                    {release.version}
                  </span>
                  {release.latest ? (
                    <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-medium text-sky-300">最新</span>
                  ) : null}
                  {release.tag ? (
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                      {release.tag}
                    </span>
                  ) : null}
                  <span className="ml-auto shrink-0 font-mono text-[11px] tracking-wide text-slate-500">{release.date}</span>
                  <span className="shrink-0 text-[10px] text-slate-600">{release.items.length} 条</span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen ? (
                  <ul className="space-y-1.5 px-3.5 pb-3.5 pt-0.5">
                    {release.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                        <span
                          className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${
                            release.latest ? 'bg-sky-400/80' : 'bg-slate-600'
                          }`}
                        />
                        <span className="min-w-0 flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>

        <p className="pt-1 text-[10px] text-slate-600">点版本号展开或收起；旧版本只保留关键变化，细节以各子站自己的记录为准。</p>
      </DialogContent>
    </Dialog>
  );
}

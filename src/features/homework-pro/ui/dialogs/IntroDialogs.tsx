'use client';

import {
  Sparkles, Camera, Gauge, CalendarRange, PenLine, ShieldCheck,
  LayoutDashboard, WifiOff, ArrowRight, Check,
} from 'lucide-react';
import { usePro } from '../../hooks/ProContext';
import { ProDialog } from '../common/bits';

/**
 * 品牌区两个按钮的介绍弹窗：
 *   Pro → 这一版到底有什么（功能清单 + 与原版关系）
 *   AI  → 本站 AI 到底能干什么（能力清单 + 三因子解释 + 直达入口）
 *
 * 之前左上角三个位置点哪个都跳首页，现在各司其职。
 */

const PRO_POINTS = [
  { icon: LayoutDashboard, title: '双布局 + 三主题', desc: '① 速览双栏 / ② 侧栏工作台；① 手账纸感 / ② 极简晨白 / ③ 明快俏皮，随时切换。' },
  { icon: Camera, title: 'AI 记作业', desc: '拍照、说一句话、或粘一整段，自动拆成多条并补上科目。' },
  { icon: Gauge, title: 'AI 用时推测', desc: '按年级 + 薄弱项 + 作业内容，逐条估算完成时间。' },
  { icon: CalendarRange, title: 'AI 智能排期', desc: '独立整页，把作业均衡分到每一天，超载的日期会标红。' },
  { icon: PenLine, title: '改期、看板、统计', desc: '拖拽改期、四列看板、热力图与完成趋势、考前复习清单。' },
  { icon: WifiOff, title: '离线可用', desc: '本地缓存 + 断网暂存，联网后自动同步，写入失败会回滚。' },
  { icon: ShieldCheck, title: '数据互通', desc: '与原版共用同一套账号与云端数据，两版随时来回切。' },
];

const AI_POINTS = [
  { icon: Camera, title: '拍照 / 语音记作业', desc: '拍作业本、念一段话，AI 直接整理成待办列表，还能自动补科目和用时。' },
  { icon: PenLine, title: 'AI 批改', desc: '上传作业，逐题判断对错，给出正确答案、解析和同类练习题。' },
  { icon: Gauge, title: 'AI 用时推测', desc: '年级定基准速度，薄弱项额外加 15~25% 时间，估算结果直接写回作业。' },
  { icon: CalendarRange, title: 'AI 智能排期', desc: '把估算出的用时折算成难度，自动均衡到每一天，哪天写不完一眼看得出来。' },
];

export function IntroDialogs() {
  const { dialog, closeDialog, openDialog } = usePro();

  return (
    <>
      {/* ---------------------------------------------------- Pro 版介绍 */}
      <ProDialog
        open={dialog === 'proIntro'}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
        title="作业管理系统 Pro"
        desc="在原版之上重做的版本：同一套账号与数据，交互与视觉全面重做。"
        className="sm:max-w-[620px]"
      >
        <div className="space-y-3">
          <div className="hw-ai-hero p-4">
            <span className="hw-ai-tag"><Sparkles size={13} /> Pro 版</span>
            <p className="hw-ai-title mt-2 text-base">原版的全部功能都在，只是重新排了一遍</p>
            <p className="hw-ai-desc mt-1">
              旧版功能一个没少，改动集中在「少点几下就能记完作业」这件事上：
              输入即拆条、工具不再散落、换肤不掉状态。
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {PRO_POINTS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="hw-panel flex items-start gap-2.5 p-3">
                  <span className="hw-grade-ico" style={{ width: 30, height: 30, borderRadius: 9 }}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="hw-title block text-sm">{p.title}</span>
                    <span className="hw-label">{p.desc}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
            <a href="/homework/pro/updates" className="hw-btn"><Sparkles size={14} /> 查看完整更新记录</a>
            <a href="/homework" className="hw-chip">去用原版（数据互通）</a>
            <button type="button" className="hw-btn ml-auto" onClick={closeDialog}>知道了</button>
          </div>
        </div>
      </ProDialog>

      {/* ---------------------------------------------------- AI 介绍 */}
      <ProDialog
        open={dialog === 'aiIntro'}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
        title="本站 AI 能帮你做什么"
        desc="不是聊天机器人，是四件具体的事：记下来、算清楚、排到每天、批改讲明白。"
        className="sm:max-w-[620px]"
      >
        <div className="space-y-3">
          <div className="hw-ai-hero p-4">
            <span className="hw-ai-tag"><Sparkles size={13} /> 本站 AI 特色</span>
            <p className="hw-ai-title mt-2 text-base">年级 + 薄弱项 + 作业内容，三件事一起算</p>
            <p className="hw-ai-desc mt-1">
              普通清单只能记录；这里会按你的年级定基准速度，再给薄弱科目多留 15~25% 时间，
              把「今天到底写不写得完」提前算出来。
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="hw-ai-pill"><Check size={12} /> 年级定基准</span>
              <span className="hw-ai-pill"><Check size={12} /> 薄弱项加权</span>
              <span className="hw-ai-pill"><Check size={12} /> 一键排到每天</span>
            </div>
          </div>

          <div className="space-y-2">
            {AI_POINTS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="hw-panel flex items-start gap-2.5 p-3">
                  <span className="hw-grade-ico" style={{ width: 30, height: 30, borderRadius: 9 }}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="hw-title block text-sm">{p.title}</span>
                    <span className="hw-label">{p.desc}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
            <button type="button" className="hw-btn" data-variant="primary"
              onClick={() => { closeDialog(); openDialog('capture'); }}>
              <Camera size={14} /> 试一下 AI 记作业
            </button>
            <a href="/homework/pro/planner" className="hw-btn" onClick={closeDialog}>
              <ArrowRight size={14} /> 去 AI 智能排期
            </a>
            <button type="button" className="hw-btn ml-auto" onClick={closeDialog}>知道了</button>
          </div>
          <p className="hw-label">
            年级与薄弱项在「个人中心」里改；改完立刻影响估算与批改，不用重新登录。
          </p>
        </div>
      </ProDialog>
    </>
  );
}

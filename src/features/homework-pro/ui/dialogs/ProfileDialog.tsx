'use client';

import {
  User, GraduationCap, Target, Bell, Download, Trash2, LogOut,
  ArrowUpRight, ChevronRight, ChartNoAxesColumn, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePro } from '../../hooks/ProContext';
import { ProDialog } from '../common/bits';
import { DraftInput } from '../common/DraftInput';
import { GradePicker, WeakSubjectPicker } from '../common/ProfilePickers';
import { SKIP_INTRO_KEY } from '../layout/IntroSplash';
import { useAiUsage, DAILY_BUDGET, USAGE_PROMO, USAGE_PROMO_DETAIL, usagePercent, type ModelKey } from '../../hooks/useAiUsage';
import { MODEL_META } from '../features/AIAsk';

/**
 * 个人中心。
 *
 * 之前九个区块从上到下一路平铺，两条用量卡各带一整段重复说明，找设置要滚很久。
 * 现在按「概览 / AI 与用量 / 偏好 / 数据」分四页，用量合并成一块，
 * 识别速度收进折叠区，购买额度提到 AI 页顶部作为主操作。
 */
export function ProfileDialog() {
  const {
    dialog, closeDialog, openDialog, user, logout, stats, settings, setSettings,
  } = usePro();

  const initial = (user?.username || '本地').slice(0, 1).toUpperCase();
  const weak = settings.weakSubjects ?? [];
  const { usage } = useAiUsage();

  const overview = [
    { label: '待办', value: stats.active, tone: 'var(--primary)' },
    { label: '逾期', value: stats.overdue, tone: 'var(--hw-overdue)' },
    { label: '已完成', value: stats.completed, tone: 'var(--foreground)' },
    { label: '连续天数', value: stats.streak, tone: 'var(--primary)' },
  ];

  const dataRows = [
    { label: '导出作业', desc: 'txt / md / csv / 打印 PDF', icon: Download, run: () => openDialog('export') },
    { label: '回收站', desc: '8 秒内可撤销删除', icon: Trash2, run: () => openDialog('recycle') },
    { label: 'PRO 更新记录', desc: '只记录 Pro 版，不与原版混写', icon: ChartNoAxesColumn, run: () => openDialog('updates') },
  ];

  return (
    <ProDialog
      open={dialog === 'settings'}
      onOpenChange={(v) => { if (!v) closeDialog(); }}
      title="个人中心"
      desc="账号、学习画像、AI 用量与偏好，分四页放好。"
      className="sm:max-w-[700px]"
    >
      <Tabs defaultValue="overview" className="mt-1 w-full">
        <TabsList className="grid w-full grid-cols-4 gap-1 rounded-lg p-1" style={{ background: 'var(--muted)' }}>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="ai">AI 与用量</TabsTrigger>
          <TabsTrigger value="prefs">偏好</TabsTrigger>
          <TabsTrigger value="data">数据</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ 概览 */}
        <TabsContent value="overview" className="mt-3 space-y-3">
          <section className="hw-profile-hero">
            <div className="flex items-center gap-3">
              <span className="hw-avatar">{initial}</span>
              <div className="min-w-0 flex-1">
                <p className="hw-title truncate text-base">{user?.username || '未登录（本机使用）'}</p>
                <p className="hw-label mt-0.5">
                  {user ? '已登录 · 数据存在云端，新旧两版互通' : '未登录 · 数据只存在这台设备'}
                </p>
              </div>
              {user ? (
                <button type="button" className="hw-btn shrink-0" onClick={() => { logout(); closeDialog(); }}>
                  <LogOut size={14} /> 退出
                </button>
              ) : (
                <button type="button" className="hw-btn shrink-0" data-variant="primary" onClick={() => openDialog('auth')}>
                  <User size={14} /> 登录 / 注册
                </button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {overview.map((x) => (
                <div key={x.label} className="hw-profile-stat">
                  <p className="hw-num text-lg font-bold" style={{ color: x.tone }}>{x.value}</p>
                  <p className="hw-label">{x.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="hw-chip"><GraduationCap size={11} /> {settings.grade || '未选年级'}</span>
              {weak.length ? (
                <span className="hw-chip" data-active="true"><Target size={11} /> 薄弱项 {weak.join(' / ')}</span>
              ) : (
                <span className="hw-chip"><Target size={11} /> 未设薄弱项</span>
              )}
              <span className="hw-chip hw-num"><ChartNoAxesColumn size={11} /> 完成率 {Math.round(stats.completionRate * 100)}%</span>
            </div>
          </section>

          <section className="hw-panel space-y-2 p-3">
            <div className="flex items-center justify-between">
              <p className="hw-eyebrow">学习画像</p>
              <span className="hw-ai-badge">AI 依据</span>
            </div>
            <p className="hw-label">年级是 AI 估算的基准速度；薄弱项会多留 15~25% 时间，批改时也多讲基础。</p>
            <div className="space-y-1.5">
              <span className="hw-label block">年级</span>
              <GradePicker dense value={settings.grade} onChange={(g) => {
                setSettings({ ...settings, grade: g });
                toast.success(`已保存年级：${g}`);
              }} />
            </div>
            <div className="space-y-1.5">
              <span className="hw-label block">薄弱项（可多选）</span>
              <WeakSubjectPicker value={weak} onChange={(list) => {
                setSettings({ ...settings, weakSubjects: list });
                toast.success(list.length ? `已保存薄弱项：${list.join('/')}` : '已清空薄弱项');
              }} />
            </div>
          </section>
        </TabsContent>

        {/* ------------------------------------------------ AI 与用量 */}
        <TabsContent value="ai" className="mt-3 space-y-3">
          <button
            type="button"
            className="hw-quota-entry"
            onClick={() => { closeDialog(); openDialog('quota'); }}
          >
            <span className="flex items-center gap-2"><Sparkles size={14} /> 购买 AI 用量额度</span>
            <span className="flex items-center gap-1">
              <span className="hw-label">免费版 / Pro / Max · 拟定价</span>
              <ChevronRight size={15} />
            </span>
          </button>

          <section className="hw-panel space-y-3 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="hw-eyebrow">AI 问答用量</p>
              <span className="hw-ai-badge">每日 0 点归零</span>
            </div>
            {(['A', 'B'] as ModelKey[]).map((key) => {
              const meta = MODEL_META[key];
              const Icon = meta.icon;
              const pct = usagePercent(usage, key);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="hw-label flex items-center gap-1.5"><Icon size={12} /> {meta.name} · {meta.tag}</span>
                    <span className="hw-label hw-num">
                      {usage[key].toLocaleString()} / {DAILY_BUDGET[key].toLocaleString()}
                    </span>
                  </div>
                  <div className="hw-usage-track mt-1" role="progressbar" aria-label={`${meta.name}今日用量`}
                    aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <i style={{ width: `${pct}%` }} data-key={key} />
                  </div>
                </div>
              );
            })}
            <p className="hw-label border-t pt-2" style={{ borderColor: 'var(--hw-rule)' }}>
              {USAGE_PROMO}。{USAGE_PROMO_DETAIL} 按每次调用返回的真实 token 累计，
              是本站自己的用量估算，不是平台账单余额。
            </p>
          </section>

          <details className="hw-panel p-3">
            <summary className="hw-eyebrow cursor-pointer">识别速度 · 标准 / 快速</summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                { on: false, title: '标准模式', pick: '更准更稳', lines: ['公式和手写更少出错', '单张约 2~10 秒'] },
                { on: true, title: '快速模式', pick: '更快出字', lines: ['约 1 秒出结果', '整页印刷体识别很准'] },
              ].map((opt) => {
                const active = Boolean(settings.fastMode) === opt.on;
                return (
                  <button key={opt.title} type="button" className="hw-mode-card"
                    data-active={active ? 'true' : undefined}
                    onClick={() => {
                      if (active) return;
                      setSettings({ ...settings, fastMode: opt.on });
                      toast.success(opt.on ? '已切换到快速模式' : '已切换到标准模式');
                    }}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="hw-title text-sm">{opt.title}</span>
                      <span className="hw-ai-pill">{opt.pick}</span>
                    </span>
                    <ul className="mt-1.5 space-y-1">
                      {opt.lines.map((l) => (
                        <li key={l} className="hw-label flex items-start gap-1.5"><span className="hw-dot" /> {l}</li>
                      ))}
                    </ul>
                    {active && <span className="hw-mode-on">当前使用</span>}
                  </button>
                );
              })}
            </div>
            <p className="hw-label mt-2">两种模式识别失败都会自动换通道重试。</p>
          </details>
        </TabsContent>

        {/* ------------------------------------------------ 偏好 */}
        <TabsContent value="prefs" className="mt-3 space-y-3">
          <section className="hw-panel space-y-3 p-3">
            <p className="hw-eyebrow">偏好</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="hw-label block">每日预计负担上限（分钟）
                <DraftInput type="number" min={30} step={30} className="hw-input mt-1" ariaLabel="每日负担上限"
                  value={String(settings.dailyLimitMin)}
                  onCommit={(v) => setSettings({ ...settings, dailyLimitMin: Math.max(30, Number(v) || 180) })} />
              </label>
              <label className="hw-label block">默认提前提醒（分钟）
                <DraftInput type="number" min={0} step={5} className="hw-input mt-1" ariaLabel="默认提前提醒"
                  value={String(settings.notifyLeadMin)}
                  onCommit={(v) => setSettings({ ...settings, notifyLeadMin: Math.max(0, Number(v) || 0) })} />
              </label>
            </div>

            <label className="hw-label flex items-center gap-2">显示已完成作业
              <input type="checkbox" checked={settings.showCompleted}
                onChange={(e) => setSettings({ ...settings, showCompleted: e.target.checked })} />
            </label>

            <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
              <button type="button" className="hw-btn"
                onClick={async () => {
                  if (typeof Notification === 'undefined') { toast.error('当前浏览器不支持通知'); return; }
                  const ok = (await Notification.requestPermission()) === 'granted';
                  setSettings({ ...settings, notificationsEnabled: ok });
                  toast[ok ? 'success' : 'error'](ok ? '已开启页内到期提醒' : '浏览器拒绝了通知权限');
                }}>
                <Bell size={14} /> 开启页内到期提醒
              </button>
              <span className="hw-label">只在页面打开时生效</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
              <span className="hw-label">开屏介绍</span>
              <button type="button" className="hw-chip"
                onClick={() => {
                  try { localStorage.removeItem(SKIP_INTRO_KEY); } catch { /* 忽略 */ }
                  toast.success('已重新开启，下次进站会播放开屏介绍');
                }}>
                重新播放
              </button>
              <span className="hw-label">点了「以后都跳过」后可在这里恢复</span>
            </div>
          </section>
        </TabsContent>

        {/* ------------------------------------------------ 数据 */}
        <TabsContent value="data" className="mt-3 space-y-3">
          <section className="hw-panel divide-y overflow-hidden" style={{ borderColor: 'var(--hw-rule)' }}>
            {dataRows.map((row) => {
              const Icon = row.icon;
              return (
                <button key={row.label} type="button" className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                  onClick={() => { closeDialog(); row.run(); }}>
                  <Icon size={15} style={{ color: 'var(--primary)' }} />
                  <span className="min-w-0 flex-1">
                    <span className="hw-title block text-sm">{row.label}</span>
                    <span className="hw-label">{row.desc}</span>
                  </span>
                  <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                </button>
              );
            })}
            <a href="/homework" className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
              <ArrowUpRight size={15} style={{ color: 'var(--primary)' }} />
              <span className="min-w-0 flex-1">
                <span className="hw-title block text-sm">前往原版</span>
                <span className="hw-label">同一套账号与云端数据，随时来回切</span>
              </span>
              <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
            </a>
          </section>
          <p className="hw-label">导出、回收站与更新记录都会打开各自的弹窗，不会离开当前页面。</p>
        </TabsContent>
      </Tabs>
    </ProDialog>
  );
}

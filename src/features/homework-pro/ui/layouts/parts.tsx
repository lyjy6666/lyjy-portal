'use client';

import { lazy, Suspense, useState, type ReactNode, type RefObject } from 'react';
import { toast } from 'sonner';
import {
  Search, X, Sparkles, Plus, ChevronDown, MoreHorizontal,
  BrainCircuit, Layers3, Upload, Download, Trash2, Settings,
  HelpCircle, LogOut, ListChecks, CalendarRange, LayoutDashboard,
  CalendarDays, BarChart3, Sun, BookOpenCheck, Trophy, Timer, Flame,
  ArrowUpRight, Pencil,
} from 'lucide-react';
import { usePro, type DialogName } from '../../hooks/ProContext';
import { LayoutPicker } from './LayoutPicker';
import { LoadBar, Skeleton } from '../common/bits';
import { TaskList } from '../task/TaskList';
import { dailyLoad } from '../../core/stats';
import { computeMilestones, streakDays } from '../../core/achievements';
import { todayKey } from '../../core/date';
import type { ViewMode } from '../../core/types';

type ViewItem = { id: ViewMode; label: string; icon: typeof ListChecks };

export const PRIMARY_VIEWS: ViewItem[] = [
  { id: 'today', label: '今天', icon: Sun },
  { id: 'list', label: '全部作业', icon: ListChecks },
  { id: 'week', label: '周计划', icon: CalendarRange },
];

export const MORE_VIEWS: ViewItem[] = [
  { id: 'board', label: '看板', icon: LayoutDashboard },
  { id: 'calendar', label: '日历', icon: CalendarDays },
  { id: 'stats', label: '统计', icon: BarChart3 },
  { id: 'achievements', label: '成就', icon: Trophy },
  { id: 'review', label: '复习清单', icon: BookOpenCheck },
];

export const VIEW_ITEMS: ViewItem[] = [...PRIMARY_VIEWS, ...MORE_VIEWS];

/**
 * 品牌区。
 *
 * 之前整块包在 <a href="/"> 里，导致 House 图标 / Pro / AI 三个位置点哪个都是回首页，
 * 用户反馈「三个图标全是返回个人主页」。现在：
 *   · 文字改成正式名称「lyjy作业管理系统」，不可点击；
 *   · Pro 是按钮 → 弹出 Pro 版介绍；
 *   · AI 是按钮 → 弹出 AI 能力介绍。
 */
export function Brand({ compact = false }: { compact?: boolean }) {
  const { openDialog } = usePro();
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className={compact ? 'hw-title text-[13px] leading-tight' : 'hw-display'}>lyjy作业管理系统</span>
      <button type="button" className="hw-chip"
        style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
        title="查看 Pro 版介绍"
        onClick={() => openDialog('proIntro')}>
        <Sparkles size={11} /> Pro
      </button>
      <button type="button" className="hw-ai-mark"
        title="查看本站 AI 能力介绍"
        onClick={() => openDialog('aiIntro')}>
        <Sparkles size={11} /> AI
      </button>
    </div>
  );
}

export function SearchBox({ searchRef }: { searchRef: RefObject<HTMLInputElement | null> }) {
  const { filter, setFilter } = usePro();
  return (
    <div className="relative w-full">
      <Search size={15} className="hw-search-icon hw-label" />
      <input
        ref={searchRef}
        className="hw-input hw-input-search"
        placeholder="搜索作业、科目、标签…"
        value={filter.query}
        onChange={(e) => setFilter({ ...filter, query: e.target.value })}
      />
      {filter.query && (
        <button type="button" className="hw-search-clear" onClick={() => setFilter({ ...filter, query: '' })}
          aria-label="清空搜索"><X size={14} /></button>
      )}
    </div>
  );
}

function Dropdown({ label, children, active = false, align = 'right' }: {
  label: ReactNode;
  children: (close: () => void) => ReactNode;
  active?: boolean;
  align?: 'right' | 'left';
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="hw-nav-item" data-active={active || open ? 'true' : undefined}
        onClick={() => setOpen((v) => !v)}>{label}</button>
      {open && (
        <>
          <button type="button" aria-label="关闭菜单" className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)} />
          <div className={`hw-panel hw-menu-pop top-full mt-1 ${align === 'right' ? 'right-0' : 'left-0'}`}>
            {children(() => setOpen(false))}
          </div>
        </>
      )}
    </div>
  );
}

export function MainNav({ vertical = false }: { vertical?: boolean }) {
  const { view, setView } = usePro();
  const [moreOpen, setMoreOpen] = useState(false);
  const current = VIEW_ITEMS.find((v) => v.id === view) ?? VIEW_ITEMS[0]!;
  const moreActive = MORE_VIEWS.some((v) => v.id === view);

  if (vertical) {
    return (
      <nav data-tour="views" className="hw-nav" data-vertical="true">
        {PRIMARY_VIEWS.map((v) => {
          const Icon = v.icon;
          return (
            <button key={v.id} type="button" className="hw-nav-item"
              data-active={view === v.id ? 'true' : undefined} onClick={() => setView(v.id)}>
              <Icon size={15} /> {v.label}
            </button>
          );
        })}
        <button type="button" className="hw-nav-item"
          data-active={moreActive || moreOpen ? 'true' : undefined}
          onClick={() => setMoreOpen((x) => !x)}>
          {moreActive ? current.label : '更多视图'}
          <ChevronDown size={13} className="ml-auto" style={{ transform: moreOpen ? 'rotate(180deg)' : undefined }} />
        </button>
        {moreOpen && (
          <div className="flex flex-col gap-1 py-1 pl-3">
            {MORE_VIEWS.map((v) => {
              const Icon = v.icon;
              return (
                <button key={v.id} type="button" className="hw-nav-item"
                  data-active={view === v.id ? 'true' : undefined} onClick={() => setView(v.id)}>
                  <Icon size={14} /> {v.label}
                </button>
              );
            })}
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav data-tour="views" className="hw-nav">
      {PRIMARY_VIEWS.map((v) => {
        const Icon = v.icon;
        return (
          <button key={v.id} type="button" className="hw-nav-item"
            data-active={view === v.id ? 'true' : undefined} onClick={() => setView(v.id)}>
            <Icon size={15} /> {v.label}
          </button>
        );
      })}
      <Dropdown active={moreActive} label={<>{moreActive ? current.label : '更多视图'} <ChevronDown size={13} /></>}>
        {(close) => (<>
          <p className="hw-menu-group">其它视图</p>
          {MORE_VIEWS.map((v) => {
            const Icon = v.icon;
            return (
              <button key={v.id} type="button" className="hw-menu-item"
                style={view === v.id ? { color: 'var(--primary)', fontWeight: 700 } : undefined}
                onClick={() => { setView(v.id); close(); }}>
                <Icon size={14} /> {v.label}
              </button>
            );
          })}
        </>)}
      </Dropdown>
    </nav>
  );
}

/** 一屏只有一个标题、一条副信息；不再重复放工具按钮 */
export function ViewHeading() {
  const { view, stats } = usePro();
  const current = VIEW_ITEMS.find((v) => v.id === view) ?? VIEW_ITEMS[0]!;
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="hw-eyebrow">作业管理 Pro</p>
        <h1 className="hw-display mt-1">{current.label}</h1>
      </div>
      <span className="hw-label">待办 {stats.active} 项 · 逾期 {stats.overdue} 项</span>
    </div>
  );
}

/**
 * 工具区（A 侧栏 / B 右栏共用）：智能排期、AI 批改、专注、AI 记作业，
 * 以及合并成一组的「输入 / 导入 / 导出」。
 * 「更多工具」菜单里不再重复这些入口。
 */
export function ToolDock({ vertical = false }: { vertical?: boolean }) {
  const { openDialog, setFocusTaskId, tasks } = usePro();
  const firstActive = tasks.find((t) => !t.completed);
  const grid = vertical ? 'flex flex-col gap-1.5' : 'grid grid-cols-2 gap-2';

  const focusInput = () => {
    const el = document.querySelector<HTMLTextAreaElement>('[data-tour="input"] textarea');
    if (!el) return;
    el.focus();
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    toast('已定位到创建作业输入框，可直接输入');
  };

  const primary: { label: string; icon: typeof Layers3; tour?: string; run: () => void; disabled?: boolean }[] = [
    // 智能排期改成独立整页，工具区直接跳转（不再开弹窗）
    { label: 'AI 智能排期', icon: Layers3, tour: 'planner', run: () => { window.location.href = '/homework/pro/planner'; } },
    { label: 'AI 批改', icon: BrainCircuit, tour: 'grader', run: () => openDialog('grader') },
    { label: '开始专注', icon: Timer, run: () => firstActive && setFocusTaskId(firstActive.id), disabled: !firstActive },
    { label: 'AI 记作业', icon: Sparkles, run: () => openDialog('capture') },
  ];
  const data: { label: string; icon: typeof Upload; tour?: string; run: () => void }[] = [
    { label: '输入作业', icon: Pencil, run: focusInput },
    { label: '导入作业', icon: Upload, tour: 'io', run: () => openDialog('import') },
    { label: '导出作业', icon: Download, run: () => openDialog('export') },
  ];

  return (
    <section className="hw-panel p-3">
      <p className="hw-eyebrow">快捷工具</p>
      <div className={`mt-2 ${grid}`}>
        {primary.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} type="button" data-tour={item.tour}
              className={`hw-btn ${vertical ? 'w-full justify-start' : 'w-full justify-start'}`}
              disabled={item.disabled} onClick={item.run}>
              <Icon size={15} /> {item.label}
            </button>
          );
        })}
      </div>
      <div className="hw-hr my-3" />
      <p className="hw-eyebrow" data-tour="batch">作业数据 · 输入 / 导入 / 导出</p>
      <div className={`mt-2 ${vertical ? 'flex flex-col gap-1.5' : 'grid grid-cols-3 gap-1.5'}`}>
        {data.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} type="button" data-tour={item.tour} className="hw-btn w-full justify-start px-2"
              onClick={item.run} title={item.label}>
              <Icon size={14} /> <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type ToolItem = { name: DialogName; label: string; icon: typeof Upload };
const TOOL_GROUPS: { group: string; items: ToolItem[] }[] = [
  { group: '数据', items: [{ name: 'recycle', label: '回收站', icon: Trash2 }] },
  {
    group: '账号', items: [
      { name: 'settings', label: '个人中心', icon: Settings },
      { name: 'tour', label: '使用教程', icon: HelpCircle },
    ],
  },
];

/** 更多工具：只保留不与工具区重复的设置类入口 */
export function ToolMenu({ vertical = false }: { vertical?: boolean }) {
  const { openDialog, logout } = usePro();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="hw-btn shrink-0" aria-label="更多工具"
        onClick={() => setOpen((v) => !v)}><MoreHorizontal size={16} /></button>
      {open && (
        <>
          <button type="button" aria-label="关闭菜单" className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)} />
          <div className={`hw-panel hw-menu-pop ${vertical ? 'bottom-full left-0 mb-2' : 'top-full right-0 mt-2'}`}>
            {TOOL_GROUPS.map((g, gi) => (
              <div key={g.group}>
                {gi > 0 && <div className="hw-menu-sep" />}
                <p className="hw-menu-group">{g.group}</p>
                {g.items.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.name} type="button" className="hw-menu-item"
                      onClick={() => { openDialog(t.name); setOpen(false); }}>
                      <Icon size={14} /> {t.label}
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="hw-menu-sep" />
            <a href="/homework" className="hw-menu-item"><ArrowUpRight size={14} /> 前往原版</a>
            <button type="button" className="hw-menu-item" onClick={() => { logout(); setOpen(false); }}>
              <LogOut size={14} /> 退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function StatusLine() {
  const { offline, loading, user, refresh } = usePro();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {offline && <span className="hw-chip hw-overdue">离线</span>}
      {loading && <span className="hw-label">同步中…</span>}
      <button type="button" className="hw-chip" onClick={() => void refresh()}>↻ 同步</button>
      {user && <span className="hw-chip">{user.username}</span>}
    </div>
  );
}

export function TopBar({
  searchRef, minimal = false, showBrand = true,
}: {
  searchRef: RefObject<HTMLInputElement | null>;
  minimal?: boolean;
  showBrand?: boolean;
}) {
  const { openDialog, offline, user } = usePro();
  return (
    <header className="hw-topbar">
      {showBrand && <Brand compact />}
      <div className="min-w-0 flex-1"><SearchBox searchRef={searchRef} /></div>
      {offline && <span className="hw-chip hw-overdue hidden sm:inline-flex">离线</span>}
      <button type="button" className="hw-btn shrink-0" data-variant="primary"
        onClick={() => openDialog('capture')} title="拍照 / 说一句话 / AI 解析记作业">
        <Plus size={16} /> <span className="hidden sm:inline">记作业</span>
      </button>
      {!user && <button type="button" className="hw-btn shrink-0" onClick={() => openDialog('auth')}>登录</button>}
      {!minimal && <><LayoutPicker /><ToolMenu /></>}
      {minimal && <div className="flex items-center gap-1 md:hidden"><LayoutPicker /><ToolMenu /></div>}
    </header>
  );
}

/** B 布局右栏：只放速览数据，工具统一由 ToolDock 提供 */
export function GlancePanel() {
  const { tasks, stats, settings, setView } = usePro();
  const load = dailyLoad(tasks, todayKey(), settings.dailyLimitMin);
  const reached = computeMilestones(tasks).filter((m) => m.reached).length;

  return (
    <div className="space-y-4">
      <section className="hw-panel hw-glance-card">
        <p className="hw-eyebrow">这一刻</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: '逾期', value: stats.overdue, tone: 'var(--hw-overdue)' },
            { label: '今天到期', value: stats.dueToday, tone: 'var(--hw-due-soon)' },
            { label: '连续天数', value: streakDays(tasks), tone: 'var(--primary)' },
          ].map((x) => (
            <div key={x.label}>
              <div className="hw-glance-num" style={{ color: x.tone }}>{x.value}</div>
              <div className="hw-glance-label mt-1">{x.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4"><LoadBar minutes={load.minutes} limit={settings.dailyLimitMin} /></div>
      </section>

      <section className="hw-panel hw-glance-card">
        <p className="hw-eyebrow">里程碑</p>
        <div className="mt-2 flex items-center gap-2">
          <Flame size={18} style={{ color: 'var(--primary)' }} />
          <span className="hw-title text-sm">已解锁 {reached} 个</span>
        </div>
        <button type="button" className="hw-chip mt-3" onClick={() => setView('achievements')}>
          查看成就 <ArrowUpRight size={12} />
        </button>
      </section>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 border-t pt-4 text-center hw-label" style={{ borderColor: 'var(--hw-rule)' }}>
      LYJY 作业管理系统 Pro · 新旧两版并存、数据互通 ·
      <a href="/homework" className="mx-1 underline underline-offset-2">前往原版</a>
    </footer>
  );
}

const TodayFocus = lazy(() => import('../views/TodayFocusView').then((m) => ({ default: m.TodayFocusView })));
const BoardSection = lazy(() => import('../views/BoardView').then((m) => ({ default: m.BoardView })));
const CalendarSection = lazy(() => import('../views/CalendarView').then((m) => ({ default: m.CalendarView })));
const StatsSection = lazy(() => import('../views/StatsView').then((m) => ({ default: m.StatsView })));
const ReviewSection = lazy(() => import('../views/ReviewView').then((m) => ({ default: m.ReviewView })));
const WeekPlanSection = lazy(() => import('../features/WeekPlan').then((m) => ({ default: m.WeekPlan })));
const AchievementsSection = lazy(() => import('../features/Achievements').then((m) => ({ default: m.Achievements })));

export function ContentRouter() {
  const { view } = usePro();
  let node: ReactNode = <TaskList />;
  switch (view) {
    case 'today': node = <TodayFocus />; break;
    case 'week': node = <WeekPlanSection />; break;
    case 'board': node = <BoardSection />; break;
    case 'calendar': node = <CalendarSection />; break;
    case 'stats': node = <StatsSection />; break;
    case 'achievements': node = <AchievementsSection />; break;
    case 'review': node = <ReviewSection />; break;
    default: break;
  }
  return <Suspense fallback={<Skeleton rows={5} />}>{node}</Suspense>;
}

/**
 * 500 天 · 方案 A / C 的数据层
 *
 * 独立于 anniversary.ts（相册方案），避免改动已完成的页面。
 * 事实来源：过去程序-500天整理/时间线.md 附录 36 条 + 站内版本记录。
 * dist 路径对应 public/versions/<id>/index.html（13 个可运行快照）。
 */

export const SITE_START = '2025-08-04';
export const ANNIVERSARY_DAY = '2026-12-18';

export const ARCHIVE_STATS = {
  snapshots: 36,
  playable: 13,
  services: 22,
  peakPerDay: 150000,
  maxSnapshot: 386231,
  lines: 4,
} as const;

export type SnapshotCategory = '主页' | '导航' | '搜索' | '工具';

export type Snapshot = {
  id: string;
  date: string;
  label: string;
  category: SnapshotCategory;
  files: number;
  note?: string;
  /** 可运行快照（相对站点根） */
  dist?: string;
};

export const SNAPSHOTS: Snapshot[] = [
  { id: 'v8.4', date: '2025-08-04', label: '主页8.4', category: '主页', files: 12206, note: '起点', dist: '/versions/v8.4/index.html' },
  { id: 'v8.6-home', date: '2025-08-06', label: '8.6更新，主页', category: '主页', files: 12205, dist: '/versions/v8.6-home/index.html' },
  { id: 'v8.6-search', date: '2025-08-06', label: '搜索页8.6', category: '搜索', files: 9883, note: '第二条线', dist: '/versions/v8.6-search/index.html' },
  { id: 'v8.10-nav', date: '2025-08-10', label: '导航页8.10', category: '导航', files: 9884, note: '第三条线', dist: '/versions/v8.10-nav/index.html' },
  { id: 'v8.10-search', date: '2025-08-10', label: '搜索页8.10', category: '搜索', files: 9883, dist: '/versions/v8.10-search/index.html' },
  { id: 'v8.11-home', date: '2025-08-11', label: '主页8.11', category: '主页', files: 12206, dist: '/versions/v8.11-home/index.html' },
  { id: 'v8.23-nav', date: '2025-08-23', label: '导航页8.23', category: '导航', files: 9883, dist: '/versions/v8.23-nav/index.html' },
  { id: 'v8.23plus-nav', date: '2025-08-23', label: '导航页8.23+', category: '导航', files: 9884, note: '当日加强版', dist: '/versions/v8.23plus-nav/index.html' },
  { id: 'v8.27-home', date: '2025-08-27', label: '8.27主页', category: '主页', files: 12211, note: '2025 收官', dist: '/versions/v8.27-home/index.html' },
  { id: 'v8.27-nav', date: '2025-08-27', label: '8.27导航页', category: '导航', files: 9885, dist: '/versions/v8.27-nav/index.html' },
  { id: 'v8.27-search', date: '2025-08-27', label: '8.27搜索页', category: '搜索', files: 9883, dist: '/versions/v8.27-search/index.html' },
  { id: 'v1.29-home', date: '2026-01-29', label: '1.29主页', category: '主页', files: 37, note: '纯源码存档' },
  { id: 'v1.29-home-new', date: '2026-01-29', label: '1.29主页新', category: '主页', files: 12153, note: '回归', dist: '/versions/v1.29-home/index.html' },
  { id: 'v1.29-nav', date: '2026-01-29', label: '1.29导航', category: '导航', files: 27 },
  { id: 'v1.29-search', date: '2026-01-29', label: '1.29搜索', category: '搜索', files: 25 },
  { id: 'v1.30-homework', date: '2026-01-30', label: '1.30作业', category: '工具', files: 107, note: '工具线雏形' },
  { id: 'v1.30-homework-new', date: '2026-01-30', label: '1.30作业 新', category: '工具', files: 109 },
  { id: 'v1.30-convert', date: '2026-01-30', label: '1.30转换', category: '工具', files: 100 },
  { id: 'v1.30-nav', date: '2026-01-30', label: '1.30导航', category: '导航', files: 28 },
  { id: 'v2.5-nav', date: '2026-02-05', label: '2.5导航', category: '导航', files: 28 },
  { id: 'v2.28-nav', date: '2026-02-28', label: '2.28导航页', category: '导航', files: 29 },
  { id: 'v3.1-nav', date: '2026-03-01', label: '3.1导航页', category: '导航', files: 30 },
  { id: 'v3.11-search', date: '2026-03-11', label: '3.11搜索', category: '搜索', files: 34 },
  { id: 'v3.14-home', date: '2026-03-14', label: '3.14主页', category: '主页', files: 52 },
  { id: 'v3.14-home2', date: '2026-03-14', label: '3.14主页2', category: '主页', files: 52 },
  { id: 'v3.21-home', date: '2026-03-21', label: '3.21主页', category: '主页', files: 69 },
  { id: 'v3.21-tool', date: '2026-03-21', label: '3.21工具', category: '工具', files: 102 },
  { id: 'v3.28-home', date: '2026-03-28', label: '3.28主页', category: '主页', files: 71 },
  { id: 'v4.1-home', date: '2026-04-01', label: '4.1主页', category: '主页', files: 75 },
  { id: 'v5.30-home', date: '2026-05-30', label: '5.30主页', category: '主页', files: 41263, note: '主页线最大存档', dist: '/versions/v5.30-home/index.html' },
  { id: 'v6.5-nav', date: '2026-06-05', label: '6.5导航页', category: '导航', files: 31282 },
  { id: 'v6.5-search', date: '2026-06-05', label: '6.5搜索页', category: '搜索', files: 31912 },
  { id: 'v6.5-homework', date: '2026-06-05', label: '6.5作业', category: '工具', files: 386231, note: 'Supabase 后端' },
  { id: 'v6.5-convert', date: '2026-06-05', label: '6.5格式转换工具箱', category: '工具', files: 332421 },
  { id: 'v6.5-pomodoro', date: '2026-06-05', label: '6.5番茄钟', category: '工具', files: 316627 },
  { id: 'v6.5-tts', date: '2026-06-05', label: '6.5语音朗读', category: '工具', files: 314728 },
];

export type MilestoneTag = '起点' | '诞生' | '空窗' | '回归' | '爆发' | '合并' | '现在';

export type Milestone = {
  date: string;
  title: string;
  text: string;
  tag: MilestoneTag;
};

export const MILESTONES: Milestone[] = [
  { date: '2025-08-04', title: '一台电脑，一个主页', text: '「主页8.4」存档。那天产生了 15 万个文件，是档案期的单日峰值——绝大多数是依赖包，真正手写的只有几个页面。', tag: '起点' },
  { date: '2025-08-06', title: '第二天，多了一个搜索页', text: '三条线里的第二条诞生。主页与搜索页各自独立开发、独立部署，那时还没有「导航系统」这个概念。', tag: '诞生' },
  { date: '2025-08-10', title: '导航页出现，三条线凑齐', text: '导航页带着 Canvas 粒子动画和一套访问统计上线。散落的页面第一次有了「入口」的意义。', tag: '诞生' },
  { date: '2025-08-27', title: '2025 年的三件套收官', text: '主页、导航页、搜索页同时存档。当时没人知道，下一次存档要等到五个月后。', tag: '诞生' },
  { date: '2025-09', title: '空窗的五个月', text: '2025 年 9 月到 2026 年 1 月，档案里没有任何存档。这一段没有代码，但也是 500 天的一部分。', tag: '空窗' },
  { date: '2026-01-29', title: '回来了，一天四个存档', text: '主页、主页新、导航、搜索，一天之内全部重新存档。工具线的第一个雏形也开始出现。', tag: '回归' },
  { date: '2026-06-05', title: '一天，六个项目', text: '导航页、搜索页、作业管理、格式转换、番茄钟、语音朗读同日产出。工具线正式成型，也是合并前最后一次大爆发。', tag: '爆发' },
  { date: '2026-06-29', title: '合并：多站整合到一个域名', text: 'V4.0 上线，「全新统一门户系统上线，多站整合到单一域名」。从这天起，不再有互相独立的版本存档。', tag: '合并' },
  { date: '2026-09-24', title: '银河圆环：17 个节点', text: 'V6.0 把入口重做成星轨道环形布局，17 个服务像行星一样绕着中心转。', tag: '合并' },
  { date: '2026-11-13', title: 'V7.0：22 个入口', text: '作业 Pro、自动签到、AI 聊天、垂直管制、手机端适配——V7.0 把这 500 天里长出来的东西收进同一张星图。', tag: '现在' },
];

export const SERVICE_GROWTH = [
  { date: '2025-08-04', count: 1, label: '主页' },
  { date: '2025-08-06', count: 2, label: '搜索页' },
  { date: '2025-08-10', count: 3, label: '导航页' },
  { date: '2026-06-05', count: 7, label: '四个工具' },
  { date: '2026-09-24', count: 17, label: '银河圆环' },
  { date: '2026-11-13', count: 22, label: 'V7.0' },
];

export const LINES: { id: SnapshotCategory; color: string; desc: string }[] = [
  { id: '主页', color: '#38bdf8', desc: 'React + Vite + Tailwind，个人门户' },
  { id: '导航', color: '#a78bfa', desc: 'Framer Motion + Recharts，粒子与统计' },
  { id: '搜索', color: '#34d399', desc: '带登录认证门的 SPA' },
  { id: '工具', color: '#fbbf24', desc: 'Next.js 家族，作业系统带 Supabase' },
];

/** 13 个可运行快照，按时间正序 */
export const PLAYABLE = SNAPSHOTS.filter((s): s is Snapshot & { dist: string } => Boolean(s.dist));

export function monthOf(date: string) {
  return date.slice(0, 7);
}

export function formatDate(date: string) {
  return date.replaceAll('-', '.');
}

/** 距起点的天数（用于星图横轴） */
export function dayOffset(date: string) {
  const start = new Date(`${SITE_START}T00:00:00+08:00`).getTime();
  const cur = new Date(`${date.length === 7 ? `${date}-01` : date}T00:00:00+08:00`).getTime();
  return Math.round((cur - start) / 86400000);
}

/** 线上部署快照：Netlify 上的历代门户，可直接 iframe（均已确认无 X-Frame-Options） */
export type PortalVersion = {
  id: string;
  label: string;
  date: string;
  url: string;
  shot: string;
  note: string;
};

export const PORTAL_VERSIONS: PortalVersion[] = [
  { id: 'p3', label: 'V3.0', date: '2025', shot: '/portal-shots/v3.png', url: 'https://lyjyold.netlify.app/', note: '最早的门户，标签页还叫 project_template_react' },
  { id: 'p5', label: 'V5.0', date: '2026-07-11', shot: '/portal-shots/v5.png', url: 'https://6a6bfe856bfd6a00099eb6a5--lyjy.netlify.app/', note: '城市深夜电台 · 声音星系，列表布局' },
  { id: 'p6', label: 'V6.0', date: '2026-09-24', shot: '/portal-shots/v6.png', url: 'https://6add793d0bd0f3dfb0aeddcc--lyjy.netlify.app/', note: '银河圆环首次展开，17 个节点' },
  { id: 'p65', label: 'V6.5', date: '2026-10', shot: '/portal-shots/v65.png', url: 'https://6af0097eaeafc87fbd07e7eb--lyjy.netlify.app/', note: '搜索页与工具箱全面 Pro 版化，22 个节点' },
  { id: 'p7pre', label: 'V7.0 preview', date: '2026-11-07', shot: '/portal-shots/v7pre.png', url: 'https://6ae5ed883430536274ae289b--lyjy.netlify.app/', note: '四项上新，但默认仍是 V6.5，要尝鲜才解锁' },
  { id: 'now', label: 'V7.0', date: '2026-11-14', shot: '/portal-shots/v7.png', url: '/', note: '此刻的版本：22 个入口、手机端适配、500 天这两套方案' },
];

/** 搜索页快照的「岁月痕迹」说明：背景图没跟着代码留下来 */
export const SEARCH_FADED_NOTE =
  '随着岁月的痕迹，这一页的背景图已经加载不出来了。当年铺满整屏的那张图，没有跟着代码一起留下来——剩下的是骨架、文字，和一块空出来的位置。';

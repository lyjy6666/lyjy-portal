import type { SkinId } from '../core/types';

export type ThemeId = SkinId;

export type ThemeMeta = {
  /** 界面上显示的连续序号 */
  index: string;
  name: string;
  short: string;
  desc: string;
  tone: 'light' | 'dark';
  swatch: [string, string, string];
};

/**
 * 3 套视觉主题，编号按**展示顺序**连续不跳号：
 * 默认的手账纸感排第一 → ①；黑白科技占原来的 ②，明快俏皮为 ③。
 */
export const THEME_META: Record<ThemeId, ThemeMeta> = {
  journal: {
    index: '①', name: '手账纸感', short: '手账贴纸',
    desc: '暖纸横线、楷体手写感、柔和彩铅色，轻松不压迫。',
    tone: 'light', swatch: ['#FBF3E4', '#5B4636', '#E9A23B'],
  },
  playful: {
    index: '③', name: '明快俏皮', short: '大色块',
    desc: '亮白底 + 蓝黄粉大色块、粗黑体、大圆角，年轻轻快。',
    tone: 'light', swatch: ['#FFFFFC', '#2563EB', '#FACC15'],
  },
  tech: {
    index: '②', name: '黑白科技', short: '克制极简',
    desc: '纯黑白基底，只用一抹科技蓝点睛；细线、零纹理、零装饰。',
    tone: 'dark', swatch: ['#0B0E14', '#F2F5FA', '#3B82F6'],
  },
};

/** 展示顺序：默认 ① 手账纸感；② 由下线的极简晨白换成黑白科技 */
export const THEME_ORDER: ThemeId[] = ['journal', 'tech', 'playful'];

/** 兼容旧引用 */
export const SKIN_META = THEME_META;
export const SKIN_ORDER = THEME_ORDER;

/**
 * 布局只保留「速览 · 双栏」一套；旧「侧栏 · 工作台」(A) 已下线。
 */
export type LayoutId = 'B';
export const LAYOUT_META: Record<LayoutId, { index: string; name: string; desc: string }> = {
  B: { index: '①', name: '速览 · 双栏', desc: '左边作业清单，右边本周速览与工具区，一屏看完。' },
};
export const LAYOUT_ORDER: LayoutId[] = ['B'];

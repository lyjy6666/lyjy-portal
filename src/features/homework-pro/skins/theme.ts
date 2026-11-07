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
 * 默认的手账纸感排第一 → ①；极简晨白与其交换位置 → ②。
 */
export const THEME_META: Record<ThemeId, ThemeMeta> = {
  journal: {
    index: '①', name: '手账纸感', short: '手账贴纸',
    desc: '暖纸横线、楷体手写感、柔和彩铅色，轻松不压迫。',
    tone: 'light', swatch: ['#FBF3E4', '#5B4636', '#E9A23B'],
  },
  clarity: {
    index: '②', name: '极简晨白', short: '清爽克制',
    desc: '冷白底、一抹蓝、极细线、零纹理零装饰，层级清楚最耐看。',
    tone: 'light', swatch: ['#FBFCFE', '#16202E', '#2F6FED'],
  },
  playful: {
    index: '③', name: '明快俏皮', short: '大色块',
    desc: '亮白底 + 蓝黄粉大色块、粗黑体、大圆角，年轻轻快。',
    tone: 'light', swatch: ['#FFFFFC', '#2563EB', '#FACC15'],
  },
};

/** 展示顺序：默认主题排第一（① 手账纸感），① / ② 已按用户要求互换 */
export const THEME_ORDER: ThemeId[] = ['journal', 'clarity', 'playful'];

/** 兼容旧引用 */
export const SKIN_META = THEME_META;
export const SKIN_ORDER = THEME_ORDER;

/**
 * 两套布局，编号按**展示顺序**连续不跳号：
 * 默认的「速览 · 双栏」排第一 → 显示为 ①；「侧栏 · 工作台」为 ②。
 */
export type LayoutId = 'A' | 'B';
export const LAYOUT_META: Record<LayoutId, { index: string; name: string; desc: string }> = {
  B: { index: '①', name: '速览 · 双栏', desc: '左边作业清单，右边本周速览与工具区，一屏看完。' },
  A: { index: '②', name: '侧栏 · 工作台', desc: '左侧固定导航，右侧整块作业区，桌面上最稳。' },
};
export const LAYOUT_ORDER: LayoutId[] = ['B', 'A'];

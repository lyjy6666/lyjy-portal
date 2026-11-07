/**
 * 搜索页 Pro 版（/search/pro）数据与逻辑。
 *
 * 相比 A 版（/search）的关键修复：
 * - 搜索引擎全部改用 buildUrl(query) 函数，彻底修正了 A 版把「URL 附加片段」
 *   误当成「查询参数名」的 bug（知乎 type=content&q、头条 dvpf=pc 等）。
 * - AI 对话助手（豆包/DeepSeek/通义/元宝/Kimi）统一为「直接打开」，
 *   不再拼一个无效的 ?q= 链接。
 * - 每个引擎带 accent 主题色，用「首字 + 品牌色」做图标，零外部图标依赖。
 */

export type SearchEngineB = {
  id: string;
  name: string;
  /** 图标首字（中文取首字，英文取首字母） */
  initial: string;
  /** 品牌主题色 */
  accent: string;
  /** 根据关键词生成真实可用的搜索 URL */
  buildUrl: (q: string) => string;
  /** AI 助手类：直接打开首页而非拼接查询 */
  ai?: boolean;
  /** 访问提示（如国内网络环境） */
  note?: string;
};

const enc = (q: string) => encodeURIComponent(q);

export const SEARCH_ENGINES: SearchEngineB[] = [
  {
    id: 'bing',
    name: '必应',
    initial: 'B',
    accent: '#0d7ff2',
    buildUrl: (q) => `https://www.bing.com/search?q=${enc(q)}`,
  },
  {
    id: 'baidu',
    name: '百度',
    initial: '百',
    accent: '#2932e1',
    buildUrl: (q) => `https://www.baidu.com/s?wd=${enc(q)}`,
  },
  {
    id: 'google',
    name: '谷歌',
    initial: 'G',
    accent: '#4285f4',
    buildUrl: (q) => `https://www.google.com/search?q=${enc(q)}`,
    note: '国内需特殊网络',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    initial: 'D',
    accent: '#de5833',
    buildUrl: (q) => `https://duckduckgo.com/?q=${enc(q)}`,
  },
  {
    id: 'sogou',
    name: '搜狗',
    initial: '搜',
    accent: '#f94c18',
    buildUrl: (q) => `https://www.sogou.com/web?query=${enc(q)}`,
  },
  {
    id: 'zhihu',
    name: '知乎',
    initial: '知',
    accent: '#0084ff',
    // A 版此处 param 误填为 "type=content&q"，导致搜索失效，现已修正
    buildUrl: (q) => `https://www.zhihu.com/search?type=content&q=${enc(q)}`,
  },
  {
    id: 'bilibili',
    name: '哔哩哔哩',
    initial: 'B',
    accent: '#fb7299',
    buildUrl: (q) => `https://search.bilibili.com/all?keyword=${enc(q)}`,
  },
  {
    id: 'xiaohongshu',
    name: '小红书',
    initial: '红',
    accent: '#ff2442',
    buildUrl: (q) => `https://www.xiaohongshu.com/search_result?keyword=${enc(q)}`,
  },
  {
    id: 'weibo',
    name: '微博',
    initial: '微',
    accent: '#e6162d',
    buildUrl: (q) => `https://s.weibo.com/weibo?q=${enc(q)}`,
  },
  {
    id: 'toutiao',
    name: '头条',
    initial: '头',
    accent: '#ff8300',
    // A 版此处 param 误填为 "dvpf=pc"，导致搜索失效，现已修正为 keyword
    buildUrl: (q) => `https://so.toutiao.com/search?keyword=${enc(q)}&dvpf=pc`,
  },
  {
    id: 'douban',
    name: '豆瓣',
    initial: '豆',
    accent: '#2e963d',
    buildUrl: (q) => `https://www.douban.com/search?q=${enc(q)}`,
  },
  {
    id: 'taobao',
    name: '淘宝',
    initial: '淘',
    accent: '#ff5000',
    buildUrl: (q) => `https://s.taobao.com/search?q=${enc(q)}`,
  },
  {
    id: 'jd',
    name: '京东',
    initial: '京',
    accent: '#e1251b',
    buildUrl: (q) => `https://search.jd.com/Search?keyword=${enc(q)}`,
  },
  {
    id: 'github',
    name: 'GitHub',
    initial: 'G',
    accent: '#8b5cf6',
    buildUrl: (q) => `https://github.com/search?q=${enc(q)}`,
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    initial: 'S',
    accent: '#f48024',
    buildUrl: (q) => `https://stackoverflow.com/search?q=${enc(q)}`,
  },
  {
    id: 'mdn',
    name: 'MDN',
    initial: 'M',
    accent: '#0ea5e9',
    buildUrl: (q) => `https://developer.mozilla.org/search?q=${enc(q)}`,
  },
  {
    id: 'scholar',
    name: '谷歌学术',
    initial: '学',
    accent: '#4285f4',
    buildUrl: (q) => `https://scholar.google.com/scholar?q=${enc(q)}`,
    note: '国内需特殊网络',
  },
  // ===== AI 助手：直接打开，不拼 ?q= =====
  {
    id: 'doubao',
    name: '豆包',
    initial: '豆',
    accent: '#2f6bff',
    buildUrl: () => 'https://www.doubao.com/chat/',
    ai: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    initial: 'D',
    accent: '#4d6bfe',
    buildUrl: () => 'https://chat.deepseek.com/',
    ai: true,
  },
  {
    id: 'tongyi',
    name: '通义千问',
    initial: '通',
    accent: '#615ced',
    buildUrl: () => 'https://tongyi.aliyun.com/qianwen/',
    ai: true,
  },
  {
    id: 'yuanbao',
    name: '腾讯元宝',
    initial: '元',
    accent: '#0052d9',
    buildUrl: () => 'https://yuanbao.tencent.com/chat',
    ai: true,
  },
  {
    id: 'kimi',
    name: 'Kimi',
    initial: 'K',
    accent: '#111827',
    buildUrl: () => 'https://kimi.moonshot.cn/',
    ai: true,
  },
  {
    id: 'metaso',
    name: '秘塔 AI 搜索',
    initial: '秘',
    accent: '#7c3aed',
    buildUrl: (q) => `https://metaso.cn/?q=${enc(q)}`,
    ai: true,
  },
];

export const DEFAULT_ENGINE_ID = 'bing';

export function getEngine(id: string): SearchEngineB {
  return SEARCH_ENGINES.find((e) => e.id === id) ?? SEARCH_ENGINES[0];
}

/** 取名字的首字/首字母作为图标 */
export function initialOf(name: string): string {
  const ch = name.trim()[0] ?? '?';
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
  return ch;
}

// ===== 快速访问（可自定义，存 localStorage） =====
export type QuickLink = {
  id: string;
  name: string;
  url: string;
  accent: string;
};

export const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: 'ql-bili', name: '哔哩哔哩', url: 'https://www.bilibili.com', accent: '#fb7299' },
  { id: 'ql-zhihu', name: '知乎', url: 'https://www.zhihu.com', accent: '#0084ff' },
  { id: 'ql-weibo', name: '微博', url: 'https://weibo.com', accent: '#e6162d' },
  { id: 'ql-ncm', name: '网易云音乐', url: 'https://music.163.com', accent: '#c20c0c' },
  { id: 'ql-github', name: 'GitHub', url: 'https://github.com', accent: '#6e7681' },
  { id: 'ql-taobao', name: '淘宝', url: 'https://www.taobao.com', accent: '#ff5000' },
  { id: 'ql-baidu', name: '百度', url: 'https://www.baidu.com', accent: '#2932e1' },
];

// ===== 应用/书签网格（分类） =====
export type AppLink = {
  name: string;
  url: string;
  accent: string;
};

export type AppCategory = {
  id: string;
  name: string;
  icon: 'video' | 'chat' | 'code' | 'bag' | 'music' | 'news';
  accent: string;
  apps: AppLink[];
};

export const APP_CATEGORIES: AppCategory[] = [
  {
    id: 'video',
    name: '视频娱乐',
    icon: 'video',
    accent: '#fb7299',
    apps: [
      { name: '哔哩哔哩', url: 'https://www.bilibili.com', accent: '#fb7299' },
      { name: '腾讯视频', url: 'https://v.qq.com', accent: '#ff6022' },
      { name: '爱奇艺', url: 'https://www.iqiyi.com', accent: '#00be06' },
      { name: '优酷', url: 'https://youku.com', accent: '#1e80ff' },
      { name: '抖音', url: 'https://www.douyin.com', accent: '#161823' },
      { name: 'YouTube', url: 'https://www.youtube.com', accent: '#ff0000' },
    ],
  },
  {
    id: 'social',
    name: '社区社交',
    icon: 'chat',
    accent: '#0084ff',
    apps: [
      { name: '知乎', url: 'https://www.zhihu.com', accent: '#0084ff' },
      { name: '微博', url: 'https://weibo.com', accent: '#e6162d' },
      { name: '小红书', url: 'https://www.xiaohongshu.com', accent: '#ff2442' },
      { name: '豆瓣', url: 'https://www.douban.com', accent: '#2e963d' },
      { name: '百度贴吧', url: 'https://tieba.baidu.com', accent: '#2932e1' },
    ],
  },
  {
    id: 'dev',
    name: '开发技术',
    icon: 'code',
    accent: '#8b5cf6',
    apps: [
      { name: 'GitHub', url: 'https://github.com', accent: '#6e7681' },
      { name: 'Gitee', url: 'https://gitee.com', accent: '#c71d23' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', accent: '#f48024' },
      { name: 'MDN', url: 'https://developer.mozilla.org', accent: '#0ea5e9' },
      { name: 'Vercel', url: 'https://vercel.com', accent: '#111827' },
      { name: 'npm', url: 'https://www.npmjs.com', accent: '#cb3837' },
    ],
  },
  {
    id: 'shopping',
    name: '购物',
    icon: 'bag',
    accent: '#ff5000',
    apps: [
      { name: '淘宝', url: 'https://www.taobao.com', accent: '#ff5000' },
      { name: '京东', url: 'https://www.jd.com', accent: '#e1251b' },
      { name: '拼多多', url: 'https://www.pinduoduo.com', accent: '#e02e24' },
      { name: '天猫', url: 'https://www.tmall.com', accent: '#ff0036' },
    ],
  },
  {
    id: 'music',
    name: '音乐',
    icon: 'music',
    accent: '#c20c0c',
    apps: [
      { name: '网易云音乐', url: 'https://music.163.com', accent: '#c20c0c' },
      { name: 'QQ音乐', url: 'https://y.qq.com', accent: '#31c27c' },
      { name: '酷狗音乐', url: 'https://www.kugou.com', accent: '#2ca2f9' },
      { name: 'Spotify', url: 'https://www.spotify.com', accent: '#1db954' },
    ],
  },
  {
    id: 'news',
    name: '资讯阅读',
    icon: 'news',
    accent: '#f48024',
    apps: [
      { name: '今日头条', url: 'https://www.toutiao.com', accent: '#ff8300' },
      { name: '澎湃新闻', url: 'https://www.thepaper.cn', accent: '#d93a49' },
      { name: '36氪', url: 'https://36kr.com', accent: '#4285f4' },
      { name: '少数派', url: 'https://sspai.com', accent: '#d71e1e' },
    ],
  },
];

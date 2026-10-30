/** 「尝鲜版」入口：主按钮旁边多给一个入口，带两个标签 */
export type ProEntry = {
  /** 目标地址 */
  href: string;
  /** 按钮文案 */
  label: string;
  /** 标签（如「尝鲜体验」「重大更新」） */
  tags: string[];
  /** 悬停提示 */
  hint?: string;
};

export type ServiceItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
  /** 原版地址：有 Pro 版时 url 指向 Pro，原版入口用这个 */
  oldUrl?: string;
  desc: string;
  /** 主入口旁边额外展示的尝鲜版入口 */
  pro?: ProEntry;
  /** 原版关停日期（YYYY-MM-DD）。到期后首页原版入口自动停用，仅保留 Pro 版 */
  sunset?: string;
  badge?: string | string[];
  external?: boolean;
  type?: string;
  soon?: boolean;
  upgradeHref?: string;
  oldLabel?: string;
  shortName?: string;
  unavailable?: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
};

export type ServiceCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  services: ServiceItem[];
};

export const serviceCategories: ServiceCategory[] = [
  { id: 'core', name: '核心入口', icon: 'fa-compass', color: 'blue', services: [
    { id: 'home', name: '主页', icon: 'fa-house-signal', color: 'blue', url: '/home', desc: '每日名言、音乐播放器、功能入口、液态玻璃按钮', badge: '近期更新' },
    {
      id: 'search',
      name: '搜索页',
      icon: 'fa-magnifying-glass-chart',
      color: 'purple',
      url: '/search/pro',
      oldUrl: '/search',
      desc: '聚合 26+ 搜索引擎',
      sunset: '2026-11-01',
      pro: {
        href: '/search/pro',
        label: 'Pro 版',
        tags: [],
        hint: '搜索页 Pro 版：全新界面、修复搜索失效、本地壁纸与图标',
      },
    },
  ] },
  { id: 'tools', name: '效率工具', icon: 'fa-screwdriver-wrench', color: 'cyan', services: [
    {
      id: 'toolbox',
      name: '格式转换工具箱',
      icon: 'fa-screwdriver-wrench',
      color: 'cyan',
      url: '/toolbox/pro',
      oldUrl: '/toolbox',
      desc: '多种格式高效转换',
      sunset: '2026-10-25',
      pro: {
        href: '/toolbox/pro',
        label: 'Pro 版',
        tags: [],
        hint: '完全重写的新版：9 个工具、修复全部已知问题',
      },
    },
    { id: 'homework', name: '作业管理系统', icon: 'fa-graduation-cap', color: 'green', url: '/homework', desc: '语音输入、智能排期、按时间视图、AI 批改', badge: '重磅更新' },
    { id: 'pomodoro', name: '番茄钟', icon: 'fa-stopwatch', color: 'orange', url: '/pomodoro', desc: '专注计时、任务管理、统计' },
    { id: 'tts', name: '语音朗读', icon: 'fa-microphone-lines', color: 'pink', url: '/tts', desc: 'TTS 语音合成' },
  ] },
  { id: 'entertainment', name: '娱乐休闲', icon: 'fa-play', color: 'red', services: [
    { id: 'movie', name: '影视资源', icon: 'fa-clapperboard', color: 'red', url: '/movie', desc: '免费在线观影，多线路播放', badge: 'Beta' },
    { id: 'radio', name: '城市深夜电台 · 声音星系', shortName: '深夜电台', icon: 'fa-tower-cell', color: 'indigo', url: '#', desc: '城市深夜电台 · 声音星系，正在筹备中', badge: '施工中', soon: true },
    { id: 'video', name: '视频播放器', icon: 'fa-photo-film', color: 'orange', url: 'http://8.217.179.106/', desc: '视频播放与浏览', external: true, upgradeHref: '/video', oldLabel: '返回旧版' },
  ] },
  { id: 'fun', name: '趣味应用', icon: 'fa-gamepad', color: 'yellow', services: [
    { id: 'doudizhu', name: '斗地主', icon: 'fa-clone', color: 'red', url: 'https://doudizhu-play.netlify.app', desc: '在线斗地主游戏，经典扑克玩法', external: true },
    { id: 'fruit', name: '水果游戏', icon: 'fa-apple-whole', color: 'orange', url: 'https://lyjyfruitgame.netlify.app', desc: '休闲益智类网页小游戏', external: true },
    { id: 'monopoly', name: '大富翁计分器', icon: 'fa-dice', color: 'yellow', url: 'https://lyjymonopoly.netlify.app', desc: '桌游大富翁的多人计分工具', external: true },
    { id: 'grandma', name: '老人训练题', icon: 'fa-brain', color: 'pink', url: 'https://grandma-lyjy.netlify.app', desc: '为老人设计的认知训练题库', external: true },
  ] },
  { id: 'download', name: '产品下载', icon: 'fa-download', color: 'purple', services: [
    { id: 'qianglilock', name: '强力锁', icon: 'fa-shield-halved', color: 'blue', url: '/product/qianglilock', desc: '锁定电脑，更加专注，保护安全', badge: '新增' },
    { id: 'toolbox-desktop', name: '格式转换工具箱（桌面版）', shortName: '格式转换桌面版', icon: 'fa-box-open', color: 'cyan', url: '#', desc: '该项目已下线', badge: '已下线', soon: true, unavailable: '此项目已下线' },
    { id: 'windows-toolbox', name: 'Windows Toolbox（应用程序版）', shortName: 'Windows Toolbox', icon: 'fa-cubes-stacked', color: 'indigo', url: '/product/windows-toolbox', desc: '原生桌面工具合集，需安装 .NET 8 桌面运行时', badge: 'ZIP 包' },
    { id: 'windows-tool-web', name: 'Windows 工具（网页版）', shortName: 'Windows 工具网页版', icon: 'fa-window-restore', color: 'green', url: '/product/windows-tool-web', desc: '单文件绿色版，内置本地服务器', badge: '单文件' },
    { id: 'campus-assistant', name: '校园助手', shortName: '校园助手', icon: 'fa-graduation-cap', color: 'green', url: '/product/campus-assistant', desc: '一体机课堂叫人朗读工具', badge: '桌面应用' },
    { id: 'papermark', name: '试卷批注助手', shortName: '试卷批注', icon: 'fa-file-pen', color: 'orange', url: '/product/papermark', desc: '试卷手写批注，重开还原', badge: '桌面应用' },
  ] },
];

export const flattenServices = () =>
  serviceCategories.flatMap((category) =>
    category.services.map((service) => ({
      ...service,
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color,
    })),
  );

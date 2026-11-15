import type { Release } from '@/components/UpdateTimeline';

/** Pro 版专用版本历史：只记录 Pro，不与原版版本混写 */

export type ProHighlight = { no: string; title: string; desc: string };

/**
 * 重磅升级：更新记录里的独立大卡片单独呈现，不混在普通条目列表里。
 * 按版本分组：V0.1 是 AI 全线打通与三因子估时，V0.2 是 AI 问答上线。
 */
export const HOMEWORK_PRO_HIGHLIGHTS: ProHighlight[] = [
  {
    no: '01',
    title: 'AI 全线打通',
    desc: 'AI 记作业（拍照 / 语音 / 一句话解析）、AI 批改、AI 智能排期（独立整页）',
  },
  {
    no: '02',
    title: '三因子用时推测',
    desc: 'AI 根据年级、薄弱项与作业内容三因子推测完成用时',
  },
];

export const HOMEWORK_PRO_V02_HIGHLIGHTS: ProHighlight[] = [
  {
    no: '03',
    title: 'AI 问答',
    desc: '独立聊天页与多会话记录；双模型可选、平台审核，按学段与薄弱项深度分析，公式与代码清晰排版',
  },
];


/** 每个版本的大 Card 标题，避免 V0.1 里提前出现 V0.2 的能力 */
export const HOMEWORK_PRO_HIGHLIGHT_TITLE: Record<string, string> = {
  'Pro V0.1': 'AI 深度融合，作业从记录到排期全链接管',
  'Pro V0.2': 'AI 问答上线 · 不懂的地方随时问',
};

export const HOMEWORK_PRO_RELEASES: Release[] = [
  {
    version: 'Pro V0.3',
    date: '2026.11.15',
    tag: '体验更新',
    latest: true,
    items: [
      '新增第 ② 套视觉主题「黑白科技」：黑白基底 + 科技蓝点缀，克制极简',
      '下线「侧栏 · 工作台」布局，统一为「速览 · 双栏」',
      '原版截止日期时区修正，不再差 8 小时',
    ],
  },
  {
    version: 'Pro V0.2',
    date: '2026.11.13',
    tag: '重磅更新',
    items: [
      '独立聊天页 /homework/pro/ai：左侧会话列表（可新建 / 切换 / 删除），右侧聊天记录，多会话自动保留',
      '模型 A / 模型 B 两个档位可选：A 质量高、速度较慢、用量较高；B 质量较低、速度快、用量较低',
      '发送前平台审核，可开启深度分析，回答按 Markdown 排版',
      'Pro 版刚发布用量狂欢，基础 1 万 / 3 万 tokens 翻三倍为 3 万 / 9 万',
    ],
  },
  {
    version: 'Pro V0.1',
    date: '2026.11.07',
    tag: '全新重构',
    items: [
      '建档学习画像（年级 + 薄弱项），个人中心随时修改',
      '图片识别与文本 AI 均支持多通道自动降级，单通道限流不影响使用，可选快速模式',
      '全新分层架构，原版功能全部保留，两版并存且数据互通',
      '两套布局 ①② 与三套视觉主题 ①②③，编号即排列顺序，点击即时切换',
      '周计划时间轴、看板、统计热力图、今日聚焦、考前复习清单',
      '子任务检查清单、优先级、标签、预计 / 实际耗时、迟交标记',
      '本地缓存与离线暂存、乐观更新失败回滚、8 秒撤销删除',
      '专注计时支持自定义时长，结束只记耗时、不自动完成作业',
      '开屏光波介绍：从左上角 AI 标识展开，介绍深度融合的 AI 系统',
    ],
  },
];

/** 下一版预告：与已发布版本分开渲染，明确是计划中的内容 */
export const HOMEWORK_PRO_PREVIEW = {
  version: 'Pro V0.4',
  title: '更多 AI 功能',
  items: [
    'AI 问答持续增强：更多题型与学科适配',
    '更多 AI 功能持续接入',
  ],
  note: '以上为计划内容，具体功能以上线版本为准。',
} as const;

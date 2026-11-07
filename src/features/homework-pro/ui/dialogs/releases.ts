import type { Release } from '@/components/UpdateTimeline';

/** Pro 版专用版本历史：只记录 Pro，不与原版版本混写 */

/**
 * 重磅升级：更新记录页顶部用独立的大卡片单独呈现，
 * 不混在普通条目列表里，才能真的「凸显」。
 */
export const HOMEWORK_PRO_HIGHLIGHTS = [
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
] as const;

export const HOMEWORK_PRO_RELEASES: Release[] = [
  {
    version: 'Pro V0.1',
    date: '2026.11.07',
    tag: '全新重构',
    latest: true,
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
  version: 'Pro V0.2',
  title: 'AI 问答等更多 AI 功能',
  items: [
    'AI 问答',
    '更多 AI 功能持续接入',
  ],
  note: '以上为计划内容，具体功能以上线版本为准。',
} as const;

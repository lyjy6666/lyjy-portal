'use client';

import { useCallback, useEffect, useState } from 'react';
import { readScoped, writeScoped, KEYS } from '../core/storage';

/**
 * 模块级常量：旧版把 TOUR_STEPS 定义在组件函数体内，父组件每次重渲染都会
 * 让 HomeworkTour 的过滤 effect 重新跑、进度被重置回第 1 步。
 * 同时锚点不再依赖 tasks.length > 0（空状态也要能走完 8 步，UI 里放占位锚点）。
 */
export const TOUR_STEPS = [
  { target: '[data-tour="input"]', title: '快速记作业', desc: '在这里输入一整段作业，AI 会自动拆成多条并补上科目。' },
  { target: '[data-tour="voice"]', title: '懒得打字？说也行', desc: '点麦克风直接念，识别结果会持续追加到输入框。' },
  { target: '[data-tour="views"]', title: '换个角度看', desc: '清单 / 看板 / 日历 / 统计 / 今日聚焦，随时切换。' },
  { target: '[data-tour="planner"]', title: 'AI 智能排期', desc: '独立整页：先列作业，AI 按年级估时，再自动均衡分到每一天。' },
  { target: '[data-tour="grader"]', title: 'AI 批改', desc: '拍下作业上传，逐题给解析和举一反三。' },
  { target: '[data-tour="io"]', title: '导入与导出', desc: '支持 txt / md / docx 导入，以及多种格式导出或打印。' },
  { target: '[data-tour="batch"]', title: '批量操作', desc: '多选后可批量删除、置顶、改期、加标签。' },
  { target: '[data-tour="task"]', title: '点开看细节', desc: '子任务、优先级、耗时、备注、标签都在这里。' },
] as const;

/** 教程状态：修掉旧版 `completed ? '1' : '1'` 死三元（跳过与完成写不同值） */
export function useTour(userId: number | string) {
  const [done, setDone] = useState<string>(() => readScoped<string>(userId, KEYS.tour, ''));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // '1'（完成）与 'skipped'（跳过）都是终态，跳过后再刷新不该重新弹教程
    if (done) return;
    const timer = window.setTimeout(() => setOpen(true), 1500);
    return () => window.clearTimeout(timer);
  }, [done]);

  const finish = useCallback((completed: boolean) => {
    const value = completed ? '1' : 'skipped';
    writeScoped(userId, KEYS.tour, value);
    setDone(value);
    setOpen(false);
  }, [userId]);

  return { open, setOpen, done, finish };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProTask } from '../core/types';
import { readScoped, writeScoped } from '../core/storage';
import { applyLeadTime } from '../core/date';

/**
 * 页内到期提醒（浏览器通知）。
 * 诚实边界：页面关闭后不会推送——那需要 Service Worker + Push + 订阅表，
 * 超出「最小后端」范围，UI 不宣称「离线推送」。
 */
export function useNotifications(
  tasks: ProTask[],
  userId: number | string,
  settings: { notificationsEnabled: boolean; notifyLeadMin: number },
) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const firedRef = useState(() => new Set<string>())[0];

  // 权限在「设置」里由原生 requestPermission 申请，本 hook 不会自动感知。
  // 授权弹窗关闭后页面会重新聚焦；同时监听可见性与延时补读，确保轮询能启动。
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    const sync = () => setPermission(Notification.permission);
    sync();
    const delayed = window.setTimeout(sync, 1200);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearTimeout(delayed);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [settings.notificationsEnabled]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  useEffect(() => {
    if (!settings.notificationsEnabled || permission !== 'granted') return;
    const check = () => {
      const now = Date.now();
      for (const task of tasks) {
        if (task.completed || !task.dueDate) continue;
        const lead = task.meta.notifyLeadMin ?? settings.notifyLeadMin;
        const at = applyLeadTime(task.dueDate, lead);
        const key = `${task.id}:${at}`;
        if (at > now || now - at > 60 * 60 * 1000 || firedRef.has(key)) continue;
        firedRef.add(key);
        try {
          new Notification('作业即将到期', {
            body: `${task.text} · 还有 ${lead} 分钟`,
            tag: key,
          });
        } catch { /* 某些浏览器禁止非安全上下文通知 */ }
      }
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [tasks, permission, settings.notificationsEnabled, settings.notifyLeadMin, firedRef]);

  // 持久化「已提醒」集合，避免刷新后重复弹
  useEffect(() => {
    const saved = readScoped<string[]>(userId, 'firedNotifications', []);
    saved.forEach((k) => firedRef.add(k));
  }, [userId, firedRef]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      writeScoped(userId, 'firedNotifications', [...firedRef].slice(-200));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [userId, firedRef]);

  return { permission, requestPermission };
}

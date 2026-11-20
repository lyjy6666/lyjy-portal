'use client';

import { useCallback, useEffect, useState } from 'react';
import { TimerConfig } from '@/lib/types';
import { defaultTimerConfig } from '@/lib/pomodoro-utils';
import { STORAGE_KEYS } from '../lib/constants';
import { normalizeConfig, readJSON, writeJSON } from '../lib/storage';

/** 各模式时长 / 长休息间隔的持久化配置 */
export function useStudyConfig() {
  const [config, setConfig] = useState<TimerConfig>(defaultTimerConfig);
  const [ready, setReady] = useState(false);

  // 挂载后再读，避免服务端渲染与客户端首帧不一致
  useEffect(() => {
    setConfig(readJSON(STORAGE_KEYS.config, defaultTimerConfig, normalizeConfig));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeJSON(STORAGE_KEYS.config, config);
  }, [config, ready]);

  const updateConfig = useCallback((patch: Partial<TimerConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  return { config, updateConfig };
}

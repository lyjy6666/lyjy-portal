'use client';

import { useCallback, useEffect, useRef } from 'react';
import { SoundType } from '@/lib/types';
import { generateWhiteNoise, stopAllAudio } from '@/lib/pomodoro-utils';

/** 白噪音单例：同一时刻只有一路环境音，切换类型会先停掉旧的 */
export function useAmbientSound() {
  const playingRef = useRef<SoundType>('none');

  const play = useCallback((type: SoundType) => {
    if (playingRef.current === type) return;
    if (playingRef.current !== 'none') {
      stopAllAudio();
      playingRef.current = 'none';
    }
    if (type !== 'none') {
      try {
        generateWhiteNoise(type);
        playingRef.current = type;
      } catch {
        playingRef.current = 'none';
      }
    }
  }, []);

  const stop = useCallback(() => play('none'), [play]);

  useEffect(() => {
    return () => {
      if (playingRef.current !== 'none') stopAllAudio();
    };
  }, []);

  return { play, stop, playingRef };
}

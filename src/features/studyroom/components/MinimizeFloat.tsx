'use client';

import { TimerMode } from '@/lib/types';
import { formatTime } from '@/lib/pomodoro-utils';
import { Maximize2, Pause, Play } from 'lucide-react';
import { MODE_META } from '../lib/constants';
import styles from '../studyroom.module.css';

interface MinimizeFloatProps {
  mode: TimerMode;
  remainingSeconds: number;
  progress: number;
  isRunning: boolean;
  onToggle: () => void;
  onExpand: () => void;
}

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MinimizeFloat({
  mode,
  remainingSeconds,
  progress,
  isRunning,
  onToggle,
  onExpand,
}: MinimizeFloatProps) {
  const accent = MODE_META[mode].color;

  return (
    <div className={styles.float}>
      <svg className={styles.floatRing} viewBox="0 0 44 44" aria-hidden="true">
        <circle
          cx="22"
          cy="22"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,240,220,0.1)"
          strokeWidth="4"
        />
        <circle
          cx="22"
          cy="22"
          r={RADIUS}
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <div>
        <div className={styles.floatTime}>{formatTime(remainingSeconds)}</div>
        <div className={styles.floatMode}>{MODE_META[mode].label}</div>
      </div>
      <div className={styles.floatControls}>
        <button className={styles.iconBtn} onClick={onToggle} title="开始/暂停">
          {isRunning ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button className={styles.iconBtn} onClick={onExpand} title="展开">
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
}

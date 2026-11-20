'use client';

import { TimerMode } from '@/lib/types';
import { formatTime } from '@/lib/pomodoro-utils';
import { Maximize2, Minimize2, Pause, Play, RotateCcw, Settings2 } from 'lucide-react';
import { ALL_MODES, MODE_META, isBreakMode } from '../lib/constants';
import styles from '../studyroom.module.css';

type TimerStatus = 'idle' | 'running' | 'paused';

interface TimerPanelProps {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  totalSeconds: number;
  pomodoroCount: number;
  progress: number;
  goal: number;
  showSettings: boolean;
  isMinimized: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSwitchMode: (mode: TimerMode) => void;
  onGoalChange: (goal: number) => void;
  onToggleSettings: () => void;
  onToggleMinimized: () => void;
}

const RADIUS = 132;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerPanel({
  mode,
  status,
  remainingSeconds,
  totalSeconds,
  pomodoroCount,
  progress,
  goal,
  showSettings,
  isMinimized,
  onToggle,
  onReset,
  onSwitchMode,
  onGoalChange,
  onToggleSettings,
  onToggleMinimized,
}: TimerPanelProps) {
  const meta = MODE_META[mode];
  const rest = isBreakMode(mode);
  const accent = meta.color;
  const statusText = status === 'running' ? '专注进行中' : status === 'paused' ? '已暂停' : '等待开始';
  const goalPct = goal > 0 ? Math.min(100, (pomodoroCount / goal) * 100) : 0;

  if (isMinimized) {
    return (
      <div className={`${styles.card} ${styles.timerCard}`}>
        <p className={styles.emptyHint}>计时器已最小化，可在右下角浮窗中继续操作。</p>
        <button className={styles.wideBtn} onClick={onToggleMinimized}>
          <Maximize2 size={14} /> 展开计时面板
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.timerCard}`}>
      <div className={styles.modeRow}>
        {ALL_MODES.map((m) => (
          <button
            key={m}
            className={`${styles.modePill} ${
              isBreakMode(m) ? styles.modePillRest : ''
            } ${m === mode ? styles.modePillActive : ''}`}
            onClick={() => onSwitchMode(m)}
            title={MODE_META[m].hint}
          >
            {MODE_META[m].label}
          </button>
        ))}
      </div>

      <div className={styles.dialWrap}>
        <svg className={styles.dial} viewBox="0 0 300 300" aria-hidden="true">
          <circle className={styles.dialTrack} cx="150" cy="150" r={RADIUS} />
          <circle
            className={styles.dialProgress}
            cx="150"
            cy="150"
            r={RADIUS}
            stroke={accent}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            style={{ filter: `drop-shadow(0 0 10px ${accent}55)` }}
          />
        </svg>
        <div className={styles.dialCenter}>
          <div className={styles.timeText}>{formatTime(remainingSeconds)}</div>
          <div className={styles.modeLabel} style={{ color: accent }}>
            {meta.label}
          </div>
          <div className={styles.modeHint}>{meta.hint}</div>
          <div
            className={`${styles.statusChip} ${
              status === 'running'
                ? styles.statusRunning
                : status === 'paused'
                  ? styles.statusPaused
                  : ''
            }`}
          >
            {statusText} · 本段 {Math.round(totalSeconds / 60)} 分钟
          </div>
        </div>
      </div>

      <div className={styles.cycleDots} title={`今日已完成 ${pomodoroCount} 段`}>
        {Array.from({ length: Math.max(4, goal) }).map((_, i) => (
          <span
            key={i}
            className={`${styles.cycleDot} ${
              i < Math.min(pomodoroCount, goal) ? styles.cycleDotOn : ''
            }`}
          />
        ))}
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.primaryBtn} ${rest ? styles.primaryBtnRest : ''}`}
          onClick={onToggle}
        >
          {status === 'running' ? <Pause size={16} /> : <Play size={16} />}{' '}
          {status === 'running' ? '暂停' : status === 'paused' ? '继续' : '开始'}
        </button>
        <button className={styles.iconBtn} onClick={onReset} title="重置本段">
          <RotateCcw size={18} />
        </button>
        <button
          className={`${styles.iconBtn} ${showSettings ? styles.iconBtnActive : ''}`}
          onClick={onToggleSettings}
          title="时长设置"
        >
          <Settings2 size={18} />
        </button>
        <button className={styles.iconBtn} onClick={onToggleMinimized} title="最小化浮窗">
          <Minimize2 size={18} />
        </button>
      </div>

      <div className={styles.goalBlock}>
        <div className={styles.goalHead}>
          <span className={styles.goalLabel}>今日目标</span>
          <span className={styles.goalValue}>
            {pomodoroCount} / {goal} 段 · {Math.round(goalPct)}%
          </span>
        </div>
        <div className={styles.goalBar}>
          <div className={styles.goalFill} style={{ width: `${goalPct}%` }} />
        </div>
        <div className={styles.goalEdit}>
          <span className={styles.goalLabel}>每日目标</span>
          <button
            className={styles.goalStepBtn}
            onClick={() => onGoalChange(Math.max(1, goal - 1))}
            aria-label="减少目标"
          >
            −
          </button>
          <input
            className={styles.goalInput}
            type="number"
            min={1}
            max={30}
            value={goal}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(n)) onGoalChange(Math.max(1, Math.min(30, n)));
            }}
            aria-label="每日目标段数"
          />
          <button
            className={styles.goalStepBtn}
            onClick={() => onGoalChange(Math.min(30, goal + 1))}
            aria-label="增加目标"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.shortcutHint}>
        <kbd>Space</kbd> 开始 / 暂停 · <kbd>R</kbd> 重置
      </div>
    </div>
  );
}

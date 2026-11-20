'use client';

import { TimerConfig } from '@/lib/types';
import { MODE_META } from '../lib/constants';
import styles from '../studyroom.module.css';

interface SettingsPanelProps {
  config: TimerConfig;
  show: boolean;
  onUpdate: (patch: Partial<TimerConfig>) => void;
}

type DurationField = {
  key: keyof TimerConfig;
  label: string;
  min: number;
  max: number;
  step: number;
};

const DURATIONS: DurationField[] = [
  { key: 'focusDuration', label: MODE_META.focus.label, min: 1, max: 60, step: 1 },
  { key: 'studyDuration', label: MODE_META.study.label, min: 15, max: 120, step: 5 },
  { key: 'meditationDuration', label: MODE_META.meditation.label, min: 5, max: 60, step: 5 },
  { key: 'exerciseDuration', label: MODE_META.exercise.label, min: 10, max: 120, step: 5 },
  { key: 'readingDuration', label: MODE_META.reading.label, min: 15, max: 120, step: 5 },
  { key: 'shortBreakDuration', label: MODE_META.shortBreak.label, min: 1, max: 15, step: 1 },
  { key: 'longBreakDuration', label: MODE_META.longBreak.label, min: 5, max: 30, step: 1 },
  { key: 'longBreakInterval', label: '长休息间隔', min: 2, max: 12, step: 1 },
];

export function SettingsPanel({ config, show, onUpdate }: SettingsPanelProps) {
  if (!show) return null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>时长设置</h2>
        <span className={styles.cardSub}>自动保存</span>
      </div>

      <div className={styles.settingsGrid}>
        {DURATIONS.map((field) => {
          const value = config[field.key] as number;
          return (
            <div key={field.key}>
              <div className={styles.settingHead}>
                <span>{field.label}</span>
                <span className={styles.settingValue}>
                  {field.key === 'longBreakInterval' ? `${value} 段` : `${value} 分`}
                </span>
              </div>
              <input
                className={styles.range}
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={value}
                onChange={(e) => onUpdate({ [field.key]: Number(e.target.value) })}
                aria-label={field.label}
              />
            </div>
          );
        })}
      </div>

      <div className={styles.divider} />

      <button
        className={`${styles.toggleRow} ${styles.toggleButton}`}
        onClick={() => onUpdate({ autoStartBreaks: !config.autoStartBreaks })}
      >
        <span>工作结束自动开始休息</span>
        <span className={`${styles.switch} ${config.autoStartBreaks ? styles.switchOn : ''}`}>
          <span className={styles.switchDot} />
        </span>
      </button>
      <button
        className={`${styles.toggleRow} ${styles.toggleButton}`}
        onClick={() => onUpdate({ autoStartPomodoros: !config.autoStartPomodoros })}
      >
        <span>休息结束自动开始下一段</span>
        <span className={`${styles.switch} ${config.autoStartPomodoros ? styles.switchOn : ''}`}>
          <span className={styles.switchDot} />
        </span>
      </button>
    </div>
  );
}

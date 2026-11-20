'use client';

import { SoundConfig, SoundType, AlarmType } from '@/lib/types';
import styles from '../studyroom.module.css';

interface SoundPanelProps {
  config: SoundConfig;
  onChange: (patch: Partial<SoundConfig>) => void;
  onPreview: (type: SoundType) => void;
  previewing: SoundType;
  onTestAlarm: () => void;
}

const NOISES: { value: SoundType; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'rain', label: '雨声' },
  { value: 'forest', label: '森林' },
  { value: 'ocean', label: '海浪' },
  { value: 'cafe', label: '咖啡厅' },
  { value: 'wind', label: '风声' },
  { value: 'birds', label: '鸟鸣' },
  { value: 'stream', label: '溪流' },
  { value: 'fire', label: '篝火' },
  { value: 'whitenoise', label: '白噪音' },
  { value: 'pinknoise', label: '粉噪' },
  { value: 'brownnoise', label: '棕噪' },
];

const ALARMS: { value: AlarmType; label: string }[] = [
  { value: 'bell', label: '钟声' },
  { value: 'chime', label: '风铃' },
  { value: 'gentle', label: '温柔' },
  { value: 'digital', label: '数字' },
];

export function SoundPanel({
  config,
  onChange,
  onPreview,
  previewing,
  onTestAlarm,
}: SoundPanelProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>声音</h2>
        <span className={styles.cardSub}>按时段自动播放</span>
      </div>

      <span className={styles.label}>背景环境音</span>
      <div className={styles.soundGrid}>
        {NOISES.map((n) => (
          <button
            key={n.value}
            className={`${styles.soundOption} ${
              config.whiteNoise === n.value ? styles.soundOptionActive : ''
            }`}
            onClick={() => onChange({ whiteNoise: n.value })}
          >
            {n.label}
          </button>
        ))}
      </div>
      <div className={styles.previewRow}>
        <button
          className={`${styles.textBtn} ${
            previewing !== 'none' ? styles.textBtnActive : ''
          }`}
          onClick={() => onPreview(config.whiteNoise)}
          disabled={config.whiteNoise === 'none'}
        >
          {previewing !== 'none' ? '停止试听' : '试听环境音'}
        </button>
        <button className={styles.textBtn} onClick={onTestAlarm}>
          试听提示音
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.rangeRow}>
        <span className={styles.label} style={{ margin: 0 }}>
          音量
        </span>
        <input
          className={styles.range}
          type="range"
          min={0}
          max={100}
          step={5}
          value={config.volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
          aria-label="音量"
        />
        <span className={styles.rangeValue}>{config.volume}</span>
      </div>

      <div className={styles.divider} />

      <span className={styles.label}>结束提示音</span>
      <div className={styles.alarmGrid}>
        {ALARMS.map((a) => (
          <button
            key={a.value}
            className={`${styles.alarmOption} ${
              config.alarm === a.value ? styles.alarmOptionActive : ''
            }`}
            onClick={() => onChange({ alarm: a.value })}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className={styles.divider} />

      <button
        className={`${styles.toggleRow} ${styles.toggleButton}`}
        onClick={() => onChange({ playDuringFocus: !config.playDuringFocus })}
      >
        <span>工作时段播放</span>
        <span className={`${styles.switch} ${config.playDuringFocus ? styles.switchOn : ''}`}>
          <span className={styles.switchDot} />
        </span>
      </button>
      <button
        className={`${styles.toggleRow} ${styles.toggleButton}`}
        onClick={() => onChange({ playDuringBreak: !config.playDuringBreak })}
      >
        <span>休息时段播放</span>
        <span className={`${styles.switch} ${config.playDuringBreak ? styles.switchOn : ''}`}>
          <span className={styles.switchDot} />
        </span>
      </button>
    </div>
  );
}

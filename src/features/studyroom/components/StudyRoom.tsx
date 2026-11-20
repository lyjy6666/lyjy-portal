'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, House, Timer as TimerIcon } from 'lucide-react';
import { SoundConfig, SoundType } from '@/lib/types';
import { playAlarm } from '@/lib/pomodoro-utils';
import { DEFAULT_GOAL, STORAGE_KEYS, isWorkMode } from '../lib/constants';
import { normalizeGoal, normalizeSound, readJSON, writeJSON } from '../lib/storage';
import { useAmbientSound } from '../hooks/useAmbientSound';
import { useStudyConfig } from '../hooks/useStudyConfig';
import { useStudyStats } from '../hooks/useStudyStats';
import { useStudyTasks } from '../hooks/useStudyTasks';
import { CompletionPayload, useStudyTimer } from '../hooks/useStudyTimer';
import { MinimizeFloat } from './MinimizeFloat';
import { SettingsPanel } from './SettingsPanel';
import { SoundPanel } from './SoundPanel';
import { StatsPanel } from './StatsPanel';
import { TaskPanel } from './TaskPanel';
import { TimerPanel } from './TimerPanel';
import styles from '../studyroom.module.css';

const DEFAULT_SOUND: SoundConfig = {
  whiteNoise: 'none',
  alarm: 'bell',
  volume: 50,
  playDuringFocus: false,
  playDuringBreak: false,
};

export function StudyRoom() {
  const { config, updateConfig } = useStudyConfig();
  const { statistics, recordSession } = useStudyStats();
  const {
    tasks,
    selectedTaskId,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    incrementPomodoro,
    selectTask,
  } = useStudyTasks();
  const { play: playAmbient, stop: stopAmbient } = useAmbientSound();

  const [sound, setSound] = useState<SoundConfig>(DEFAULT_SOUND);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [prefsReady, setPrefsReady] = useState(false);
  const [previewing, setPreviewing] = useState<SoundType>('none');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setSound(readJSON(STORAGE_KEYS.sound, DEFAULT_SOUND, normalizeSound));
    setGoal(readJSON(STORAGE_KEYS.goal, DEFAULT_GOAL, normalizeGoal));
    setPrefsReady(true);
  }, []);

  useEffect(() => {
    if (prefsReady) writeJSON(STORAGE_KEYS.sound, sound);
  }, [sound, prefsReady]);

  useEffect(() => {
    if (prefsReady) writeJSON(STORAGE_KEYS.goal, goal);
  }, [goal, prefsReady]);

  const handleSoundChange = useCallback((patch: Partial<SoundConfig>) => {
    setSound((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleComplete = useCallback(
    (payload: CompletionPayload) => {
      if (payload.isWork) {
        // 真实模式时长入账，并同步给当前选中的任务
        recordSession(payload.minutes);
        if (selectedTaskId) incrementPomodoro(selectedTaskId);
      }
      stopAmbient();
      if (!payload.silent) {
        try {
          playAlarm(sound.alarm, sound.volume / 100);
        } catch {
          /* 浏览器拒绝自动播放时静默降级 */
        }
      }
    },
    [recordSession, selectedTaskId, incrementPomodoro, stopAmbient, sound.alarm, sound.volume],
  );

  const timer = useStudyTimer(config, handleComplete);

  // 真正接上 playDuringFocus / playDuringBreak：开始计时按当前模式播放，切模式/暂停/结束自动停
  const targetSound = useMemo<SoundType>(() => {
    if (timer.status !== 'running' || sound.whiteNoise === 'none') return 'none';
    const work = isWorkMode(timer.mode);
    if (work && sound.playDuringFocus) return sound.whiteNoise;
    if (!work && sound.playDuringBreak) return sound.whiteNoise;
    return 'none';
  }, [timer.status, timer.mode, sound]);

  useEffect(() => {
    playAmbient(targetSound);
  }, [targetSound, playAmbient]);

  const handlePreview = useCallback(
    (type: SoundType) => {
      if (type === 'none') {
        stopAmbient();
        setPreviewing('none');
        return;
      }
      if (previewing === type) {
        stopAmbient();
        setPreviewing('none');
      } else {
        playAmbient(type);
        setPreviewing(type);
      }
    },
    [playAmbient, stopAmbient, previewing],
  );

  const handleTestAlarm = useCallback(() => {
    try {
      playAlarm(sound.alarm, sound.volume / 100);
    } catch {
      /* 忽略 */
    }
  }, [sound.alarm, sound.volume]);

  // 快捷键：输入框聚焦时不触发
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const el = event.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
      ) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        timer.toggle();
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        timer.reset();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [timer.toggle, timer.reset]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className={styles.brandTitle}>LYJY 自习室</h1>
              <p className={styles.brandSub}>安静一点 · 专注久一点</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.ghostLink} href="/">
              <House size={14} /> 返回首页
            </Link>
            <Link className={styles.ghostLink} href="/pomodoro">
              <TimerIcon size={14} /> 原版番茄钟
            </Link>
          </div>
        </header>

        <main className={styles.layout}>
          <section className={styles.timerArea}>
            <TimerPanel
              mode={timer.mode}
              status={timer.status}
              remainingSeconds={timer.remainingSeconds}
              totalSeconds={timer.totalSeconds}
              pomodoroCount={statistics.todayPomodoros}
              progress={timer.progress}
              goal={goal}
              showSettings={showSettings}
              isMinimized={isMinimized}
              onToggle={timer.toggle}
              onReset={timer.reset}
              onSwitchMode={timer.switchMode}
              onGoalChange={setGoal}
              onToggleSettings={() => setShowSettings((v) => !v)}
              onToggleMinimized={() => setIsMinimized((v) => !v)}
            />
          </section>

          <section className={styles.taskArea}>
            <TaskPanel
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onAdd={addTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onToggleComplete={toggleComplete}
              onIncrementPomodoro={incrementPomodoro}
              onSelect={selectTask}
            />
          </section>

          <section className={styles.controlArea}>
            <SoundPanel
              config={sound}
              onChange={handleSoundChange}
              onPreview={handlePreview}
              previewing={previewing}
              onTestAlarm={handleTestAlarm}
            />
            <SettingsPanel config={config} show={showSettings} onUpdate={updateConfig} />
          </section>

          <section className={styles.statsArea}>
            <StatsPanel statistics={statistics} />
          </section>
        </main>

        <div className={styles.footnote}>
          数据保存在本机浏览器 · 与原版番茄钟共享任务与统计 · <kbd>Space</kbd> 开始/暂停 · <kbd>R</kbd> 重置
        </div>
      </div>

      {isMinimized && (
        <MinimizeFloat
          mode={timer.mode}
          remainingSeconds={timer.remainingSeconds}
          progress={timer.progress}
          isRunning={timer.isRunning}
          onToggle={timer.toggle}
          onExpand={() => setIsMinimized(false)}
        />
      )}
    </div>
  );
}

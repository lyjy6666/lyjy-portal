'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { TimerMode, TimerConfig } from '@/lib/types'
import { defaultTimerConfig } from '@/lib/pomodoro-utils'

interface TimerContextType {
  mode: TimerMode
  setMode: (mode: TimerMode) => void
  isRunning: boolean
  isPaused: boolean
  remainingTime: number
  totalDuration: number
  config: TimerConfig
  pomodoroCount: number
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  updateConfig: (newConfig: Partial<TimerConfig>) => void
  isMinimized: boolean
  setIsMinimized: (minimized: boolean) => void
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TimerMode>('focus')
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [remainingTime, setRemainingTime] = useState(defaultTimerConfig.focusDuration * 60)
  const [totalDuration, setTotalDuration] = useState(defaultTimerConfig.focusDuration * 60)
  const [config, setConfig] = useState(defaultTimerConfig)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  // 获取当前模式的总时长
  const getModeDuration = useCallback((currentMode: TimerMode): number => {
    switch (currentMode) {
      case 'focus': return config.focusDuration * 60
      case 'study': return config.studyDuration * 60
      case 'meditation': return config.meditationDuration * 60
      case 'exercise': return config.exerciseDuration * 60
      case 'reading': return config.readingDuration * 60
      case 'shortBreak': return config.shortBreakDuration * 60
      case 'longBreak': return config.longBreakDuration * 60
      default: return 25 * 60
    }
  }, [config])

  // 切换模式时更新时长
  useEffect(() => {
    const duration = getModeDuration(mode)
    if (!isRunning) {
      setRemainingTime(duration)
      setTotalDuration(duration)
    }
  }, [mode, getModeDuration, isRunning])

  // 计时器逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && !isPaused && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // 计时完成
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isPaused, remainingTime])

  // 计时完成处理
  useEffect(() => {
    if (remainingTime === 0 && isRunning) {
      setIsRunning(false)

      // 播放提醒音效
      if (typeof window !== 'undefined') {
        const audio = new Audio('/notification.mp3')
        audio.play().catch(() => {})
      }

      // 工作/活动模式完成后自动进入休息
      if (['focus', 'study', 'meditation', 'exercise', 'reading'].includes(mode)) {
        setPomodoroCount(prev => {
          const newCount = prev + 1
          
          // 自动切换到休息（每4个番茄后长休息）
          const shouldLongBreak = newCount % 4 === 0
          setTimeout(() => {
            setMode(shouldLongBreak ? 'longBreak' : 'shortBreak')
          }, 500)
          
          return newCount
        })
      } else {
        // 休息完成后自动回到专注
        setTimeout(() => {
          setMode('focus')
        }, 500)
      }
    }
  }, [remainingTime, isRunning, mode])

  const startTimer = useCallback(() => {
    setIsRunning(true)
    setIsPaused(false)
  }, [])

  const pauseTimer = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setIsPaused(false)
    const duration = getModeDuration(mode)
    setRemainingTime(duration)
    setTotalDuration(duration)
  }, [mode, getModeDuration])

  const updateConfig = useCallback((newConfig: Partial<TimerConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  const value: TimerContextType = {
    mode,
    setMode,
    isRunning,
    isPaused,
    remainingTime,
    totalDuration,
    config,
    pomodoroCount,
    startTimer,
    pauseTimer,
    resetTimer,
    updateConfig,
    isMinimized,
    setIsMinimized,
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider')
  }
  return context
}

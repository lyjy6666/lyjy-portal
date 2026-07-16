'use client';

import { useState } from 'react';
import { Volume2, VolumeX, Music, Bell, Droplets, Wind, Trees, Waves, Coffee, Play, Pause, Bird, Flame, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { SoundConfig, SoundType, AlarmType } from '@/lib/types';
import { playAlarm, generateWhiteNoise, stopAllAudio } from '@/lib/pomodoro-utils';
import { cn } from '@/lib/utils';

interface SoundControlProps {
  config: SoundConfig;
  onConfigChange: (config: SoundConfig) => void;
}

export function SoundControl({ config, onConfigChange }: SoundControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const whiteNoiseOptions: { value: SoundType; label: string; icon: React.ReactNode }[] = [
    { value: 'none', label: '无', icon: <VolumeX className="h-5 w-5" /> },
    { value: 'rain', label: '雨声', icon: <Droplets className="h-5 w-5" /> },
    { value: 'forest', label: '森林', icon: <Trees className="h-5 w-5" /> },
    { value: 'ocean', label: '海浪', icon: <Waves className="h-5 w-5" /> },
    { value: 'cafe', label: '咖啡厅', icon: <Coffee className="h-5 w-5" /> },
    { value: 'wind', label: '风声', icon: <Wind className="h-5 w-5" /> },
    { value: 'birds', label: '鸟鸣', icon: <Bird className="h-5 w-5" /> },
    { value: 'stream', label: '溪流', icon: <Droplets className="h-5 w-5" /> },
    { value: 'fire', label: '篝火', icon: <Flame className="h-5 w-5" /> },
    { value: 'whitenoise', label: '白噪音', icon: <Zap className="h-5 w-5" /> },
    { value: 'pinknoise', label: '粉红噪音', icon: <Sparkles className="h-5 w-5" /> },
    { value: 'brownnoise', label: '棕色噪音', icon: <Wind className="h-5 w-5" /> },
  ];

  const alarmOptions: { value: AlarmType; label: string }[] = [
    { value: 'bell', label: '钟声' },
    { value: 'chime', label: '风铃' },
    { value: 'gentle', label: '温柔' },
    { value: 'digital', label: '数字' },
  ];

  const handlePlayWhiteNoise = () => {
    if (isPlaying) {
      stopAllAudio();
      setIsPlaying(false);
    } else {
      if (config.whiteNoise !== 'none') {
        generateWhiteNoise(config.whiteNoise); // 使用默认5秒循环
        setIsPlaying(true);
      }
    }
  };

  const handleTestAlarm = () => {
    playAlarm(config.alarm, config.volume / 100);
  };

  const handleWhiteNoiseChange = (type: SoundType) => {
    if (isPlaying) {
      stopAllAudio();
      setIsPlaying(false);
    }
    onConfigChange({ ...config, whiteNoise: type });
  };

  const handleVolumeChange = (volume: number) => {
    onConfigChange({ ...config, volume });
  };

  const handleAlarmChange = (alarm: AlarmType) => {
    onConfigChange({ ...config, alarm });
  };

  const handleTogglePlayDuringFocus = () => {
    onConfigChange({ ...config, playDuringFocus: !config.playDuringFocus });
  };

  const handleTogglePlayDuringBreak = () => {
    onConfigChange({ ...config, playDuringBreak: !config.playDuringBreak });
  };

  return (
    <Card className="p-6 w-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Music className="h-5 w-5" />
        音效设置
      </h2>

      <div className="space-y-6">
        {/* 白噪音选择 */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">背景白噪音</label>
            <Button
              size="sm"
              variant={isPlaying ? 'default' : 'outline'}
              onClick={handlePlayWhiteNoise}
              disabled={config.whiteNoise === 'none'}
              className={cn(
                'h-8',
                isPlaying
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {whiteNoiseOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleWhiteNoiseChange(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                  config.whiteNoise === option.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                )}
              >
                {option.icon}
                <span className="text-xs">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 音量控制 */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            音量
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">0</span>
            <Slider
              value={[config.volume]}
              onValueChange={([value]) => handleVolumeChange(value)}
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="text-sm text-slate-500 w-8">{config.volume}</span>
          </div>
        </div>

        {/* 提醒铃声选择 */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              提醒铃声
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestAlarm}
              className="h-8 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              试听
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {alarmOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAlarmChange(option.value)}
                className={cn(
                  'py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium',
                  config.alarm === option.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 播放时机 */}
        <div className="space-y-3 pt-4 border-t border-slate-300 dark:border-slate-700">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">播放时机</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={cn(
                  'relative w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                  config.playDuringFocus
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-400 dark:border-slate-600'
                )}
              >
                {config.playDuringFocus && (
                  <div className="w-3 h-3 rounded-full bg-white" />
                )}
              </div>
              <input
                type="checkbox"
                checked={config.playDuringFocus}
                onChange={handleTogglePlayDuringFocus}
                className="hidden"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">专注时播放</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={cn(
                  'relative w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                  config.playDuringBreak
                    ? 'border-green-500 bg-green-500'
                    : 'border-slate-400 dark:border-slate-600'
                )}
              >
                {config.playDuringBreak && (
                  <div className="w-3 h-3 rounded-full bg-white" />
                )}
              </div>
              <input
                type="checkbox"
                checked={config.playDuringBreak}
                onChange={handleTogglePlayDuringBreak}
                className="hidden"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">休息时播放</span>
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
}

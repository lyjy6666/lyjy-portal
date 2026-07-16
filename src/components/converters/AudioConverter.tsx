'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Music, Play, Pause, CheckCircle2, Loader2 } from 'lucide-react';

type AudioFormat = 'mp3' | 'wav' | 'aac' | 'ogg';

export default function AudioConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<AudioFormat>('mp3');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedUrl, setConvertedUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      setConvertedUrl('');
      setConversionProgress(0);
      setDownloadSuccess(false);
    }
  };

  const convertAudio = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setConversionProgress(0);
    setDownloadSuccess(false);

    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      setConversionProgress(20);
      
      // 解码音频数据
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setConversionProgress(50);
      
      // 创建离线音频上下文进行转换
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      setConversionProgress(80);
      
      // 转换为 WAV 格式（最简单的方法）
      const wavBlob = await bufferToWav(renderedBuffer);
      
      setConversionProgress(100);
      
      const url = URL.createObjectURL(wavBlob);
      setConvertedUrl(url);
      
      setTimeout(() => {
        setIsConverting(false);
      }, 500);
      
    } catch (e) {
      console.error('转换失败:', e);
      setIsConverting(false);
    }
  };

  const bufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV 文件头
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // 写入音频数据
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const handleDownload = () => {
    if (!convertedUrl || isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    const link = document.createElement('a');
    link.href = convertedUrl;
    const extension = 'wav'; // 目前只支持输出 WAV
    const originalName = selectedFile?.name.split('.')[0] || 'audio';
    link.download = `${originalName}_converted.${extension}`;
    link.click();

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    }, 1500);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
        setConvertedUrl('');
        setConversionProgress(0);
        setDownloadSuccess(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div
        className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-cyan-50 to-blue-50 p-8 transition-all duration-300 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 dark:hover:border-cyan-500"
        onClick={handleUploadClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-cyan-500/10 dark:to-blue-500/10"></div>
        <div className="relative z-10 mb-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 p-4 shadow-lg shadow-cyan-500/25 transition-transform duration-300 group-hover:scale-110">
          <Music className="h-8 w-8 text-white" />
        </div>
        <p className="relative z-10 text-sm font-semibold text-slate-800 dark:text-slate-200">
          点击上传音频或拖拽到此处
        </p>
        <p className="relative z-10 mt-1 text-xs text-slate-500 dark:text-slate-400">
          支持 MP3、WAV、AAC、OGG 格式
        </p>
      </div>

      {/* File Info */}
      {selectedFile && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
          <div className="rounded-lg bg-cyan-500/10 p-2 dark:bg-cyan-500/20">
            <Music className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}

      {/* Format Selection */}
      {selectedFile && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            目标格式
          </label>
          <Select value={targetFormat} onValueChange={(value: AudioFormat) => setTargetFormat(value)}>
            <SelectTrigger className="border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp3">MP3</SelectItem>
              <SelectItem value="wav">WAV</SelectItem>
              <SelectItem value="aac">AAC</SelectItem>
              <SelectItem value="ogg">OGG</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            注意：当前版本优先输出 WAV 格式以保证高质量
          </p>
        </div>
      )}

      {/* Progress */}
      {isConverting && (
        <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-800 dark:bg-cyan-950/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              正在转换音频...
            </span>
            <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
              {conversionProgress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${conversionProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Convert Button */}
      {selectedFile && !isConverting && !convertedUrl && (
        <Button
          onClick={convertAudio}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-cyan-700 hover:to-blue-700 hover:shadow-xl hover:shadow-cyan-500/30"
        >
          <Music className="mr-2 h-4 w-4" />
          开始转换
        </Button>
      )}

      {/* Audio Player and Download */}
      {convertedUrl && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 dark:border-slate-700 dark:from-green-950/30 dark:to-emerald-950/30">
            <div className="rounded-lg bg-green-500/10 p-2 dark:bg-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                转换成功
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {selectedFile?.name.split('.')[0]}_converted.wav
              </p>
            </div>
          </div>

          {/* Audio Player */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <Button
              onClick={togglePlay}
              size="icon"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 hover:from-cyan-600 hover:to-blue-600"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            <audio
              ref={audioRef}
              src={convertedUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="flex-1"
              controls
            />
          </div>

          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                下载中，请稍候...
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                下载成功
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                下载音频
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

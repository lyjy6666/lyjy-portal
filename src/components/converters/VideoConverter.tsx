'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileVideo, CheckCircle2, Loader2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function VideoConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string>('');
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [outputFormat, setOutputFormat] = useState('mp4');
  
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const supportedFormats = ['MP4', 'WebM', 'MOV', 'AVI', 'MKV', 'FLV'];
  const outputFormats = [
    { value: 'mp4', label: 'MP4' },
    { value: 'webm', label: 'WebM' },
    { value: 'mov', label: 'MOV' },
    { value: 'avi', label: 'AVI' },
    { value: 'mkv', label: 'MKV' },
  ];

  const loadFFmpeg = async () => {
    if (loadedRef.current) return;
    
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      loadedRef.current = true;
    } catch (error) {
      console.error('FFmpeg 加载失败:', error);
      alert('视频转换组件加载失败，请刷新页面重试');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setConvertedUrl('');
      setConvertedFileName('');
      setDownloadSuccess(false);
    }
  };

  const convertVideo = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setConvertedUrl('');
    setDownloadSuccess(false);

    try {
      await loadFFmpeg();
      
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        throw new Error('FFmpeg not loaded');
      }
      
      const inputName = `input.${selectedFile.name.split('.').pop()}`;
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(selectedFile));

      await ffmpeg.exec([
        '-i',
        inputName,
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName) as unknown as ArrayBuffer;
      const dataArray = new Uint8Array(data);
      
      const blob = new Blob([dataArray], { type: `video/${outputFormat}` });
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
      setConvertedFileName(`${selectedFile.name.split('.')[0]}_converted.${outputFormat}`);
      
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (error) {
      console.error('视频转换失败:', error);
      alert('视频转换失败，请检查文件格式或重试');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!convertedUrl) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const link = document.createElement('a');
      link.href = convertedUrl;
      link.download = convertedFileName;
      link.click();

      setDownloadSuccess(true);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div
        className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-8 transition-all duration-300 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 dark:hover:border-rose-500"
        onClick={handleUploadClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-rose-500/10 dark:to-pink-500/10"></div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="relative z-10 mb-3 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 p-4 shadow-lg shadow-rose-500/25 transition-transform duration-300 group-hover:scale-110">
          <Upload className="h-8 w-8 text-white" />
        </div>
        <p className="relative z-10 text-sm font-semibold text-slate-800 dark:text-slate-200">
          点击上传视频或拖拽到此处
        </p>
        <p className="relative z-10 mt-1 text-xs text-slate-500 dark:text-slate-400">
          支持 {supportedFormats.join(', ')} 格式
        </p>
      </div>

      {/* Selected File Info */}
      {selectedFile && !convertedUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-rose-500/10 p-2 dark:bg-rose-500/20">
                <FileVideo className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                已选择视频
              </h3>
            </div>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {selectedFile.name}
            </span>
          </div>

          {/* Format Selection */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
              目标格式
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all duration-300 hover:border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-rose-500 dark:focus:border-rose-500"
            >
              {outputFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          {/* Convert Button */}
          <Button
            onClick={convertVideo}
            disabled={isConverting}
            className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-rose-700 hover:to-pink-700 hover:shadow-xl hover:shadow-rose-500/30 disabled:opacity-50"
          >
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                转换中，请稍候...
              </>
            ) : (
              <>
                <FileVideo className="mr-2 h-4 w-4" />
                开始转换
              </>
            )}
          </Button>
        </div>
      )}

      {/* Download Section */}
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
                {convertedFileName}
              </p>
            </div>
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
                下载视频
              </>
            )}
          </Button>
        </div>
      )}

      {/* Info Card */}
      <Card className="border-0 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
        <CardContent className="p-6">
          <h4 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">功能说明</h4>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-rose-500">•</span>
              <span>支持 {supportedFormats.join(', ')} 等常见视频格式之间的转换</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500">•</span>
              <span>使用 H.264 编码，保证视频质量和兼容性</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500">•</span>
              <span>自动处理音频，转换为 AAC 编码</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500">•</span>
              <span>所有转换都在浏览器本地完成，保护隐私</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

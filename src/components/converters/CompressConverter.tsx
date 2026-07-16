'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, CheckCircle2, Loader2, FileText, Image as ImageIcon, FileVideo, Music } from 'lucide-react';
import JSZip from 'jszip';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export default function CompressConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'document' | 'video' | 'audio' | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionStatus, setCompressionStatus] = useState('');
  const [compressedUrl, setCompressedUrl] = useState<string>('');
  const [compressedFileName, setCompressedFileName] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [quality, setQuality] = useState(80);
  
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const supportedFormats = [
    '图片：JPEG, PNG, WebP, GIF',
    '文档：PDF, DOC, DOCX, TXT, HTML, CSV',
    '视频：MP4, WebM, MOV',
    '音频：MP3, WAV, AAC, OGG'
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
      alert('视频/音频压缩组件加载失败，请刷新页面重试');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOriginalSize(file.size);
      setCompressedUrl('');
      setCompressedFileName('');
      setCompressedSize(0);
      setDownloadSuccess(false);
      
      // Determine file type
      const type = file.type.toLowerCase();
      if (type.startsWith('image/')) {
        setFileType('image');
      } else if (type.startsWith('video/')) {
        setFileType('video');
      } else if (type.startsWith('audio/')) {
        setFileType('audio');
      } else {
        setFileType('document');
      }
    }
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Calculate new dimensions (max 1920x1080)
        let width = img.width;
        let height = img.height;
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress using canvas
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, 'image/jpeg', quality / 100);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const compressDocument = async (file: File): Promise<Blob> => {
    const zip = new JSZip();
    
    // Add file to zip
    const content = await file.arrayBuffer();
    zip.file(file.name, content);
    
    // Generate zip
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    return zipBlob;
  };

  const compressVideo = async (file: File): Promise<Blob> => {
    await loadFFmpeg();
    const ffmpeg = ffmpegRef.current;
    
    if (!ffmpeg) throw new Error('FFmpeg not loaded');
    
    const inputName = `input.${file.name.split('.').pop()}`;
    const outputName = `output.mp4`;
    
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    
    // Compress video with lower bitrate
    await ffmpeg.exec([
      '-i',
      inputName,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      (28 - (quality - 50) / 50 * 10).toString(),
      '-c:a',
      'aac',
      '-b:a',
      '64k',
      outputName,
    ]);
    
    const data = await ffmpeg.readFile(outputName) as unknown as ArrayBuffer;
    const dataArray = new Uint8Array(data);
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    return new Blob([dataArray], { type: 'video/mp4' });
  };

  const compressAudio = async (file: File): Promise<Blob> => {
    await loadFFmpeg();
    const ffmpeg = ffmpegRef.current;
    
    if (!ffmpeg) throw new Error('FFmpeg not loaded');
    
    const inputName = `input.${file.name.split('.').pop()}`;
    const outputName = `output.mp3`;
    
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    
    // Compress audio with lower bitrate
    await ffmpeg.exec([
      '-i',
      inputName,
      '-b:a',
      `${64 + (quality - 50) / 50 * 96}k`,
      outputName,
    ]);
    
    const data = await ffmpeg.readFile(outputName) as unknown as ArrayBuffer;
    const dataArray = new Uint8Array(data);
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    return new Blob([dataArray], { type: 'audio/mp3' });
  };

  const handleCompress = async () => {
    if (!selectedFile || !fileType) return;

    setIsCompressing(true);
    setCompressionProgress(0);
    setCompressionStatus('正在准备压缩...');
    setCompressedUrl('');
    setDownloadSuccess(false);

    try {
      let blob: Blob;
      let extension = '';
      
      setCompressionProgress(20);
      
      switch (fileType) {
        case 'image':
          setCompressionStatus('正在压缩图片...');
          blob = await compressImage(selectedFile);
          extension = 'jpg';
          break;
          
        case 'document':
          setCompressionStatus('正在压缩文档...');
          blob = await compressDocument(selectedFile);
          extension = 'zip';
          break;
          
        case 'video':
          setCompressionStatus('正在压缩视频...');
          blob = await compressVideo(selectedFile);
          extension = 'mp4';
          break;
          
        case 'audio':
          setCompressionStatus('正在压缩音频...');
          blob = await compressAudio(selectedFile);
          extension = 'mp3';
          break;
          
        default:
          throw new Error('不支持的文件类型');
      }
      
      setCompressionProgress(100);
      setCompressionStatus('压缩完成！');
      
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
      setCompressedSize(blob.size);
      setCompressedFileName(`${selectedFile.name.split('.')[0]}_compressed.${extension}`);
      
      setTimeout(() => {
        setIsCompressing(false);
        setCompressionProgress(0);
        setCompressionStatus('');
      }, 500);
      
    } catch (e) {
      console.error('压缩失败:', e);
      alert('压缩失败: ' + (e as Error).message);
      setIsCompressing(false);
      setCompressionProgress(0);
      setCompressionStatus('');
    }
  };

  const handleDownload = async () => {
    if (!compressedUrl || isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const link = document.createElement('a');
      link.href = compressedUrl;
      link.download = compressedFileName;
      link.click();

      setDownloadSuccess(true);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getCompressionRatio = () => {
    if (originalSize === 0 || compressedSize === 0) return 0;
    return Math.round((1 - compressedSize / originalSize) * 100);
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'image': return <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'video': return <FileVideo className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'audio': return <Music className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />;
      default: return <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div
        className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-8 transition-all duration-300 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 dark:hover:border-indigo-500"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-indigo-500/10 dark:to-violet-500/10"></div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="relative z-10 mb-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 p-4 shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110">
          <Upload className="h-8 w-8 text-white" />
        </div>
        <p className="relative z-10 text-sm font-semibold text-slate-800 dark:text-slate-200">
          点击上传文件或拖拽到此处
        </p>
        <p className="relative z-10 mt-1 text-xs text-slate-500 dark:text-slate-400">
          {supportedFormats.join(' · ')}
        </p>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-500/10 p-2 dark:bg-indigo-500/20">
                {getFileIcon()}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  已选择文件
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {selectedFile.name} · {formatFileSize(originalSize)}
                </p>
              </div>
            </div>
          </div>

          {/* Quality Control for image/video/audio */}
          {fileType !== 'document' && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  压缩质量: {quality}%
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {quality < 50 ? '高压缩' : quality < 80 ? '平衡' : '高质量'}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>高压缩</span>
                <span>高质量</span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isCompressing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">{compressionStatus}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{compressionProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${compressionProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Compress Button */}
          {!compressedUrl && !isCompressing && (
            <Button
              onClick={handleCompress}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl hover:shadow-indigo-500/30"
            >
              开始压缩
            </Button>
          )}

          {/* Compression Result */}
          {compressedUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 dark:border-green-800 dark:from-green-950/30 dark:to-emerald-950/30">
                <div className="rounded-lg bg-green-500/10 p-2 dark:bg-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    压缩完成
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span>原始: {formatFileSize(originalSize)}</span>
                    <span>→</span>
                    <span>压缩后: {formatFileSize(compressedSize)}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      节省 {getCompressionRatio()}%
                    </span>
                  </div>
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
                    下载中...
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    下载成功
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    下载压缩文件
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-0 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-slate-900 dark:to-slate-800">
        <CardContent className="p-6">
          <h4 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">功能说明</h4>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>图片压缩：自动调整尺寸和优化JPEG质量</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>文档压缩：使用ZIP格式打包文档，节省存储空间</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>视频压缩：使用H.264编码降低比特率，保持清晰度</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>音频压缩：降低比特率，保持音质平衡</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>所有压缩都在浏览器本地完成，保护隐私</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp';

export default function ImageConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState<number>(90);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setConvertedUrl('');
      setDownloadSuccess(false);
    }
  };

  const convertImage = () => {
    if (!selectedFile || !previewUrl) return;

    setIsConverting(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsConverting(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const mimeType = `image/${targetFormat === 'jpeg' ? 'jpeg' : targetFormat}`;
      const qualityValue = targetFormat === 'png' || targetFormat === 'bmp' ? undefined : quality / 100;
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setConvertedUrl(url);
        }
        setIsConverting(false);
      }, mimeType, qualityValue);
    };
    img.src = previewUrl;
  };

  const downloadImage = () => {
    if (!convertedUrl || isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    const link = document.createElement('a');
    link.href = convertedUrl;
    const extension = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
    const originalName = selectedFile?.name.split('.')[0] || 'image';
    link.download = `${originalName}_converted.${extension}`;
    link.click();

    // 模拟下载延迟，显示提示
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    }, 1500);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const supportedFormats = 'JPEG, PNG, WebP, GIF, BMP';

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div
        className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-8 transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 dark:hover:border-blue-500"
        onClick={handleUploadClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-500/10 dark:to-purple-500/10"></div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="relative z-10 mb-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-4 shadow-lg shadow-blue-500/25 transition-transform duration-300 group-hover:scale-110">
          <Upload className="h-8 w-8 text-white" />
        </div>
        <p className="relative z-10 text-sm font-semibold text-slate-800 dark:text-slate-200">
          点击上传图片或拖拽到此处
        </p>
        <p className="relative z-10 mt-1 text-xs text-slate-500 dark:text-slate-400">
          支持 {supportedFormats} 格式
        </p>
      </div>

      {/* Preview Section */}
      {previewUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 dark:bg-blue-500/20">
                <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                预览
              </h3>
            </div>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {selectedFile?.name}
            </span>
          </div>
          <div className="flex justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-6 shadow-inner dark:border-slate-700 dark:bg-slate-800">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-72 max-w-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      )}

      {/* Conversion Options */}
      {previewUrl && (
        <div className="space-y-5 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            转换选项
          </h3>
          
          {/* Format Selection */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              目标格式：
            </label>
            <Select value={targetFormat} onValueChange={(value: ImageFormat) => setTargetFormat(value)}>
              <SelectTrigger className="w-full border-slate-300 bg-white shadow-sm sm:w-[200px] dark:border-slate-600 dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG (.jpg)</SelectItem>
                <SelectItem value="png">PNG (.png)</SelectItem>
                <SelectItem value="webp">WebP (.webp)</SelectItem>
                <SelectItem value="gif">GIF (.gif)</SelectItem>
                <SelectItem value="bmp">BMP (.bmp)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality Slider */}
          {targetFormat !== 'png' && targetFormat !== 'bmp' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  图片质量
                </label>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600 dark:bg-slate-700"
              />
            </div>
          )}

          {/* Convert Button */}
          <Button
            onClick={convertImage}
            disabled={isConverting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50"
          >
            {isConverting ? '转换中...' : '开始转换'}
          </Button>
        </div>
      )}

      {/* Download Section */}
      {convertedUrl && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
            <div className="rounded-lg bg-green-500/10 p-2 dark:bg-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              转换完成
            </h3>
          </div>
          <div className="flex justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-6 shadow-inner dark:border-slate-700 dark:bg-slate-800">
            <img
              src={convertedUrl}
              alt="Converted"
              className="max-h-72 max-w-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
          <Button
            onClick={downloadImage}
            disabled={isDownloading}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-green-700 hover:to-teal-700 hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-pulse" />
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
                下载转换后的图片
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

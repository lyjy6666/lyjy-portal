'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

type InputType = 'image' | 'spreadsheet' | 'text';
type OutputType = 'pdf' | 'image';

interface ConversionOption {
  input: InputType;
  output: OutputType;
  label: string;
}

interface ConversionGroup {
  input: InputType;
  label: string;
  icon: string;
  options: ConversionOption[];
}

// 转换选项定义（只保留稳定可用的功能）
const conversionOptions: ConversionOption[] = [
  // 图片转换
  { input: 'image', output: 'pdf', label: '图片 → PDF' },
  
  // 文本转换
  { input: 'text', output: 'pdf', label: '文本 → PDF' },
  { input: 'text', output: 'image', label: '文本 → 图片' },
  
  // 表格转换
  { input: 'spreadsheet', output: 'pdf', label: '表格 → PDF' },
];

// 转换分组（按输入文件类型）
const conversionGroups: ConversionGroup[] = [
  {
    input: 'image',
    label: '图片转换',
    icon: '🖼️',
    options: conversionOptions.filter(opt => opt.input === 'image'),
  },
  {
    input: 'text',
    label: '文本转换',
    icon: '📝',
    options: conversionOptions.filter(opt => opt.input === 'text'),
  },
  {
    input: 'spreadsheet',
    label: '表格转换',
    icon: '📊',
    options: conversionOptions.filter(opt => opt.input === 'spreadsheet'),
  },
];

export default function DocumentConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [conversionType, setConversionType] = useState<ConversionOption>(conversionOptions[0]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState('');
  const [convertedUrl, setConvertedUrl] = useState<string>('');
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setConvertedUrl('');
      setConvertedFileName('');
      setConversionProgress(0);
      setConversionStatus('');
      setError('');
      setDownloadSuccess(false);
    }
  };

  // 图片 → PDF
  const convertImageToPDF = async (file: File): Promise<Blob> => {
    const pdf = new jsPDF();
    const img = await loadImage(file);
    
    const imgWidth = 210;
    const imgHeight = (img.height * imgWidth) / img.width;
    
    pdf.addImage(img, 'JPEG', 0, 0, imgWidth, imgHeight);
    return pdf.output('blob');
  };

  // 文本 → PDF（使用 Canvas 渲染以支持中文）
  const convertTextToPDF = async (file: File): Promise<Blob> => {
    const text = await file.text();
    
    // 先用 Canvas 渲染文本（支持中文）
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建 canvas 上下文');
    
    const fontSize = 14;
    const lineHeight = 20;
    const padding = 30;
    const pageWidth = 595; // A4 width in points
    const pageHeight = 842; // A4 height in points
    
    // 设置中文字体
    ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", "STHeiti", sans-serif`;
    
    // 计算文本宽度
    const lines = text.split('\n');
    const maxWidth = pageWidth - padding * 2;
    
    // 自动换行
    const wrappedLines: string[] = [];
    lines.forEach(line => {
      let currentLine = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          wrappedLines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    });
    
    // 创建 PDF
    const pdf = new jsPDF();
    let currentPage = 0;
    let y = padding;
    
    // 分页
    const linesPerPage = Math.floor((pageHeight - padding * 2) / lineHeight);
    
    wrappedLines.forEach((line, index) => {
      if (index > 0 && index % linesPerPage === 0) {
        pdf.addPage();
        currentPage++;
        y = padding;
      }
      
      // 使用 Canvas 渲染文本
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('无法创建 canvas 上下文');
      
      tempCtx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", "STHeiti", sans-serif`;
      const metrics = tempCtx.measureText(line);
      
      tempCanvas.width = metrics.width;
      tempCanvas.height = lineHeight;
      
      tempCtx.fillStyle = '#000000';
      tempCtx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", "STHeiti", sans-serif`;
      tempCtx.textBaseline = 'top';
      tempCtx.fillText(line, 0, 2);
      
      const imgData = tempCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', padding, y, metrics.width, lineHeight);
      
      y += lineHeight;
    });
    
    return pdf.output('blob');
  };

  // 文本 → 图片（支持中文）
  const convertTextToImage = async (file: File): Promise<Blob> => {
    const text = await file.text();
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建 canvas 上下文');
    
    const fontSize = 16;
    const lineHeight = 24;
    const padding = 20;
    const maxWidth = 800;
    
    // 设置支持中文的字体
    ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", "STHeiti", "SimHei", sans-serif`;
    
    // 自动换行
    const lines = text.split('\n');
    const wrappedLines: string[] = [];
    
    lines.forEach(line => {
      let currentLine = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          wrappedLines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    });
    
    // 计算画布高度
    const textHeight = wrappedLines.length * lineHeight;
    canvas.width = maxWidth + padding * 2;
    canvas.height = textHeight + padding * 2;
    
    // 绘制背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 重新设置字体（重置画布后需要重新设置）
    ctx.fillStyle = '#000000';
    ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", "STHeiti", "SimHei", sans-serif`;
    ctx.textBaseline = 'top';
    
    // 绘制文本
    wrappedLines.forEach((line, index) => {
      ctx.fillText(line, padding, padding + index * lineHeight);
    });
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('无法转换为图片'));
      }, 'image/png');
    });
  };

  // 表格 → PDF
  const convertSpreadsheetToPDF = async (file: File): Promise<Blob> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    if (!jsonData || jsonData.length === 0) throw new Error('表格为空');
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    
    const cellWidth = (pageWidth - margin * 2) / jsonData[0].length;
    const cellHeight = 10;
    
    let y = margin;
    
    jsonData.forEach((row, rowIndex) => {
      if (y + cellHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      
      row.forEach((cell, cellIndex) => {
        pdf.rect(margin + cellIndex * cellWidth, y, cellWidth, cellHeight);
        const cellText = String(cell || '');
        pdf.text(cellText, margin + cellIndex * cellWidth + 2, y + 7);
      });
      
      y += cellHeight;
    });
    
    return pdf.output('blob');
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setConversionProgress(0);
    setConversionStatus('正在准备转换...');
    setError('');
    setConvertedUrl('');
    setDownloadSuccess(false);

    try {
      let blob: Blob;
      let extension = '';
      
      setConversionProgress(10);
      
      switch (conversionType.input) {
        case 'image':
          if (conversionType.output === 'pdf') {
            setConversionStatus('正在生成PDF...');
            blob = await convertImageToPDF(selectedFile);
            extension = 'pdf';
          } else {
            throw new Error('不支持的转换类型');
          }
          break;
          
        case 'text':
          if (conversionType.output === 'pdf') {
            setConversionStatus('正在转换PDF...');
            blob = await convertTextToPDF(selectedFile);
            extension = 'pdf';
          } else if (conversionType.output === 'image') {
            setConversionStatus('正在生成图片...');
            blob = await convertTextToImage(selectedFile);
            extension = 'png';
          } else {
            throw new Error('不支持的转换类型');
          }
          break;
          
        case 'spreadsheet':
          if (conversionType.output === 'pdf') {
            setConversionStatus('正在转换PDF...');
            blob = await convertSpreadsheetToPDF(selectedFile);
            extension = 'pdf';
          } else {
            throw new Error('不支持的转换类型');
          }
          break;
          
        default:
          throw new Error('不支持的输入类型');
      }
      
      setConversionProgress(100);
      setConversionStatus('转换完成！');
      
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
      setConvertedFileName(`${selectedFile.name.split('.')[0]}_converted.${extension}`);
      
      setTimeout(() => {
        setIsConverting(false);
        setConversionProgress(0);
        setConversionStatus('');
      }, 500);
      
    } catch (e) {
      setError((e as Error).message);
      setIsConverting(false);
      setConversionProgress(0);
      setConversionStatus('');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getFileAccept = () => {
    switch (conversionType.input) {
      case 'image':
        return 'image/*';
      case 'text':
        return '.txt';
      case 'spreadsheet':
        return '.csv,.xlsx,.xls';
      default:
        return '*/*';
    }
  };

  const handleDownload = async () => {
    if (!convertedUrl) return;

    setIsDownloading(true);
    
    // 延迟下载，给用户反馈
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const response = await fetch(convertedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = convertedFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Conversion Type Selector */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
        <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          选择转换类型
        </label>
        <div className="grid gap-3">
          {conversionGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span>{group.icon}</span>
                <span>{group.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((option, optionIndex) => (
                  <button
                    key={optionIndex}
                    onClick={() => setConversionType(option)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      conversionType === option
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-400 hover:bg-orange-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:border-orange-500 dark:hover:bg-orange-950/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div
        className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-orange-50 to-amber-50 p-8 transition-all duration-300 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 dark:hover:border-orange-500"
        onClick={handleUploadClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-orange-500/10 dark:to-amber-500/10"></div>
        <input
          ref={fileInputRef}
          type="file"
          accept={getFileAccept()}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="relative z-10 mb-3 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 p-4 shadow-lg shadow-orange-500/25 transition-transform duration-300 group-hover:scale-110">
          <Upload className="h-8 w-8 text-white" />
        </div>
        <p className="relative z-10 text-sm font-semibold text-slate-800 dark:text-slate-200">
          点击上传文件
        </p>
        <p className="relative z-10 mt-1 text-xs text-slate-500 dark:text-slate-400">
          支持格式：{getFileAccept().replace(/,/g, '、')}
        </p>
      </div>

      {/* File Info */}
      {selectedFile && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
          <div className="rounded-lg bg-orange-500/10 p-2 dark:bg-orange-500/20">
            <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      {isConverting && (
        <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {conversionStatus}
            </span>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {conversionProgress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
              style={{ width: `${conversionProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/50">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {/* Convert Button */}
      {selectedFile && !isConverting && !convertedUrl && (
        <Button
          onClick={handleConvert}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-orange-700 hover:to-amber-700 hover:shadow-xl hover:shadow-orange-500/30"
        >
          <ImageIcon className="mr-2 h-5 w-5" />
          开始转换
        </Button>
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
                下载文件
              </>
            )}
          </Button>
        </div>
      )}

      {/* Info Card */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50 p-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
        <h4 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">功能说明</h4>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-orange-500">•</span>
            <span>支持图片、文本、表格等常见格式的快速转换</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500">•</span>
            <span>所有转换都在浏览器本地完成，保护隐私</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500">•</span>
            <span>简单易用，无需安装任何软件</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

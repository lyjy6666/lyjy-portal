'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Sparkles, Minimize2, CheckCircle2, AlertCircle, Code } from 'lucide-react';

type CodeType = 'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'yaml' | 'xml';
type Operation = 'format' | 'minify';

export default function CodeConverter() {
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [codeType, setCodeType] = useState<CodeType>('javascript');
  const [operation, setOperation] = useState<Operation>('format');
  const [error, setError] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // JavaScript/TypeScript Formatter
  const formatJS = (code: string, isTS = false): string => {
    try {
      let formatted = code.trim();
      const lines = formatted.split('\n');
      let indent = 0;
      const formattedLines: string[] = [];
      
      const keywords = ['if', 'else if', 'for', 'while', 'function', 'return', 'switch', 'case', 'break', 'class', 'import', 'export', 'default', 'try', 'catch', 'finally', 'throw', 'async', 'await'];
      
      lines.forEach((line) => {
        let trimmed = line.trim();
        if (!trimmed) return;
        
        if (trimmed.startsWith('}')) {
          indent = Math.max(0, indent - 1);
        }
        
        keywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\s*`, 'g');
          trimmed = trimmed.replace(regex, `${keyword} `);
        });
        
        formattedLines.push('  '.repeat(indent) + trimmed.trim());
        
        if (trimmed.endsWith('{')) {
          indent++;
        }
      });
      
      return formattedLines.join('\n');
    } catch (e) {
      throw new Error('格式化 JavaScript/TypeScript 失败');
    }
  };

  // HTML Formatter
  const formatHTML = (code: string): string => {
    try {
      let formatted = code.trim();
      const lines: string[] = [];
      let indent = 0;
      
      const parts = formatted.split(/(<[^>]+>)/g);
      
      parts.forEach(part => {
        if (!part) return;
        
        const isTag = part.startsWith('<');
        const isOpenTag = isTag && !part.startsWith('</') && !part.endsWith('/>');
        const isCloseTag = isTag && part.startsWith('</');
        
        if (isCloseTag) {
          indent = Math.max(0, indent - 1);
        }
        
        if (part.trim()) {
          lines.push('  '.repeat(indent) + part);
        }
        
        if (isOpenTag) {
          indent++;
        }
      });
      
      return lines.join('\n');
    } catch (e) {
      throw new Error('格式化 HTML 失败');
    }
  };

  // CSS Formatter
  const formatCSS = (code: string): string => {
    try {
      let formatted = code.trim();
      
      formatted = formatted
        .replace(/;/g, ';\n  ')
        .replace(/\{/g, ' {\n  ')
        .replace(/\}/g, '\n}\n')
        .replace(/,([^\s])/g, ', $1');
      
      return formatted.replace(/\n\s*\n/g, '\n').trim();
    } catch (e) {
      throw new Error('格式化 CSS 失败');
    }
  };

  // JSON Formatter
  const formatJSON = (code: string): string => {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      throw new Error('格式化 JSON 失败');
    }
  };

  // YAML Formatter
  const formatYAML = (code: string): string => {
    try {
      // 简化的 YAML 格式化
      let formatted = code.trim();
      const lines = formatted.split('\n');
      const formattedLines: string[] = [];
      let indent = 0;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          formattedLines.push(line);
          continue;
        }
        
        const currentIndent = line.search(/\S|$/);
        
        if (trimmed.startsWith('- ')) {
          indent = currentIndent;
        } else if (trimmed.endsWith(':')) {
          indent = currentIndent;
        } else if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          indent = currentIndent;
        }
        
        formattedLines.push('  '.repeat(indent / 2) + trimmed);
      }
      
      return formattedLines.join('\n');
    } catch (e) {
      throw new Error('格式化 YAML 失败');
    }
  };

  // XML Formatter
  const formatXML = (code: string): string => {
    try {
      let formatted = code.trim();
      const lines: string[] = [];
      let indent = 0;
      
      const parts = formatted.split(/(<[^>]+>)/g);
      
      parts.forEach(part => {
        if (!part) return;
        
        const isTag = part.startsWith('<');
        const isOpenTag = isTag && !part.startsWith('</') && !part.endsWith('/>');
        const isCloseTag = isTag && part.startsWith('</');
        
        if (isCloseTag) {
          indent = Math.max(0, indent - 1);
        }
        
        if (part.trim()) {
          lines.push('  '.repeat(indent) + part);
        }
        
        if (isOpenTag) {
          indent++;
        }
      });
      
      return lines.join('\n');
    } catch (e) {
      throw new Error('格式化 XML 失败');
    }
  };

  // JavaScript/TypeScript Minifier
  const minifyJS = (code: string): string => {
    try {
      let minified = code.trim();
      
      minified = minified.replace(/\/\/.*$/gm, '');
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
      minified = minified.replace(/\s+/g, ' ');
      minified = minified
        .replace(/\s*([{}();,:+\-*/%=&|<>!?])\s*/g, '$1')
        .replace(/([{}();,:+\-*/%=&|<>!?])\s*/g, '$1')
        .replace(/\s*([{}();,:+\-*/%=&|<>!?])/g, '$1');
      
      return minified;
    } catch (e) {
      throw new Error('压缩 JavaScript/TypeScript 失败');
    }
  };

  // HTML Minifier
  const minifyHTML = (code: string): string => {
    try {
      let minified = code.trim();
      
      minified = minified.replace(/<!--[\s\S]*?-->/g, '');
      minified = minified.replace(/\s+/g, ' ');
      minified = minified.replace(/>\s+</g, '><');
      minified = minified.replace(/\s*(<[^>]+>)\s*/g, '$1');
      
      return minified;
    } catch (e) {
      throw new Error('压缩 HTML 失败');
    }
  };

  // CSS Minifier
  const minifyCSS = (code: string): string => {
    try {
      let minified = code.trim();
      
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
      minified = minified.replace(/\s+/g, ' ');
      minified = minified
        .replace(/\s*([{}();:,>+~])\s*/g, '$1')
        .replace(/\s*([{}();:,>+~])/g, '$1');
      minified = minified.replace(/;}/g, '}');
      
      return minified;
    } catch (e) {
      throw new Error('压缩 CSS 失败');
    }
  };

  // JSON Minifier
  const minifyJSON = (code: string): string => {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed);
    } catch (e) {
      throw new Error('压缩 JSON 失败');
    }
  };

  // YAML Minifier
  const minifyYAML = (code: string): string => {
    try {
      // 简化的 YAML 压缩
      let minified = code.trim();
      minified = minified.replace(/\n\s*\n/g, '\n');
      return minified;
    } catch (e) {
      throw new Error('压缩 YAML 失败');
    }
  };

  // XML Minifier
  const minifyXML = (code: string): string => {
    try {
      let minified = code.trim();
      minified = minified.replace(/<!--[\s\S]*?-->/g, '');
      minified = minified.replace(/\s+/g, ' ');
      minified = minified.replace(/>\s+</g, '><');
      return minified;
    } catch (e) {
      throw new Error('压缩 XML 失败');
    }
  };

  const handleProcess = () => {
    setError('');
    setIsProcessing(true);
    
    try {
      let result = '';
      
      switch (codeType) {
        case 'javascript':
        case 'typescript':
          result = operation === 'format' 
            ? formatJS(inputCode, codeType === 'typescript')
            : minifyJS(inputCode);
          break;
        case 'html':
          result = operation === 'format' ? formatHTML(inputCode) : minifyHTML(inputCode);
          break;
        case 'css':
          result = operation === 'format' ? formatCSS(inputCode) : minifyCSS(inputCode);
          break;
        case 'json':
          result = operation === 'format' ? formatJSON(inputCode) : minifyJSON(inputCode);
          break;
        case 'yaml':
          result = operation === 'format' ? formatYAML(inputCode) : minifyYAML(inputCode);
          break;
        case 'xml':
          result = operation === 'format' ? formatXML(inputCode) : minifyXML(inputCode);
          break;
      }
      
      setOutputCode(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
  };

  const handleDownload = () => {
    if (!outputCode || isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    const extensions: Record<CodeType, string> = {
      javascript: 'js',
      typescript: 'ts',
      html: 'html',
      css: 'css',
      json: 'json',
      yaml: 'yaml',
      xml: 'xml'
    };
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `processed.${extensions[codeType]}`;
    link.click();
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    }, 1500);
  };

  const handleClear = () => {
    setInputCode('');
    setOutputCode('');
    setError('');
    setDownloadSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2 dark:bg-purple-500/20">
              <Code className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              输入代码
            </h3>
          </div>
          <Select value={codeType} onValueChange={(value: CodeType) => setCodeType(value)}>
            <SelectTrigger className="w-[140px] border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="css">CSS</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="yaml">YAML</SelectItem>
              <SelectItem value="xml">XML</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder={`输入 ${codeType.toUpperCase()} 代码...`}
          className="min-h-[200px] border-slate-300 bg-white font-mono text-sm shadow-sm dark:border-slate-600 dark:bg-slate-900"
        />
      </div>

      {/* Operation Controls */}
      <div className="flex items-center justify-center gap-4">
        <Select value={operation} onValueChange={(value: Operation) => setOperation(value)}>
          <SelectTrigger className="w-[140px] border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="format">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                格式化
              </div>
            </SelectItem>
            <SelectItem value="minify">
              <div className="flex items-center gap-2">
                <Minimize2 className="h-4 w-4" />
                压缩
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <Button 
          onClick={handleProcess} 
          disabled={isProcessing}
          className="w-[140px] bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
        >
          {isProcessing ? '处理中...' : (operation === 'format' ? '格式化' : '压缩')}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Output Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2 dark:bg-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              处理结果
            </h3>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" size="sm" className="shadow-sm transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md">
              <Copy className="mr-2 h-4 w-4" />
              复制
            </Button>
            <Button 
              onClick={handleDownload} 
              disabled={isDownloading}
              variant="outline" 
              size="sm"
              className="shadow-sm transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-pulse" />
                  下载中...
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  已下载
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  下载
                </>
              )}
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm" className="shadow-sm transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md">
              清空
            </Button>
          </div>
        </div>
        <Textarea
          value={outputCode}
          readOnly
          placeholder="处理结果将显示在这里..."
          className="min-h-[200px] border-slate-300 bg-white font-mono text-sm shadow-sm dark:border-slate-600 dark:bg-slate-900"
        />
      </div>
    </div>
  );
}

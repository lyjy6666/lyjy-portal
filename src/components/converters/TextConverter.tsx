'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, FileText, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

type TextFormat = 'json' | 'yaml' | 'csv' | 'xml' | 'toml';

export default function TextConverter() {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [inputFormat, setInputFormat] = useState<TextFormat>('json');
  const [outputFormat, setOutputFormat] = useState<TextFormat>('yaml');
  const [error, setError] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const convertJsonToYaml = (json: string): string => {
    try {
      const obj = JSON.parse(json);
      let yaml = '';
      
      const stringify = (data: any, indent = 0): string => {
        const spaces = '  '.repeat(indent);
        if (data === null) return 'null';
        if (typeof data === 'boolean') return data ? 'true' : 'false';
        if (typeof data === 'number') return String(data);
        if (typeof data === 'string') return `"${data}"`;
        if (Array.isArray(data)) {
          if (data.length === 0) return '[]';
          return data.map(item => {
            const itemStr = stringify(item, indent + 1);
            return `${spaces}- ${itemStr.replace(new RegExp(`^${spaces}`), '')}`;
          }).join('\n');
        }
        if (typeof data === 'object') {
          if (Object.keys(data).length === 0) return '{}';
          return Object.entries(data).map(([key, value]) => {
            const valueStr = stringify(value, indent + 1);
            if (typeof value === 'object' && value !== null) {
              return `${spaces}${key}:\n${valueStr}`;
            }
            return `${spaces}${key}: ${valueStr}`;
          }).join('\n');
        }
        return '';
      };
      
      yaml = stringify(obj);
      return yaml;
    } catch (e) {
      throw new Error('无效的 JSON 格式');
    }
  };

  const convertYamlToJson = (yaml: string): string => {
    try {
      const lines = yaml.trim().split('\n');
      const result: any = {};
      const stack: { obj: any; indent: number }[] = [{ obj: result, indent: -1 }];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const indent = line.search(/\S|$/);
        let current = stack[stack.length - 1];
        
        while (current.indent >= indent) {
          stack.pop();
          current = stack[stack.length - 1];
        }

        if (trimmed.startsWith('- ')) {
          const value = trimmed.slice(2);
          if (!Array.isArray(current.obj)) {
            const key = Object.keys(current.obj).pop();
            if (key) {
              const arr = [parseValue(value)];
              current.obj[key] = arr;
              stack.push({ obj: arr, indent });
            }
          } else {
            (current.obj as any[]).push(parseValue(value));
          }
        } else {
          const colonIndex = trimmed.indexOf(':');
          if (colonIndex !== -1) {
            const key = trimmed.slice(0, colonIndex).trim();
            const valueStr = trimmed.slice(colonIndex + 1).trim();
            const value = parseValue(valueStr);
            current.obj[key] = value;
            
            if (typeof value === 'object' && value !== null) {
              stack.push({ obj: value, indent });
            }
          }
        }
      }

      return JSON.stringify(result, null, 2);
    } catch (e) {
      throw new Error('无效的 YAML 格式');
    }
  };

  const parseValue = (value: string): any => {
    if (!value) return '';
    if (value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
    
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') return num;
    
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    return value;
  };

  const convertJsonToCsv = (json: string): string => {
    try {
      const data = JSON.parse(json);
      const array = Array.isArray(data) ? data : [data];
      
      if (array.length === 0) return '';
      
      const headers = Object.keys(array[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of array) {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    } catch (e) {
      throw new Error('JSON 转 CSV 失败');
    }
  };

  const convertCsvToJson = (csv: string): string => {
    try {
      const lines = csv.trim().split('\n');
      if (lines.length < 2) return '[]';
      
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      };
      
      const headers = parseCSVLine(lines[0]);
      const result = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const obj: any = {};
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || '';
          const numValue = Number(value);
          obj[header] = !isNaN(numValue) && value !== '' ? numValue : value;
        });
        result.push(obj);
      }
      
      return JSON.stringify(result, null, 2);
    } catch (e) {
      throw new Error('无效的 CSV 格式');
    }
  };

  const convertYamlToCsv = (yaml: string): string => {
    const json = convertYamlToJson(yaml);
    return convertJsonToCsv(json);
  };

  const convertCsvToYaml = (csv: string): string => {
    const json = convertCsvToJson(csv);
    return convertJsonToYaml(json);
  };

  const convertJsonToXml = (json: string): string => {
    try {
      const obj = JSON.parse(json);
      const stringify = (data: any, indent = 0, tagName = 'root'): string => {
        const spaces = '  '.repeat(indent);
        let xml = `${spaces}<${tagName}>\n`;
        
        if (typeof data === 'object' && data !== null) {
          if (Array.isArray(data)) {
            data.forEach((item, index) => {
              xml += stringify(item, indent + 1, 'item');
            });
          } else {
            Object.entries(data).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                xml += stringify(value, indent + 1, key);
              } else {
                const strValue = value === null ? 'null' : String(value);
                xml += `${spaces}  <${key}>${strValue}</${key}>\n`;
              }
            });
          }
        } else {
          xml += `${spaces}  ${data}\n`;
        }
        
        xml += `${spaces}</${tagName}>\n`;
        return xml;
      };
      
      return stringify(obj);
    } catch (e) {
      throw new Error('JSON 转 XML 失败');
    }
  };

  const convertXmlToJson = (xml: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      
      const parseNode = (node: Element): any => {
        const obj: any = {};
        
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i] as Element;
          const key = child.tagName;
          const value = child.children.length > 0 ? parseNode(child) : child.textContent;
          
          if (obj[key] !== undefined) {
            if (!Array.isArray(obj[key])) {
              obj[key] = [obj[key]];
            }
            obj[key].push(value);
          } else {
            obj[key] = value;
          }
        }
        
        return obj;
      };
      
      const result = parseNode(doc.documentElement);
      return JSON.stringify(result, null, 2);
    } catch (e) {
      throw new Error('XML 转 JSON 失败');
    }
  };

  const convertTomlToJson = (toml: string): string => {
    try {
      // 简化的 TOML 解析
      const result: any = {};
      const lines = toml.split('\n');
      let currentSection = result;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // 跳过注释和空行
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        // 处理节 [section]
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          const sectionName = trimmed.slice(1, -1);
          result[sectionName] = result[sectionName] || {};
          currentSection = result[sectionName];
          continue;
        }
        
        // 处理键值对
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex !== -1) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          currentSection[key] = parseValue(value);
        }
      }
      
      return JSON.stringify(result, null, 2);
    } catch (e) {
      throw new Error('TOML 转 JSON 失败');
    }
  };

  const convertJsonToToml = (json: string): string => {
    try {
      const obj = JSON.parse(json);
      let toml = '';
      
      const stringify = (data: any, indent = 0): string => {
        const spaces = '  '.repeat(indent);
        if (data === null) return 'null';
        if (typeof data === 'boolean') return data ? 'true' : 'false';
        if (typeof data === 'number') return String(data);
        if (typeof data === 'string') return `"${data}"`;
        if (typeof data === 'object') {
          return JSON.stringify(data, null, 2);
        }
        return '';
      };
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          toml += `[${key}]\n`;
          for (const [subKey, subValue] of Object.entries(value as any)) {
            toml += `${subKey} = ${stringify(subValue)}\n`;
          }
          toml += '\n';
        } else {
          toml += `${key} = ${stringify(value)}\n`;
        }
      }
      
      return toml.trim();
    } catch (e) {
      throw new Error('JSON 转 TOML 失败');
    }
  };

  const handleConvert = () => {
    setError('');
    setIsConverting(true);
    
    try {
      let result = '';
      
      // 先转为 JSON
      let jsonData = '';
      if (inputFormat === 'json') {
        jsonData = inputText;
      } else if (inputFormat === 'yaml') {
        jsonData = convertYamlToJson(inputText);
      } else if (inputFormat === 'csv') {
        jsonData = convertCsvToJson(inputText);
      } else if (inputFormat === 'xml') {
        jsonData = convertXmlToJson(inputText);
      } else if (inputFormat === 'toml') {
        jsonData = convertTomlToJson(inputText);
      }
      
      // 再从 JSON 转为目标格式
      if (outputFormat === 'json') {
        const parsed = JSON.parse(jsonData);
        result = JSON.stringify(parsed, null, 2);
      } else if (outputFormat === 'yaml') {
        result = convertJsonToYaml(jsonData);
      } else if (outputFormat === 'csv') {
        result = convertJsonToCsv(jsonData);
      } else if (outputFormat === 'xml') {
        result = convertJsonToXml(jsonData);
      } else if (outputFormat === 'toml') {
        result = convertJsonToToml(jsonData);
      }
      
      setOutputText(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
  };

  const handleDownload = () => {
    if (!outputText || isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted.${outputFormat}`;
    link.click();
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    }, 1500);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError('');
    setDownloadSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 dark:bg-blue-500/20">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              输入内容
            </h3>
          </div>
          <Select value={inputFormat} onValueChange={(value: TextFormat) => setInputFormat(value)}>
            <SelectTrigger className="w-[140px] border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="yaml">YAML</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xml">XML</SelectItem>
              <SelectItem value="toml">TOML</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`输入 ${inputFormat.toUpperCase()} 格式的内容...`}
          className="min-h-[200px] border-slate-300 bg-white font-mono text-sm shadow-sm dark:border-slate-600 dark:bg-slate-900"
        />
      </div>

      {/* Conversion Controls */}
      <div className="flex items-center justify-center gap-4">
        <Select value={outputFormat} onValueChange={(value: TextFormat) => setOutputFormat(value)}>
          <SelectTrigger className="w-[140px] border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="yaml">YAML</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="xml">XML</SelectItem>
            <SelectItem value="toml">TOML</SelectItem>
          </SelectContent>
        </Select>
        <ArrowRight className="h-5 w-5 text-slate-400" />
        <Button 
          onClick={handleConvert} 
          disabled={isConverting}
          className="w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
        >
          {isConverting ? '转换中...' : '转换'}
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
              输出结果
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
          value={outputText}
          readOnly
          placeholder="转换结果将显示在这里..."
          className="min-h-[200px] border-slate-300 bg-white font-mono text-sm shadow-sm dark:border-slate-600 dark:bg-slate-900"
        />
      </div>
    </div>
  );
}

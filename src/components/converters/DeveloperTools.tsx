'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Palette, Clock, Lock, QrCode, Copy, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import JsBarcode from 'jsbarcode';

// ============ 颜色转换 ============
interface ColorState {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  cmyk: { c: number; m: number; y: number; k: number };
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const rgbToCmyk = (r: number, g: number, b: number) => {
  const c = 1 - r / 255;
  const m = 1 - g / 255;
  const y = 1 - b / 255;
  const k = Math.min(c, Math.min(m, y));
  return {
    c: Math.round((c - k) / (1 - k) * 100),
    m: Math.round((m - k) / (1 - k) * 100),
    y: Math.round((y - k) / (1 - k) * 100),
    k: Math.round(k * 100)
  };
};

// ============ 时间转换 ============
const timestampToDate = (timestamp: number) => {
  return new Date(timestamp * 1000);
};

const dateToTimestamp = (date: Date) => {
  return Math.floor(date.getTime() / 1000);
};

// ============ 哈希加密 ============
const calculateHash = async (text: string, algorithm: 'SHA-1' | 'SHA-256') => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function DeveloperTools() {
  const [activeTool, setActiveTool] = useState('color');
  const [copied, setCopied] = useState(false);

  // ============ 颜色状态 ============
  const [color, setColor] = useState<ColorState>({
    hex: '#3B82F6',
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 },
    cmyk: { c: 76, m: 47, y: 0, k: 4 }
  });

  // ============ 时间状态 ============
  const [timestamp, setTimestamp] = useState(Date.now() / 1000);
  const [selectedZone, setSelectedZone] = useState('Asia/Shanghai');

  // ============ 哈希状态 ============
  const [hashText, setHashText] = useState('');
  const [hashResults, setHashResults] = useState({ md5: '', sha1: '', sha256: '' });

  // ============ 二维码状态 ============
  const [qrText, setQrText] = useState('https://example.com');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrScanned, setQrScanned] = useState('');

  // ============ 条形码状态 ============
  const [barcodeText, setBarcodeText] = useState('1234567890');
  const [barcodeFormat, setBarcodeFormat] = useState<'CODE128' | 'CODE39' | 'EAN13' | 'UPC'>('CODE128');
  const [barcodeUrl, setBarcodeUrl] = useState('');
  const [barcodeScanned, setBarcodeScanned] = useState('');

  // ============ 密码生成器状态 ============
  const [passwordLength, setPasswordLength] = useState(16);
  const [passwordOptions, setPasswordOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');

  // ============ 颜色处理 ============
  const handleColorChange = async (value: string, type: 'hex' | 'r' | 'g' | 'b') => {
    let newColor = { ...color };
    
    if (type === 'hex') {
      const hex = value.startsWith('#') ? value : '#' + value;
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        const rgb = hexToRgb(hex);
        newColor.hex = hex;
        newColor.rgb = rgb;
        newColor.hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        newColor.cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
      }
    } else {
      const key = type as 'r' | 'g' | 'b';
      const val = parseInt(value) || 0;
      newColor.rgb[key] = Math.max(0, Math.min(255, val));
      newColor.hex = rgbToHex(newColor.rgb.r, newColor.rgb.g, newColor.rgb.b);
      newColor.hsl = rgbToHsl(newColor.rgb.r, newColor.rgb.g, newColor.rgb.b);
      newColor.cmyk = rgbToCmyk(newColor.rgb.r, newColor.rgb.g, newColor.rgb.b);
    }
    
    setColor(newColor);
  };

  // ============ 时间处理 ============
  const handleTimestampChange = (value: string) => {
    const ts = parseInt(value) || 0;
    setTimestamp(ts);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ============ 哈希处理 ============
  const handleHash = async () => {
    if (!hashText) return;
    
    const sha1 = await calculateHash(hashText, 'SHA-1');
    const sha256 = await calculateHash(hashText, 'SHA-256');
    
    // 简化版 MD5 (仅用于演示)
    const md5 = await calculateHash(hashText, 'SHA-256');
    
    setHashResults({ md5, sha1, sha256 });
  };

  // ============ 二维码处理 ============
  const handleGenerateQR = async () => {
    try {
      const url = await QRCode.toDataURL(qrText);
      setQrCodeUrl(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScanQR = async (file: File) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setQrScanned(code.data);
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  // ============ 条形码处理 ============
  const handleGenerateBarcode = () => {
    if (typeof window !== 'undefined') {
      const canvas = document.createElement('canvas');
      try {
        JsBarcode(canvas, barcodeText, {
          format: barcodeFormat,
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 10,
        });
        setBarcodeUrl(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('条形码生成失败:', error);
        alert('条形码格式不正确，请检查输入');
      }
    }
  };

  const handleScanBarcode = async (file: File) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setBarcodeScanned(code.data);
        } else {
          alert('未识别到条形码');
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  // ============ 密码生成器处理 ============
  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (passwordOptions.uppercase) chars += uppercase;
    if (passwordOptions.lowercase) chars += lowercase;
    if (passwordOptions.numbers) chars += numbers;
    if (passwordOptions.symbols) chars += symbols;

    if (chars === '') {
      alert('请至少选择一种字符类型');
      return;
    }

    let password = '';
    const array = new Uint32Array(passwordLength);
    crypto.getRandomValues(array);
    for (let i = 0; i < passwordLength; i++) {
      password += chars[array[i] % chars.length];
    }
    setGeneratedPassword(password);
  };

  const timezones = [
    'UTC',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'America/New_York',
    'Europe/London',
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTool} onValueChange={setActiveTool} className="w-full">
        <TabsList className="flex h-auto flex-wrap justify-center rounded-2xl bg-white/80 p-2 shadow-xl backdrop-blur-sm dark:bg-slate-900/80 gap-2">
          <TabsTrigger value="color" className="px-4 py-2 text-xs">
            <Palette className="mr-1.5 h-3.5 w-3.5" />
            颜色
          </TabsTrigger>
          <TabsTrigger value="time" className="px-4 py-2 text-xs">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            时间
          </TabsTrigger>
          <TabsTrigger value="hash" className="px-4 py-2 text-xs">
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            哈希
          </TabsTrigger>
          <TabsTrigger value="qr" className="px-4 py-2 text-xs">
            <QrCode className="mr-1.5 h-3.5 w-3.5" />
            二维码
          </TabsTrigger>
          <TabsTrigger value="barcode" className="px-4 py-2 text-xs">
            <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
            条形码
          </TabsTrigger>
          <TabsTrigger value="password" className="px-4 py-2 text-xs">
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            密码
          </TabsTrigger>
        </TabsList>

        {/* 颜色转换 */}
        <TabsContent value="color" className="space-y-6 rounded-xl bg-white/50 p-6 dark:bg-slate-800/50">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 颜色预览 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">颜色预览</h3>
              <div
                className="h-48 rounded-xl shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: color.hex }}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400">HEX</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{color.hex}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400">RGB</p>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                    {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                  </p>
                </div>
              </div>
            </div>

            {/* 颜色输入 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">颜色输入</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">HEX</label>
                  <Input
                    value={color.hex}
                    onChange={(e) => handleColorChange(e.target.value, 'hex')}
                    className="font-mono"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">R</label>
                    <Input
                      type="number"
                      min="0"
                      max="255"
                      value={color.rgb.r}
                      onChange={(e) => handleColorChange(e.target.value, 'r')}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">G</label>
                    <Input
                      type="number"
                      min="0"
                      max="255"
                      value={color.rgb.g}
                      onChange={(e) => handleColorChange(e.target.value, 'g')}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">B</label>
                    <Input
                      type="number"
                      min="0"
                      max="255"
                      value={color.rgb.b}
                      onChange={(e) => handleColorChange(e.target.value, 'b')}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <h4 className="mb-3 text-sm font-semibold">其他格式</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">HSL:</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">CMYK:</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {color.cmyk.c}%, {color.cmyk.m}%, {color.cmyk.y}%, {color.cmyk.k}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 时间转换 */}
        <TabsContent value="time" className="space-y-6 rounded-xl bg-white/50 p-6 dark:bg-slate-800/50">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Unix 时间戳</h3>
              <Input
                type="number"
                value={Math.floor(timestamp)}
                onChange={(e) => handleTimestampChange(e.target.value)}
                className="font-mono text-lg"
              />
              <Button onClick={() => setTimestamp(Date.now() / 1000)} className="w-full transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg">
                当前时间戳
              </Button>
              
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <h4 className="mb-2 text-sm font-semibold">转换结果</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">秒:</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {Math.floor(timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">毫秒:</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {Math.floor(timestamp * 1000)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">日期时间</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">时区</label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                  >
                    {timezones.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-mono text-lg text-slate-900 dark:text-slate-100">
                    {new Date(timestamp * 1000).toLocaleString('zh-CN', {
                      timeZone: selectedZone,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 哈希加密 */}
        <TabsContent value="hash" className="space-y-6 rounded-xl bg-white/50 p-6 dark:bg-slate-800/50">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">输入文本</label>
              <textarea
                value={hashText}
                onChange={(e) => setHashText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm min-h-[100px] font-mono dark:border-slate-600 dark:bg-slate-900"
                placeholder="输入要计算哈希的文本..."
              />
            </div>
            <Button onClick={handleHash} className="w-full transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg">
              计算哈希
            </Button>

            {hashResults.sha1 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">SHA-256</span>
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(hashResults.sha256)} className="transition-all duration-300 hover:scale-110 hover:bg-slate-200 dark:hover:bg-slate-700">
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-300">
                    {hashResults.sha256}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">SHA-1</span>
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(hashResults.sha1)} className="transition-all duration-300 hover:scale-110 hover:bg-slate-200 dark:hover:bg-slate-700">
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-300">
                    {hashResults.sha1}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 二维码 */}
        <TabsContent value="qr" className="space-y-6 rounded-xl bg-white/50 p-6 dark:bg-slate-800/50">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">生成二维码</h3>
              <div>
                <label className="mb-2 block text-sm font-medium">文本或链接</label>
                <Input
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="输入文本或URL"
                />
              </div>
              <Button onClick={handleGenerateQR} className="w-full transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg">
                生成二维码
              </Button>
              {qrCodeUrl && (
                <div className="flex justify-center rounded-lg bg-white p-4">
                  <img src={qrCodeUrl} alt="QR Code" className="max-w-[200px]" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">识别二维码</h3>
              <div>
                <label className="mb-2 block text-sm font-medium">上传二维码图片</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScanQR(file);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
              </div>
              {qrScanned && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/50">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="mb-1 text-sm font-semibold text-green-900 dark:text-green-100">
                        识别成功
                      </p>
                      <p className="break-all text-sm text-green-700 dark:text-green-300">
                        {qrScanned}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 条形码 */}
        <TabsContent value="barcode" className="space-y-6 rounded-xl bg-white/50 p-6 dark:bg-slate-800/50">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">生成条形码</h3>
              <div>
                <label className="mb-2 block text-sm font-medium">条形码内容</label>
                <Input
                  value={barcodeText}
                  onChange={(e) => setBarcodeText(e.target.value)}
                  placeholder="输入数字或字母"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">条形码格式</label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                >
                  <option value="CODE128">CODE128（支持字母数字）</option>
                  <option value="CODE39">CODE39</option>
                  <option value="EAN13">EAN-13（商品条码）</option>
                  <option value="UPC">UPC</option>
                </select>
              </div>
              <Button onClick={handleGenerateBarcode} className="w-full transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg">
                生成条形码
              </Button>
              {barcodeUrl && (
                <div className="flex justify-center rounded-lg bg-white p-4">
                  <img src={barcodeUrl} alt="Barcode" className="max-w-full" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">识别条形码</h3>
              <div>
                <label className="mb-2 block text-sm font-medium">上传条形码图片</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScanBarcode(file);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
              </div>
              {barcodeScanned && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/50">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="mb-1 text-sm font-semibold text-green-900 dark:text-green-100">
                        识别成功
                      </p>
                      <p className="break-all text-sm text-green-700 dark:text-green-300">
                        {barcodeScanned}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 密码生成器 */}
        <TabsContent value="password" className="space-y-6 rounded-xl bg-white/50 p-6 dark:bg-slate-800/50">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">随机密码生成器</h3>
              
              <div>
                <label className="mb-2 block text-sm font-medium">密码长度: {passwordLength}</label>
                <input
                  type="range"
                  min="6"
                  max="64"
                  value={passwordLength}
                  onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>6</span>
                  <span>64</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">包含字符类型:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950/30">
                    <input
                      type="checkbox"
                      checked={passwordOptions.uppercase}
                      onChange={(e) => setPasswordOptions({ ...passwordOptions, uppercase: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
                    />
                    <span className="text-sm">大写字母 (A-Z)</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer transition-all duration-200 hover:border-green-400 hover:bg-green-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-green-500 dark:hover:bg-green-950/30">
                    <input
                      type="checkbox"
                      checked={passwordOptions.lowercase}
                      onChange={(e) => setPasswordOptions({ ...passwordOptions, lowercase: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-900"
                    />
                    <span className="text-sm">小写字母 (a-z)</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer transition-all duration-200 hover:border-purple-400 hover:bg-purple-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-500 dark:hover:bg-purple-950/30">
                    <input
                      type="checkbox"
                      checked={passwordOptions.numbers}
                      onChange={(e) => setPasswordOptions({ ...passwordOptions, numbers: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-900"
                    />
                    <span className="text-sm">数字 (0-9)</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-500 dark:hover:bg-orange-950/30">
                    <input
                      type="checkbox"
                      checked={passwordOptions.symbols}
                      onChange={(e) => setPasswordOptions({ ...passwordOptions, symbols: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-900"
                    />
                    <span className="text-sm">特殊符号</span>
                  </label>
                </div>
              </div>

              <Button onClick={generatePassword} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:shadow-blue-500/30">
                生成密码
              </Button>

              {generatedPassword && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">生成的密码</span>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(generatedPassword)} className="transition-all duration-300 hover:scale-110 hover:bg-slate-200 dark:hover:bg-slate-700">
                        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="break-all font-mono text-lg text-slate-700 dark:text-slate-300">
                      {generatedPassword}
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 提示：请妥善保存生成的密码，建议使用密码管理器进行安全存储
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image, FileJson, Code2, Sparkles, FileText, Wrench, Music, Clock, Video, Archive, Download, AlertCircle, Droplet } from 'lucide-react';
import ImageConverter from '@/components/converters/ImageConverter';
import TextConverter from '@/components/converters/TextConverter';
import CodeConverter from '@/components/converters/CodeConverter';
import DocumentConverter from '@/components/converters/DocumentConverter';
import DeveloperTools from '@/components/converters/DeveloperTools';
import AudioConverter from '@/components/converters/AudioConverter';
import VideoConverter from '@/components/converters/VideoConverter';
import CompressConverter from '@/components/converters/CompressConverter';
import WatermarkTool from '@/components/converters/WatermarkTool';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function ToolboxPage() {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <LoadingSpinner
        onComplete={() => setIsLoading(false)}
        duration={2000}
      />
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-4 shadow-xl shadow-blue-500/30">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-4 flex items-center justify-center gap-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            lyjy格式转换工具箱
            <span className="relative inline-flex animate-pulse">
              <span className="absolute inset-0 rounded-full bg-orange-500 opacity-20 animate-ping"></span>
              <span className="relative inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30">
                BETA
              </span>
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            全能格式转换工具，支持图片、文本、代码、文档等多种格式的高效转换
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="app" className="mx-auto max-w-5xl">
          <div className="mb-8 flex justify-center">
            <TabsList className="inline-flex h-auto rounded-2xl bg-white/80 p-2 shadow-xl backdrop-blur-md dark:bg-slate-900/80">
              <TabsTrigger
                value="app"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/20"
              >
                <Download className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                推荐应用
              </TabsTrigger>
              <TabsTrigger
                value="document"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/20"
              >
                <FileText className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                文档转换
              </TabsTrigger>
              <TabsTrigger
                value="image"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/20"
              >
                <Image className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                图片转换
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/20"
              >
                <Video className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                视频转换
              </TabsTrigger>
              <TabsTrigger
                value="audio"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/20"
              >
                <Music className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                音频转换
              </TabsTrigger>
              <TabsTrigger
                value="text"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/20"
              >
                <FileJson className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                文本转换
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/20"
              >
                <Code2 className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                代码工具
              </TabsTrigger>
              <TabsTrigger
                value="developer"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/20"
              >
                <Wrench className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                开发工具
              </TabsTrigger>
              <TabsTrigger
                value="compress"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-500/20"
              >
                <Archive className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                压缩工具
              </TabsTrigger>
              <TabsTrigger
                value="watermark"
                className="group relative rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fuchsia-500/20"
              >
                <Droplet className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                水印工具
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Image Converter */}
          <TabsContent value="image">
            <Card className="border-0 rounded-xl bg-white/80 shadow-2xl backdrop-blur-md dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg shadow-blue-500/30">
                    <Image className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      图片格式转换
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                      支持 JPEG、PNG、WebP、GIF、BMP 格式之间的互相转换
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ImageConverter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text Converter */}
          <TabsContent value="text">
            <Card className="border-0 rounded-xl bg-white/80 shadow-2xl backdrop-blur-md dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-green-500 to-teal-600 p-3 shadow-lg shadow-green-500/30">
                    <FileJson className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      文本格式转换
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                      支持 JSON、YAML、CSV、XML、TOML 格式之间的互相转换
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <TextConverter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Converter */}
          <TabsContent value="code">
            <Card className="border-0 rounded-xl bg-white/80 shadow-2xl backdrop-blur-md dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-3 shadow-lg shadow-purple-500/30">
                    <Code2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      代码格式化与压缩
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                      支持 JavaScript、TypeScript、HTML、CSS、JSON、YAML、XML 的格式化和压缩
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CodeConverter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommended Standalone App */}
          <TabsContent value="app">
            <div className="space-y-6">
              {/* Web Version Warning Banner */}
              <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-lg shadow-amber-500/10 dark:border-amber-800 dark:from-amber-950/50 dark:to-orange-950/50">
                <div className="flex items-center justify-center gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    网页版功能严重缺失，建议下载应用
                  </p>
                </div>
              </div>

              {/* Download App Card - Large Version */}
              <Card className="border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-2xl shadow-green-500/20 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Left: Icon and Title */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 p-3 shadow-xl shadow-green-500/30">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-orange-500/30">
                              ⭐ 强烈推荐
                            </span>
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-green-500/30">
                              ✓ 安全无毒
                            </span>
                          </div>
                          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:via-teal-400 dark:to-emerald-400">
                            独立桌面应用
                          </h2>
                        </div>
                      </div>

                      <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        🚀 更强大的离线转换体验
                      </p>

                      {/* Features Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-600 text-[10px]">✓</span>
                          </div>
                          <span>文件仅70MB，小巧好用</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-600 text-[10px]">✓</span>
                          </div>
                          <span>无需联网，离线使用</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-600 text-[10px]">✓</span>
                          </div>
                          <span>转换速度更快更稳定</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-600 text-[10px]">✓</span>
                          </div>
                          <span>批量处理，效率翻倍</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-600 text-[10px]">✓</span>
                          </div>
                          <span>支持更多文档格式</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-600 text-[10px]">✓</span>
                          </div>
                          <span>一键拖拽转换</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">支持格式：</span>
                          DOC、DOCX、PDF、TXT、HTML、EPUB、MOBI、ODT、RTF 等多种文档格式
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">适用系统：</span>
                          Windows 7/8/10/11
                        </p>
                      </div>
                    </div>

                    {/* Right: Download Button */}
                    <div className="flex-shrink-0">
                      <Link
                        href="https://pan.quark.cn/s/1c01905791bc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative inline-flex flex-col items-center justify-center"
                      >
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500 via-teal-500 to-emerald-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <Button
                          size="lg"
                          className="relative bg-gradient-to-br from-green-500 via-teal-500 to-emerald-500 text-white text-base font-bold px-10 py-6 rounded-2xl shadow-2xl shadow-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-green-500/50 hover:-translate-y-1"
                        >
                          <Download className="mr-2 h-5 w-5" />
                          立即下载
                        </Button>
                        <div className="mt-3 text-center">
                          <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                            💎 夸克网盘高速下载
                          </p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                            官方认证 · 安全可靠 · 免费使用
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Bottom Note */}
                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                    <p className="text-center text-xs text-slate-600 dark:text-slate-400">
                      💡 <span className="font-semibold">小贴士：</span>
                      独立应用支持离线使用，无需担心网络问题，转换速度比网页版快3-5倍，推荐重度用户使用
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Document Converter */}
          <TabsContent value="document">
            <Card className="border-0 rounded-xl bg-white/80 shadow-2xl backdrop-blur-md dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-3 shadow-lg shadow-orange-500/30">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      文档格式转换
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                      支持图片、PDF、文档、表格之间的互相转换（含 OCR 文字识别）
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <DocumentConverter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Developer Tools */}
          <TabsContent value="developer">
            <Card className="border-0 rounded-xl bg-white/80 shadow-2xl backdrop-blur-md dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-3 shadow-lg shadow-indigo-500/30">
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      开发者工具集
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                      颜色转换、时间转换、哈希加密、二维码工具等实用开发工具
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <DeveloperTools />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compress Tool */}
          <TabsContent value="compress">
            <Card className="border-0 rounded-xl bg-white/80 shadow-2xl backdrop-blur-md dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 p-3 shadow-lg shadow-slate-500/30">
                    <Archive className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      全能压缩工具
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                      支持图片、文档、视频、音频的智能压缩
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CompressConverter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audio Converter */}
          <TabsContent value="audio">
            <Card className="border-0 rounded-xl bg-white/80 shadow-2xl backdrop-blur-md dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg shadow-cyan-500/30">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      音频格式转换
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                      支持 MP3、WAV、AAC、OGG 格式之间的互相转换
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <AudioConverter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Converter */}
          <TabsContent value="video">
            <Card className="border-0 rounded-xl bg-white/80 shadow-2xl backdrop-blur-md dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 p-3 shadow-lg shadow-rose-500/30">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      视频工具
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                      视频预览、信息查看和帧画面提取
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <VideoConverter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Watermark Tool */}
          <TabsContent value="watermark">
            <Card className="border-0 rounded-xl bg-white/80 shadow-2xl backdrop-blur-md dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 p-3 shadow-lg shadow-fuchsia-500/30">
                    <Droplet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      水印工具
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                      图片去水印（框选区域自动修复）/ 图片视频加水印
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <WatermarkTool />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Update Record Button */}
        <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-8 left-8 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-0 shadow-2xl shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-110"
              size="icon"
            >
              <Clock className="h-6 w-6 text-white animate-pulse" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-2">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                更新记录
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* V2.3 - 突出显示 */}
              <div className="rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 shadow-xl shadow-blue-500/20 dark:border-blue-500 dark:from-blue-950/50 dark:via-purple-950/50 dark:to-pink-950/50 dark:shadow-blue-500/20">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      🎉 当前版本
                    </span>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                      V2.3
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    2026.7.29
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💧</span>
                    <span className="font-semibold">新增了水印工具</span>
                  </div>
                </div>
              </div>

              {/* V2.2 - 历史版本 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-md dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    V2.2
                  </h3>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    2026.7.9
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔧</span>
                    <span>修复了一些已知问题</span>
                  </div>
                </div>
              </div>

              {/* V2.1 - 历史版本 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-md dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    V2.1
                  </h3>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    2026.3.1
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✨</span>
                    <span>新增了大量功能</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🚀</span>
                    <span>增加了独立桌面应用</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔧</span>
                    <span>已经修复了已知问题</span>
                  </div>
                </div>
              </div>

              {/* V2.0 - 普通显示 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-md dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    V2.0
                  </h3>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    2026.1.31
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🌐</span>
                    <span>网站焕新上线了，原网站已停用</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💎</span>
                    <span>修复了已知问题，界面美观提升</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 返回首页按钮 */}
        <Link
          href="/"
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-700 shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center"
          title="返回首页"
        >
          <i className="fa-solid fa-house text-white"></i>
        </Link>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-6 py-3 text-sm text-slate-600 shadow-md backdrop-blur-md dark:bg-slate-900/60 dark:text-slate-400">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>所有转换都在本地浏览器中完成，确保数据安全</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

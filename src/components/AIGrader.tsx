'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Sparkles, AlertCircle, CheckCircle, Lightbulb, ScanText } from 'lucide-react';

interface AIGraderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GradingResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  problems: Array<{
    question: string;
    studentAnswer?: string;
    correctAnswer: string;
    explanation: string;
    similarProblems: string[];
  }>;
  overallComment: string;
}

export default function AIGrader({ isOpen, onClose }: AIGraderProps) {
  const [images, setImages] = useState<string[]>([]); // base64
  const [subject, setSubject] = useState('数学');
  const [grade, setGrade] = useState('小学');
  const [stage, setStage] = useState<'idle' | 'ocr' | 'grading' | 'done' | 'error'>('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            // 压缩图片：最大宽度 2000px，JPEG 质量 0.85，确保不超过 GLM-4V 的 5MB 限制
            const img = new window.Image();
            const url = URL.createObjectURL(f);
            img.onload = () => {
              URL.revokeObjectURL(url);
              const MAX_W = 2000;
              const MAX_H = 2000;
              let { width, height } = img;
              if (width > MAX_W || height > MAX_H) {
                const ratio = Math.min(MAX_W / width, MAX_H / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                // 降级：直接用原文件
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(f);
                return;
              }
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              // JPEG 格式体积更小，避免 PNG 大图超限
              resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error('图片加载失败'));
            };
            img.src = url;
          })
      )
    ).then((arr) => {
      setImages((prev) => [...prev, ...arr]);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // 主流程：OCR → 批改
  const handleGrade = useCallback(async () => {
    if (images.length === 0) {
      setError('请至少上传一张作业图片');
      return;
    }
    setError('');
    setResult(null);
    setOcrText('');
    setStage('ocr');
    setOcrProgress(0);

    try {
      // 第一步：调用后端 GLM-4V-Flash 视觉模型 OCR（准确率远高于 tesseract.js）
      const allTexts: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setOcrProgress(Math.round(((i) / images.length) * 100));
        const ocrRes = await fetch('/api/homework/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: images[i] }),
        });
        const ocrData = await ocrRes.json();
        if (!ocrRes.ok || !ocrData.success) {
          throw new Error(ocrData.message || `第 ${i + 1} 页识别失败`);
        }
        if (ocrData.text && ocrData.text.trim()) {
          allTexts.push(`--- 第${i + 1}页 ---\n${ocrData.text.trim()}`);
        }
        setOcrProgress(Math.round(((i + 1) / images.length) * 100));
      }

      const fullText = allTexts.join('\n\n');
      setOcrText(fullText);

      if (!fullText.trim()) {
        setStage('error');
        setError('未识别到文字内容，请上传更清晰的作业图片');
        return;
      }

      // 第二步：调用后端文本批改 API
      setStage('grading');
      const res = await fetch('/api/homework/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrText: fullText, subject, grade }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || '批改失败');
      }
      setResult(data.result);
      setStage('done');
    } catch (e) {
      setStage('error');
      setError(e instanceof Error ? e.message : '处理失败，请稍后重试');
    }
  }, [images, subject, grade]);

  const reset = () => {
    setImages([]);
    setResult(null);
    setError('');
    setOcrText('');
    setStage('idle');
    setOcrProgress(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto border border-blue-500/30"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex justify-between items-center p-5 border-b border-blue-500/20 bg-black/30 sticky top-0 z-10">
              <h2 className="text-xl font-bold flex items-center gap-2 text-blue-300">
                <Sparkles className="h-5 w-5" />
                AI 智能批改作业
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-blue-500/20 transition-colors text-blue-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {stage !== 'done' && (
                <>
                  {/* 学科和学段 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">学科</label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
                      >
                        <option>数学</option>
                        <option>语文</option>
                        <option>英语</option>
                        <option>物理</option>
                        <option>化学</option>
                        <option>生物</option>
                        <option>历史</option>
                        <option>地理</option>
                        <option>政治</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">学段</label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
                      >
                        <option>小学</option>
                        <option>初中</option>
                        <option>高中</option>
                      </select>
                    </div>
                  </div>

                  {/* 上传区 */}
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onPickFiles}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={stage === 'ocr' || stage === 'grading'}
                      className="w-full border-2 border-dashed border-blue-500/40 rounded-xl p-6 text-center hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                      <p className="text-sm text-slate-300">
                        点击上传作业图片（支持多张，可拍多页）
                      </p>
                    </button>
                  </div>

                  {/* 图片预览 */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {images.map((img, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={img}
                            alt={`作业 ${i + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-slate-700"
                          />
                          <button
                            onClick={() => removeImage(i)}
                            disabled={stage === 'ocr' || stage === 'grading'}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 进度提示 */}
                  {stage === 'ocr' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-300">
                        <ScanText className="h-4 w-4 animate-pulse" />
                        正在用 GLM-4V 视觉模型识别图片文字... {ocrProgress}%
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        AI 视觉识别中，每张图片约需 3-8 秒，请耐心等待
                      </p>
                    </div>
                  )}

                  {stage === 'grading' && (
                    <div className="flex items-center gap-2 text-sm text-purple-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI 正在批改作业，分析错题并生成相似题...
                    </div>
                  )}

                  {/* OCR 识别结果（可编辑） */}
                  {ocrText && stage !== 'ocr' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-300">
                        OCR 识别结果（如识别有误可手动修改）
                      </label>
                      <textarea
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                        rows={6}
                        className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white font-mono"
                      />
                      <button
                        onClick={async () => {
                          setStage('grading');
                          setError('');
                          try {
                            const res = await fetch('/api/homework/grade', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ocrText, subject, grade }),
                            });
                            const data = await res.json();
                            if (!res.ok || !data.success) throw new Error(data.message);
                            setResult(data.result);
                            setStage('done');
                          } catch (e) {
                            setStage('error');
                            setError(e instanceof Error ? e.message : '批改失败');
                          }
                        }}
                        disabled={stage === 'grading'}
                        className="mt-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-50"
                      >
                        重新批改
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* 提交按钮 */}
                  {stage !== 'ocr' && stage !== 'grading' && (
                    <button
                      onClick={handleGrade}
                      disabled={images.length === 0}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-5 w-5" />
                      开始智能批改
                    </button>
                  )}
                </>
              )}

              {/* 批改结果 */}
              {stage === 'done' && result && (
                <div className="space-y-4">
                  {/* 总览卡片 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                      <p className="text-xs text-blue-300">总题数</p>
                      <p className="text-2xl font-bold text-blue-200">{result.totalQuestions}</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                      <p className="text-xs text-green-300">正确</p>
                      <p className="text-2xl font-bold text-green-200">{result.correctCount}</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                      <p className="text-xs text-red-300">错误</p>
                      <p className="text-2xl font-bold text-red-200">{result.wrongCount}</p>
                    </div>
                  </div>

                  {/* 整体点评 */}
                  {result.overallComment && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                      <p className="text-sm font-semibold text-purple-300 mb-1">整体点评</p>
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{result.overallComment}</p>
                    </div>
                  )}

                  {/* 逐题详情 */}
                  {result.problems.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-300">错题详情与举一反三</p>
                      {result.problems.map((p, i) => (
                        <div
                          key={i}
                          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-200">题目 {i + 1}</p>
                              <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{p.question}</p>
                            </div>
                          </div>
                          {p.studentAnswer && (
                            <div className="text-sm pl-6">
                              <span className="text-red-400">学生答案：</span>
                              <span className="text-slate-300">{p.studentAnswer}</span>
                            </div>
                          )}
                          <div className="text-sm pl-6">
                            <span className="text-green-400">正确答案：</span>
                            <span className="text-slate-200">{p.correctAnswer}</span>
                          </div>
                          {p.explanation && (
                            <div className="text-sm pl-6 text-slate-400">
                              <span className="text-blue-400">解析：</span>
                              {p.explanation}
                            </div>
                          )}
                          {p.similarProblems.length > 0 && (
                            <div className="pl-6 space-y-1">
                              <p className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" />
                                举一反三
                              </p>
                              {p.similarProblems.map((s, j) => (
                                <p key={j} className="text-xs text-slate-400 pl-4">
                                  {j + 1}. {s}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.problems.length === 0 && result.totalQuestions > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                      <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-2" />
                      <p className="text-green-300 font-medium">全部正确！</p>
                    </div>
                  )}

                  <button
                    onClick={reset}
                    className="w-full py-2.5 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
                  >
                    重新批改
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

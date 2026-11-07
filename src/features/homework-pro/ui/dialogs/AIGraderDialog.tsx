'use client';

import { useEffect, useState } from 'react';
import { Upload, Sparkles, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { ProDialog } from '../common/bits';
import { ocrApi, gradeApi, type GradingResult } from '../../api/ai';

const SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const STAGES = ['小学', '初中', '高中'];
const MAX_W = 2000;
const MAX_H = 2000;

async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_W / bitmap.width, MAX_H / bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('浏览器不支持图片处理');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function AIGraderDialog() {
  const { dialog, closeDialog, settings } = usePro();
  const [images, setImages] = useState<string[]>([]);
  const [ocrText, setOcrText] = useState('');
  const [subject, setSubject] = useState('数学');
  // 学段默认跟随学习画像，省得每次手改；用户仍可在下拉里临时覆盖
  const [stage, setStage] = useState(settings.grade || '初中');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<GradingResult | null>(null);

  // 组件常驻不卸载：关闭后清空，重新打开不会残留上次的图片与批改结果
  useEffect(() => {
    if (dialog === 'grader') return;
    setImages([]); setOcrText(''); setSubject('数学'); setStage(settings.grade || '初中');
    setBusy(false); setProgress(''); setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  const onFiles = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    try {
      const dataUrls = await Promise.all(files.slice(0, 8).map(compress));
      setImages(dataUrls);
      setResult(null);
      const texts: string[] = [];
      for (let i = 0; i < dataUrls.length; i++) {
        setProgress(`正在识别第 ${i + 1}/${dataUrls.length} 张图片…`);
        const res = await ocrApi.recognize(dataUrls[i], settings.fastMode);
        if (!res.success || !res.text) throw new Error(res.message || '识别失败');
        texts.push(res.text);
      }
      setOcrText(texts.join('\n\n'));
      toast.success(`已识别 ${texts.length} 张图片，可先校对文字再批改`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '图片处理失败');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const grade = async () => {
    if (!ocrText.trim()) { toast.error('请先上传图片或手动粘贴作业内容'); return; }
    setBusy(true);
    setProgress('AI 正在逐题批改…');
    try {
      const res = await gradeApi.grade(ocrText, subject, stage, settings.weakSubjects ?? []);
      if (!res.success || !res.result) throw new Error(res.message || '批改失败');
      setResult(res.result);
      toast.success('批改完成');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批改失败');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const reset = () => { setImages([]); setOcrText(''); setResult(null); setProgress(''); };

  return (
    <ProDialog
      open={dialog === 'grader'}
      onOpenChange={(v) => { if (!v) closeDialog(); }}
      title="AI 批改作业"
      desc="上传作业照片 → 图片识别 → 校对文字 → 逐题批改，给出正确答案、解析与举一反三。"
      className="sm:max-w-[720px]"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="hw-btn cursor-pointer">
            <Upload size={14} /> 选择作业图片（最多 8 张）
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                e.target.value = ''; // 允许重复选择同一批图片
                void onFiles(list);
              }} />
          </label>
          <select className="hw-input w-auto text-xs" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="hw-input w-auto text-xs" value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" className="hw-btn" onClick={reset}><RotateCcw size={14} /> 重新上传</button>
        </div>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <img key={i} src={src} alt={`作业 ${i + 1}`} className="h-20 w-20 rounded object-cover" style={{ border: '1px solid var(--border)' }} />
            ))}
          </div>
        )}

        <label className="hw-label">识别出的作业内容（可直接修改）</label>
        <textarea
          className="hw-input min-h-32" rows={6}
          value={ocrText}
          onChange={(e) => setOcrText(e.target.value)}
          placeholder="也可以不上传图片，直接把作业内容粘贴到这里"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="hw-btn" data-variant="primary" disabled={busy} onClick={() => void grade()}>
            <Sparkles size={14} /> {busy ? '处理中…' : '开始批改'}
          </button>
          {progress && <span className="hw-label">{progress}</span>}
        </div>

        {result && (
          <div className="space-y-3 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['总题数', result.totalQuestions],
                ['答对', result.correctCount],
                ['答错', result.wrongCount],
              ].map(([label, value]) => (
                <div key={String(label)} className="hw-panel p-2 text-center">
                  <div className="hw-title hw-num text-lg">{value}</div>
                  <div className="hw-label">{label}</div>
                </div>
              ))}
            </div>

            <p className="hw-panel p-3 text-sm"><span className="hw-title">整体点评：</span>{result.overallComment}</p>

            {result.problems.length === 0 ? (
              <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--primary)' }}>
                <CheckCircle2 size={16} /> 全部正确，没有需要订正的题目
              </p>
            ) : (
              result.problems.map((p, i) => (
                <div key={i} className="hw-panel p-3 text-sm">
                  <p className="hw-title flex items-center gap-1"><XCircle size={14} /> 第 {i + 1} 题：{p.question}</p>
                  <p className="mt-1">你的答案：{p.studentAnswer}</p>
                  <p style={{ color: 'var(--primary)' }}>正确答案：{p.correctAnswer}</p>
                  <p className="hw-label mt-1">解析：{p.explanation}</p>
                  {p.similarProblems?.length ? (
                    <ul className="mt-1 list-disc pl-5 text-xs">
                      {p.similarProblems.map((s, j) => <li key={j}>{s}</li>)}
                    </ul>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </ProDialog>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Camera, Mic, MicOff, Sparkles, Plus, Check, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { ProDialog, SubjectChip } from '../common/bits';
import { tasksApi } from '../../api/tasks';
import { metaApi } from '../../api/meta';
import { ocrApi, estimateApi } from '../../api/ai';
import { toCaptureItems, localSplit, type CaptureItem } from '../../core/capture';
import { fromUtcIso, toUtcIso } from '../../core/date';
import { splitIntoChecklist } from '../../core/templates';
import type { Priority } from '../../core/types';

async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / bitmap.width, 1800 / bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * AI 一句话 / 拍照记作业。
 * 照片或一句话 → 识别/解析 → **结构化预览（科目 + 截止时间 + 可编辑）** → 确认才入库。
 * 与旧版「输入即直接插入」不同，这里给用户校对机会，且不会二次 AI 分点。
 */
export function SmartCapture() {
  const { dialog, closeDialog, refresh, openDialog, settings } = usePro();
  const [text, setText] = useState('');
  const [items, setItems] = useState<CaptureItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<'ai' | 'local' | ''>('');
  // 确认入库前统一设置，避免每条都要「先创建 → 再点详情」补字段
  const [estimateMin, setEstimateMin] = useState('30');
  const [priority, setPriority] = useState<Priority>('normal');
  const [notifyLeadMin, setNotifyLeadMin] = useState('');
  const [estimating, setEstimating] = useState(false);
  const voice = useVoiceInput((chunk) => setText((prev) => (prev ? `${prev}${chunk}` : chunk)));

  // 组件常驻不卸载：关闭后清空，重新打开是干净的
  useEffect(() => {
    if (dialog === 'capture') return;
    setText(''); setItems([]); setSource('');
  }, [dialog]);

  /** AI 用时推测：按年级 + 作业内容估算，回填这批作业的平均预计耗时 */
  const runEstimate = async () => {
    const lines = items.length
      ? items.map((i) => i.text)
      : text.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!lines.length) { toast.error('先写一句话，或先解析出作业条目'); return; }
    setEstimating(true);
    try {
      const res = await estimateApi.estimate(lines, settings.grade || '初中', settings.weakSubjects ?? []);
      if (!res.success || !res.estimates) { toast.error(res.message || '用时推测失败'); return; }
      const avg = Math.round(res.estimates.reduce((a, b) => a + b, 0) / res.estimates.length / 5) * 5;
      setEstimateMin(String(avg));
      toast.success(`按${settings.grade || '初中'}年级推测：每条约 ${avg} 分钟，共 ${res.total} 分钟`);
      if (res.notice) toast(res.notice);
    } finally {
      setEstimating(false);
    }
  };

  const parse = async () => {
    if (!text.trim()) { toast.error('先写一句话或拍张照片'); return; }
    setBusy(true);
    try {
      const res = await tasksApi.parse(text);
      setSource(res.source);
      setItems(toCaptureItems(res.items));
      toast.success(`拆成 ${res.items.length} 条，请核对后添加`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '解析失败');
      // 离线/接口失败时退回纯本地规则，保证功能仍可用
      setSource('local');
      setItems(toCaptureItems(localSplit(text)));
    } finally {
      setBusy(false);
    }
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const image = await compress(file);
      const res = await ocrApi.recognize(image, settings.fastMode);
      if (!res.success || !res.text) throw new Error(res.message || '识别失败');
      setText(res.text);
      toast.success('已识别图片文字，点「AI 解析」拆成作业');
    } catch (err) {
      // 上游配额/限流不再透传成「余额不足」，且识别失败不阻断记作业流程
      toast.error(err instanceof Error ? err.message : '图片识别暂时不可用', { duration: 8000 });
      window.setTimeout(() => document.querySelector<HTMLTextAreaElement>('[data-capture-text]')?.focus(), 120);
    } finally {
      setBusy(false);
    }
  };

  const addAll = async () => {
    const picked = items.filter((i) => i.checked && i.text.trim());
    if (!picked.length) { toast.error('至少勾选一条'); return; }
    setBusy(true);
    try {
      const created = await tasksApi.createMany(picked.map((i) => ({ text: i.text, dueDate: i.dueDate })));
      // 补 Pro 专属字段：科目与检查清单（只在确认后写，且不污染 tasks.text）
      for (let n = 0; n < created.length; n++) {
        const src = picked[n];
        const raw = created[n];
        if (!raw || !src) continue;
        const id = Number(raw.id);
        if (!Number.isFinite(id)) continue;
        await metaApi.put(id, 0, {
          subject: src.subject,
          subtasks: splitIntoChecklist(src.text),
          estimateMin: Math.max(0, Number(estimateMin) || 0),
          priority,
          ...(notifyLeadMin === '' ? {} : { notifyLeadMin: Math.max(0, Number(notifyLeadMin) || 0) }),
        }).catch(() => undefined);
      }
      toast.success(`已添加 ${created.length} 条作业`);
      setText(''); setItems([]); setSource('');
      await refresh();
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '添加失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProDialog
      open={dialog === 'capture'}
      onOpenChange={(v) => { if (!v) closeDialog(); }}
      title="AI 记作业"
      desc="拍下黑板／作业条，或直接说一句话。先拆成结构化条目给你核对，确认后才写入清单。"
      className="sm:max-w-[680px]"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="hw-panel flex cursor-pointer items-center justify-center gap-2 p-4 text-sm font-semibold">
            <Camera size={18} /> 拍照 / 上传图片
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void onPhoto(e.target.files?.[0])} />
          </label>
          <button type="button" className="hw-panel flex items-center justify-center gap-2 p-4 text-sm font-semibold"
            onClick={voice.toggle}>
            {voice.recording ? <MicOff size={18} /> : <Mic size={18} />}
            {voice.recording ? '停止录音' : '说一句'}
          </button>
        </div>

        <textarea
          data-capture-text=""
          className="hw-input min-h-28" rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'例：明天交数学卷子和英语听写，后天语文背诵第三课\n或：下周一前完成物理实验报告'}
        />
        {voice.recording && voice.interim && <p className="hw-label">正在识别：{voice.interim}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="hw-btn" data-variant="primary" disabled={busy} onClick={() => void parse()}>
            <Wand2 size={15} /> {busy ? '处理中…' : 'AI 解析成作业'}
          </button>
          <span className="hw-label">会识别科目、推断截止时间，并自动拆成多条</span>
        </div>

        <div className="hw-panel mt-3 grid gap-3 p-3 sm:grid-cols-3">
          <label className="hw-label block">这批作业的预计耗时（分钟）
            <input type="number" min={0} className="hw-input mt-1" value={estimateMin}
              onChange={(e) => setEstimateMin(e.target.value)} />
            <button type="button" className="hw-chip mt-1" disabled={estimating}
              onClick={() => void runEstimate()}>
              <Sparkles size={11} /> {estimating ? '推测中…' : 'AI 按年级推测'}
            </button>
          </label>
          <label className="hw-label block">优先级
            <select className="hw-input mt-1" value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="urgent">紧急</option>
              <option value="high">高</option>
              <option value="normal">普通</option>
              <option value="low">低</option>
            </select>
          </label>
          <label className="hw-label block">提前提醒（分钟，留空用默认）
            <input type="number" min={0} step={5} className="hw-input mt-1" value={notifyLeadMin}
              onChange={(e) => setNotifyLeadMin(e.target.value)} placeholder="默认 30" />
          </label>
        </div>

        {items.length > 0 && (
          <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hw-title text-sm">解析结果（{items.length} 条）</span>
              <span className="hw-chip">{source === 'ai' ? 'AI 拆解' : '本地规则'}</span>
              <button type="button" className="hw-chip" onClick={() => setItems((list) => list.map((i) => ({ ...i, checked: true })))}>全选</button>
              <button type="button" className="hw-chip" onClick={() => setItems((list) => list.map((i) => ({ ...i, checked: false })))}>全不选</button>
            </div>

            {items.map((item, i) => (
              <div key={item.id} className="hw-row flex flex-wrap items-center gap-2">
                <input type="checkbox" checked={item.checked}
                  onChange={(e) => setItems((list) => list.map((x, j) => j === i ? { ...x, checked: e.target.checked } : x))} />
                <input className="hw-input min-w-[160px] flex-1 py-1 text-sm" value={item.text}
                  onChange={(e) => setItems((list) => list.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
                <SubjectChip subject={item.subject} />
                <input type="datetime-local" className="hw-input w-auto py-1 text-xs"
                  value={fromUtcIso(item.dueDate)}
                  onChange={(e) => setItems((list) => list.map((x, j) => j === i
                    ? { ...x, dueDate: toUtcIso(e.target.value), dueLabel: '手动设定' } : x))} />
                <span className="hw-label">{item.dueLabel}</span>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button type="button" className="hw-btn" data-variant="primary" disabled={busy} onClick={() => void addAll()}>
                <Plus size={15} /> 添加勾选的 {items.filter((i) => i.checked).length} 条
              </button>
              <button type="button" className="hw-btn" onClick={() => setItems([])}>清空结果</button>
              <a href="/homework/pro/planner" className="hw-chip"><Check size={12} /> 加完去 AI 排期</a>
            </div>
          </div>
        )}
      </div>
    </ProDialog>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, Timer, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { Confetti } from '../common/bits';
import { isComposing } from '../common/interaction';
import { readScoped, writeScoped, KEYS } from '../../core/storage';

/**
 * 专注计时：时长可自定义并记住；改时长不清零进度；
 * 结束只回填实际耗时，是否把作业标记完成由用户点 toast 决定。
 */
export function FocusTimer() {
  const pro = usePro();
  const uid = pro.user?.id ?? 'guest';
  const [celebrate, setCelebrate] = useState(false);
  const [minutes, setMinutes] = useState<number>(() => readScoped<number>(uid, KEYS.focusMinutes, 25));
  const [custom, setCustom] = useState('');
  const startedRef = useRef<number | null>(null);
  const celebrateTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (celebrateTimer.current !== null) window.clearTimeout(celebrateTimer.current);
  }, []);

  const timer = useFocusTimer((taskId, mins, reason) => {
    void (async () => {
      // 绝不自动 patchTask({completed:true})：作业不会从清单里凭空消失
      await pro.patchMeta(taskId, { actualMin: mins });
      pro.setFocusTaskId(null);
      setCelebrate(true);
      if (celebrateTimer.current !== null) window.clearTimeout(celebrateTimer.current);
      celebrateTimer.current = window.setTimeout(() => setCelebrate(false), 1300);
      toast(`已记录实际专注 ${mins} 分钟${reason === 'completed' ? '（计时结束）' : ''}`, {
        duration: 12_000,
        action: {
          label: '标记完成',
          onClick: () => void pro.patchTask(taskId, { completed: true }),
        },
        cancel: { label: '保持未完成', onClick: () => undefined },
      });
    })();
  });

  const applyMinutes = (n: number) => {
    const v = Math.max(1, Math.min(600, Math.round(n)));
    setMinutes(v);
    writeScoped(uid, KEYS.focusMinutes, v);
    // 设定＝从完整时长重新计时：不扣减已流逝时间，哪怕已经过了 30 多秒，总时长也不会变少
    if (timer.state.taskId !== null) timer.start(timer.state.taskId, v);
  };

  const applyCustom = () => {
    const n = Number(custom);
    if (!Number.isFinite(n) || n <= 0) { toast.error('请输入 1 ~ 600 之间的分钟数'); return; }
    applyMinutes(n);
    setCustom('');
  };

  // 只在选中任务变化时启动；改时长不重启计时
  useEffect(() => {
    if (pro.focusTaskId === null) { startedRef.current = null; return; }
    if (startedRef.current !== pro.focusTaskId) {
      startedRef.current = pro.focusTaskId;
      timer.start(pro.focusTaskId, minutes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pro.focusTaskId]);

  const { state } = timer;
  if (state.taskId === null) return <Confetti show={celebrate} />;

  const task = pro.tasks.find((t) => t.id === state.taskId);
  const mm = String(Math.floor(state.remainingSec / 60)).padStart(2, '0');
  const ss = String(state.remainingSec % 60).padStart(2, '0');
  const progress = state.totalSec > 0 ? 1 - state.remainingSec / state.totalSec : 0;

  return (
    <>
      <Confetti show={celebrate} />
      <div className="hw-panel hw-float fixed bottom-4 left-1/2 z-40 w-[min(94vw,560px)] -translate-x-1/2 p-3">
        <div className="flex items-center gap-3">
          <Timer size={20} style={{ color: 'var(--primary)' }} />
          <div className="min-w-0 flex-1">
            <p className="hw-label truncate">正在专注：{task?.text ?? '作业'}</p>
            <div className="hw-load-track mt-1">
              <div className="hw-load-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
            </div>
          </div>
          <span className="hw-title hw-num text-2xl">{mm}:{ss}</span>
        </div>

        <div className="hw-panel mt-3 p-3">
          <p className="hw-eyebrow">专注时长</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {timer.presets.map((p) => (
              <button key={p} type="button" className="hw-chip"
                data-active={minutes === p ? 'true' : undefined}
                onClick={() => applyMinutes(p)}>{p} 分</button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--hw-rule)' }}>
            <label className="hw-label" htmlFor="hw-focus-custom">自定义分钟</label>
            <input
              id="hw-focus-custom" type="number" min={1} max={600}
              className="hw-input hw-duration-input" value={custom}
              placeholder="1 ~ 600" aria-label="自定义分钟数"
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (isComposing(e)) return;
                if (e.key === 'Enter') { e.preventDefault(); applyCustom(); }
              }}
            />
            <button type="button" className="hw-btn" data-variant="primary" onClick={applyCustom}>
              设定并重新计时
            </button>
            <span className="hw-label">设定后从完整时长重新开始，不扣已流逝时间</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className="hw-btn"
            onClick={() => state.running ? timer.pause() : timer.resume()}>
            {state.running ? <Pause size={14} /> : <Play size={14} />}
            {state.running ? '暂停' : '继续'}
          </button>
          <button type="button" className="hw-btn" data-variant="primary"
            onClick={() => { timer.finishEarly(); pro.setFocusTaskId(null); }}>
            <CheckCircle2 size={14} /> 结束并记录
          </button>
          <button type="button" className="hw-btn"
            onClick={() => { timer.stop(); pro.setFocusTaskId(null); }}>
            <Square size={14} /> 放弃
          </button>
        </div>
        <p className="hw-label mt-1.5 flex items-center gap-1">
          <CheckCircle2 size={12} /> 结束只记下实际专注时间，不会自动把作业标记完成
        </p>
      </div>
    </>
  );
}

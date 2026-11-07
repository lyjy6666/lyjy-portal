'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Sparkles, ArrowRight, Camera, Gauge, CalendarRange, PenLine } from 'lucide-react';
import { useSkin } from '../../skins/skin';

/**
 * 开屏动效：每次进入 Pro 工作台时播放。
 *
 * 严格两段式：
 *   ① 光波段（0.4 秒）：**工作台界面保持可见**，一层光波从左上角真实 AI 按钮
 *      那颗胶囊形状开始展开到全屏；期间底色与波的浓度同步连续加深，
 *      不是最后「啪」一下突然盖满；同时屏蔽所有弹窗/提示。
 *   ② 介绍段（5 秒）：展开铺满之后，介绍文字在已经铺好的底上上浮出现。
 *   ③ 0.45 秒淡出并卸载。
 *
 * 关键点：
 *   - 组件首次渲染（含 SSR）返回 null，DOM 只在客户端挂载，所以 CSS animation
 *     一定从挂载那一刻开始播，不会在 React 水合前偷跑（旧版「光波没扩散」的根因）。
 *   - 形状用元素自身 width/height/left/top + border-radius 做 morph：
 *     0% 完全照抄按钮（胶囊）→ 999px/120px/28px 连续收圆角 → 整屏圆角矩形。
 *   - 「逐渐加深」由 wave 的 opacity 与 veil 的 opacity 两条 0.4s 同步动画完成，
 *     不依赖 phase 切换，所以覆盖是连续的。
 */
type Phase = 'wave' | 'show' | 'out' | 'done';

/** 与 pro.css 里 hw-splash-morph / hw-splash-progress 的时长保持一致 */
const WAVE_MS = 400;
const INTRO_MS = 5000;
const OUT_MS = 450;

/** 「以后都跳过介绍」的持久化标记；个人中心可清除后重新开启 */
export const SKIP_INTRO_KEY = 'hw_skip_intro';

const FEATURES = [
  { icon: Camera, text: '拍照 / 语音记作业' },
  { icon: Gauge, text: '按年级 + 薄弱项估时' },
  { icon: CalendarRange, text: 'AI 智能排期' },
  { icon: PenLine, text: 'AI 批改与举一反三' },
];

export function IntroSplash() {
  const { motion } = useSkin();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>('wave');
  /** AI 按钮的真实矩形：光波的起始形状与它完全一致（胶囊） */
  const [box, setBox] = useState({ x: 30, y: 18, w: 70, h: 24 });
  /** 起点亮点坐标（按钮中心） */
  const [origin, setOrigin] = useState({ x: 65, y: 34 });

  // 开屏期间给 body 打标记：CSS 会把登录框、教程、toast 等浮层全部藏起来，
  // 光波就是干净地在工作台界面上扩散，不会被任何窗口打断。
  useEffect(() => {
    const active = mounted && phase !== 'done';
    document.body.classList.toggle('hw-intro-active', active);
    return () => document.body.classList.remove('hw-intro-active');
  }, [mounted, phase]);

  useEffect(() => {
    // 用户点过「以后都跳过介绍」后，之后每次进站都不再播放
    try {
      if (localStorage.getItem(SKIP_INTRO_KEY) === '1') { setPhase('done'); return; }
    } catch { /* 隐私模式下 localStorage 不可用，照常播放 */ }

    // motion 会在挂载后由 media query 同步；为 false 时必须显式收尾，
    // 否则会留下一个没有计时器、光波也不会动的死层
    if (!motion) { setPhase('done'); return; }

    const el = document.querySelector<HTMLElement>('.hw-ai-mark');
    const rect = el?.getBoundingClientRect();
    // 起始形状就是按钮本身：位置、宽高、圆角都照抄，保证第一帧是那颗胶囊
    const b = rect ?? { left: 30, top: 18, width: 70, height: 24 };
    setBox({ x: b.left, y: b.top, w: b.width, h: b.height });
    setOrigin({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
    setMounted(true);

    const t1 = window.setTimeout(() => setPhase('show'), WAVE_MS);
    const t2 = window.setTimeout(() => setPhase('out'), WAVE_MS + INTRO_MS);
    const t3 = window.setTimeout(() => setPhase('done'), WAVE_MS + INTRO_MS + OUT_MS);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, [motion]);

  if (!mounted || phase === 'done') return null;

  const skip = () => setPhase('done');
  /** 「以后都跳过介绍」：写入本地标记，之后每次进站都不再播放 */
  const skipForever = () => {
    try { localStorage.setItem(SKIP_INTRO_KEY, '1'); } catch { /* 隐私模式忽略 */ }
    setPhase('done');
  };

  return (
    <div
      className={`hw-splash ${phase === 'out' ? 'is-out' : ''}`}
      data-phase={phase}
      style={{
        '--sp-x': `${box.x}px`,
        '--sp-y': `${box.y}px`,
        '--sp-w': `${box.w}px`,
        '--sp-h': `${box.h}px`,
      } as CSSProperties}
      role="presentation"
      onClick={skip}
    >
      {/* ① 只有从 AI 按钮那颗胶囊展开的光波：底板透明，工作台界面看得见 */}
      <div className="hw-splash-wave" />
      <div className="hw-splash-ring" />
      <span className="hw-splash-spark" style={{ left: origin.x, top: origin.y }} />

      {/* ② 波铺满之后才淡入的全屏底板 */}
      <div className="hw-splash-veil" />

      <div className="hw-splash-content">
        <span className="hw-splash-tag"><Sparkles size={15} /> AI · PRO</span>
        <h1 className="hw-splash-title">深度融合 AI 系统</h1>
        <p className="hw-splash-sub">lyjy 作业管理系统 Pro</p>
        <p className="hw-splash-desc">
          不只是把作业记下来。从拍照录入、按年级估算用时，到自动排进每一天、逐题批改讲解，
          整条链路都由 AI 接手。
        </p>

        <div className="hw-splash-features">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <span key={f.text} className="hw-splash-feat">
                <Icon size={14} /> {f.text}
              </span>
            );
          })}
        </div>

        <button type="button" className="hw-splash-enter"
          onClick={(e) => { e.stopPropagation(); skip(); }}>
          进入工作台 <ArrowRight size={15} />
        </button>
      </div>

      <button type="button" className="hw-splash-skip"
        onClick={(e) => { e.stopPropagation(); skipForever(); }}>
        以后都跳过介绍
      </button>
      <span className="hw-splash-progress" />
    </div>
  );
}

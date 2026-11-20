'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';

/* ============================================================
   通用视觉动效组件
   样式在 app/globals.css 的「通用视觉动效」区，全站已引入。
   ============================================================ */

/** 鼠标跟随聚光灯。包裹目标即可，不改变内部结构（只加一个绝对定位光层）。 */
export function Spotlight({
  children,
  className = '',
  radius = 220,
  color = 'rgba(56, 189, 248, 0.16)',
  alwaysOn = false,
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
  color?: string;
  alwaysOn?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--fx-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--fx-y', `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`fx-spotlight ${alwaysOn ? 'is-on' : ''} ${className}`}
      style={{ '--fx-radius': `${radius}px`, '--fx-color': color } as CSSProperties}
    >
      <span className="fx-spotlight-glow" aria-hidden="true" />
      {children}
    </div>
  );
}

/** 沿边框流动的高光。父元素需要 position:relative + border-radius。 */
export function BorderBeam({
  color,
  duration = 4,
  className = '',
}: {
  color?: string;
  duration?: number;
  className?: string;
}) {
  return (
    <span
      className={`fx-border-beam ${className}`}
      aria-hidden="true"
      style={
        {
          ...(color ? { '--fx-beam-color': color } : {}),
          '--fx-beam-duration': `${duration}s`,
        } as CSSProperties
      }
    />
  );
}

/** 3D 倾斜卡片：鼠标在不同位置时跟随倾斜，移出回正。 */
export function TiltCard({
  children,
  className = '',
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 160, damping: 18 });
  const sy = useSpring(my, { stiffness: 160, damping: 18 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const reduce = useReducedMotion();

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`fx-tilt ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
    >
      {children}
    </motion.div>
  );
}

/** 严格 Scroll Reveal：以指定滚动容器为 root，进入视口才显现。 */
export function ScrollReveal({
  children,
  root,
  className = '',
  delay = 0,
  y = 34,
  threshold = 0.18,
  once = true,
  onEnter,
}: {
  children: ReactNode;
  root?: RefObject<HTMLElement | null>;
  className?: string;
  delay?: number;
  y?: number;
  threshold?: number;
  once?: boolean;
  onEnter?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const enterRef = useRef(onEnter);
  enterRef.current = onEnter;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      enterRef.current?.();
      return;
    }
    // 同步兜底：IO 回调在无头浏览器 / 某些环境可能不及时，
    // 已经在可视区里的元素直接点亮，避免首屏空白。
    const viewport = root?.current?.getBoundingClientRect() ?? { top: 0, bottom: window.innerHeight };
    const rect = el.getBoundingClientRect();
    if (rect.top < viewport.bottom - 8 && rect.bottom > viewport.top + 8) {
      setVisible(true);
      enterRef.current?.();
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            enterRef.current?.();
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { root: root?.current ?? null, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [root, threshold, once]);

  return (
    <div
      ref={ref}
      className={`fx-reveal ${visible ? 'is-in' : ''} ${className}`}
      style={{ '--fx-delay': `${delay}ms`, '--fx-y': `${y}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** 数字递增。start 由 ScrollReveal 的 onEnter 触发，保证「滚到才数」。 */
export function CountUp({
  value,
  duration = 1600,
  power = 3,
  start = true,
  className = '',
}: {
  value: number;
  duration?: number;
  /** 缓出强度：越大越「先快后慢」，8 时约 1/3 时间就到 96% */
  power?: number;
  start?: boolean;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (!start || ran.current) return;
    ran.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, power))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value, duration, power]);

  return <span className={className}>{n.toLocaleString('zh-CN')}</span>;
}

/** 打字机。start 同样由 ScrollReveal 控制。 */
export function Typewriter({
  text,
  speed = 95,
  start = true,
  className = '',
}: {
  text: string;
  speed?: number;
  start?: boolean;
  className?: string;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!start) {
      setN(0);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(text.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [start, text, speed]);

  return (
    <span className={className}>
      {text.slice(0, n)}
      <span className="fx-caret" aria-hidden="true" />
    </span>
  );
}

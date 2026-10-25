'use client';

import type { CSSProperties } from 'react';
import { Apple, ArrowDownToLine, ArrowRight, AudioLines, Boxes, Brain, Clapperboard, Compass, Copy, Dice5, Gamepad2, GraduationCap, House, PackageOpen, RadioTower, Search, ShieldCheck, Sparkles, Timer, Video, Wrench, PanelsTopLeft, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { ServiceItem } from '@/data/services';
import { isSunset, sunsetLabel } from '@/lib/sunset';
import { resolveService } from '@/lib/serviceNav';
import { useServiceNav } from './useServiceNav';

const icons: Record<string, LucideIcon> = {
  'fa-house-signal': House, 'fa-magnifying-glass-chart': Search,
  'fa-screwdriver-wrench': Wrench, 'fa-graduation-cap': GraduationCap,
  'fa-stopwatch': Timer, 'fa-microphone-lines': AudioLines,
  'fa-clapperboard': Clapperboard, 'fa-tower-cell': RadioTower,
  'fa-photo-film': Video, 'fa-clone': Copy, 'fa-apple-whole': Apple,
  'fa-dice': Dice5, 'fa-brain': Brain, 'fa-shield-halved': ShieldCheck,
  'fa-box-open': PackageOpen, 'fa-cubes-stacked': Boxes,
  'fa-window-restore': PanelsTopLeft, 'fa-compass': Compass,
  'fa-play': Clapperboard, 'fa-gamepad': Gamepad2, 'fa-download': ArrowDownToLine,
};

export const accents: Record<string, string> = {
  blue: '#9abafa', purple: '#c4b5fd', indigo: '#a5b4fc', cyan: '#93c5da',
  green: '#96c9ae', orange: '#e4bb8a', pink: '#deb1cd', red: '#e6a7ab', yellow: '#d9cd95',
};
export function accentStyle(color: string): CSSProperties {
  return { '--service-accent': accents[color] ?? accents.blue } as CSSProperties;
}
export function ServiceIcon({ icon, size = 22 }: { icon: string; size?: number }) {
  const Icon = icons[icon] ?? Compass;
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}
export function ServiceAction({ service, className = 'portal-enter' }: { service: ServiceItem; className?: string }) {
  // 与圆环节点、列表整行共用同一个跳转入口，保证行为完全一致
  const open = useServiceNav();
  const target = resolveService(service);

  if (target.mode === 'soon') {
    return <span className="portal-unavailable">{target.message ?? '正在筹备中，敬请期待'}</span>;
  }

  // 箭头必须与文字同行，否则窄卡片里 → 会被挤到下一行
  const content = (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {target.label}
      <ArrowRight size={14} className="shrink-0" aria-hidden="true" />
    </span>
  );

  // 保留真实 <a href>：中键新标签、复制链接仍然可用；
  // 普通左键点击则统一交给 open()，与圆圈点击走同一条逻辑。
  return (
    <a
      className={className}
      href={target.href}
      target={target.mode === 'external' ? '_blank' : undefined}
      rel={target.mode === 'external' ? 'noopener noreferrer' : undefined}
      download={target.mode === 'download' || undefined}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        open(service);
      }}
    >
      {content}
    </a>
  );
}
export function ServiceBadges({ service }: { service: ServiceItem }) {
  const badges = service.badge ? (Array.isArray(service.badge) ? service.badge : [service.badge]) : [];
  return <div className="portal-badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div>;
}

/**
 * 服务入口组。
 *
 * 有 Pro 版时：Pro 版做成最醒目的主按钮，原版退到下方做次级入口，并标注关停日期；
 * 一旦过了 sunset 日期，原版自动停用（按钮保留、置灰、不可进入），只留 Pro 版。
 * 没有 Pro 版时退化为普通主入口，保持原样。
 */
export function ServiceEntries({ service, inline = false }: { service: ServiceItem; inline?: boolean }) {
  const pro = service.pro;

  if (!pro) {
    return <ServiceAction service={service} />;
  }

  const sunset = isSunset(service);
  const soon = Boolean(service.soon || service.unavailable);
  const oldHref = service.oldUrl ?? service.url;

  return (
    <div className={`portal-entries ${inline ? 'portal-entries--inline' : ''}`}>
      {/* Pro 版：主按钮，最醒目 */}
      <a className="portal-pro-main" href={pro.href} title={pro.hint ?? pro.label}>
        <Sparkles size={15} strokeWidth={2} aria-hidden="true" />
        {pro.label}
      </a>

      {/* 原版：次级入口；到期后置灰停用 */}
      {!soon &&
        (sunset ? (
          <span className="portal-old-entry is-off" aria-disabled="true">
            原版已关停
          </span>
        ) : (
          <a className="portal-old-entry" href={oldHref}>
            进入原版
          </a>
        ))}

      <span className="portal-old-note">{sunset ? '请使用 Pro 版' : sunsetLabel(service)}</span>
    </div>
  );
}
export function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writePreference(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
// Local acknowledgement only: no claim that a request was sent to a server.
let fallbackTimes: number[] = [];
let fallbackCount = 0;
export function handleNudge() {
  const now = Date.now();
  let timestamps = fallbackTimes;
  try {
    const parsed: unknown = JSON.parse(readPreference('nudgeLimit') ?? '[]');
    if (Array.isArray(parsed)) timestamps = parsed.filter((t): t is number => typeof t === 'number' && Number.isFinite(t));
  } catch { /* A corrupt preference must not break navigation. */ }
  timestamps = timestamps.filter((t) => now - t < 60_000 && now >= t);
  if (timestamps.length >= 10) { toast('催更太频繁了，请稍后再试'); return; }
  fallbackTimes = [...timestamps, now];
  writePreference('nudgeLimit', JSON.stringify(fallbackTimes));
  const savedCount = Number(readPreference('nudgeCount') ?? fallbackCount);
  fallbackCount = (Number.isFinite(savedCount) && savedCount >= 0 ? savedCount : 0) + 1;
  writePreference('nudgeCount', String(fallbackCount));
  toast(`已在本机记录，本次累计催更 ${fallbackCount} 次`);
}

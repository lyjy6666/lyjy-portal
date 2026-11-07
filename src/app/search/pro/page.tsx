'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Palette,
  ScrollText,
  ArrowLeftRight,
  Home,
  ChevronDown,
  History,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import SearchBBackground, {
  WALLPAPERS,
  DEFAULT_WALLPAPER_ID,
} from '@/components/search-b/SearchBBackground';
import SearchBClock from '@/components/search-b/SearchBClock';
import EnginePicker from '@/components/search-b/EnginePicker';
import QuickLinks from '@/components/search-b/QuickLinks';
import AppGrid from '@/components/search-b/AppGrid';
import ChangelogModal from '@/components/search-b/ChangelogModal';
import AppIcon from '@/components/search-b/AppIcon';
import {
  SEARCH_ENGINES,
  DEFAULT_ENGINE_ID,
  DEFAULT_QUICK_LINKS,
  getEngine,
  type QuickLink,
} from '@/data/searchB';
import { isSunsetDate } from '@/lib/sunset';

const LS = {
  engine: 'searchB.engine',
  wallpaper: 'searchB.wallpaper',
  history: 'searchB.history',
  quick: 'searchB.quickLinks',
};

function loadLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

// 入场动画
const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const itemV = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const URL_RE = /^https?:\/\//i;
const DOMAIN_RE = /^[\w-]+(\.[\w-]+)+(\/[^\s]*)?$/;

export default function SearchProPage() {
  const [engineId, setEngineId] = useState(DEFAULT_ENGINE_ID);
  const [wallpaper, setWallpaper] = useState(DEFAULT_WALLPAPER_ID);
  const [history, setHistory] = useState<string[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(DEFAULT_QUICK_LINKS);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [panel, setPanel] = useState<null | 'engine' | 'wallpaper'>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const engine = getEngine(engineId);
  // 原版搜索页已关停时，禁用顶部「原版」入口
  const searchOff = hydrated && isSunsetDate('2026-11-01');

  // 挂载后读取本地偏好，避免 SSR / 客户端 hydration 不一致
  useEffect(() => {
    setEngineId(loadLS(LS.engine, DEFAULT_ENGINE_ID));
    setWallpaper(loadLS(LS.wallpaper, DEFAULT_WALLPAPER_ID));
    setHistory(loadLS<string[]>(LS.history, []));
    setQuickLinks(loadLS<QuickLink[]>(LS.quick, DEFAULT_QUICK_LINKS));
    setHydrated(true);
  }, []);

  // 持久化（仅在 hydrate 之后，避免用默认值覆盖已存数据）
  useEffect(() => { if (hydrated) localStorage.setItem(LS.engine, JSON.stringify(engineId)); }, [engineId, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(LS.wallpaper, JSON.stringify(wallpaper)); }, [wallpaper, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(LS.history, JSON.stringify(history)); }, [history, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(LS.quick, JSON.stringify(quickLinks)); }, [quickLinks, hydrated]);

  // 全局快捷键：/ 或 Ctrl+K 聚焦，Esc 关闭弹层
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === 'Escape') {
        if (panel) setPanel(null);
        else if (showChangelog) setShowChangelog(false);
        return;
      }
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, showChangelog]);

  // 智能识别：像网址就直接打开，否则走当前引擎搜索
  const openTarget = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const isUrl = URL_RE.test(t) || (DOMAIN_RE.test(t) && !/\s/.test(t));
    const url = isUrl ? (URL_RE.test(t) ? t : `https://${t}`) : engine.buildUrl(t);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const runSearch = (raw: string) => {
    const t = raw.trim();
    if (!t) {
      inputRef.current?.focus();
      return;
    }
    openTarget(t);
    setHistory((prev) => [t, ...prev.filter((h) => h !== t)].slice(0, 12));
    setQuery('');
    inputRef.current?.blur();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      e.currentTarget.blur();
    }
  };

  const quickEngines = SEARCH_ENGINES.filter((e) => !e.ai).slice(0, 8);
  const aiEngines = SEARCH_ENGINES.filter((e) => e.ai);
  const showHistory = focused && !query.trim() && history.length > 0;

  // AI 助手：点击直接打开网站，不进搜索框流程（避免用户白输）
  const openAi = (e: (typeof SEARCH_ENGINES)[number]) =>
    window.open(e.buildUrl(''), '_blank', 'noopener,noreferrer');

  const EnginePill = ({ id }: { id: string }) => {
    const e = getEngine(id);
    const active = e.id === engineId;
    return (
      <button
        type="button"
        onClick={() => (e.ai ? openAi(e) : setEngineId(e.id))}
        title={e.ai ? `打开 ${e.name}` : undefined}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
          active
            ? 'border-white/25 bg-white/15 text-white'
            : 'border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/10 hover:text-white/85'
        }`}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.accent }} />
        {e.name}
        {e.ai && <ExternalLink size={11} className="opacity-50" />}
      </button>
    );
  };

  return (
    <div className="relative min-h-screen">
      <SearchBBackground wallpaperId={wallpaper} />

      {/* 顶栏 */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white">
              L
            </span>
            <span className="text-sm font-semibold text-white/90">LYJY 搜索</span>
            <span className="rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              Pro 版
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPanel(panel === 'wallpaper' ? null : 'wallpaper')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition hover:bg-white/10 ${
                panel === 'wallpaper' ? 'bg-white/10 text-white' : 'text-white/60'
              }`}
            >
              <Palette size={15} /> 壁纸
            </button>
            <button
              type="button"
              onClick={() => setShowChangelog(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <ScrollText size={15} /> 更新日志
            </button>
            {searchOff ? (
              <span
                className="flex cursor-not-allowed items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/30 line-through"
                title="原版已关停"
              >
                <ArrowLeftRight size={15} /> 原版已关停
              </span>
            ) : (
              <a
                href="/search"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                title="回到原版搜索页"
              >
                <ArrowLeftRight size={15} /> 原版
              </a>
            )}
            <a
              href="/"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
              title="返回导航系统"
            >
              <Home size={15} /> 门户
            </a>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <motion.main
        variants={containerV}
        initial="hidden"
        animate="show"
        className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 pt-24"
      >
        {/* 时钟 */}
        <motion.div variants={itemV} className="flex justify-center">
          <SearchBClock />
        </motion.div>

        {/* 搜索区 */}
        <motion.div variants={itemV} className="relative mt-8">
          <form onSubmit={onSubmit}>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 shadow-2xl backdrop-blur-xl transition focus-within:border-white/25 focus-within:bg-white/[0.09]">
              <button
                type="button"
                onClick={() => setPanel(panel === 'engine' ? null : 'engine')}
                className="flex shrink-0 items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-white/10"
                aria-label="切换搜索引擎"
              >
                <AppIcon initial={engine.initial} accent={engine.accent} size={30} />
                <span className="hidden text-sm text-white/70 sm:inline">{engine.name}</span>
                <ChevronDown size={14} className="text-white/40" />
              </button>

              <span className="h-6 w-px bg-white/10" />

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => window.setTimeout(() => setFocused(false), 120)}
                onKeyDown={onInputKeyDown}
                placeholder={`用 ${engine.name} 搜索，或输入网址`}
                aria-label="搜索输入框"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder-white/35 outline-none"
              />

              <button
                type="submit"
                aria-label="搜索"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg transition hover:brightness-110 active:scale-95"
              >
                <Search size={17} />
              </button>
            </div>
          </form>

          {/* 引擎选择面板 */}
          <AnimatePresence>
            {panel === 'engine' && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPanel(null)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="relative z-40"
                >
                  <EnginePicker currentId={engineId} onSelect={(id) => { setEngineId(id); setPanel(null); }} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* 搜索历史 */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-white/40">
                    <History size={12} /> 搜索历史
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="flex items-center gap-1 text-[11px] text-white/40 transition hover:text-white/70"
                  >
                    <Trash2 size={11} /> 清空
                  </button>
                </div>
                <ul className="max-h-64 overflow-y-auto pb-1">
                  {history.map((h) => (
                    <li key={h}>
                      <button
                        type="button"
                        onClick={() => runSearch(h)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/75 transition hover:bg-white/10"
                      >
                        <Search size={13} className="shrink-0 text-white/30" />
                        <span className="truncate">{h}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 引擎快捷 pills */}
        <motion.div variants={itemV} className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {quickEngines.map((e) => (
            <EnginePill key={e.id} id={e.id} />
          ))}
          <span className="mx-1 h-4 w-px bg-white/10" />
          {aiEngines.map((e) => (
            <EnginePill key={e.id} id={e.id} />
          ))}
        </motion.div>

        {/* 快速访问 + 网址导航 */}
        <motion.div variants={itemV} className="mt-12 space-y-12">
          <QuickLinks links={quickLinks} onChange={setQuickLinks} />
          <AppGrid />
        </motion.div>

        {/* 页脚 */}
        <motion.footer variants={itemV} className="mt-16 text-center">
          <p className="text-[11px] text-white/30">
            按 <kbd className="rounded bg-white/10 px-1">/</kbd> 聚焦搜索 ·
            <kbd className="mx-1 rounded bg-white/10 px-1">Esc</kbd> 清空 ·
            输入网址可直接打开
          </p>
          <p className="mt-1 text-[11px] text-white/25">© {new Date().getFullYear()} LYJY · 搜索页 Pro 版</p>
        </motion.footer>
      </motion.main>

      {/* 壁纸选择面板 */}
      <AnimatePresence>
        {panel === 'wallpaper' && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setPanel(null)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="fixed right-4 top-16 z-50 w-56 rounded-2xl border border-white/10 bg-black/75 p-3 shadow-2xl backdrop-blur-xl"
            >
              <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-white/40">壁纸</p>
              <div className="grid grid-cols-5 gap-2">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => { setWallpaper(w.id); setPanel(null); }}
                    title={w.name}
                    className="group flex flex-col items-center gap-1"
                  >
                    <span
                      className={`h-9 w-9 rounded-lg ring-1 transition group-hover:scale-110 ${
                        wallpaper === w.id ? 'ring-2 ring-white' : 'ring-white/15'
                      }`}
                      style={{ background: w.base }}
                    />
                    <span className="text-[10px] text-white/50">{w.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ChangelogModal open={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Palette,
  ScrollText,
  ArrowLeftRight,
  Home,
  ChevronDown,
  History,
  Trash2,
  Mic,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import SearchBBackground, {
  WALLPAPERS,
  DEFAULT_WALLPAPER_ID,
} from '@/components/search-b/SearchBBackground';
import SearchBClock from '@/components/search-b/SearchBClock';
import EnginePicker from '@/components/search-b/EnginePicker';
import EnginePill from '@/components/search-b/EnginePill';
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
import { useVoiceInput } from '@/features/homework-pro/hooks/useVoiceInput';

const LS = {
  engine: 'searchB.engine',
  wallpaper: 'searchB.wallpaper',
  history: 'searchB.history',
  quick: 'searchB.quickLinks',
};

/** 读本地偏好：任何损坏的数据都静默回退，绝不让页面白屏 */
function readJSON(key: string): unknown {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function saveLS(key: string, value: unknown) {
  // Safari 隐私模式 / 配额满时静默失败，不影响使用
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 忽略 */
  }
}

function asId(v: unknown, allowed: string[], fallback: string): string {
  return typeof v === 'string' && allowed.includes(v) ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0 && x.length <= 200)
    .slice(0, 12);
}

function asQuickLinks(v: unknown): QuickLink[] {
  if (!Array.isArray(v)) return DEFAULT_QUICK_LINKS;
  return v
    .filter(
      (x): x is QuickLink =>
        !!x &&
        typeof x === 'object' &&
        typeof (x as QuickLink).id === 'string' &&
        typeof (x as QuickLink).name === 'string' &&
        typeof (x as QuickLink).url === 'string' &&
        typeof (x as QuickLink).accent === 'string',
    )
    .slice(0, 24);
}

type Suggest = {
  kind: 'history' | 'engine' | 'url';
  label: string;
  value: string;
  hint: string;
  engineId?: string;
};

// 入场动画
const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const itemV = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const URL_RE = /^https?:\/\//i;
const DOMAIN_RE = /^[\w-]+(\.[\w-]+)+(\/[^\s]*)?$/;

const NORMAL_ENGINE_IDS = SEARCH_ENGINES.filter((e) => !e.ai).map((e) => e.id);
const WALLPAPER_IDS = WALLPAPERS.map((w) => w.id);

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
  const [suggestIndex, setSuggestIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<number | null>(null);
  const engine = getEngine(engineId);
  const searchOff = hydrated && isSunsetDate('2026-11-01');

  // 挂载后读取并校验本地偏好，避免 SSR / 客户端 hydration 不一致
  useEffect(() => {
    setEngineId(asId(readJSON(LS.engine), NORMAL_ENGINE_IDS, DEFAULT_ENGINE_ID));
    setWallpaper(asId(readJSON(LS.wallpaper), WALLPAPER_IDS, DEFAULT_WALLPAPER_ID));
    setHistory(asStringArray(readJSON(LS.history)));
    setQuickLinks(asQuickLinks(readJSON(LS.quick)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    return () => {
      if (blurTimer.current) window.clearTimeout(blurTimer.current);
    };
  }, []);

  // 仅在 hydrate 之后持久化，避免用默认值覆盖已存数据
  useEffect(() => { if (hydrated) saveLS(LS.engine, engineId); }, [engineId, hydrated]);
  useEffect(() => { if (hydrated) saveLS(LS.wallpaper, wallpaper); }, [wallpaper, hydrated]);
  useEffect(() => { if (hydrated) saveLS(LS.history, history); }, [history, hydrated]);
  useEffect(() => { if (hydrated) saveLS(LS.quick, quickLinks); }, [quickLinks, hydrated]);

  const resetPrefs = useCallback(() => {
    try {
      Object.values(LS).forEach((k) => localStorage.removeItem(k));
    } catch {
      /* 忽略 */
    }
    setEngineId(DEFAULT_ENGINE_ID);
    setWallpaper(DEFAULT_WALLPAPER_ID);
    setHistory([]);
    setQuickLinks(DEFAULT_QUICK_LINKS);
    setQuery('');
    setSuggestIndex(-1);
    setPanel(null);
    toast.success('偏好已重置');
  }, []);

  // 语音输入：识别由浏览器提供，不经过本站服务器
  const voice = useVoiceInput((text) => {
    setQuery((prev) => (prev ? `${prev} ${text}` : text));
    inputRef.current?.focus();
  });

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
    setSuggestIndex(-1);
    inputRef.current?.blur();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const openAi = useCallback((id: string) => {
    const e = getEngine(id);
    // 秘塔等少数 AI 的 buildUrl 带 ?q=，空查询时剥掉
    const url = e.buildUrl('').replace(/\?q=$/, '');
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);
  const selectEngine = useCallback((id: string) => setEngineId(id), []);

  const quickEngines = SEARCH_ENGINES.filter((e) => !e.ai).slice(0, 8);
  const aiEngines = SEARCH_ENGINES.filter((e) => e.ai);

  /** 本地搜索建议：全部来自历史与静态引擎表，零网络请求 */
  const suggestions = useMemo<Suggest[]>(() => {
    const raw = query.trim();
    const q = raw.toLowerCase();
    if (!q) return [];

    const out: Suggest[] = [];
    const isUrl = URL_RE.test(raw) || (DOMAIN_RE.test(raw) && !/\s/.test(raw));
    if (isUrl) {
      out.push({ kind: 'url', label: `直接打开 ${raw}`, value: raw, hint: '网址' });
    }
    history
      .filter((h) => h.toLowerCase().includes(q) && h !== raw)
      .slice(0, 4)
      .forEach((h) => out.push({ kind: 'history', label: h, value: h, hint: '历史' }));
    SEARCH_ENGINES.filter((e) => !e.ai && e.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((e) =>
        out.push({ kind: 'engine', label: `用 ${e.name} 搜索`, value: raw, hint: e.name, engineId: e.id }),
      );
    return out.slice(0, 6);
  }, [query, history]);

  const showSuggest = focused && suggestions.length > 0;
  const showHistory = focused && !query.trim() && history.length > 0;

  const applySuggest = (s: Suggest) => {
    setSuggestIndex(-1);
    if (s.kind === 'history') {
      setQuery(s.value);
      inputRef.current?.focus();
      return;
    }
    if (s.kind === 'engine' && s.engineId) setEngineId(s.engineId);
    runSearch(s.value);
  };

  // Esc 与快捷键统一在此处理，避免与输入框的重复监听互相打架
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

      if (e.key === 'Escape') {
        if (showSuggest) {
          setSuggestIndex(-1);
          inputRef.current?.blur();
        } else if (panel) {
          setPanel(null);
        } else if (showChangelog) {
          setShowChangelog(false);
        } else if (document.activeElement === inputRef.current) {
          setQuery('');
          inputRef.current?.blur();
        }
        return;
      }
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, showChangelog, showSuggest]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggest) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && suggestIndex >= 0) {
      e.preventDefault();
      applySuggest(suggestions[suggestIndex]);
    }
  };

  const onFocus = () => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    setFocused(true);
  };
  const onBlur = () => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    blurTimer.current = window.setTimeout(() => setFocused(false), 120);
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
            <span className="hidden rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm sm:inline">
              Pro 版
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPanel(panel === 'wallpaper' ? null : 'wallpaper')}
              aria-label="切换壁纸"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition hover:bg-white/10 ${
                panel === 'wallpaper' ? 'bg-white/10 text-white' : 'text-white/60'
              }`}
            >
              <Palette size={15} /> <span className="hidden sm:inline">壁纸</span>
            </button>
            <button
              type="button"
              onClick={() => setShowChangelog(true)}
              aria-label="查看更新日志"
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white sm:flex"
            >
              <ScrollText size={15} /> 更新日志
            </button>
            {searchOff ? (
              <span
                className="hidden cursor-not-allowed items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/50 line-through md:flex"
                title="原版已关停"
              >
                <ArrowLeftRight size={15} /> 原版已关停
              </span>
            ) : (
              <a
                href="/search"
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white md:flex"
                title="回到原版搜索页"
              >
                <ArrowLeftRight size={15} /> 原版
              </a>
            )}
            <a
              href="/"
              aria-label="返回导航系统"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
              title="返回导航系统"
            >
              <Home size={15} /> <span className="hidden sm:inline">门户</span>
            </a>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <motion.main
        variants={containerV}
        initial="hidden"
        animate="show"
        className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 pb-10 pt-20 sm:pt-24"
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
                <ChevronDown size={14} className="text-white/60" />
              </button>

              <span className="h-6 w-px bg-white/10" />

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSuggestIndex(-1); }}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onInputKeyDown}
                placeholder={voice.recording && voice.interim ? voice.interim : `用 ${engine.name} 搜索，或输入网址`}
                aria-label="搜索输入框"
                aria-autocomplete="list"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder-white/50 outline-none"
              />

              {voice.supported ? (
                <button
                  type="button"
                  onClick={() => voice.toggle()}
                  aria-label={voice.recording ? '停止语音输入' : '开始语音输入'}
                  title={voice.recording ? '停止语音输入' : '语音输入（由浏览器识别，不经过本站服务器）'}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                    voice.recording
                      ? 'bg-rose-500/80 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Mic size={16} />
                </button>
              ) : null}

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

          {/* 本地搜索建议 */}
          <AnimatePresence>
            {showSuggest && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/75 shadow-2xl backdrop-blur-xl"
                role="listbox"
                aria-label="搜索建议"
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[11px] text-white/50">搜索建议 · 全部来自本地</span>
                  <span className="text-[10px] text-white/40">↑↓ 选择 · Enter 确认</span>
                </div>
                <ul className="pb-1">
                  {suggestions.map((s, i) => (
                    <li key={`${s.kind}-${s.label}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === suggestIndex}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applySuggest(s)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                          i === suggestIndex ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/10'
                        }`}
                      >
                        <Search size={13} className="shrink-0 text-white/50" />
                        <span className="truncate">{s.label}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-white/40">{s.hint}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 搜索历史 */}
          <AnimatePresence>
            {showHistory && !showSuggest && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/75 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-white/50">
                    <History size={12} /> 搜索历史
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="flex items-center gap-1 text-[11px] text-white/50 transition hover:text-white/80"
                  >
                    <Trash2 size={11} /> 清空
                  </button>
                </div>
                <ul className="max-h-64 overflow-y-auto pb-1">
                  {history.map((h) => (
                    <li key={h}>
                      <button
                        type="button"
                        onClick={() => { setQuery(h); setFocused(false); inputRef.current?.focus(); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/75 transition hover:bg-white/10"
                      >
                        <Search size={13} className="shrink-0 text-white/50" />
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
            <EnginePill key={e.id} id={e.id} engineId={engineId} onSelect={selectEngine} onOpenAi={openAi} />
          ))}
          <button
            type="button"
            onClick={() => setPanel('engine')}
            title="展开全部 23 个搜索引擎"
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white/85"
          >
            <Plus size={11} /> 更多 <span className="text-white/40">({SEARCH_ENGINES.length})</span>
          </button>
          <span className="mx-1 h-4 w-px bg-white/10" />
          {aiEngines.map((e) => (
            <EnginePill key={e.id} id={e.id} engineId={engineId} onSelect={selectEngine} onOpenAi={openAi} />
          ))}
        </motion.div>

        {/* 快速访问 + 网址导航 */}
        <motion.div variants={itemV} className="mt-12 space-y-12">
          <QuickLinks links={quickLinks} onChange={setQuickLinks} />
          <AppGrid />
        </motion.div>

        {/* 页脚 */}
        <motion.footer variants={itemV} className="mt-16 text-center">
          <p className="text-[11px] text-white/50">
            按 <kbd className="rounded bg-white/10 px-1">/</kbd> 聚焦 ·
            <kbd className="mx-1 rounded bg-white/10 px-1">↑↓</kbd> 选建议 ·
            <kbd className="mx-1 rounded bg-white/10 px-1">Esc</kbd> 关闭 · 输入网址可直接打开
          </p>
          <p className="mt-1 text-[11px] text-white/50">© {new Date().getFullYear()} LYJY · 搜索页 Pro 版</p>
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
              <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-white/50">壁纸</p>
              <div className="grid grid-cols-4 gap-2">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => { setWallpaper(w.id); setPanel(null); }}
                    title={w.name}
                    aria-label={`切换到壁纸 ${w.name}`}
                    aria-pressed={wallpaper === w.id}
                    className="group flex flex-col items-center gap-1"
                  >
                    <span
                      className={`h-9 w-9 rounded-lg ring-1 transition group-hover:scale-110 ${
                        wallpaper === w.id ? 'ring-2 ring-white' : 'ring-white/15'
                      }`}
                      style={{ background: w.base }}
                    />
                    <span className="text-[10px] text-white/60">{w.name}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={resetPrefs}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 px-2 py-1.5 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw size={12} /> 重置偏好
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ChangelogModal open={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  );
}

'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import type {
  BaseTask, BoardGroupBy, DateMode, FilterState, ListGroupBy, ProMeta, ProTask,
  SyncOp, UserInfo, ViewMode,
} from '../core/types';
import { DEFAULT_FILTER, makeMeta } from '../core/types';
import type { MetaMap } from '../core/merge';
import { mergeProTasks, normalizeBaseTask, metaPatch } from '../core/merge';
import { filterTasks } from '../core/filters';
import { groupBySubject, groupByTime, groupByPriority, boardGroups, type TaskGroup } from '../core/grouping';
import { summary } from '../core/stats';
import { combineDateMode, expandRepeat, todayKey, dayEndIso } from '../core/date';
import { buildBatchDateUpdates, runBatch } from '../core/batch';
import { parseImportText } from '../core/importExport';
import { readScoped, writeScoped, clearUserData, migrateLegacy, hasMigratedLegacy, KEYS } from '../core/storage';
import { setApiAuth, ApiError, isNetworkError } from '../api/client';
import { LAYOUT_META, type LayoutId } from '../skins/theme';
import { tasksApi } from '../api/tasks';
import { metaApi } from '../api/meta';
import { authApi } from '../api/auth';

export type DialogName =
  | 'grader' | 'import' | 'export' | 'auth' | 'tour'
  | 'recycle' | 'settings' | 'review' | 'confirm' | 'capture' | 'achievements' | 'picker'
  // 品牌区的 Pro / AI 两个按钮各自弹出介绍
  | 'proIntro' | 'aiIntro' | null;

export type ProSettings = {
  dailyLimitMin: number;
  notifyLeadMin: number;
  notificationsEnabled: boolean;
  showCompleted: boolean;
  hideInactive: boolean;
  /** AI 用时推测所依据的年级；空串表示尚未选择 */
  grade: string;
  /**
   * 薄弱项（科目）：AI 会据此给这些科目的作业多留时间，
   * 批改时也会多出背后的知识点提示。
   */
  weakSubjects: string[];
  /**
   * 快速模式：图片识别优先走 GLM 4.6V（约 1 秒出字），
   * 关闭时走默认高精度链（Agnes 3.0 优先，2~10 秒但更稳）。
   */
  fastMode: boolean;
};

const DEFAULT_SETTINGS: ProSettings = {
  dailyLimitMin: 180,
  notifyLeadMin: 30,
  notificationsEnabled: false,
  showCompleted: true,
  hideInactive: false,
  grade: '',
  weakSubjects: [],
  fastMode: false,
};

// ---------------------------------------------------------------------------
// reducer：旧版约 40 个 useState 收敛为 1 个
// ---------------------------------------------------------------------------
type State = { tasks: ProTask[]; metaMap: MetaMap; loading: boolean; error: string | null };
type Action =
  | { type: 'hydrate'; tasks: ProTask[]; metaMap: MetaMap }
  | { type: 'loading'; value: boolean }
  | { type: 'error'; value: string | null }
  | { type: 'add'; task: ProTask }
  | { type: 'replaceTemp'; tempId: number; tasks: ProTask[] }
  | { type: 'patch'; id: number; patch: Partial<BaseTask> }
  | { type: 'patchMeta'; id: number; patch: Partial<ProMeta> }
  | { type: 'setRev'; id: number; rev: number }
  | { type: 'remove'; id: number }
  | { type: 'restore'; task: ProTask }
  | { type: 'setAll'; tasks: ProTask[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate': return { ...state, tasks: action.tasks, metaMap: action.metaMap, loading: false, error: null };
    case 'loading': return { ...state, loading: action.value };
    case 'error': return { ...state, error: action.value, loading: false };
    case 'add': return { ...state, tasks: [action.task, ...state.tasks] };
    case 'replaceTemp': return {
      ...state,
      tasks: [...state.tasks.filter((t) => t.id !== action.tempId), ...action.tasks],
    };
    case 'patch': return {
      ...state,
      tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
    };
    case 'patchMeta': return {
      ...state,
      metaMap: {
        ...state.metaMap,
        [String(action.id)]: { ...(state.metaMap[String(action.id)] ?? makeMeta()), ...action.patch },
      },
      tasks: state.tasks.map((t) =>
        t.id === action.id ? { ...t, meta: { ...t.meta, ...action.patch } } : t),
    };
    case 'setRev': return {
      ...state,
      metaMap: { ...state.metaMap, [String(action.id)]: { ...(state.metaMap[String(action.id)] ?? makeMeta()), rev: action.rev } },
      tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, meta: { ...t.meta, rev: action.rev } } : t)),
    };
    case 'remove': return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case 'restore': return { ...state, tasks: [action.task, ...state.tasks] };
    case 'setAll': return { ...state, tasks: action.tasks };
    default: return state;
  }
}

/** 批量操作只接受已落库的真实 id：负数临时 id 打给服务端必然 404 */
function validIds(ids: number[], tasks: ProTask[]): number[] {
  const known = new Set(tasks.filter((t) => t.id > 0).map((t) => t.id));
  return ids.filter((id) => Number.isInteger(id) && known.has(id));
}

/** 写往 /pro/meta 的 patch：剥掉 rev，并把 undefined 显式转成 null 以清除字段 */
function wireMetaPatch(patch: Partial<ProMeta>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metaPatch(patch as ProMeta)).map(([k, v]) => [k, v === undefined ? null : v]),
  );
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
type ProContextValue = {
  user: UserInfo | null;
  authReady: boolean;
  login: (u: string, p: string) => Promise<boolean>;
  register: (u: string, p: string) => Promise<boolean>;
  logout: () => void;

  tasks: ProTask[];
  loading: boolean;
  error: string | null;
  offline: boolean;
  refresh: () => Promise<void>;

  addTask: (text: string, dueDate: string | null, meta?: Partial<ProMeta>) => Promise<boolean>;
  patchTask: (id: number, patch: Partial<BaseTask>) => Promise<void>;
  patchMeta: (id: number, patch: Partial<ProMeta>) => Promise<void>;
  removeTask: (id: number) => void;
  toggleDone: (id: number) => Promise<void>;
  togglePin: (id: number) => Promise<void>;
  batchDelete: (ids: number[]) => Promise<void>;
  batchPin: (ids: number[], value: boolean) => Promise<void>;
  batchReschedule: (ids: number[], mode: DateMode, value: string) => Promise<{ ok: number; skipped: number; failed: number }>;
  importText: (text: string, dueDate?: string | null) => Promise<boolean>;
  importPlan: (items: { text: string; dueDate: string | null }[], onProgress?: (done: number, total: number) => void) => Promise<{ created: number; failed: number }>;

  layout: LayoutId; setLayout: (v: LayoutId) => void;
  focusTaskId: number | null; setFocusTaskId: (id: number | null) => void;
  view: ViewMode; setView: (v: ViewMode) => void;
  groupBy: ListGroupBy; setGroupBy: (v: ListGroupBy) => void;
  boardBy: BoardGroupBy; setBoardBy: (v: BoardGroupBy) => void;
  filter: FilterState; setFilter: (f: FilterState) => void;
  settings: ProSettings; setSettings: (s: ProSettings) => void;

  dialog: DialogName; openDialog: (d: DialogName, payload?: unknown) => void; closeDialog: () => void;
  dialogPayload: unknown;
  selection: Set<number>; setSelection: (s: Set<number>) => void;
  detailId: number | null; setDetailId: (id: number | null) => void;
  recycle: ProTask[]; restoreFromRecycle: (task: ProTask) => Promise<void>; clearRecycle: () => void;
  undo: (() => void) | null;

  filtered: ProTask[];
  groups: TaskGroup[];
  board: TaskGroup[];
  stats: ReturnType<typeof summary>;
};

const ProContext = createContext<ProContextValue | null>(null);

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro 必须在 ProProvider 内使用');
  return ctx;
}

function uidOf(user: UserInfo | null): number | string { return user?.id ?? 'guest'; }

export function ProProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { tasks: [], metaMap: {}, loading: true, error: null });
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [offline, setOffline] = useState(false);

  const [layout, setLayoutState] = useState<LayoutId>('B');
  const [focusTaskId, setFocusTaskId] = useState<number | null>(null);
  const [view, setViewState] = useState<ViewMode>('list');
  const [groupBy, setGroupByState] = useState<ListGroupBy>('time');
  const [boardBy, setBoardByState] = useState<BoardGroupBy>('status');
  const [filter, setFilterState] = useState<FilterState>(DEFAULT_FILTER);
  const [settings, setSettingsState] = useState<ProSettings>(DEFAULT_SETTINGS);

  const [dialog, setDialog] = useState<DialogName>(null);
  const [dialogPayload, setDialogPayload] = useState<unknown>(null);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [detailId, setDetailId] = useState<number | null>(null);
  const [recycle, setRecycle] = useState<ProTask[]>([]);
  const [undo, setUndo] = useState<(() => void) | null>(null);

  const pendingDeletes = useRef<Map<number, { timer: number; task: ProTask }>>(new Map());
  const stateRef = useRef(state);
  stateRef.current = state;
  const userRef = useRef(user);
  userRef.current = user;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  // 同一任务的 meta 写请求按 id 串行；rev 用独立 ref 同步推进，
  // 不依赖 React render 时机，避免两次并发带同一 baseRev 触发 409 并互相覆盖。
  const metaQueues = useRef<Map<number, Promise<void>>>(new Map());
  const revRef = useRef<Map<number, number>>(new Map());

  // --- 偏好：按用户隔离，带 legacy 复制迁移 ---
  const setPref = useCallback(<T,>(key: string, value: T, setter: (v: T) => void) => {
    setter(value);
    writeScoped(uidOf(userRef.current), key, value);
  }, []);

  const setLayout = useCallback((v: LayoutId) => setPref('layout', v, setLayoutState), [setPref]);
  const setView = useCallback((v: ViewMode) => setPref(KEYS.view, v, setViewState), [setPref]);
  const setGroupBy = useCallback((v: ListGroupBy) => setPref(KEYS.groupBy, v, setGroupByState), [setPref]);
  const setBoardBy = useCallback((v: BoardGroupBy) => setPref('boardBy', v, setBoardByState), [setPref]);
  const setFilter = useCallback((v: FilterState) => setPref(KEYS.filter, v, setFilterState), [setPref]);
  const setSettings = useCallback((v: ProSettings) => setPref(KEYS.settings, v, setSettingsState), [setPref]);

  const loadPrefs = useCallback((u: UserInfo | null) => {
    const id = uidOf(u);
    if (!hasMigratedLegacy(id)) migrateLegacy(id);
    // 主题由 SkinProvider 单独管理；布局旧编号在这里做一次性映射
    const rawLayout = readScoped<string>(id, 'layout', 'B');
    const migrated = readScoped<boolean>(id, 'layoutV2', false);
    let nextLayout: LayoutId = 'B';
    if (migrated) {
      nextLayout = rawLayout in LAYOUT_META ? (rawLayout as LayoutId) : 'B';
    } else {
      // 旧 B＝侧栏工作台 → 新 A；旧 F＝速览双栏 → 新 B
      nextLayout = rawLayout === 'F' ? 'B' : 'A';
      writeScoped(id, 'layoutV2', true);
      writeScoped(id, 'layout', nextLayout);
    }
    // 一次性重置到新默认（B 速览双栏）：用户要求默认值改成 B，
    // 老账号里存的 A 会被这一次性标志覆盖一次，之后手动切换照常保存。
    if (!readScoped<boolean>(id, 'layoutV3', false)) {
      nextLayout = 'B';
      writeScoped(id, 'layoutV3', true);
      writeScoped(id, 'layout', 'B');
    }
    setLayoutState(nextLayout);
    setViewState(readScoped<ViewMode>(id, KEYS.view, 'list'));
    setGroupByState(readScoped<ListGroupBy>(id, KEYS.groupBy, 'time'));
    setBoardByState(readScoped<BoardGroupBy>(id, 'boardBy', 'status'));
    setFilterState(readScoped<FilterState>(id, KEYS.filter, DEFAULT_FILTER));
    // 老版本存的 settings 没有 weakSubjects 字段，必须与默认值合并，否则读到 undefined
    const savedSettings = readScoped<Partial<ProSettings>>(id, KEYS.settings, {});
    setSettingsState({
      ...DEFAULT_SETTINGS,
      ...savedSettings,
      weakSubjects: Array.isArray(savedSettings.weakSubjects) ? savedSettings.weakSubjects : [],
    });
    setRecycle(readScoped<ProTask[]>(id, KEYS.recycle, []));
  }, []);

  // --- 身份初始化 ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem('homeworkUser');
      const parsed = raw ? (JSON.parse(raw) as UserInfo) : null;
      if (parsed?.id) {
        setUser(parsed);
        setApiAuth(parsed.token || '', parsed.id);
        loadPrefs(parsed);
        if (!parsed.token) {
          // Pro 版必须重新登录一次换取签名凭证（原版仍可用旧会话，互不影响）
          setDialog('auth');
          toast('Pro 版需重新登录一次以启用更安全的凭证');
        }
      } else {
        loadPrefs(null);
        setDialog('auth');
      }
    } catch { loadPrefs(null); setDialog('auth'); }
    setAuthReady(true);
  }, [loadPrefs]);

  // --- 在线状态 ---
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  // --- 拉取：云端 tasks + 旁路 meta 并行，失败回退本地缓存 ---
  const refresh = useCallback(async () => {
    if (!userRef.current) { dispatch({ type: 'loading', value: false }); return; }
    dispatch({ type: 'loading', value: true });
    try {
      const [rawTasks, metaMap] = await Promise.all([tasksApi.list(), metaApi.list()]);
      const base = rawTasks.map(normalizeBaseTask);
      const tasks = mergeProTasks(base, metaMap);
      dispatch({ type: 'hydrate', tasks, metaMap });
      revRef.current.clear(); // hydrate 带来服务端最新 rev，本地推进值作废
      writeScoped(uidOf(userRef.current), KEYS.cache, { tasks, metaMap, savedAt: Date.now() });
    } catch (err) {
      const cache = readScoped<{ tasks?: ProTask[]; metaMap?: MetaMap }>(uidOf(userRef.current), KEYS.cache, {});
      if (cache.tasks?.length) {
        dispatch({ type: 'hydrate', tasks: cache.tasks, metaMap: cache.metaMap ?? {} });
        dispatch({ type: 'error', value: isNetworkError(err) ? '当前离线，展示本地缓存' : '同步失败，展示本地缓存' });
      } else {
        dispatch({ type: 'error', value: err instanceof ApiError ? err.message : '加载失败' });
      }
    }
  }, []);

  useEffect(() => {
    if (authReady && user?.token) { void refresh(); }
    else if (authReady) {
      // 未登录时也要结束 loading，否则清单永远停在骨架屏，且登录框被关掉后无法恢复
      dispatch({ type: 'loading', value: false });
    }
  }, [authReady, user?.token, refresh]);

  // 回到页面 / 切回标签时对齐原版的改动（替代旧版 60s 无条件全量重渲染）
  useEffect(() => {
    const onFocus = () => { if (userRef.current?.token) void refresh(); };
    const onVisible = () => { if (document.visibilityState === 'visible') onFocus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  // --- 离线写队列 ---
  const enqueue = useCallback((op: Omit<SyncOp, 'id' | 'createdAt' | 'retries'>) => {
    const list = readScoped<SyncOp[]>(uidOf(userRef.current), KEYS.outbox, []);
    list.push({ ...op, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now(), retries: 0 });
    writeScoped(uidOf(userRef.current), KEYS.outbox, list);
    toast.info('当前离线，改动已暂存，联网后自动同步');
  }, []);

  const flushOutbox = useCallback(async () => {
    const id = uidOf(userRef.current);
    const ops = readScoped<SyncOp[]>(id, KEYS.outbox, []);
    if (!ops.length) return;
    const rest: SyncOp[] = [];
    // 离线新建的任务是负数临时 id；create 成功后把后续 update/delete/meta 重定向到真实 id
    const idMap = new Map<number, number>();
    for (const op of ops) {
      try {
        if (op.kind === 'create') {
          const p = op.payload as { text: string; dueDate: string | null };
          const created = await tasksApi.create(p.text, p.dueDate);
          const temp = Number(op.tempId);
          const real = Number(created[0]?.id);
          if (Number.isFinite(temp) && Number.isInteger(real) && real > 0) idMap.set(temp, real);
        } else if (op.kind === 'update') {
          const p = op.payload as { id: number; patch: Partial<BaseTask> };
          await tasksApi.update(idMap.get(p.id) ?? p.id, p.patch);
        } else if (op.kind === 'delete' && op.taskId) {
          await tasksApi.remove(idMap.get(op.taskId) ?? op.taskId);
        } else if (op.kind === 'meta') {
          const p = op.payload as { id: number; patch: Partial<ProMeta> };
          const realId = idMap.get(p.id) ?? p.id;
          if (!Number.isInteger(realId) || realId <= 0) {
            rest.push({ ...op, retries: op.retries + 1 });
            continue;
          }
          const rev = revRef.current.get(realId) ?? stateRef.current.metaMap[String(realId)]?.rev ?? 0;
          await metaApi.put(realId, rev, wireMetaPatch(p.patch));
        }
      } catch {
        rest.push({ ...op, retries: op.retries + 1 });
      }
    }
    writeScoped(id, KEYS.outbox, rest);
    await refresh();
    if (rest.length < ops.length) toast.success(`已同步 ${ops.length - rest.length} 条离线改动`);
  }, [refresh]);

  useEffect(() => {
    if (!offline && user?.token) void flushOutbox();
  }, [offline, user?.token, flushOutbox]);

  // --- 通用回滚辅助 ---
  const rollback = useCallback((snapshot: ProTask[], err: unknown) => {
    dispatch({ type: 'setAll', tasks: snapshot });
    toast.error(err instanceof ApiError ? err.message : '操作失败，已恢复');
    void refresh();
  }, [refresh]);

  // --- 任务操作 ---
  // patchMeta 用 ref 打破与 patchTask（完成时写 completedAt）的循环依赖
  const patchMetaRef = useRef<(id: number, patch: Partial<ProMeta>) => Promise<void>>(async () => {});

  const addTask = useCallback(async (text: string, dueDate: string | null, meta: Partial<ProMeta> = {}): Promise<boolean> => {
    const clean = text.trim();
    if (!clean) return false;
    const tempId = -Date.now();
    const optimistic: ProTask = {
      id: tempId, text: clean, completed: false, dueDate, isPinned: false,
      createdAt: new Date().toISOString(), updatedAt: null, meta: makeMeta(meta),
    };
    dispatch({ type: 'add', task: optimistic });
    // 带上 tempId：联网补传时把后续 meta 操作重定向到真实 id
    if (offline) { enqueue({ kind: 'create', tempId: String(tempId), payload: { text: clean, dueDate } }); return true; }
    try {
      // 保留 Coze 智能分点：一次输入可能返回多条
      const created = await tasksApi.create(clean, dueDate);
      const real = created.map((raw) => ({ ...normalizeBaseTask(raw), meta: makeMeta(meta) } as ProTask));
      dispatch({ type: 'replaceTemp', tempId, tasks: real });
      if (Object.keys(meta).length) {
        for (const t of real) {
          try {
            const r = await metaApi.put(t.id, 0, metaPatch(meta as ProMeta));
            dispatch({ type: 'setRev', id: t.id, rev: r.rev });
          } catch { /* meta 失败不阻塞主流程 */ }
        }
      }
      return true;
    } catch (err) {
      dispatch({ type: 'remove', id: tempId });
      toast.error(err instanceof ApiError ? err.message : '添加失败');
      return false;
    }
  }, [offline, enqueue]);

  const patchTask = useCallback(async (id: number, patch: Partial<BaseTask>) => {
    const snapshot = stateRef.current.tasks;
    dispatch({ type: 'patch', id, patch });
    if (offline) { enqueue({ kind: 'update', payload: { id, patch } }); return; }
    try {
      const raw = await tasksApi.update(id, patch);
      const normalized = normalizeBaseTask(raw);
      dispatch({ type: 'patch', id, patch: normalized });
      // 完成时记录 completedAt（用于迟交判定）
      if (patch.completed !== undefined) {
        await patchMetaRef.current(id, { completedAt: patch.completed ? new Date().toISOString() : null });
      }
    } catch (err) { rollback(snapshot, err); }
  }, [offline, enqueue, rollback]);

  const patchMetaNow = useCallback(async (id: number, patch: Partial<ProMeta>) => {
    if (offline) { enqueue({ kind: 'meta', payload: { id, patch } }); return; }
    // undefined 字段必须显式传 null，否则 JSON.stringify 丢键，服务端不会清除该字段
    const wire = wireMetaPatch(patch);
    const send = async (rev: number) => {
      const res = await metaApi.put(id, rev, wire);
      const nextRev = Number(res.rev) || 0;
      revRef.current.set(id, nextRev);
      dispatch({ type: 'setRev', id, rev: nextRev });
    };
    try {
      const rev = revRef.current.get(id) ?? stateRef.current.metaMap[String(id)]?.rev ?? 0;
      await send(rev);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // 只重读版本号重试同一 patch，绝不整体 refresh —— 那会覆盖用户正在输入的内容
        try {
          const all = await metaApi.list();
          await send(Number(all[String(id)]?.rev) || 0);
        } catch {
          toast.error('保存冲突，请稍后重试');
          void refresh();
        }
      } else {
        toast.error(err instanceof ApiError ? err.message : '保存失败');
      }
    }
  }, [offline, enqueue, refresh]);

  const patchMeta = useCallback((id: number, patch: Partial<ProMeta>): Promise<void> => {
    // 乐观更新立即生效；写请求排队，保证后一次拿到前一次的新 rev
    dispatch({ type: 'patchMeta', id, patch });
    const prev = metaQueues.current.get(id) ?? Promise.resolve();
    const next = prev.then(() => patchMetaNow(id, patch));
    metaQueues.current.set(id, next);
    void next.catch(() => undefined).finally(() => {
      if (metaQueues.current.get(id) === next) metaQueues.current.delete(id);
    });
    return next;
  }, [patchMetaNow]);
  patchMetaRef.current = patchMeta;

  const toggleDone = useCallback((id: number) => {
    const t = stateRef.current.tasks.find((x) => x.id === id);
    const willComplete = !t?.completed;
    // 重复作业：完成后只在**本地**生成下一条草稿，用户确认才创建，不写服务端 cron，
    // 避免与原版数据互通时产生重复条目。
    if (willComplete && t?.meta.repeat) {
      const nextDay = expandRepeat(t.meta.repeat, todayKey(), 1)[0];
      if (nextDay) {
        const source = t;
        toast('这是重复作业，要生成下一条吗？', {
          duration: 12_000,
          action: {
            label: '生成下一条',
            onClick: () => void addTask(source.text, dayEndIso(nextDay), {
              ...source.meta, completedAt: null, rev: 0,
            }),
          },
        });
      }
    }
    return patchTask(id, { completed: willComplete });
  }, [patchTask, addTask]);

  const togglePin = useCallback(async (id: number) => {
    const snapshot = stateRef.current.tasks;
    const t = snapshot.find((x) => x.id === id);
    const next = !t?.isPinned;
    // 用 PUT 设置目标值，而不是旧版「NOT toggle」的非幂等语义
    return patchTask(id, { isPinned: next });
  }, [patchTask]);

  /** 延迟提交删除 + 8 秒撤销；零服务端中间态，避免两版显示不一致 */
  const removeTask = useCallback((id: number) => {
    const task = stateRef.current.tasks.find((t) => t.id === id);
    if (!task) return;
    dispatch({ type: 'remove', id });
    const uid = uidOf(userRef.current);
    const nextRecycle = [task, ...readScoped<ProTask[]>(uid, KEYS.recycle, [])].slice(0, 50);
    setRecycle(nextRecycle);
    writeScoped(uid, KEYS.recycle, nextRecycle);

    const timer = window.setTimeout(() => {
      pendingDeletes.current.delete(id);
      setUndo((prev) => (prev === doUndo ? null : prev));
      void (async () => {
        try {
          await tasksApi.remove(id);
          await metaApi.remove(id).catch(() => undefined);
        } catch { toast.error('删除未同步到云端，请检查网络'); }
      })();
    }, 8000);

    const doUndo = () => {
      const pending = pendingDeletes.current.get(id);
      if (!pending) return;
      window.clearTimeout(pending.timer);
      pendingDeletes.current.delete(id);
      dispatch({ type: 'restore', task: pending.task });
      // 撤销后回收站里的副本也要移除，否则再点「恢复」会生成一条重复作业
      const next = readScoped<ProTask[]>(uid, KEYS.recycle, []).filter((t) => t.id !== id);
      setRecycle(next);
      writeScoped(uid, KEYS.recycle, next);
      setUndo(null);
      toast.success('已撤销删除');
    };
    pendingDeletes.current.set(id, { timer, task });
    setUndo(() => doUndo);
    toast('已删除', { action: { label: '撤销', onClick: doUndo } });
  }, []);

  const batchDelete = useCallback(async (ids: number[]) => {
    const snapshot = stateRef.current.tasks;
    const targets = validIds(ids, snapshot);
    if (!targets.length) return;
    dispatch({ type: 'setAll', tasks: snapshot.filter((t) => !targets.includes(t.id)) });
    const result = await runBatch(targets, async (id) => {
      await tasksApi.remove(id);
      await metaApi.remove(id).catch(() => undefined);
    }, 4);
    if (result.failed.length) {
      toast.error(`${result.failed.length} 条删除失败，已重新同步`);
      void refresh();
    } else {
      toast.success(`已删除 ${targets.length} 项`);
      void refresh(); // 与云端对账，避免本地乐观值与服务端漂移
    }
  }, [refresh]);

  /** 真正的「批量设为置顶/取消置顶」，不再是逐条 toggle */
  const batchPin = useCallback(async (ids: number[], value: boolean) => {
    const snapshot = stateRef.current.tasks;
    const targets = validIds(ids, snapshot);
    if (!targets.length) return;
    dispatch({ type: 'setAll', tasks: snapshot.map((t) => (targets.includes(t.id) ? { ...t, isPinned: value } : t)) });
    const result = await runBatch(targets, (id) => tasksApi.update(id, { isPinned: value }), 4);
    if (result.failed.length) { toast.error(`${result.failed.length} 条失败，已重新同步`); void refresh(); }
    else toast.success(`已${value ? '置顶' : '取消置顶'} ${targets.length} 项`);
  }, [refresh]);

  const batchReschedule = useCallback(async (ids: number[], mode: DateMode, value: string) => {
    const valid = validIds(ids, stateRef.current.tasks);
    const targets = stateRef.current.tasks.filter((t) => valid.includes(t.id));
    const { updates, skipped } = buildBatchDateUpdates(targets, value, mode, combineDateMode);
    const snapshot = stateRef.current.tasks;
    dispatch({
      type: 'setAll',
      tasks: snapshot.map((t) => {
        const hit = updates.find((u) => u.id === t.id);
        return hit ? { ...t, dueDate: hit.dueDate } : t;
      }),
    });
    const result = await runBatch(updates, (u) => tasksApi.update(u.id, { dueDate: u.dueDate }), 4);
    if (result.failed.length) { toast.error(`${result.failed.length} 条改期失败，已重新同步`); void refresh(); }
    else toast.success(`已改期 ${updates.length} 项${skipped ? `，跳过 ${skipped} 项` : ''}`);
    return { ok: result.ok.length, skipped, failed: result.failed.length };
  }, [refresh]);

  const importText = useCallback(async (text: string, dueDate: string | null = null): Promise<boolean> => {
    const parsed = parseImportText(text);
    if (parsed.error || !parsed.lines.length) { toast.error(parsed.error ?? '没有可导入的作业'); return false; }
    try {
      const created = await tasksApi.importLines(parsed.lines, dueDate);
      const tasks = created.map((raw) => ({ ...normalizeBaseTask(raw), meta: makeMeta() } as ProTask));
      dispatch({ type: 'setAll', tasks: [...tasks, ...stateRef.current.tasks] });
      toast.success(`已导入 ${tasks.length} 条作业`);
      return true;
    } catch (err) {
      // 返回 false：调用方保留粘贴的原文，用户可以重试，不会白输一遍
      toast.error(err instanceof ApiError ? err.message : '导入失败');
      return false;
    }
  }, []);

  const importPlan = useCallback(async (
    items: { text: string; dueDate: string | null }[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<{ created: number; failed: number }> => {
    let ok = 0;
    // 单条写入在 Neon 冷启动下要 2s+，排期一次十几条，并发开大一点省一半时间
    const created = await runBatch(items, (i) => tasksApi.create(i.text, i.dueDate), 6, onProgress);
    for (const { result } of created.ok) {
      const tasks = result.map((raw) => ({ ...normalizeBaseTask(raw), meta: makeMeta() } as ProTask));
      dispatch({ type: 'setAll', tasks: [...tasks, ...stateRef.current.tasks] });
      ok += tasks.length;
    }
    if (created.failed.length) toast.error(`${created.failed.length} 条排期写入失败`);
    else toast.success(`排期已写入 ${ok} 条作业`);
    return { created: ok, failed: created.failed.length };
  }, []);

  const restoreFromRecycle = useCallback(async (task: ProTask) => {
    await addTask(task.text, task.dueDate, task.meta);
    const uid = uidOf(userRef.current);
    const next = recycle.filter((t) => t !== task);
    setRecycle(next);
    writeScoped(uid, KEYS.recycle, next);
  }, [addTask, recycle]);

  const clearRecycle = useCallback(() => {
    setRecycle([]);
    writeScoped(uidOf(userRef.current), KEYS.recycle, []);
  }, []);

  // --- 身份 ---
  const applyUser = useCallback((u: UserInfo) => {
    localStorage.setItem('homeworkUser', JSON.stringify(u));
    userRef.current = u; // refresh() 读 ref，必须同步更新，否则首屏拉不到数据
    setUser(u);
    setApiAuth(u.token || '', u.id);
    loadPrefs(u);
    setDialog(null);
    void refresh();
  }, [loadPrefs, refresh]);

  const login = useCallback(async (u: string, p: string) => {
    try { applyUser(await authApi.login(u, p)); toast.success('登录成功'); return true; }
    catch (err) { toast.error(err instanceof ApiError ? err.message : '登录失败'); return false; }
  }, [applyUser]);

  const register = useCallback(async (u: string, p: string) => {
    try { applyUser(await authApi.register(u, p)); toast.success('注册成功'); return true; }
    catch (err) { toast.error(err instanceof ApiError ? err.message : '注册失败'); return false; }
  }, [applyUser]);

  const logout = useCallback(() => {
    // 切换账号前清掉待提交的删除定时器，否则会用新凭证去删旧账号的 id
    for (const { timer } of pendingDeletes.current.values()) window.clearTimeout(timer);
    pendingDeletes.current.clear();
    setUndo(null);
    revRef.current.clear();
    clearUserData(uidOf(userRef.current));
    localStorage.removeItem('homeworkUser');
    setApiAuth('', null);
    setUser(null);
    dispatch({ type: 'hydrate', tasks: [], metaMap: {} });
    setDialog('auth');
    toast('已退出登录');
  }, []);

  // --- 派生数据 ---
  const filtered = useMemo(
    () => filterTasks(state.tasks, filter),
    [state.tasks, filter],
  );
  const groups = useMemo(() => {
    if (groupBy === 'subject') return groupBySubject(filtered);
    if (groupBy === 'priority') return groupByPriority(filtered);
    return groupByTime(filtered);
  }, [filtered, groupBy]);
  const board = useMemo(() => boardGroups(filtered, boardBy), [filtered, boardBy]);
  const stats = useMemo(() => summary(state.tasks), [state.tasks]);

  // 筛选/任务变化后清掉不可见的选择，避免「全选」或残留 id 误删用户看不到的作业
  useEffect(() => {
    const visible = new Set(filtered.map((t) => t.id));
    const current = selectionRef.current;
    if ([...current].every((id) => visible.has(id))) return;
    setSelection(new Set([...current].filter((id) => visible.has(id))));
  }, [filtered]);

  const openDialog = useCallback((d: DialogName, payload?: unknown) => {
    setDialog(d);
    setDialogPayload(payload ?? null);
  }, []);
  const closeDialog = useCallback(() => { setDialog(null); setDialogPayload(null); }, []);

  const value: ProContextValue = {
    user, authReady, login, register, logout,
    tasks: state.tasks, loading: state.loading, error: state.error, offline, refresh,
    addTask, patchTask, patchMeta, removeTask, toggleDone, togglePin,
    batchDelete, batchPin, batchReschedule, importText, importPlan,
    layout, setLayout, focusTaskId, setFocusTaskId,
    view, setView, groupBy, setGroupBy, boardBy, setBoardBy,
    filter, setFilter, settings, setSettings,
    dialog, openDialog, closeDialog, dialogPayload,
    selection, setSelection, detailId, setDetailId,
    recycle, restoreFromRecycle, clearRecycle, undo,
    filtered, groups, board, stats,
  };

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

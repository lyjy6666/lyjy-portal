/**
 * 按用户隔离的本地存储。
 *
 * 旧版登出只清 homeworkUser 和 tasks，不清排期草稿 / 视图偏好 / 教程标记，
 * 同一浏览器换账号后会串号。这里所有 key 都带 uid 前缀，登出一次性清空。
 */

export const LEGACY_KEYS = {
  planner: 'homeworkPlannerStateV2',
  view: 'homeworkListView',
  tour: 'homeworkTourDone',
} as const;

export const KEYS = {
  skin: 'skin',
  view: 'view',
  groupBy: 'groupBy',
  filter: 'filter',
  tour: 'tour',
  planner: 'planner',
  templates: 'templates',
  cache: 'cache',
  outbox: 'outbox',
  recycle: 'recycle',
  settings: 'settings',
  focusDay: 'focusDay',
  createPanel: 'createPanel',
  focusMinutes: 'focusMinutes',
} as const;

function prefix(uid: number | string): string {
  return `homeworkPro:${uid}:`;
}

export function scopedKey(uid: number | string, name: string): string {
  return `${prefix(uid)}${name}`;
}

export function readScoped<T>(uid: number | string, name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(scopedKey(uid, name));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeScoped<T>(uid: number | string, name: string, value: T): boolean {
  try {
    localStorage.setItem(scopedKey(uid, name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeScoped(uid: number | string, name: string): void {
  try { localStorage.removeItem(scopedKey(uid, name)); } catch { /* 忽略 */ }
}

/** 登出时清空该用户的全部本地数据（不动其它 uid，也不动原版的 legacy key） */
export function clearUserData(uid: number | string): void {
  try {
    const p = prefix(uid);
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(p)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* 忽略 */ }
}

/**
 * legacy 偏好「复制迁移」：原版仍在用这些 key，所以只复制、绝不删除。
 * 返回是否发生了迁移，便于只在首次执行。
 */
export function migrateLegacy(uid: number | string): boolean {
  try {
    let changed = false;
    const copy = (legacy: string, target: string) => {
      if (localStorage.getItem(scopedKey(uid, target)) !== null) return;
      const raw = localStorage.getItem(legacy);
      if (raw === null) return;
      localStorage.setItem(scopedKey(uid, target), JSON.stringify(raw));
      changed = true;
    };
    copy(LEGACY_KEYS.planner, KEYS.planner);
    copy(LEGACY_KEYS.view, KEYS.view);
    copy(LEGACY_KEYS.tour, KEYS.tour);
    if (changed) localStorage.setItem(scopedKey(uid, 'legacyMigrated'), JSON.stringify(true));
    return changed;
  } catch {
    return false;
  }
}

export function hasMigratedLegacy(uid: number | string): boolean {
  return readScoped<boolean>(uid, 'legacyMigrated', false) === true;
}

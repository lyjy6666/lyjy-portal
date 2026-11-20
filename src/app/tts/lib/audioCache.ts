// 轻量 IndexedDB 封装：历史音频本地缓存（无第三方依赖）。
// 设计原则：任何异常都静默降级——返回 null / 空操作，由调用方回退到"仅存文本"的原行为。

const DB_NAME = 'lyjy-tts-audio-cache';
const DB_VERSION = 1;
const STORE = 'audio';
const MAX_CACHE = 20;

interface CachedAudio {
  id: string;
  dataUrl: string;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

function getStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore | null {
  try {
    return db.transaction(STORE, mode).objectStore(STORE);
  } catch {
    return null;
  }
}

/** 写入音频缓存，并淘汰超出上限的最旧记录。失败时静默返回。 */
export async function putAudio(id: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDb();
    if (!db) return;
    const store = getStore(db, 'readwrite');
    if (!store) return;
    await new Promise<void>((resolve) => {
      try {
        const req = store.put({ id, dataUrl, createdAt: Date.now() } as CachedAudio);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
    await prune(db);
  } catch {
    // QuotaExceeded / IDB 不可用：静默降级
  }
}

/** 读取缓存；无缓存或任何异常返回 null。 */
export async function getAudio(id: string): Promise<string | null> {
  try {
    const db = await openDb();
    if (!db) return null;
    const store = getStore(db, 'readonly');
    if (!store) return null;
    return await new Promise<string | null>((resolve) => {
      try {
        const req = store.get(id);
        req.onsuccess = () => {
          const rec = req.result as CachedAudio | undefined;
          resolve(rec && typeof rec.dataUrl === 'string' ? rec.dataUrl : null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/** 删除单条缓存。 */
export async function deleteAudio(id: string): Promise<void> {
  try {
    const db = await openDb();
    if (!db) return;
    const store = getStore(db, 'readwrite');
    if (!store) return;
    await new Promise<void>((resolve) => {
      try {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // 静默
  }
}

/** 清空全部缓存。 */
export async function clearAudio(): Promise<void> {
  try {
    const db = await openDb();
    if (!db) return;
    const store = getStore(db, 'readwrite');
    if (!store) return;
    await new Promise<void>((resolve) => {
      try {
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // 静默
  }
}

async function prune(db: IDBDatabase): Promise<void> {
  try {
    const store = getStore(db, 'readonly');
    if (!store) return;
    const all = await new Promise<CachedAudio[]>((resolve) => {
      try {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result || []) as CachedAudio[]);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
    if (all.length <= MAX_CACHE) return;
    const oldest = all
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, all.length - MAX_CACHE);
    const writeStore = getStore(db, 'readwrite');
    if (!writeStore) return;
    await new Promise<void>((resolve) => {
      let pending = oldest.length;
      if (pending === 0) {
        resolve();
        return;
      }
      for (const rec of oldest) {
        try {
          const req = writeStore.delete(rec.id);
          req.onsuccess = () => { if (--pending === 0) resolve(); };
          req.onerror = () => { if (--pending === 0) resolve(); };
        } catch {
          if (--pending === 0) resolve();
        }
      }
    });
  } catch {
    // 静默
  }
}

// IndexedDB wrapper for offline POS — Item 19
// Minimal, no external library.

const DB_NAME = 'tshastho-offline';
const DB_VERSION = 1;

export interface PendingSale {
  id: string;            // client UUID
  payload: unknown;      // original POS sale request body
  createdAt: number;
  attempts: number;
  lastError?: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}

export interface MetaRecord {
  key: string;
  value: unknown;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pending_sales')) {
        const store = db.createObjectStore('pending_sales', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('status', 'status');
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const req = fn(s);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// ===== pending_sales =====

export async function enqueueSale(sale: PendingSale): Promise<void> {
  await tx('pending_sales', 'readwrite', (s) => s.put(sale));
}

export async function getPendingSale(id: string): Promise<PendingSale | undefined> {
  return tx('pending_sales', 'readonly', (s) => s.get(id));
}

export async function getAllPending(): Promise<PendingSale[]> {
  return tx('pending_sales', 'readonly', (s) => s.getAll());
}

export async function getPendingCount(): Promise<number> {
  return tx('pending_sales', 'readonly', (s) => s.count());
}

export async function removePending(id: string): Promise<void> {
  await tx('pending_sales', 'readwrite', (s) => s.delete(id));
}

export async function updatePending(id: string, patch: Partial<PendingSale>): Promise<void> {
  const existing = await getPendingSale(id);
  if (!existing) return;
  await enqueueSale({ ...existing, ...patch });
}

// ===== meta =====

export async function getMeta<T = unknown>(key: string): Promise<T | undefined> {
  const rec = await tx<MetaRecord | undefined>('meta', 'readonly', (s) => s.get(key));
  return rec?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await tx('meta', 'readwrite', (s) => s.put({ key, value }));
}

// ===== misc =====

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'off-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

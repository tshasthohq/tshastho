const store = new Map<string, { exp: number; val: unknown }>();

export async function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.exp > Date.now()) return hit.val as T;
  const val = await fn();
  store.set(key, { exp: Date.now() + ttlMs, val });
  return val;
}

export const clearMemo = (key?: string) => (key ? store.delete(key) : store.clear());

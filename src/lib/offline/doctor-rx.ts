import { rxPut, rxAll, rxDelete, getMeta, setMeta, uuid } from '@/lib/offline/db';

const URL_RX = '/api/doctor/local-prescriptions';
const send = (payload: unknown) =>
  fetch(URL_RX, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });

async function queue(payload: unknown): Promise<Response> {
  await rxPut({ id: uuid(), payload, createdAt: Date.now(), status: 'PENDING' });
  return new Response(JSON.stringify({ queued: true }), { status: 202 });
}

export async function postLocalRx(payload: unknown): Promise<Response> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return queue(payload);
  try { return await send(payload); } catch { return queue(payload); }
}

export async function cachedGet(url: string): Promise<Response> {
  const key = 'cache:' + url;
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) { try { await setMeta(key, await res.clone().json()); } catch {} }
    return res;
  } catch (e) {
    const d = await getMeta<unknown>(key);
    if (d !== undefined) return new Response(JSON.stringify(d), { status: 200, headers: { 'Content-Type': 'application/json' } });
    throw e;
  }
}

let running = false;
export async function syncPendingRx() {
  if (running) return { synced: 0, failed: 0, remaining: (await rxAll()).length };
  running = true;
  let synced = 0, failed = 0;
  try {
    const all = (await rxAll()).sort((a, b) => a.createdAt - b.createdAt);
    for (const r of all) {
      if (r.status === 'FAILED') { failed++; continue; }
      try {
        const res = await send(r.payload);
        if (res.ok) { await rxDelete(r.id); synced++; }
        else if (res.status === 401 || res.status >= 500) break;
        else { await rxPut({ ...r, status: 'FAILED', lastError: 'HTTP ' + res.status }); failed++; }
      } catch { break; }
    }
  } finally { running = false; }
  return { synced, failed, remaining: (await rxAll()).length };
}

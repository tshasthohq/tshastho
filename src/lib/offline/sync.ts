// Sync engine — replays pending offline sales — Item 19
import {
  getAllPending,
  updatePending,
  removePending,
  getPendingCount,
  type PendingSale,
} from './db';

const MAX_ATTEMPTS = 5;

export interface SyncResult {
  attempted: number;
  succeeded: number;
  failed: number;
  remaining: number;
  details: Array<{ id: string; ok: boolean; error?: string }>;
}

async function postSale(payload: unknown, clientId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/pharmacy/pos/sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-sale-id': clientId,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok || res.status === 409) {
      // 409 = already synced (idempotency hit)
      return { ok: true };
    }
    const text = await res.text().catch(() => '');
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function syncPendingSales(): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { attempted: 0, succeeded: 0, failed: 0, remaining: await getPendingCount(), details: [] };
  }

  const all = await getAllPending();
  const targets = all.filter((s) => s.status !== 'FAILED' || s.attempts < MAX_ATTEMPTS);
  const result: SyncResult = {
    attempted: targets.length,
    succeeded: 0,
    failed: 0,
    remaining: 0,
    details: [],
  };

  for (const sale of targets) {
    await updatePending(sale.id, { status: 'SYNCING' });
    const r = await postSale(sale.payload, sale.id);
    if (r.ok) {
      await removePending(sale.id);
      result.succeeded += 1;
      result.details.push({ id: sale.id, ok: true });
    } else {
      const attempts = sale.attempts + 1;
      await updatePending(sale.id, {
        status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
        attempts,
        lastError: r.error,
      });
      result.failed += 1;
      result.details.push({ id: sale.id, ok: false, error: r.error });
    }
  }

  result.remaining = await getPendingCount();
  return result;
}

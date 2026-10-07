// POS sale submit with offline fallback — Item 19
import { enqueueSale, uuid } from './db';

export interface SubmitResult {
  ok: boolean;
  status: number;
  queued?: boolean;
  json: () => Promise<unknown>;
}

export async function submitPosSale(body: unknown): Promise<SubmitResult> {
  const clientId = uuid();

  // Offline check first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      await enqueueSale({
        id: clientId,
        payload: body,
        createdAt: Date.now(),
        attempts: 0,
        status: 'PENDING',
      });
      return {
        ok: true,
        status: 202,
        queued: true,
        json: async () => ({ success: true, queued: true, clientSaleId: clientId }),
      };
    } catch {
      // Fall through to online attempt
    }
  }

  try {
    const res = await fetch('/api/pharmacy/pos/sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-sale-id': clientId,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, json: () => res.json() };
  } catch (err) {
    // Network failed — queue locally
    try {
      await enqueueSale({
        id: clientId,
        payload: body,
        createdAt: Date.now(),
        attempts: 0,
        status: 'PENDING',
        lastError: err instanceof Error ? err.message : 'network',
      });
      return {
        ok: true,
        status: 202,
        queued: true,
        json: async () => ({ success: true, queued: true, clientSaleId: clientId }),
      };
    } catch (innerErr) {
      return {
        ok: false,
        status: 0,
        json: async () => ({
          success: false,
          message: innerErr instanceof Error ? innerErr.message : 'offline queue failed',
        }),
      };
    }
  }
}

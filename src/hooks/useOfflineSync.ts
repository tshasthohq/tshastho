'use client';

// Offline sync hook — Item 19
import { useCallback, useEffect, useState } from 'react';
import { getPendingCount } from '@/lib/offline/db';
import { syncPendingSales } from '@/lib/offline/sync';

export interface OfflineState {
  online: boolean;
  pending: number;
  syncing: boolean;
  lastSync?: number;
  lastError?: string;
}

export function useOfflineSync(autoIntervalMs = 30_000) {
  const [state, setState] = useState<OfflineState>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pending: 0,
    syncing: false,
  });

  const refreshCount = useCallback(async () => {
    try {
      const n = await getPendingCount();
      setState((s) => ({ ...s, pending: n }));
    } catch { /* IDB not ready */ }
  }, []);

  const runSync = useCallback(async () => {
    setState((s) => ({ ...s, syncing: true }));
    try {
      const r = await syncPendingSales();
      setState((s) => ({
        ...s,
        pending: r.remaining,
        syncing: false,
        lastSync: Date.now(),
        lastError: r.failed > 0 ? `${r.failed} failed` : undefined,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        syncing: false,
        lastError: err instanceof Error ? err.message : 'sync error',
      }));
    }
  }, []);

  useEffect(() => {
    refreshCount();

    const onOnline = () => {
      setState((s) => ({ ...s, online: true }));
      runSync();
    };
    const onOffline = () => setState((s) => ({ ...s, online: false }));

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const t = setInterval(() => {
      if (navigator.onLine) runSync();
    }, autoIntervalMs);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(t);
    };
  }, [autoIntervalMs, refreshCount, runSync]);

  return { ...state, runSync, refreshCount };
}

'use client';

// Offline / pending-sync indicator — Item 19
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function OfflineIndicator() {
  const { online, pending, syncing, runSync, lastError } = useOfflineSync();

  if (online && pending === 0 && !syncing) return null;

  const bg = !online
    ? 'bg-red-50 border-red-300 text-red-800'
    : syncing
    ? 'bg-blue-50 border-blue-300 text-blue-800'
    : 'bg-yellow-50 border-yellow-300 text-yellow-800';

  return (
    <div className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${bg}`}>
      {!online && <span className="font-medium">● Offline — sales queued ({pending})</span>}
      {online && syncing && <span className="font-medium">⟳ Syncing…</span>}
      {online && !syncing && pending > 0 && (
        <span className="font-medium">{pending} pending sync</span>
      )}
      {lastError && <span className="text-xs opacity-80">({lastError})</span>}
      {online && pending > 0 && !syncing && (
        <button
          type="button"
          onClick={runSync}
          className="ml-auto rounded bg-white/60 px-2 py-1 text-xs font-medium hover:bg-white"
        >
          Sync now
        </button>
      )}
    </div>
  );
}

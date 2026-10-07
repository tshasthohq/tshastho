'use client';

// List of drug-recall matches with status actions.
// Item 17

import { useEffect, useState, useCallback } from 'react';

interface Recall {
  id: string;
  source: string;
  drugName: string;
  genericName: string | null;
  batchNumbers: string[];
  manufacturer: string | null;
  reason: string | null;
  severity: string;
  recallDate: string | null;
  sourceUrl: string | null;
}

interface Match {
  id: string;
  matchType: string;
  quantity: number;
  status: string;
  notes: string | null;
  createdAt: string;
  recall: Recall;
  batch: { id: string; batchNumber: string; expiryDate: string | null; quantity: number } | null;
}

interface Props {
  pharmacyId: string;
}

const SEV_COLOR: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const ST_COLOR: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800',
  ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

export default function RecallMatchList({ pharmacyId }: Props) {
  const [items, setItems] = useState<Match[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [busyId, setBusyId] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/pharmacy/recalls?${params.toString()}`);
      const json = await res.json();
      if (json?.success) {
        setItems(json.items ?? []);
        setTotal(json.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/pharmacy/recalls/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json?.success) await load();
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <span className="text-sm text-gray-600">{total} match{total !== 1 ? 'es' : ''}</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No recall matches found.</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{m.recall.drugName}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SEV_COLOR[m.recall.severity] ?? 'bg-gray-100 text-gray-700'}`}>
                      {m.recall.severity}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ST_COLOR[m.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {m.status}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      {m.matchType}
                    </span>
                  </div>
                  {m.recall.genericName && (
                    <p className="mt-1 text-xs text-gray-500">Generic: {m.recall.genericName}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-700 space-y-0.5">
                    <p><strong>Source:</strong> {m.recall.source}</p>
                    {m.batch && <p><strong>Your batch:</strong> {m.batch.batchNumber} (Qty: {m.batch.quantity})</p>}
                    {m.recall.batchNumbers.length > 0 && (
                      <p><strong>Recalled batches:</strong> {m.recall.batchNumbers.join(', ')}</p>
                    )}
                    {m.recall.reason && <p><strong>Reason:</strong> {m.recall.reason}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {m.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(m.id, 'ACKNOWLEDGED')}
                      disabled={busyId === m.id}
                      className="rounded-md bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                    >
                      Acknowledge
                    </button>
                  )}
                  {m.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(m.id, 'RESOLVED')}
                      disabled={busyId === m.id}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  )}
                  {m.recall.sourceUrl && (
                    <a
                      href={m.recall.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center text-xs text-blue-600 hover:underline"
                    >
                      Source
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

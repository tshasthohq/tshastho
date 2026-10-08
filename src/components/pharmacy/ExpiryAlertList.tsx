'use client';

import { useCallback, useEffect, useState } from 'react';

interface Item {
  id: string;
  tier: string;
  daysRemaining: number;
  quantity: number;
  expiryDate: string;
  status: string;
  batch: { batchNumber: string; quantity: number } | null;
  medicine: { id: string; name: string; brand: string | null } | null;
}

export default function ExpiryAlertList() {
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState({ T30: 0, T60: 0, T90: 0 });
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (tierFilter) p.set('tier', tierFilter);
      if (statusFilter) p.set('status', statusFilter);
      const res = await fetch(`/api/pharmacy/expiry-alerts?${p}`);
      const j = await res.json();
      if (j?.success) {
        setItems(j.items ?? []);
        setSummary(j.summary ?? { T30: 0, T60: 0, T90: 0 });
      }
    } finally { setLoading(false); }
  }, [tierFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await fetch(`/api/pharmacy/expiry-alerts/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally { setBusy(''); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-700">≤ 30 days</p>
          <p className="text-lg font-semibold text-red-900">{summary.T30}</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-xs text-orange-700">31–60 days</p>
          <p className="text-lg font-semibold text-orange-900">{summary.T60}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700">61–90 days</p>
          <p className="text-lg font-semibold text-yellow-900">{summary.T90}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="rounded-md border px-3 py-1.5 text-sm">
          <option value="">All tiers</option>
          <option value="T30">≤ 30 days</option>
          <option value="T60">31–60 days</option>
          <option value="T90">61–90 days</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="WRITTEN_OFF">Written off</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No expiry alerts.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Medicine</th>
                <th className="px-3 py-2 text-left">Batch</th>
                <th className="px-3 py-2 text-right">Expires</th>
                <th className="px-3 py-2 text-right">Days</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-center">Tier</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{it.medicine?.name ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-600">{it.batch?.batchNumber ?? '-'}</td>
                  <td className="px-3 py-2 text-right">{new Date(it.expiryDate).toLocaleDateString('en-GB')}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${it.daysRemaining <= 30 ? 'text-red-600' : it.daysRemaining <= 60 ? 'text-orange-600' : 'text-yellow-600'}`}>
                    {it.daysRemaining}
                  </td>
                  <td className="px-3 py-2 text-right">{it.quantity}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${it.tier === 'T30' ? 'bg-red-100 text-red-800' : it.tier === 'T60' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {it.tier}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {it.status === 'OPEN' && (
                      <div className="flex justify-center gap-1">
                        <button onClick={() => updateStatus(it.id, 'ACKNOWLEDGED')} disabled={busy === it.id} className="rounded bg-yellow-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-yellow-600 disabled:opacity-50">
                          Ack
                        </button>
                        <button onClick={() => updateStatus(it.id, 'WRITTEN_OFF')} disabled={busy === it.id} className="rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-700 disabled:opacity-50">
                          Write-off
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

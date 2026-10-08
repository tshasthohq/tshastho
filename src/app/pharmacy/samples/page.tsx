'use client';
// Sample Tracker dashboard — Item 37
import { useCallback, useEffect, useState } from 'react';
import ReceiveSampleModal from '@/components/pharmacy/ReceiveSampleModal';
import DistributeSampleModal from '@/components/pharmacy/DistributeSampleModal';

interface Batch {
  id: string;
  batchNumber: string | null;
  expiryDate: string | null;
  quantity: number;
  remaining: number;
  repName: string | null;
  isActive: boolean;
  medicine: { id: string; name: string; brand: string | null } | null;
  supplier: { id: string; name: string } | null;
}

interface Stats {
  totalBatches: number;
  activeBatches: number;
  totalRemaining: number;
  expiringIn30Days: number;
  expiringIn90Days: number;
  totalDistributed: number;
  uniqueDoctorsReached: number;
}

export default function SamplesPage() {
  const [tab, setTab] = useState<'inventory' | 'distributions'>('inventory');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [distributions, setDistributions] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [distributeFor, setDistributeFor] = useState<Batch | null>(null);
  const [expiringFilter, setExpiringFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = expiringFilter ? `?expiringInDays=${expiringFilter}` : '';
      const [b, s, d] = await Promise.all([
        fetch(`/api/pharmacy/samples${qs}`).then((r) => r.json()),
        fetch('/api/pharmacy/samples/stats').then((r) => r.json()),
        fetch('/api/pharmacy/samples/distributions?limit=50').then((r) => r.json()),
      ]);
      if (b?.success) setBatches(b.items ?? []);
      if (s?.success) setStats(s.stats);
      if (d?.success) setDistributions(d.items ?? []);
    } finally { setLoading(false); }
  }, [expiringFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sample Medicine Tracker</h1>
          <p className="text-sm text-gray-500">Track received free samples + distributions to doctors</p>
        </div>
        <button type="button" onClick={() => setShowReceive(true)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Receive Sample
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Active Batches</p>
            <p className="text-xl font-bold">{stats.activeBatches}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs text-emerald-700">Total Remaining</p>
            <p className="text-xl font-bold text-emerald-900">{stats.totalRemaining}</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-xs text-yellow-700">Expiring ≤ 30d</p>
            <p className="text-xl font-bold text-yellow-900">{stats.expiringIn30Days}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-700">Doctors Reached</p>
            <p className="text-xl font-bold text-blue-900">{stats.uniqueDoctorsReached}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        <button type="button" onClick={() => setTab('inventory')} className={`rounded-t-md px-3 py-2 text-sm font-medium ${tab === 'inventory' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600'}`}>
          Inventory ({batches.length})
        </button>
        <button type="button" onClick={() => setTab('distributions')} className={`rounded-t-md px-3 py-2 text-sm font-medium ${tab === 'distributions' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600'}`}>
          Distributions ({distributions.length})
        </button>
      </div>

      {tab === 'inventory' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Show:</label>
            <select value={expiringFilter} onChange={(e) => setExpiringFilter(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm">
              <option value="">All active</option>
              <option value="30">Expiring ≤ 30 days</option>
              <option value="90">Expiring ≤ 90 days</option>
            </select>
          </div>

          {loading ? <p className="text-sm text-gray-500">Loading…</p>
           : batches.length === 0 ? <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No sample batches</p>
           : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Medicine</th>
                    <th className="px-3 py-2 text-left">Batch</th>
                    <th className="px-3 py-2 text-right">Expires</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Remaining</th>
                    <th className="px-3 py-2 text-left">Rep</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{b.medicine?.name ?? '-'}{b.medicine?.brand && <span className="ml-1 text-xs text-gray-500">({b.medicine.brand})</span>}</td>
                      <td className="px-3 py-2 text-gray-600">{b.batchNumber ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="px-3 py-2 text-right">{b.quantity}</td>
                      <td className="px-3 py-2 text-right font-semibold">{b.remaining}</td>
                      <td className="px-3 py-2 text-xs">{b.repName ?? '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" disabled={!b.isActive || b.remaining <= 0} onClick={() => setDistributeFor(b)} className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:bg-gray-300">
                          Distribute
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'distributions' && (
        distributions.length === 0 ? <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No distributions yet</p>
        : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Doctor</th>
                  <th className="px-3 py-2 text-left">Medicine</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-left">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {distributions.map((d) => {
                  const batch = d.sampleBatch as { medicine?: { name: string } } | undefined;
                  return (
                    <tr key={String(d.id)} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600 text-xs">{new Date(String(d.givenAt)).toLocaleDateString('en-GB')}</td>
                      <td className="px-3 py-2 font-medium">{String(d.doctorName ?? '-')}</td>
                      <td className="px-3 py-2">{batch?.medicine?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{String(d.quantity)}</td>
                      <td className="px-3 py-2 text-xs">{d.feedback ? String(d.feedback) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {showReceive && <ReceiveSampleModal onClose={() => setShowReceive(false)} onSuccess={load} />}
      {distributeFor && (
        <DistributeSampleModal
          sampleBatchId={distributeFor.id}
          medicineName={distributeFor.medicine?.name ?? 'Sample'}
          remaining={distributeFor.remaining}
          onClose={() => setDistributeFor(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

'use client';
// Exchange Medicine dashboard — Item 38
import { useCallback, useEffect, useState } from 'react';
import ExchangeModal from '@/components/pharmacy/ExchangeModal';

interface Exchange {
  id: string;
  returnNumber: string;
  status: string;
  customerName: string;
  customerPhone: string | null;
  totalAmount: number | string;
  exchangeOutAmount: number | string;
  exchangeDifference: number | string;
  exchangeDifferenceMethod: string | null;
  reason: string | null;
  createdAt: string;
  items?: Array<{ medicineName: string; quantity: number; unitPrice: number | string }>;
}

export default function ExchangesPage() {
  const [items, setItems] = useState<Exchange[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/pharmacy/exchanges${qs}`);
      const j = await res.json();
      if (j?.success) { setItems(j.items ?? []); setTotal(j.total ?? 0); }
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'approve' | 'process') => {
    setBusy(id); setMsg('');
    try {
      const res = await fetch(`/api/pharmacy/exchanges/${id}/${action}`, { method: 'POST' });
      const j = await res.json();
      if (j?.success) { setMsg(`✓ ${action}ed`); load(); }
      else setMsg(j?.error ?? 'Failed');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    } finally { setBusy(''); }
  };

  const money = (n: number | string) => 'Tk ' + Number(n ?? 0).toFixed(2);
  const stColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PROCESSED: 'bg-green-100 text-green-800',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange Medicine</h1>
          <p className="text-sm text-gray-500">Return + replacement in one transaction</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + New Exchange
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          <option value="">All status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PROCESSED">Processed</option>
        </select>
        <span className="text-sm text-gray-600">{total} exchange{total !== 1 ? 's' : ''}</span>
        {msg && <span className="text-xs text-gray-700">{msg}</span>}
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p>
       : items.length === 0 ? <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No exchanges yet</p>
       : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Exchange #</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-right">IN</th>
                <th className="px-3 py-2 text-right">OUT</th>
                <th className="px-3 py-2 text-right">Difference</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((e) => {
                const diff = Number(e.exchangeDifference ?? 0);
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{e.returnNumber}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{new Date(e.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-3 py-2">{e.customerName}{e.customerPhone && <span className="ml-1 text-xs text-gray-500">· {e.customerPhone}</span>}</td>
                    <td className="px-3 py-2 text-right">{money(e.totalAmount)}</td>
                    <td className="px-3 py-2 text-right">{money(e.exchangeOutAmount)}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${diff >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {diff >= 0 ? '+' : '−'} {money(Math.abs(diff))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${stColor[e.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {e.status === 'PENDING' && (
                        <button type="button" disabled={busy === e.id} onClick={() => act(e.id, 'approve')} className="rounded bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700 disabled:opacity-50">Approve</button>
                      )}
                      {e.status === 'APPROVED' && (
                        <button type="button" disabled={busy === e.id} onClick={() => act(e.id, 'process')} className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50">Process</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <ExchangeModal onClose={() => setShowCreate(false)} onSuccess={load} />}
    </div>
  );
}

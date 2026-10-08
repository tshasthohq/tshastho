'use client';

import { useEffect, useState, useCallback } from 'react';
import CommissionBadge from './CommissionBadge';

interface Commission {
  id: string;
  partnerId: string;
  staffName: string | null;
  orderAmount: number | string;
  commissionRate: number | string;
  commissionAmount: number | string;
  status: string;
  createdAt: string;
}

interface Summary {
  total: number;
  pending: number;
  paid: number;
}

interface Props {
  pharmacyId: string;
  staffId?: string;
  canPayout?: boolean;
}

export default function StaffCommissionList({ pharmacyId, staffId, canPayout }: Props) {
  const [items, setItems] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, pending: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [payoutMsg, setPayoutMsg] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (staffId) params.set('staffId', staffId);
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/pharmacy/staff/commissions?${params.toString()}`);
      const json = await res.json();
      if (json?.success) {
        setItems(json.items ?? []);
        setSummary(json.summary ?? { total: 0, pending: 0, paid: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [staffId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePayout = async () => {
    if (!staffId) return;
    setPayoutMsg('Processing...');
    try {
      const res = await fetch('/api/pharmacy/staff/commissions/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, method: 'CASH' }),
      });
      const json = await res.json();
      if (json?.success) {
        setPayoutMsg(`Paid ${json.count} entries (Tk ${json.amount})`);
        load();
      } else {
        setPayoutMsg(json?.error ?? 'Payout failed');
      }
    } catch {
      setPayoutMsg('Network error');
    }
  };

  const money = (n: number | string) => Number(n).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-semibold text-gray-900">Tk {money(summary.total)}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700">Pending</p>
          <p className="text-lg font-semibold text-yellow-900">Tk {money(summary.pending)}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-xs text-green-700">Paid</p>
          <p className="text-lg font-semibold text-green-900">Tk {money(summary.paid)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
        </select>

        {canPayout && staffId && (
          <button
            type="button"
            onClick={handlePayout}
            disabled={summary.pending <= 0}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Pay out pending
          </button>
        )}

        {payoutMsg && <span className="text-xs text-gray-600">{payoutMsg}</span>}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No commission entries.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                {!staffId && <th className="px-3 py-2 text-left">Staff</th>}
                <th className="px-3 py-2 text-right">Base</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600">
                    {new Date(c.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  {!staffId && (
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {c.staffName ?? '-'}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right text-gray-700">
                    {money(c.orderAmount)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500">
                    {Number(c.commissionRate).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">
                    {money(c.commissionAmount)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <CommissionBadge status={c.status} size="sm" />
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

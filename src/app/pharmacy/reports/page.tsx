'use client';

// Reports dashboard — Items 29-34

import { useCallback, useEffect, useState } from 'react';
import ReportFilters, { type Range } from '@/components/pharmacy/ReportFilters';
import ReportTable, { type Column } from '@/components/pharmacy/ReportTable';
import ReportTabs from '@/components/pharmacy/ReportTabs';

const TABS = [
  { id: 'doctor-wise', label: 'Doctor-wise', icon: '🩺' },
  { id: 'area-wise', label: 'Area/Zone', icon: '📍' },
  { id: 'peak-hours', label: 'Peak Hours', icon: '⏰' },
  { id: 'pnl', label: 'P&L', icon: '💰' },
  { id: 'customer-aging', label: 'Customer Aging', icon: '👥' },
  { id: 'supplier-aging', label: 'Supplier Aging', icon: '🚚' },
];

const money = (n: number) => 'Tk ' + Number(n ?? 0).toFixed(2);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [tab, setTab] = useState('doctor-wise');
  const [range, setRange] = useState<Range>({ from: daysAgo(30), to: today() });
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams({ type: tab, from: range.from, to: range.to });
      const res = await fetch(`/api/pharmacy/reports?${p}`);
      const j = await res.json();
      if (j?.success) setData(j);
      else setError(j?.error ?? 'Failed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [tab, range]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (format: 'csv' | 'json') => {
    const p = new URLSearchParams({ type: tab, from: range.from, to: range.to, format });
    window.open(`/api/pharmacy/reports?${p}`, '_blank');
  };

  // Column configs per report type
  const columnsByTab: Record<string, Column[]> = {
    'doctor-wise': [
      { key: 'doctorName', label: 'Doctor' },
      { key: 'orders', label: 'Orders', align: 'right' },
      { key: 'gross', label: 'Gross', align: 'right', format: (v) => money(Number(v)) },
      { key: 'discount', label: 'Discount', align: 'right', format: (v) => money(Number(v)) },
      { key: 'net', label: 'Net', align: 'right', format: (v) => money(Number(v)) },
    ],
    'area-wise': [
      { key: 'area', label: 'Area' },
      { key: 'zone', label: 'Zone' },
      { key: 'orders', label: 'Orders', align: 'right' },
      { key: 'net', label: 'Net', align: 'right', format: (v) => money(Number(v)) },
    ],
    'peak-hours': [
      { key: 'hour', label: 'Hour', align: 'right', format: (v) => String(v).padStart(2, '0') + ':00' },
      { key: 'orders', label: 'Orders', align: 'right' },
      { key: 'net', label: 'Net', align: 'right', format: (v) => money(Number(v)) },
    ],
    'customer-aging': [
      { key: 'name', label: 'Customer' },
      { key: 'phone', label: 'Phone' },
      { key: 'b0_30', label: '0-30d', align: 'right', format: (v) => money(Number(v)) },
      { key: 'b31_60', label: '31-60d', align: 'right', format: (v) => money(Number(v)) },
      { key: 'b61_90', label: '61-90d', align: 'right', format: (v) => money(Number(v)) },
      { key: 'b90plus', label: '90+', align: 'right', format: (v) => money(Number(v)) },
      { key: 'total', label: 'Total', align: 'right', format: (v) => money(Number(v)) },
    ],
    'supplier-aging': [
      { key: 'supplier', label: 'Supplier' },
      { key: 'b0_30', label: '0-30d', align: 'right', format: (v) => money(Number(v)) },
      { key: 'b31_60', label: '31-60d', align: 'right', format: (v) => money(Number(v)) },
      { key: 'b61_90', label: '61-90d', align: 'right', format: (v) => money(Number(v)) },
      { key: 'b90plus', label: '90+', align: 'right', format: (v) => money(Number(v)) },
      { key: 'total', label: 'Total', align: 'right', format: (v) => money(Number(v)) },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Business analytics and financial statements</p>
      </div>

      <ReportTabs tabs={TABS} active={tab} onChange={setTab} />

      <ReportFilters value={range} onChange={setRange} onExport={handleExport} loading={loading} />

      {loading && <p className="text-sm text-gray-500">Loading report...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && data && (
        <>
          {tab === 'pnl' ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Profit &amp; Loss Statement</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between border-b py-1"><dt>Revenue</dt><dd className="font-medium">{money(Number(data.revenue ?? 0))}</dd></div>
                <div className="flex justify-between border-b py-1"><dt>COGS</dt><dd className="font-medium">- {money(Number(data.cogs ?? 0))}</dd></div>
                <div className="flex justify-between border-b py-1"><dt>Discount given</dt><dd className="font-medium">{money(Number(data.discount ?? 0))}</dd></div>
                <div className="flex justify-between border-b py-1 font-semibold"><dt>Gross profit</dt><dd>{money(Number(data.grossProfit ?? 0))}</dd></div>
                <div className="flex justify-between border-b py-1"><dt>Expenses</dt><dd className="font-medium">- {money(Number(data.expenses ?? 0))}</dd></div>
                <div className="flex justify-between border-t-2 border-gray-800 pt-2 text-base font-bold"><dt>Net profit</dt><dd>{money(Number(data.netProfit ?? 0))}</dd></div>
                <div className="flex justify-between text-xs text-gray-500"><dt>Margin</dt><dd>{Number(data.margin ?? 0).toFixed(2)}%</dd></div>
                <div className="flex justify-between text-xs text-gray-500"><dt>Orders</dt><dd>{String(data.orderCount ?? 0)}</dd></div>
              </dl>
            </div>
          ) : (
            <ReportTable
              columns={columnsByTab[tab] ?? []}
              rows={((data.items ?? data.hourly) as Record<string, unknown>[]) ?? []}
            />
          )}
        </>
      )}
    </div>
  );
}

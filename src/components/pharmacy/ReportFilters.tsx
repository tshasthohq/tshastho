'use client';

// Shared filter bar for all reports (Items 29-34)

import { useState } from 'react';

export interface Range { from: string; to: string; }

interface Props {
  value: Range;
  onChange: (r: Range) => void;
  onExport?: (format: 'csv' | 'json') => void;
  loading?: boolean;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportFilters({ value, onChange, onExport, loading }: Props) {
  const [preset, setPreset] = useState('30');

  const applyPreset = (n: number) => {
    setPreset(String(n));
    onChange({ from: daysAgo(n), to: today() });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div>
        <label className="block text-xs font-medium text-gray-500">From</label>
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">To</label>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-1">
        {[7, 30, 90, 365].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => applyPreset(n)}
            className={`rounded-md px-2 py-1.5 text-xs font-medium ${
              preset === String(n) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {n === 365 ? '1y' : `${n}d`}
          </button>
        ))}
      </div>
      <div className="ml-auto flex gap-2">
        {onExport && (
          <>
            <button
              type="button"
              onClick={() => onExport('csv')}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => onExport('json')}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              JSON
            </button>
          </>
        )}
      </div>
    </div>
  );
}

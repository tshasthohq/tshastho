'use client';

// Generic table renderer for reports (Items 29-34)

export interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (v: unknown, row: Record<string, unknown>) => string;
}

interface Props {
  columns: Column[];
  rows: Record<string, unknown>[];
  emptyText?: string;
}

export default function ReportTable({ columns, rows, emptyText = 'No data' }: Props) {
  if (rows.length === 0) {
    return <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 text-${c.align ?? 'left'}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((c) => {
                const v = row[c.key];
                const display = c.format ? c.format(v, row) : (v === null || v === undefined ? '-' : String(v));
                return (
                  <td key={c.key} className={`px-3 py-2 text-${c.align ?? 'left'} ${c.align === 'right' ? 'tabular-nums' : ''}`}>
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

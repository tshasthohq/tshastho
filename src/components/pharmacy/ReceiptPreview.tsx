'use client';

// Live 58mm / 80mm receipt preview — Item 12

import { useMemo } from 'react';
import type { ReceiptData, PaperWidth } from '@/lib/pharmacy/printer/types';
import { renderAsciiPreview } from '@/lib/pharmacy/printer/preview';

interface Props {
  data: ReceiptData;
  onPaperWidthChange?: (w: PaperWidth) => void;
  showToggle?: boolean;
}

export default function ReceiptPreview({
  data,
  onPaperWidthChange,
  showToggle = true,
}: Props) {
  const ascii = useMemo(() => renderAsciiPreview(data), [data]);

  return (
    <div className="rounded-lg border border-gray-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <h3 className="text-sm font-semibold text-gray-800">Receipt Preview</h3>
        {showToggle && onPaperWidthChange && (
          <div className="flex gap-1 text-xs">
            {([58, 80] as PaperWidth[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onPaperWidthChange(w)}
                className={`rounded px-2 py-1 transition ${
                  data.paperWidth === w
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {w}mm
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto p-4">
        <pre
          id="thermal-receipt-printable"
          className="mx-auto inline-block bg-gray-50 font-mono text-[11px] leading-[1.35] text-gray-900"
          style={{
            minWidth: data.paperWidth === 58 ? '320px' : '440px',
            padding: '12px',
          }}
        >
          {ascii}
        </pre>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-right text-[11px] text-gray-600">
        {data.items.length} item{data.items.length !== 1 ? 's' : ''} •{' '}
        {data.paperWidth}mm • {ascii.split('\n').length} lines
      </div>
    </div>
  );
}

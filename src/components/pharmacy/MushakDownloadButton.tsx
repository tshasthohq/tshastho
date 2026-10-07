'use client';

import { useState } from 'react';

interface Props {
  vatInvoiceId: string;
  invoiceNumber?: string;
  className?: string;
}

export default function MushakDownloadButton({
  vatInvoiceId,
  invoiceNumber,
  className,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pharmacy/vat-invoices/${vatInvoiceId}/mushak-6.3`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(json?.error ?? 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mushak-6.3-${invoiceNumber ?? vatInvoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={
          'inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ' +
          (className ?? '')
        }
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {loading ? 'Generating…' : 'Mushak 6.3 PDF'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

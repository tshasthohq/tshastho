'use client';

// Wallet balance badge — Item 36
import { useEffect, useState } from 'react';

interface Props {
  className?: string;
  showIcon?: boolean;
}

interface WalletData {
  balance: number;
  currency: string;
  isFrozen: boolean;
}

export default function WalletBadge({ className, showIcon = true }: Props) {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/wallet/me')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.success) setData(j.wallet);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading || !data) return null;

  const money = (n: number) => n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <a
      href="/wallet"
      className={`inline-flex items-center gap-1.5 rounded-full border ${
        data.isFrozen ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-800'
      } px-3 py-1 text-xs font-medium transition hover:shadow-sm ${className ?? ''}`}
      title="Wallet balance — click to view"
    >
      {showIcon && (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5m0 0h-5a2 2 0 010-4h5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {data.isFrozen ? 'Frozen' : `Tk ${money(data.balance)}`}
    </a>
  );
}

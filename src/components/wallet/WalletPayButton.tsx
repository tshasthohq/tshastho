'use client';

// Wallet pay button for POS — Item 36
import { useState } from 'react';

interface Props {
  customerUserId: string;
  customerName: string;
  amount: number;
  orderContext?: {
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
    idempotencyKey?: string;
  };
  onSuccess: (result: { txnId: string; balanceAfter: number }) => void;
  onError?: (err: string) => void;
  onInsufficient?: (available: number) => void;
  className?: string;
}

export default function WalletPayButton({
  customerUserId,
  customerName,
  amount,
  orderContext,
  onSuccess,
  onError,
  onInsufficient,
  className,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!customerUserId) {
      setError('Select a customer first');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/wallet/internal/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: customerUserId,
          amount,
          vertical: 'PHARMACY',
          contextId: undefined,
          referenceType: orderContext?.referenceType ?? 'POS_SALE',
          referenceId: orderContext?.referenceId,
          referenceNumber: orderContext?.referenceNumber,
          description: `POS payment for ${customerName}`,
          idempotencyKey: orderContext?.idempotencyKey,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        onSuccess({ txnId: json.txnId, balanceAfter: json.balanceAfter });
      } else {
        const msg = json?.error ?? 'Wallet payment failed';
        setError(msg);
        if (msg.toLowerCase().includes('insufficient') && onInsufficient) {
          const m = msg.match(/Available:\s*([\d.]+)/);
          onInsufficient(m ? Number(m[1]) : 0);
        }
        onError?.(msg);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error';
      setError(msg);
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handlePay}
        disabled={busy || amount <= 0}
        className={
          'inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 ' +
          (className ?? '')
        }
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5m0 0h-5a2 2 0 010-4h5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {busy ? 'Processing…' : `Pay Tk ${amount.toFixed(2)} with Wallet`}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

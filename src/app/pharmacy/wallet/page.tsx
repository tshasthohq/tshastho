'use client';

// Pharmacy staff wallet lookup + top-up tool — Item 36
import { useState } from 'react';

interface WalletInfo {
  id: string;
  userId: string;
  balance: number;
  availableBalance: number;
  isActive: boolean;
  isFrozen: boolean;
  totalTopUp: number;
  totalSpent: number;
}

export default function PharmacyWalletPage() {
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMsg, setTopupMsg] = useState('');

  const lookup = async () => {
    if (!phone.trim() && !userId.trim()) {
      setError('Enter phone or user ID');
      return;
    }
    setLoading(true);
    setError('');
    setWallet(null);
    try {
      // Use userId if provided, else fallback: staff typically pastes userId
      const uid = userId.trim() || phone.trim();
      const res = await fetch(`/api/pharmacy/wallet/${encodeURIComponent(uid)}`);
      const j = await res.json();
      if (j?.success) {
        setWallet(j.wallet);
      } else {
        setError(j?.error ?? 'Not found');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const doTopup = async () => {
    const amt = Number(topupAmount);
    if (!wallet || !amt || amt <= 0) {
      setTopupMsg('Enter valid amount');
      return;
    }
    setTopupMsg('Processing…');
    try {
      const res = await fetch(`/api/pharmacy/wallet/${wallet.userId}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, notes: 'Staff top-up' }),
      });
      const j = await res.json();
      if (j?.success) {
        setTopupMsg(`✓ Topped up Tk ${amt}. New balance: Tk ${Number(j.balanceAfter).toFixed(2)}`);
        setTopupAmount('');
        lookup();
      } else {
        setTopupMsg(j?.error ?? 'Failed');
      }
    } catch (e) {
      setTopupMsg(e instanceof Error ? e.message : 'Error');
    }
  };

  const money = (n: number) => 'Tk ' + Number(n).toFixed(2);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Wallet</h1>
        <p className="text-sm text-gray-500">Look up customer wallet and add cash top-up</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01711-XXXXXX"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="text-center text-xs text-gray-400">OR</div>
          <div>
            <label className="block text-xs font-medium text-gray-500">User ID</label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="clx... (from system)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <button
            type="button"
            onClick={lookup}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Looking up…' : 'Look Up Wallet'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {wallet && (
        <>
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-5">
            <p className="text-xs text-emerald-700">Balance</p>
            <p className="text-3xl font-bold text-emerald-900">{money(wallet.balance)}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-600">Total Top-up</p>
                <p className="font-medium">{money(wallet.totalTopUp)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Spent</p>
                <p className="font-medium">{money(wallet.totalSpent)}</p>
              </div>
            </div>
            {wallet.isFrozen && <p className="mt-2 text-sm font-medium text-red-700">⚠ Wallet is FROZEN</p>}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Add Cash Top-up</h2>
            <div className="flex gap-2">
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="Amount (Tk)"
                min="1"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={doTopup}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Add
              </button>
            </div>
            {topupMsg && <p className="mt-2 text-sm text-gray-700">{topupMsg}</p>}
          </div>
        </>
      )}
    </div>
  );
}

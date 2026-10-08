'use client';
// Create exchange modal — Item 38
import { useState } from 'react';

interface ItemIn { medicineId: string; quantity: string; unitPrice: string; reason: string; }
interface ItemOut { medicineId: string; quantity: string; unitPrice: string; }

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExchangeModal({ onClose, onSuccess }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [differenceMethod, setDifferenceMethod] = useState<'CASH' | 'WALLET' | 'GATEWAY' | 'REFUND'>('CASH');
  const [reason, setReason] = useState('');
  const [itemsIn, setItemsIn] = useState<ItemIn[]>([{ medicineId: '', quantity: '1', unitPrice: '', reason: '' }]);
  const [itemsOut, setItemsOut] = useState<ItemOut[]>([{ medicineId: '', quantity: '1', unitPrice: '' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const calcTotal = (items: Array<{ quantity: string; unitPrice: string }>) =>
    items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);

  const inTotal = calcTotal(itemsIn);
  const outTotal = calcTotal(itemsOut);
  const diff = outTotal - inTotal;

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const payload = {
        customerName,
        customerPhone: customerPhone || undefined,
        itemsIn: itemsIn.filter((i) => i.medicineId).map((i) => ({
          medicineId: i.medicineId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          reason: i.reason || undefined,
          isRestocked: true,
        })),
        itemsOut: itemsOut.filter((i) => i.medicineId).map((i) => ({
          medicineId: i.medicineId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
        differenceMethod,
        reason: reason || undefined,
      };
      const res = await fetch('/api/pharmacy/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (j?.success) { onSuccess(); onClose(); }
      else setError(j?.error ?? 'Failed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">New Exchange</h2>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name *" className="rounded border border-gray-300 px-3 py-2" />
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" className="rounded border border-gray-300 px-3 py-2" />
        </div>

        {/* Items IN */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Items Returned (IN)</h3>
            <button type="button" onClick={() => setItemsIn([...itemsIn, { medicineId: '', quantity: '1', unitPrice: '', reason: '' }])} className="text-xs text-blue-600 hover:underline">+ Add</button>
          </div>
          {itemsIn.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
              <input value={it.medicineId} onChange={(e) => setItemsIn(itemsIn.map((x, i) => i === idx ? { ...x, medicineId: e.target.value } : x))} placeholder="Medicine ID" className="col-span-5 rounded border px-2 py-1.5 text-sm" />
              <input type="number" value={it.quantity} onChange={(e) => setItemsIn(itemsIn.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} placeholder="Qty" className="col-span-2 rounded border px-2 py-1.5 text-sm" />
              <input type="number" value={it.unitPrice} onChange={(e) => setItemsIn(itemsIn.map((x, i) => i === idx ? { ...x, unitPrice: e.target.value } : x))} placeholder="Price" className="col-span-3 rounded border px-2 py-1.5 text-sm" />
              <button type="button" onClick={() => setItemsIn(itemsIn.filter((_, i) => i !== idx))} disabled={itemsIn.length === 1} className="col-span-2 text-xs text-red-600 disabled:opacity-30">Remove</button>
            </div>
          ))}
        </div>

        {/* Items OUT */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Items Given (OUT)</h3>
            <button type="button" onClick={() => setItemsOut([...itemsOut, { medicineId: '', quantity: '1', unitPrice: '' }])} className="text-xs text-blue-600 hover:underline">+ Add</button>
          </div>
          {itemsOut.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
              <input value={it.medicineId} onChange={(e) => setItemsOut(itemsOut.map((x, i) => i === idx ? { ...x, medicineId: e.target.value } : x))} placeholder="Medicine ID" className="col-span-7 rounded border px-2 py-1.5 text-sm" />
              <input type="number" value={it.quantity} onChange={(e) => setItemsOut(itemsOut.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} placeholder="Qty" className="col-span-2 rounded border px-2 py-1.5 text-sm" />
              <input type="number" value={it.unitPrice} onChange={(e) => setItemsOut(itemsOut.map((x, i) => i === idx ? { ...x, unitPrice: e.target.value } : x))} placeholder="Price" className="col-span-3 rounded border px-2 py-1.5 text-sm" />
            </div>
          ))}
        </div>

        {/* Summary + Difference */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          <div className="flex justify-between"><span>Returned total (IN)</span><span className="font-medium">Tk {inTotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>New items total (OUT)</span><span className="font-medium">Tk {outTotal.toFixed(2)}</span></div>
          <div className="mt-1 flex justify-between border-t pt-1 text-base font-bold">
            <span>Difference</span>
            <span className={diff >= 0 ? 'text-red-700' : 'text-green-700'}>
              {diff >= 0 ? 'Customer pays ' : 'Customer refund '}Tk {Math.abs(diff).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <select value={differenceMethod} onChange={(e) => setDifferenceMethod(e.target.value as 'CASH' | 'WALLET' | 'GATEWAY' | 'REFUND')} className="rounded border border-gray-300 px-3 py-2">
            <option value="CASH">Settle: Cash</option>
            <option value="WALLET">Settle: Wallet</option>
            <option value="GATEWAY">Settle: Gateway</option>
            <option value="REFUND">Settle: Original refund method</option>
          </select>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="rounded border border-gray-300 px-3 py-2" />
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm">Cancel</button>
          <button type="button" onClick={submit} disabled={busy || !customerName} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:bg-gray-300">
            {busy ? 'Creating…' : 'Create Exchange'}
          </button>
        </div>
      </div>
    </div>
  );
}

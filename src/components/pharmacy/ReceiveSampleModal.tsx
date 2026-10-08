'use client';
// Receive sample batch modal — Item 37
import { useState } from 'react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceiveSampleModal({ onClose, onSuccess }: Props) {
  const [medicineId, setMedicineId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/pharmacy/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId,
          batchNumber: batchNumber || undefined,
          expiryDate: expiryDate || undefined,
          quantity: Number(quantity),
          repName: repName || undefined,
          repPhone: repPhone || undefined,
          notes: notes || undefined,
        }),
      });
      const j = await res.json();
      if (j?.success) {
        onSuccess();
        onClose();
      } else {
        setError(j?.error ?? 'Failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">Receive Sample</h2>
        <div className="space-y-2 text-sm">
          <input value={medicineId} onChange={(e) => setMedicineId(e.target.value)} placeholder="Medicine ID *" className="w-full rounded border border-gray-300 px-3 py-2" />
          <input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="Batch # (optional)" className="w-full rounded border border-gray-300 px-3 py-2" />
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2" />
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity *" min="1" className="w-full rounded border border-gray-300 px-3 py-2" />
          <input value={repName} onChange={(e) => setRepName(e.target.value)} placeholder="Rep name" className="w-full rounded border border-gray-300 px-3 py-2" />
          <input value={repPhone} onChange={(e) => setRepPhone(e.target.value)} placeholder="Rep phone" className="w-full rounded border border-gray-300 px-3 py-2" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} className="w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-gray-300 px-3 py-1.5 text-sm">Cancel</button>
          <button type="button" onClick={submit} disabled={busy || !medicineId || !quantity} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:bg-gray-300">
            {busy ? 'Saving…' : 'Receive'}
          </button>
        </div>
      </div>
    </div>
  );
}

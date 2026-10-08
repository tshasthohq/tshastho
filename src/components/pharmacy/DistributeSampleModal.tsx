'use client';
// Distribute sample to doctor — Item 37
import { useState } from 'react';

interface Props {
  sampleBatchId: string;
  medicineName: string;
  remaining: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DistributeSampleModal({ sampleBatchId, medicineName, remaining, onClose, onSuccess }: Props) {
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorClinic, setDoctorClinic] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/pharmacy/samples/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleBatchId,
          doctorId: doctorId || undefined,
          doctorName,
          doctorPhone: doctorPhone || undefined,
          doctorClinic: doctorClinic || undefined,
          quantity: Number(quantity),
          notes: notes || undefined,
        }),
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
      <div className="w-full max-w-md rounded-lg bg-white p-5">
        <h2 className="mb-1 text-lg font-bold">Distribute Sample</h2>
        <p className="mb-3 text-xs text-gray-500">{medicineName} · Available: {remaining}</p>
        <div className="space-y-2 text-sm">
          <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Doctor name *" className="w-full rounded border border-gray-300 px-3 py-2" />
          <input value={doctorId} onChange={(e) => setDoctorId(e.target.value)} placeholder="Doctor ID (if registered)" className="w-full rounded border border-gray-300 px-3 py-2" />
          <input value={doctorPhone} onChange={(e) => setDoctorPhone(e.target.value)} placeholder="Doctor phone" className="w-full rounded border border-gray-300 px-3 py-2" />
          <input value={doctorClinic} onChange={(e) => setDoctorClinic(e.target.value)} placeholder="Clinic / chamber" className="w-full rounded border border-gray-300 px-3 py-2" />
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity *" min="1" max={remaining} className="w-full rounded border border-gray-300 px-3 py-2" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} className="w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-gray-300 px-3 py-1.5 text-sm">Cancel</button>
          <button type="button" onClick={submit} disabled={busy || !doctorName || !quantity} className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:bg-gray-300">
            {busy ? 'Distributing…' : 'Distribute'}
          </button>
        </div>
      </div>
    </div>
  );
}

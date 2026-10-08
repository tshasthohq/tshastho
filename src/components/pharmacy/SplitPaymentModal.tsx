"use client";

import { useState } from "react";
import { X, Plus, Trash2, DollarSign, AlertCircle } from "lucide-react";

export interface Split {
  method: "CASH" | "BKASH" | "NAGAD" | "CARD" | "CREDIT" | "DUE";
  amount: number;
  reference?: string;
}

interface Props {
  total: number;
  customerName?: string;
  customerPhone?: string;
  onConfirm: (splits: Split[], notes: string) => void;
  onClose: () => void;
  processing?: boolean;
}

const METHODS: { k: Split["method"]; l: string }[] = [
  { k: "CASH", l: "Cash" },
  { k: "BKASH", l: "bKash" },
  { k: "NAGAD", l: "Nagad" },
  { k: "CARD", l: "Card" },
  { k: "CREDIT", l: "Credit" },
  { k: "DUE", l: "Due" },
];

export default function SplitPaymentModal({ total, customerName, customerPhone, onConfirm, onClose, processing }: Props) {
  const [splits, setSplits] = useState<Split[]>([{ method: "CASH", amount: total }]);
  const [notes, setNotes] = useState("");

  const totalPaid = splits.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const remaining = total - totalPaid;
  const change = remaining < 0 ? Math.abs(remaining) : 0;
  const creditAmount = splits
    .filter((s) => s.method === "CREDIT" || s.method === "DUE")
    .reduce((a, b) => a + Number(b.amount), 0);

  const addSplit = () => {
    setSplits([...splits, { method: "BKASH", amount: Math.max(0, remaining) }]);
  };

  const updateSplit = (idx: number, field: keyof Split, value: any) => {
    setSplits(splits.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeSplit = (idx: number) => {
    if (splits.length === 1) return;
    setSplits(splits.filter((_, i) => i !== idx));
  };

  const fillRemaining = (idx: number) => {
    const others = splits.reduce((s, x, i) => i === idx ? s : s + Number(x.amount || 0), 0);
    updateSplit(idx, "amount", Math.max(0, total - others));
  };

  const isValid = splits.length > 0 && splits.every((s) => s.amount > 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold">Split Payment</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-4 space-y-3">
          {customerName && (
            <div className="bg-slate-50 p-2 rounded-xl text-xs">
              <span className="text-slate-500">Customer: </span>
              <span className="font-medium">{customerName}</span>
              {customerPhone && <span className="text-slate-500"> • {customerPhone}</span>}
            </div>
          )}

          {/* Total Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-4">
            <div className="text-xs text-blue-100 mb-1">Total Amount</div>
            <div className="text-2xl font-bold">৳ {total.toFixed(2)}</div>
          </div>

          {/* Splits */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-slate-600">Payment Methods</label>
              <button type="button" onClick={addSplit}
                className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <Plus size={12} /> Add Method
              </button>
            </div>

            <div className="space-y-2">
              {splits.map((s, idx) => (
                <div key={idx} className="bg-slate-50 p-2 rounded-xl">
                  <div className="flex gap-2 items-center">
                    <select value={s.method}
                      onChange={(e) => updateSplit(idx, "method", e.target.value)}
                      className="flex-1 px-2 py-2 border border-slate-200 rounded-lg text-xs bg-white">
                      {METHODS.map(m => <option key={m.k} value={m.k}>{m.l}</option>)}
                    </select>
                    <input type="number" min={0} step="0.01" value={s.amount}
                      onChange={(e) => updateSplit(idx, "amount", Number(e.target.value))}
                      className="w-24 px-2 py-2 border border-slate-200 rounded-lg text-xs text-right" />
                    {splits.length > 1 && (
                      <button type="button" onClick={() => removeSplit(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  {(s.method === "BKASH" || s.method === "NAGAD" || s.method === "CARD") && (
                    <input value={s.reference || ""}
                      onChange={(e) => updateSplit(idx, "reference", e.target.value)}
                      placeholder="Transaction ref (optional)"
                      className="w-full mt-1 px-2 py-1 border border-slate-200 rounded text-[10px]" />
                  )}
                  {remaining > 0 && splits.length > 1 && (
                    <button type="button" onClick={() => fillRemaining(idx)}
                      className="text-[10px] text-blue-600 mt-1 underline">
                      Fill remaining ৳{remaining.toFixed(2)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Paid</span>
              <span className="font-medium">৳ {totalPaid.toFixed(2)}</span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between text-red-600">
                <span className="flex items-center gap-1">
                  <AlertCircle size={10} /> Remaining
                </span>
                <span className="font-bold">৳ {remaining.toFixed(2)}</span>
              </div>
            )}
            {change > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Change</span>
                <span className="font-bold">৳ {change.toFixed(2)}</span>
              </div>
            )}
            {creditAmount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>On Credit</span>
                <span className="font-bold">৳ {creditAmount.toFixed(2)}</span>
              </div>
            )}
            {remaining > 0 && creditAmount === 0 && (
              <p className="text-[10px] text-amber-600 mt-1">
                Tip: Add CREDIT for the remaining amount to save as due.
              </p>
            )}
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={2} placeholder="Notes (optional)"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

          <button onClick={() => onConfirm(splits, notes)} disabled={processing || !isValid}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            <DollarSign size={16} /> {processing ? "Processing..." : "Complete Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Banknote, Plus, X, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

export default function DoctorPayoutsPage() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    amount: 0,
    method: "BKASH",
    accountInfo: { bkashNumber: "", bankName: "", accountNumber: "", accountName: "", branchName: "" },
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [pRes, eRes] = await Promise.all([
      fetch("/api/doctor/payouts", { credentials: "include" }).then(r => r.json()),
      fetch("/api/doctor/earnings", { credentials: "include" }).then(r => r.json()),
    ]);
    setPayouts(pRes.payouts || []);
    setSummary(eRes.summary);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/doctor/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ amount: 0, method: "BKASH", accountInfo: { bkashNumber: "", bankName: "", accountNumber: "", accountName: "", branchName: "" }, notes: "" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const statusColor = (st: string) => {
    switch (st) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "APPROVED": return "bg-blue-100 text-blue-700";
      case "PROCESSING": return "bg-amber-100 text-amber-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const statusIcon = (st: string) => {
    switch (st) {
      case "COMPLETED": return CheckCircle;
      case "REJECTED": return XCircle;
      default: return Clock;
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Banknote className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">My Payouts</h1>
        </div>
        <button onClick={() => { setShowForm(true); setForm({ ...form, amount: summary?.available.amount || 0 }); }}
          disabled={!summary?.available.amount || summary.available.amount <= 0}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40">
          <Plus size={16} /> Request
        </button>
      </div>

      {/* Available Balance */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
        <div className="text-xs text-green-700 mb-1">Available to Withdraw</div>
        <div className="text-2xl font-bold text-green-700">৳ {(summary?.available.amount || 0).toFixed(2)}</div>
      </div>

      {payouts.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
          <p className="text-slate-500 text-sm">No payout requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => {
            const StatusIcon = statusIcon(p.status);
            return (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono text-xs text-slate-500">{p.payoutNumber}</div>
                    <div className="text-xl font-bold text-slate-800 mt-1">৳ {Number(p.amount).toFixed(2)}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                    <StatusIcon size={10} /> {p.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {p.method} • Requested {new Date(p.requestedAt).toLocaleDateString()}
                </div>
                {p.rejectionReason && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                    Reason: {p.rejectionReason}
                  </div>
                )}
                {p.completedAt && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Completed {new Date(p.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Request Payout</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Amount (৳) *</label>
                <input required type="number" min={1} max={summary?.available.amount || 0} step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <p className="text-[10px] text-slate-500 mt-1">
                  Max: ৳ {(summary?.available.amount || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Method *</label>
                <select value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              {form.method === "BKASH" && (
                <input value={form.accountInfo.bkashNumber}
                  onChange={(e) => setForm({ ...form, accountInfo: { ...form.accountInfo, bkashNumber: e.target.value } })}
                  placeholder="bKash Number *" required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              )}

              {form.method === "NAGAD" && (
                <input value={form.accountInfo.bkashNumber}
                  onChange={(e) => setForm({ ...form, accountInfo: { ...form.accountInfo, bkashNumber: e.target.value } })}
                  placeholder="Nagad Number *" required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              )}

              {form.method === "BANK" && (
                <>
                  <input value={form.accountInfo.bankName}
                    onChange={(e) => setForm({ ...form, accountInfo: { ...form.accountInfo, bankName: e.target.value } })}
                    placeholder="Bank Name *" required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={form.accountInfo.accountName}
                    onChange={(e) => setForm({ ...form, accountInfo: { ...form.accountInfo, accountName: e.target.value } })}
                    placeholder="Account Holder Name *" required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={form.accountInfo.accountNumber}
                    onChange={(e) => setForm({ ...form, accountInfo: { ...form.accountInfo, accountNumber: e.target.value } })}
                    placeholder="Account Number *" required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={form.accountInfo.branchName}
                    onChange={(e) => setForm({ ...form, accountInfo: { ...form.accountInfo, branchName: e.target.value } })}
                    placeholder="Branch Name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
                <textarea value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

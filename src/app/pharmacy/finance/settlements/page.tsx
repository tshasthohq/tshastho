"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PiggyBank, Plus, X } from "lucide-react";

export default function SettlementsPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ periodStart: monthAgo, periodEnd: today, notes: "" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/finance/settlements", { credentials: "include" });
    const data = await res.json();
    setSettlements(data.settlements || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/finance/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "APPROVED": return "bg-blue-100 text-blue-700";
      case "PROCESSING": return "bg-amber-100 text-amber-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };
// CONTINUES

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="text-purple-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Settlements</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Request
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : settlements.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No settlement requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map((s) => (
            <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-mono text-xs text-slate-500">{s.requestNumber}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(s.periodStart).toLocaleDateString()} → {new Date(s.periodEnd).toLocaleDateString()}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(s.status)}`}>
                  {s.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Gross Sales</div>
                  <div className="font-bold text-slate-800">৳ {Number(s.grossSales).toFixed(0)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Commission</div>
                  <div className="font-bold text-red-600">-৳ {Number(s.commissionAmount).toFixed(0)}</div>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <div className="text-green-700">Net Payable</div>
                  <div className="font-bold text-green-700">৳ {Number(s.netPayable).toFixed(0)}</div>
                </div>
              </div>

              {s.rejectionReason && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  {s.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold">Request Settlement</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Period Start *</label>
                <input required type="date" value={form.periodStart}
                  onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Period End *</label>
                <input required type="date" value={form.periodEnd}
                  onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Submitting..." : "Request Settlement"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

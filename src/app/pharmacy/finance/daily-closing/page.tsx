"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Plus, X, CheckCircle } from "lucide-react";

export default function DailyClosingPage() {
  const { user } = useAuth();
  const [closings, setClosings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    closingDate: new Date().toISOString().slice(0, 10),
    openingCash: 0,
    closingCash: 0,
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/finance/daily-closing", { credentials: "include" });
    const data = await res.json();
    setClosings(data.closings || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/finance/daily-closing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ closingDate: new Date().toISOString().slice(0, 10), openingCash: 0, closingCash: 0, notes: "" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };
// CONTINUES

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="text-green-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Daily Closing</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : closings.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No closings yet.
        </div>
      ) : (
        <div className="space-y-3">
          {closings.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {new Date(c.closingDate).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                  </div>
                  <div className="text-xs text-slate-500">{c.closedBy?.name || "—"}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  c.status === "VERIFIED" ? "bg-green-100 text-green-700" :
                  c.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {c.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Sales</div>
                  <div className="font-bold text-slate-800">৳ {Number(c.totalSales + c.totalPosSales).toFixed(0)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Expenses</div>
                  <div className="font-bold text-red-600">৳ {Number(c.totalExpenses).toFixed(0)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Expected</div>
                  <div className="font-bold text-slate-800">৳ {Number(c.expectedCash).toFixed(0)}</div>
                </div>
                <div className={`p-2 rounded-lg ${Number(c.difference) === 0 ? "bg-green-50" : Number(c.difference) > 0 ? "bg-blue-50" : "bg-red-50"}`}>
                  <div className={Number(c.difference) === 0 ? "text-green-700" : Number(c.difference) > 0 ? "text-blue-700" : "text-red-700"}>
                    Difference
                  </div>
                  <div className={`font-bold ${Number(c.difference) === 0 ? "text-green-700" : Number(c.difference) > 0 ? "text-blue-700" : "text-red-700"}`}>
                    {Number(c.difference) > 0 ? "+" : ""}৳ {Number(c.difference).toFixed(0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold">Daily Closing</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Date *</label>
                <input required type="date" value={form.closingDate}
                  onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Opening Cash (৳) *</label>
                <input required type="number" min={0} step="0.01" value={form.openingCash}
                  onChange={(e) => setForm({ ...form, openingCash: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Closing Cash Count (৳) *</label>
                <input required type="number" min={0} step="0.01" value={form.closingCash}
                  onChange={(e) => setForm({ ...form, closingCash: Number(e.target.value) })}
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
                {saving ? "Saving..." : "Close Day"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

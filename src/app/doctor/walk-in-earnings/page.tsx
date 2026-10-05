"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, Plus, X, Trash2, TrendingUp, Calendar, Clock } from "lucide-react";

export default function WalkInEarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, count: 0 });
  const [chambers, setChambers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"today" | "week" | "month" | "all">("today");
  const [chamberFilter, setChamberFilter] = useState("");
  const [form, setForm] = useState({
    chamberId: "",
    patientName: "",
    amount: 0,
    method: "CASH",
    serviceType: "CONSULTATION",
    description: "",
  });

  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (filter === "today") return { from: today.toISOString() };
    if (filter === "week") {
      const w = new Date(today);
      w.setDate(w.getDate() - 6);
      return { from: w.toISOString() };
    }
    if (filter === "month") {
      const m = new Date();
      m.setDate(1);
      m.setHours(0, 0, 0, 0);
      return { from: m.toISOString() };
    }
    return {};
  };

  const load = async () => {
    setLoading(true);
    const range = getDateRange();
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (chamberFilter) params.set("chamberId", chamberFilter);

    const [eRes, cRes] = await Promise.all([
      fetch(`/api/doctor/walk-in-earnings?${params}`, { credentials: "include" }).then(r => r.json()),
      fetch("/api/doctor/chambers", { credentials: "include" }).then(r => r.json()),
    ]);
    setEarnings(eRes.earnings || []);
    setSummary(eRes.summary || { total: 0, count: 0 });
    setChambers(cRes.chambers || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filter, chamberFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) { setMessage("Amount required"); return; }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/doctor/walk-in-earnings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ chamberId: "", patientName: "", amount: 0, method: "CASH", serviceType: "CONSULTATION", description: "" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Void this entry?")) return;
    const res = await fetch(`/api/doctor/walk-in-earnings?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };
// PART2

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="text-green-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Walk-in Earnings</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Record cash earnings from walk-in patients (chamber visits, procedures, etc.).
      </p>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white mb-4 shadow-lg">
        <div className="text-xs text-green-100 mb-1">Total ({filter})</div>
        <div className="text-3xl font-bold mb-2">৳ {Number(summary.total).toFixed(2)}</div>
        <div className="text-xs text-green-100">{summary.count} entries</div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {[
          { k: "today", label: "Today" },
          { k: "week", label: "This Week" },
          { k: "month", label: "This Month" },
          { k: "all", label: "All Time" },
        ].map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k as any)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              filter === f.k ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {chambers.length > 0 && (
        <div className="mb-4">
          <select value={chamberFilter} onChange={(e) => setChamberFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
            <option value="">All Chambers</option>
            {chambers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : earnings.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Wallet className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No earnings recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {earnings.map((e) => (
            <div key={e.id} className="p-3 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                    {e.method}
                  </span>
                  {e.serviceType && (
                    <span className="text-[10px] text-slate-500">{e.serviceType}</span>
                  )}
                </div>
                <div className="text-sm font-medium text-slate-800 truncate">
                  {e.localPatient?.name || e.patientName || "Walk-in"}
                </div>
                {e.chamber && (
                  <div className="text-xs text-slate-500">{e.chamber.name}</div>
                )}
                {e.description && (
                  <div className="text-xs text-slate-500 truncate">{e.description}</div>
                )}
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(e.earningDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">+৳ {Number(e.amount).toFixed(2)}</div>
                <button onClick={() => handleDelete(e.id)}
                  className="text-red-500 mt-1 text-[10px] hover:underline">
                  Void
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Add Walk-in Earning</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {chambers.length > 0 && (
                <select value={form.chamberId} onChange={(e) => setForm({ ...form, chamberId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="">— No chamber —</option>
                  {chambers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}

              <input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                placeholder="Patient name (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Amount (৳) *</label>
                <input required type="number" min={1} step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["CASH", "BKASH", "CARD"].map(m => (
                    <button key={m} type="button" onClick={() => setForm({ ...form, method: m })}
                      className={`py-2 rounded-xl text-xs font-medium border ${
                        form.method === m ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200"
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Service Type</label>
                <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="CONSULTATION">Consultation</option>
                  <option value="PROCEDURE">Procedure</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="REPORT_REVIEW">Report Review</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Add Earning"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Receipt, X, Trash2 } from "lucide-react";

const CATEGORIES = ["RENT", "SALARY", "UTILITY", "TRANSPORT", "PURCHASE", "MAINTENANCE", "MARKETING", "TAX", "MISC"];

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ category: "MISC", amount: 0, description: "", expenseDate: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const url = filter ? `/api/pharmacy/finance/expenses?category=${filter}` : "/api/pharmacy/finance/expenses";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setExpenses(data.expenses || []);
    setSummary(data.summary || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ category: "MISC", amount: 0, description: "", expenseDate: "", notes: "" });
      load();
    } else {
      setMessage(data.message || "Failed to save");
    }
  };

  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
// CONTINUES

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="text-red-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Expenses</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
        <div className="text-xs text-red-700 mb-1">Total Expenses</div>
        <div className="text-2xl font-bold text-red-700">৳ {totalExpense.toFixed(2)}</div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button onClick={() => setFilter("")}
          className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
            filter === "" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              filter === c ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : expenses.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No expenses found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {expenses.map((e) => (
            <div key={e.id} className="p-4 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {e.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(e.expenseDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-800">{e.description}</div>
                {e.notes && <div className="text-xs text-slate-500 mt-0.5">{e.notes}</div>}
              </div>
              <div className="text-right">
                <div className="font-bold text-red-600">-৳ {Number(e.amount).toFixed(2)}</div>
                <div className="text-xs text-slate-500 mt-0.5">{e.createdBy?.name || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">New Expense</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Amount (৳) *</label>
                <input required type="number" min={0} step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Description *</label>
                <input required value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Shop rent for October"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Date</label>
                <input type="date" value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
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
                {saving ? "Saving..." : "Save Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

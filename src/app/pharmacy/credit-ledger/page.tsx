"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Plus, X, User, ArrowDown, ArrowUp, Wallet } from "lucide-react";

export default function CreditLedgerPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"customers" | "entries">("customers");
  const [customers, setCustomers] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    type: "SALE_ON_CREDIT",
    amount: 0,
    description: "",
    paymentMethod: "CASH",
  });

  const load = async () => {
    setLoading(true);
    const [cRes, eRes, aRes] = await Promise.all([
      fetch("/api/pharmacy/credit-ledger/customers", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/credit-ledger", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/customers/list", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]);
    setCustomers(cRes.customers || []);
    setEntries(eRes.entries || []);
    setAllCustomers(aRes.customers || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || form.amount <= 0) { setMessage("Customer and amount required"); return; }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/credit-ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        customerId: selectedCustomer.id || selectedCustomer.customerId,
        ...form,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setSelectedCustomer(null);
      setForm({ type: "SALE_ON_CREDIT", amount: 0, description: "", paymentMethod: "CASH" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const totalDue = customers.reduce((s, c) => s + Math.max(0, c.balance), 0);

  const typeColor = (t: string) => {
    switch (t) {
      case "SALE_ON_CREDIT": return "bg-red-100 text-red-700";
      case "PAYMENT_RECEIVED": return "bg-green-100 text-green-700";
      case "WRITE_OFF": return "bg-slate-100 text-slate-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };
// PART2

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Credit Ledger</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Entry
        </button>
      </div>

      {/* Total Due */}
      <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-5 text-white mb-4 shadow-lg">
        <div className="text-xs text-red-100 mb-1 flex items-center gap-1">
          <Wallet size={12} /> Total Customer Due
        </div>
        <div className="text-3xl font-bold">৳ {totalDue.toFixed(2)}</div>
        <div className="text-xs text-red-100 mt-1">{customers.length} customers</div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setView("customers")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            view === "customers" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>Customers ({customers.length})</button>
        <button onClick={() => setView("entries")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            view === "entries" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>All Entries ({entries.length})</button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : view === "customers" ? (
        customers.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
            No outstanding customer balances. 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((c) => (
              <div key={c.customerId} className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <User className="text-red-600" size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{c.customer?.name || "Customer"}</div>
                      <div className="text-xs text-slate-500">{c.customer?.phone || c.customer?.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${c.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      ৳ {Math.abs(c.balance).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {c.balance > 0 ? "Due" : "Advance"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setSelectedCustomer(c.customer); setForm({ ...form, type: "PAYMENT_RECEIVED" }); setShowForm(true); }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-medium">
                    Receive Payment
                  </button>
                  <button onClick={() => { setSelectedCustomer(c.customer); setForm({ ...form, type: "SALE_ON_CREDIT" }); setShowForm(true); }}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-medium">
                    Add Credit Sale
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        entries.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">No entries.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {entries.map((e) => (
              <div key={e.id} className="p-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  e.type === "PAYMENT_RECEIVED" || e.type === "WRITE_OFF" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {e.type === "PAYMENT_RECEIVED" || e.type === "WRITE_OFF" ? (
                    <ArrowDown size={14} className="text-green-600" />
                  ) : (
                    <ArrowUp size={14} className="text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor(e.type)}`}>
                      {e.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-800 truncate">{e.customer?.name}</div>
                  {e.description && <div className="text-xs text-slate-500 truncate">{e.description}</div>}
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${
                    e.type === "PAYMENT_RECEIVED" || e.type === "WRITE_OFF" ? "text-green-600" : "text-red-600"
                  }`}>
                    {e.type === "PAYMENT_RECEIVED" || e.type === "WRITE_OFF" ? "-" : "+"}৳{Number(e.amount).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">Bal: ৳{Number(e.balance).toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Credit Entry</h2>
              <button onClick={() => { setShowForm(false); setSelectedCustomer(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {selectedCustomer ? (
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl">
                  <User className="text-blue-600" size={18} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{selectedCustomer.name || selectedCustomer.customer?.name}</div>
                    <div className="text-xs text-slate-500">{selectedCustomer.phone || selectedCustomer.customer?.phone}</div>
                  </div>
                  {view === "customers" && (
                    <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs text-blue-600">Change</button>
                  )}
                </div>
              ) : (
                <select required value="" onChange={(e) => setSelectedCustomer({ id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="">Select customer *</option>
                  {allCustomers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                  ))}
                </select>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "SALE_ON_CREDIT", l: "Credit Sale" },
                    { v: "PAYMENT_RECEIVED", l: "Payment" },
                    { v: "ADJUSTMENT", l: "Adjustment" },
                    { v: "WRITE_OFF", l: "Write-off" },
                  ].map(t => (
                    <button key={t.v} type="button" onClick={() => setForm({ ...form, type: t.v })}
                      className={`py-2 rounded-xl text-xs font-medium border ${
                        form.type === t.v ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200"
                      }`}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Amount (৳) *</label>
                <input required type="number" min={1} step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              {form.type === "PAYMENT_RECEIVED" && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["CASH", "BKASH", "NAGAD"].map(m => (
                      <button key={m} type="button" onClick={() => setForm({ ...form, paymentMethod: m })}
                        className={`py-2 rounded-xl text-xs font-medium border ${
                          form.paymentMethod === m ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200"
                        }`}>{m}</button>
                    ))}
                  </div>
                </div>
              )}

              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="Description"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

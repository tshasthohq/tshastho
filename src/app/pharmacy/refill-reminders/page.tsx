"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Repeat, Plus, X, User, Pill, Calendar, Clock, CheckCircle } from "lucide-react";

export default function RefillRemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ customerId: "", medicineId: "", reminderDate: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const [rRes, cRes, mRes] = await Promise.all([
      fetch("/api/pharmacy/refill-reminders", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/customers/list", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
      fetch("/api/pharmacy/medicines", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]);
    setReminders(rRes.reminders || []);
    setCustomers(cRes.customers || []);
    setMedicines(mRes.medicines || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.medicineId || !form.reminderDate) {
      setMessage("All fields required");
      return;
    }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/refill-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ customerId: "", medicineId: "", reminderDate: "", notes: "" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const isOverdue = (date: string) => new Date(date) < new Date();

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Refill Reminders</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Remind customers to refill their regular medicines.
      </p>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : reminders.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Repeat className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No refill reminders.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 truncate">{r.customer?.name || "Customer"}</div>
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                    <Pill size={10} /> {r.medicine?.name}
                  </div>
                  {r.customer?.phone && (
                    <div className="text-xs text-slate-500 mt-1">{r.customer.phone}</div>
                  )}
                  {r.notes && <div className="text-xs text-slate-600 mt-1">{r.notes}</div>}
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  r.reminderSent ? "bg-green-100 text-green-700" :
                  isOverdue(r.reminderDate) ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {r.reminderSent ? <CheckCircle size={10} /> : <Clock size={10} />}
                  {new Date(r.reminderDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">New Refill Reminder</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Customer *</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || c.email || c.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Medicine *</label>
                <select value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="">Select medicine</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Reminder Date *</label>
                <input type="date" value={form.reminderDate} onChange={(e) => setForm({ ...form, reminderDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2} placeholder="Notes"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Add Reminder"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

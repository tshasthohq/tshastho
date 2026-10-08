"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Plus, X, ArrowDown, ArrowUp, User, Calendar } from "lucide-react";

export default function NarcoticRegisterPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    medicineId: "",
    direction: "OUT",
    quantity: 1,
    batchNumber: "",
    patientName: "",
    patientAddress: "",
    doctorName: "",
    doctorRegNo: "",
    prescriptionNo: "",
    supplierName: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [eRes, mRes] = await Promise.all([
      fetch("/api/pharmacy/narcotic-register", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/medicines", { credentials: "include" }).then(r => r.json()),
    ]);
    setEntries(eRes.entries || []);
    setMedicines(mRes.medicines || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicineId || form.quantity <= 0) { setMessage("Medicine and quantity required"); return; }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/narcotic-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ ...form, medicineId: "", quantity: 1, batchNumber: "", patientName: "", patientAddress: "", doctorName: "", doctorRegNo: "", prescriptionNo: "", notes: "" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Narcotic Register</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New Entry
        </button>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
        <p className="text-xs text-red-700">
          ⚠️ All narcotic/controlled substance movements must be logged per DGDA regulations.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No entries yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {entries.map((e) => (
            <div key={e.id} className="p-3 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                e.direction === "IN" ? "bg-green-100" : "bg-red-100"
              }`}>
                {e.direction === "IN" ? (
                  <ArrowDown size={14} className="text-green-600" />
                ) : (
                  <ArrowUp size={14} className="text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[10px] text-slate-500">{e.entryNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    e.direction === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>{e.direction}</span>
                </div>
                <div className="font-medium text-sm text-slate-800 truncate">{e.medicineName}</div>
                <div className="text-xs text-slate-500">
                  {e.patientName && <span>To: {e.patientName}</span>}
                  {e.supplierName && <span>From: {e.supplierName}</span>}
                  {e.doctorName && <span className="ml-2">Dr. {e.doctorName}</span>}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar size={9} />
                  {new Date(e.entryDate).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${e.direction === "IN" ? "text-green-600" : "text-red-600"}`}>
                  {e.direction === "IN" ? "+" : "-"}{e.quantity}
                </div>
                <div className="text-[10px] text-slate-500">Bal: {e.balance}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Narcotic Entry</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Direction *</label>
                <div className="grid grid-cols-2 gap-2">
                  {["IN", "OUT"].map(d => (
                    <button key={d} type="button" onClick={() => setForm({ ...form, direction: d })}
                      className={`py-2 rounded-xl text-sm font-medium border ${
                        form.direction === d ? "bg-red-600 text-white border-red-600" : "bg-white border-slate-200"
                      }`}>
                      {d === "IN" ? "Received (IN)" : "Sold (OUT)"}
                    </button>
                  ))}
                </div>
              </div>

              <select required value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                <option value="">Select medicine *</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input required type="number" min={1} value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  placeholder="Quantity *"
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                  placeholder="Batch #"
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              {form.direction === "OUT" && (
                <>
                  <input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    placeholder="Patient name *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={form.patientAddress} onChange={(e) => setForm({ ...form, patientAddress: e.target.value })}
                    placeholder="Patient address" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                    placeholder="Prescribing doctor *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.doctorRegNo} onChange={(e) => setForm({ ...form, doctorRegNo: e.target.value })}
                      placeholder="Doctor Reg #" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                    <input value={form.prescriptionNo} onChange={(e) => setForm({ ...form, prescriptionNo: e.target.value })}
                      placeholder="Rx #" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                </>
              )}

              {form.direction === "IN" && (
                <input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                  placeholder="Supplier name *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              )}

              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2} placeholder="Notes"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Record Entry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

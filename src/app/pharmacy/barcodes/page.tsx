"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Barcode, Plus, Trash2, Printer, Search, X, Package } from "lucide-react";

export default function BarcodesPage() {
  const { user } = useAuth();
  const [barcodes, setBarcodes] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ medicineId: "", barcode: "", type: "EAN13", isPrimary: true });

  const load = async () => {
    setLoading(true);
    const [bRes, mRes] = await Promise.all([
      fetch("/api/pharmacy/barcodes", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/medicines", { credentials: "include" }).then(r => r.json()),
    ]);
    setBarcodes(bRes.barcodes || []);
    setMedicines(mRes.medicines || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicineId || !form.barcode) { setMessage("Medicine and barcode required"); return; }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/barcodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ medicineId: "", barcode: "", type: "EAN13", isPrimary: true });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this barcode?")) return;
    await fetch(`/api/pharmacy/barcodes?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const autoGenerate = () => {
    const prefix = "TSH";
    const rand = Date.now().toString().slice(-8);
    setForm({ ...form, barcode: `${prefix}${rand}` });
  };

  const filtered = barcodes.filter(b =>
    !search ||
    b.barcode.toLowerCase().includes(search.toLowerCase()) ||
    b.medicine?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Barcode className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Barcodes</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/pharmacy/barcodes/print"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Printer size={16} /> Print Labels
          </Link>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by medicine or barcode..."
          className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm" />
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Barcode className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No barcodes yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {filtered.map((b) => (
            <div key={b.id} className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Barcode className="text-blue-600" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{b.medicine?.name}</div>
                <div className="text-xs text-slate-500">{b.medicine?.brand}</div>
                <div className="font-mono text-xs text-slate-600 mt-0.5">{b.barcode}</div>
              </div>
              {b.isPrimary && (
                <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">PRIMARY</span>
              )}
              <button onClick={() => handleDelete(b.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold">Add Barcode</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <select required value={form.medicineId}
                onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                <option value="">Select medicine *</option>
                {medicines.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} {m.brand ? `— ${m.brand}` : ""}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <input required value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Barcode *"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono" />
                <button type="button" onClick={autoGenerate}
                  className="bg-slate-100 text-slate-700 px-3 rounded-xl text-xs font-medium">
                  Auto
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPrimary}
                  onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
                Primary barcode
              </label>

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Add Barcode"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

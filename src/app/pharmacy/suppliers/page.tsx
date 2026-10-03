"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Phone, Mail, MapPin, X, Search, Edit, Trash2 } from "lucide-react";

export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", companyName: "", phone: "", email: "", address: "", contactPerson: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/suppliers", { credentials: "include" });
    const data = await res.json();
    setSuppliers(data.suppliers || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const resetForm = () => {
    setForm({ name: "", companyName: "", phone: "", email: "", address: "", contactPerson: "", notes: "" });
    setEditing(null);
    setMessage("");
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name || "",
      companyName: s.companyName || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      contactPerson: s.contactPerson || "",
      notes: s.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const url = editing ? `/api/pharmacy/suppliers/${editing.id}` : "/api/pharmacy/suppliers";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setShowForm(false);
      resetForm();
      load();
    } else {
      setMessage(data.message || "Failed to save supplier");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    await fetch(`/api/pharmacy/suppliers/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const filtered = suppliers.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.companyName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">Suppliers</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No suppliers yet. Add your first supplier.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-800">{s.name}</h3>
                  {s.companyName && <p className="text-xs text-slate-500">{s.companyName}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2"><Phone size={14} /> {s.phone}</div>
                {s.email && <div className="flex items-center gap-2"><Mail size={14} /> {s.email}</div>}
                {s.address && <div className="flex items-center gap-2"><MapPin size={14} /> {s.address}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">{editing ? "Edit Supplier" : "New Supplier"}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Supplier Name *"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Company Name"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone *"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Contact Person"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Address" rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes" rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Plus, X, MapPin, Phone, Star } from "lucide-react";

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", code: "", address: "", area: "", city: "", phone: "" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/branches", { credentials: "include" });
    const data = await res.json();
    setBranches(data.branches || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", code: "", address: "", area: "", city: "", phone: "" });
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
          <Building2 className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Branches</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : branches.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No branches yet.
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((b) => (
            <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{b.name}</h3>
                    {b.isMainBranch && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                        <Star size={10} /> Main
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">{b.code}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  b.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                }`}>
                  {b.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-1 text-sm text-slate-600 mb-2">
                <div className="flex items-center gap-2"><MapPin size={14} /> {b.address}</div>
                {b.phone && <div className="flex items-center gap-2"><Phone size={14} /> {b.phone}</div>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Staff</div>
                  <div className="font-bold text-slate-800">{b._count?.staffAssign || 0}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Stock Items</div>
                  <div className="font-bold text-slate-800">{b._count?.stocks || 0}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">New Branch</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Branch name *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="Code (e.g. DHA-01) *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Address *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Area" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Create Branch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

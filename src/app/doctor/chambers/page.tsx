"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Plus, MapPin, Phone, Star, X, Edit, Trash2 } from "lucide-react";

export default function ChambersPage() {
  const { user } = useAuth();
  const [chambers, setChambers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    area: "",
    city: "",
    phone: "",
    defaultFee: 0,
    isPrimary: false,
    operatingHours: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/doctor/chambers", { credentials: "include" });
    const data = await res.json();
    setChambers(data.chambers || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const resetForm = () => {
    setForm({ name: "", address: "", area: "", city: "", phone: "", defaultFee: 0, isPrimary: false, operatingHours: "", notes: "" });
    setEditing(null);
    setMessage("");
  };

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name || "",
      address: c.address || "",
      area: c.area || "",
      city: c.city || "",
      phone: c.phone || "",
      defaultFee: Number(c.defaultFee) || 0,
      isPrimary: c.isPrimary || false,
      operatingHours: c.operatingHours || "",
      notes: c.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const url = editing ? `/api/doctor/chambers/${editing.id}` : "/api/doctor/chambers";
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
      setMessage(data.message || "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this chamber?")) return;
    const res = await fetch(`/api/doctor/chambers/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };
// PART2

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">My Chambers</h1>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Add all your practice chambers here. You can select a chamber when creating walk-in prescriptions.
      </p>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : chambers.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Building2 className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm mb-1">No chambers added yet.</p>
          <p className="text-xs text-slate-400 mb-3">Add your chambers to streamline walk-in prescriptions.</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium">
            <Plus size={14} /> Add your first chamber
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {chambers.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 truncate">{c.name}</h3>
                    {c.isPrimary && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium whitespace-nowrap">
                        <Star size={10} /> Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-1 text-xs text-slate-500">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{c.address}{c.area ? `, ${c.area}` : ""}{c.city ? `, ${c.city}` : ""}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Phone size={12} /> {c.phone}
                    </div>
                  )}
                  {c.operatingHours && (
                    <div className="text-xs text-slate-500 mt-1">🕐 {c.operatingHours}</div>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg mt-2">
                <div className="text-[10px] text-slate-500">Default Fee</div>
                <div className="text-sm font-bold text-slate-800">৳ {Number(c.defaultFee).toFixed(0)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">{editing ? "Edit Chamber" : "New Chamber"}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Chamber name (e.g. Popular Diagnostic Dhanmondi) *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address *" rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <div className="grid grid-cols-2 gap-2">
                <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Area" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Chamber phone" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <input value={form.operatingHours} onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
                placeholder="Operating hours (e.g. 5PM - 9PM, Sat-Thu)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Default Consultation Fee (৳)</label>
                <input type="number" min={0} value={form.defaultFee}
                  onChange={(e) => setForm({ ...form, defaultFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPrimary}
                  onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
                Set as primary chamber
              </label>

              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2} placeholder="Notes (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Update Chamber" : "Create Chamber"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { FileText, Plus, Trash2, Edit, Star, X, Save } from "lucide-react";

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    chiefComplaint: "",
    examination: "",
    diagnosis: "",
    investigations: "",
    advice: "",
    isPublic: false,
  });
  const [items, setItems] = useState<any[]>([
    { medicineName: "", strength: "", dosage: "", frequency: "", duration: "", quantity: "", beforeAfterMeal: "", instructions: "" },
  ]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/doctor/prescription-templates", { credentials: "include" });
    const data = await res.json();
    setTemplates(data.templates || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const resetForm = () => {
    setForm({ name: "", chiefComplaint: "", examination: "", diagnosis: "", investigations: "", advice: "", isPublic: false });
    setItems([{ medicineName: "", strength: "", dosage: "", frequency: "", duration: "", quantity: "", beforeAfterMeal: "", instructions: "" }]);
    setEditing(null);
    setMessage("");
  };

  const addItem = () => setItems([...items, { medicineName: "", strength: "", dosage: "", frequency: "", duration: "", quantity: "", beforeAfterMeal: "", instructions: "" }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, field: string, value: any) => setItems(items.map((it, idx) => idx === i ? { ...it, [field]: value } : it));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setMessage("Template name required"); return; }
    if (items.some(i => !i.medicineName.trim())) { setMessage("All medicine names required"); return; }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/doctor/prescription-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, items: items.filter(i => i.medicineName.trim()) }),
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
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/doctor/prescription-templates/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };
// PART2

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Rx Templates</h1>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Save common prescriptions as templates for quick access.
      </p>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <FileText className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No templates yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 truncate">{t.name}</h3>
                    {t.isPublic && <Star size={12} className="text-amber-500 fill-amber-500" />}
                  </div>
                  {t.diagnosis && <div className="text-xs text-slate-500 truncate">Dx: {t.diagnosis}</div>}
                  <div className="text-xs text-slate-500 mt-1">
                    {t.items?.length || 0} medicines • Used {t.usageCount || 0} times
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {t.items?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.items.slice(0, 4).map((it: any, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                      {it.medicineName}
                    </span>
                  ))}
                  {t.items.length > 4 && (
                    <span className="px-2 py-0.5 text-slate-500 text-[10px]">+{t.items.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">New Template</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Template name (e.g. Common Cold) *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="Diagnosis" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                placeholder="Chief Complaint" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={form.advice} onChange={(e) => setForm({ ...form, advice: e.target.value })}
                placeholder="Advice" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublic}
                  onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                Share with other doctors
              </label>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-slate-600">Medicines *</label>
                  <button type="button" onClick={addItem} className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-2 mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500">Rx #{idx + 1}</span>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-500">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <input value={item.medicineName} onChange={(e) => updateItem(idx, "medicineName", e.target.value)}
                      placeholder="Medicine name *"
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm mb-1" />
                    <div className="grid grid-cols-2 gap-1">
                      <input value={item.strength} onChange={(e) => updateItem(idx, "strength", e.target.value)}
                        placeholder="Strength" className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      <input value={item.frequency} onChange={(e) => updateItem(idx, "frequency", e.target.value)}
                        placeholder="1+0+1" className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                    </div>
                    <input value={item.duration} onChange={(e) => updateItem(idx, "duration", e.target.value)}
                      placeholder="Duration (7 days)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs mt-1" />
                  </div>
                ))}
              </div>

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={16} /> {saving ? "Saving..." : "Create Template"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

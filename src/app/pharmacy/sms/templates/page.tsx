"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Save, X, Edit } from "lucide-react";

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({ key: "", name: "", language: "bn", body: "", isActive: true });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/sms/templates", { credentials: "include" });
    const data = await res.json();
    setTemplates(data.templates || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleEdit = (t: any) => {
    setEditing(t);
    setForm({ key: t.key, name: t.name, language: t.language, body: t.body, isActive: t.isActive });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/sms/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      setForm({ key: "", name: "", language: "bn", body: "", isActive: true });
      load();
      setMessage("✅ Saved!");
      setTimeout(() => setMessage(""), 2000);
    } else {
      setMessage("Failed");
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">SMS Templates</h1>
      </div>

      {message && <p className="mb-3 text-sm text-center text-green-600">{message}</p>}

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : (
        <div className="space-y-2">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{t.key} • {t.language}</div>
                </div>
                <button onClick={() => handleEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit size={14} />
                </button>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-700 whitespace-pre-wrap">
                {t.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Edit Template</h2>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Message Body</label>
                <textarea required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <p className="text-[10px] text-slate-500 mt-1">
                  Variables: {"{{customerName}}"}, {"{{pharmacyName}}"}, {"{{orderNumber}}"}, {"{{amount}}"}, {"{{medicineName}}"}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={16} /> {saving ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Plus, X, Upload, Eye, Clock, CheckCircle, XCircle } from "lucide-react";

export default function MyPrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    imageUrl: "",
    doctorName: "",
    hospitalName: "",
    diagnosis: "",
    notes: "",
    items: [{ medicineName: "", strength: "", dosage: "", frequency: "", duration: "", quantity: "" }],
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/prescriptions", { credentials: "include" });
    const data = await res.json();
    setPrescriptions(data.prescriptions || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
      } else {
        setMessage("Upload failed");
      }
    } catch {
      setMessage("Upload error");
    }
    setUploading(false);
  };

  const addItem = () => {
    setForm((f) => ({ ...f, items: [...f.items, { medicineName: "", strength: "", dosage: "", frequency: "", duration: "", quantity: "" }] }));
  };

  const removeItem = (idx: number) => {
    if (form.items.length === 1) return;
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => i === idx ? { ...it, [field]: value } : it),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) { setMessage("Please upload prescription image"); return; }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/prescriptions/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...form,
        items: form.items.filter((i) => i.medicineName.trim()),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({
        imageUrl: "", doctorName: "", hospitalName: "", diagnosis: "", notes: "",
        items: [{ medicineName: "", strength: "", dosage: "", frequency: "", duration: "", quantity: "" }],
      });
      load();
    } else {
      setMessage(data.message || "Failed to upload");
    }
  };
// CONTINUES

  const statusColor = (s: string) => {
    switch (s) {
      case "VERIFIED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "EXPIRED": return "bg-slate-100 text-slate-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "VERIFIED": return CheckCircle;
      case "REJECTED": return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">My Prescriptions</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Upload
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No prescriptions yet. Upload your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p) => {
            const StatusIcon = statusIcon(p.status);
            return (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="flex gap-3">
                  <img src={p.imageUrl} alt="Rx" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                        <StatusIcon size={10} /> {p.status}
                      </span>
                    </div>
                    {p.doctorName && <div className="text-xs text-slate-600">Dr. {p.doctorName}</div>}
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.items?.length || 0} medicines • {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                    {p.rejectionReason && (
                      <div className="text-xs text-red-600 mt-1">{p.rejectionReason}</div>
                    )}
                  </div>
                  <button onClick={() => setSelected(p)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg self-start">
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Upload Prescription</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Prescription Image *</label>
                {form.imageUrl ? (
                  <div className="relative">
                    <img src={form.imageUrl} alt="Preview" className="w-full rounded-xl border border-slate-200 max-h-60 object-contain bg-slate-50" />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400">
                    <Upload size={20} className="text-slate-400 mb-1" />
                    <span className="text-sm text-slate-500">{uploading ? "Uploading..." : "Click to upload"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                  placeholder="Doctor name" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <input value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                  placeholder="Hospital" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="Diagnosis (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-slate-600">Medicines (optional)</label>
                  <button type="button" onClick={addItem} className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((it, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-slate-500">#{idx + 1}</span>
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-500">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <input value={it.medicineName} onChange={(e) => updateItem(idx, "medicineName", e.target.value)}
                        placeholder="Medicine name"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm mb-1" />
                      <div className="grid grid-cols-2 gap-1">
                        <input value={it.strength} onChange={(e) => updateItem(idx, "strength", e.target.value)}
                          placeholder="Strength" className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                        <input value={it.frequency} onChange={(e) => updateItem(idx, "frequency", e.target.value)}
                          placeholder="Frequency" className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2} placeholder="Additional notes" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving || uploading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Uploading..." : "Upload Prescription"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Prescription</h3>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <img src={selected.imageUrl} alt="Rx" className="w-full rounded-xl border border-slate-200 max-h-72 object-contain bg-slate-50 mb-3" />
            {selected.doctorName && <div className="text-sm mb-1"><span className="text-slate-500">Doctor:</span> {selected.doctorName}</div>}
            {selected.hospitalName && <div className="text-sm mb-1"><span className="text-slate-500">Hospital:</span> {selected.hospitalName}</div>}
            {selected.diagnosis && <div className="text-sm mb-2"><span className="text-slate-500">Diagnosis:</span> {selected.diagnosis}</div>}
            {selected.items?.length > 0 && (
              <div className="text-sm space-y-1 bg-slate-50 p-3 rounded-xl">
                {selected.items.map((it: any) => (
                  <div key={it.id} className="text-xs">
                    <span className="font-medium">{it.medicineName}</span> {it.strength}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

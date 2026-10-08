"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Award, Plus, X, Printer, Trash2, User, Calendar } from "lucide-react";

const TYPES = [
  { v: "FITNESS", l: "Fitness Certificate" },
  { v: "SICK_LEAVE", l: "Sick Leave" },
  { v: "MEDICAL_FITNESS", l: "Medical Fitness" },
  { v: "DISABILITY", l: "Disability" },
  { v: "VACCINATION", l: "Vaccination" },
  { v: "SURGERY", l: "Surgery" },
  { v: "OTHER", l: "Other" },
];

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  const [form, setForm] = useState({
    type: "FITNESS",
    title: "",
    subject: "",
    body: "",
    diagnosis: "",
    validFrom: "",
    validUntil: "",
    restDays: 0,
  });

  const load = async () => {
    setLoading(true);
    const [cRes, pRes] = await Promise.all([
      fetch("/api/doctor/certificates", { credentials: "include" }).then(r => r.json()),
      fetch("/api/doctor/local-patients", { credentials: "include" }).then(r => r.json()),
    ]);
    setCerts(cRes.certificates || []);
    setPatients(pRes.patients || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const resetForm = () => {
    setForm({ type: "FITNESS", title: "", subject: "", body: "", diagnosis: "", validFrom: "", validUntil: "", restDays: 0 });
    setSelectedPatient(null);
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { setMessage("Select a patient"); return; }
    if (!form.subject || !form.body) { setMessage("Subject and body required"); return; }
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/doctor/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...form,
        localPatientId: selectedPatient.id,
      }),
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

  const filteredPatients = patients.filter(p =>
    !patientSearch || p.name?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const typeColor = (t: string) => {
    switch (t) {
      case "SICK_LEAVE": return "bg-red-100 text-red-700";
      case "FITNESS": return "bg-green-100 text-green-700";
      case "VACCINATION": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };
// PART2

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Award className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Certificates</h1>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : certs.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Award className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No certificates yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {certs.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-slate-500 mb-1">{c.certificateNo}</div>
                  <div className="font-bold text-slate-800 truncate">{c.subject}</div>
                  <div className="text-xs text-slate-500">
                    Patient: {c.localPatient?.name || c.patient?.name || "—"}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${typeColor(c.type)}`}>
                  {c.type}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar size={10} /> {new Date(c.createdAt).toLocaleDateString()}
                </span>
                <a href={`/verify/rx/${c.certificateNo}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 text-xs">Verify</a>
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
              <h2 className="font-bold">New Certificate</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}><X size={20} /></button>
            </div>

            <div className="p-4 space-y-3">
              {/* Patient */}
              {selectedPatient ? (
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl">
                  <User className="text-blue-600" size={18} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{selectedPatient.name}</div>
                    <div className="text-xs text-slate-500">{selectedPatient.phone}</div>
                  </div>
                  <button type="button" onClick={() => setSelectedPatient(null)} className="text-xs text-blue-600">Change</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowPatientPicker(true)}
                  className="w-full border-2 border-dashed border-slate-300 rounded-xl p-3 text-slate-500 text-sm">
                  Select patient *
                </button>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Certificate Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  {TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>

              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Subject (e.g. Medical Certificate for Office) *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={6} placeholder="Certificate body text *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="Diagnosis (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Valid From</label>
                  <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Valid Until</label>
                  <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>

              {form.type === "SICK_LEAVE" && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Rest Days</label>
                  <input type="number" min={0} value={form.restDays} onChange={(e) => setForm({ ...form, restDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
              )}

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button onClick={handleSubmit} disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Creating..." : "Create Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Picker */}
      {showPatientPicker && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Select Patient</h2>
              <button onClick={() => setShowPatientPicker(false)}><X size={20} /></button>
            </div>
            <div className="p-4">
              <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patients..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-3" />
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredPatients.map((p) => (
                  <button key={p.id} onClick={() => { setSelectedPatient(p); setShowPatientPicker(false); }}
                    className="w-full text-left bg-slate-50 hover:bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600" size={14} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.phone}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

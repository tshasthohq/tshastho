"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Suspense } from "react";
import { Plus, Trash2, Save, ArrowLeft, User, Search } from "lucide-react";

function NewPrescriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const prefillPatientId = searchParams.get("patientId") || "";
  const prefillAppointmentId = searchParams.get("appointmentId") || "";

  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    chiefComplaint: "",
    examination: "",
    diagnosis: "",
    investigations: "",
    advice: "",
    followUpDate: "",
    followUpNotes: "",
  });

  const [items, setItems] = useState<any[]>([
    { medicineName: "", strength: "", dosage: "", frequency: "", duration: "", quantity: "", beforeAfterMeal: "", instructions: "" },
  ]);

  // Load patients from doctors' appointments
  useEffect(() => {
    if (!user) return;
    fetch("/api/doctor/appointments", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        const unique = new Map();
        (d.appointments || []).forEach((a: any) => {
          if (a.patient && !unique.has(a.patient.id)) unique.set(a.patient.id, a.patient);
        });
        const list = Array.from(unique.values());
        setPatients(list);
        if (prefillPatientId) {
          const found = list.find((p: any) => p.id === prefillPatientId);
          if (found) setSelectedPatient(found);
        }
      });
  }, [user, prefillPatientId]);

  const addItem = () => {
    setItems([...items, { medicineName: "", strength: "", dosage: "", frequency: "", duration: "", quantity: "", beforeAfterMeal: "", instructions: "" }]);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { setMessage("Please select a patient"); return; }
    if (items.some(i => !i.medicineName.trim())) { setMessage("Please fill all medicine names"); return; }

    setSaving(true);
    setMessage("");

    const res = await fetch("/api/doctor/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        patientId: selectedPatient.id,
        appointmentId: prefillAppointmentId || undefined,
        ...form,
        items: items.filter(i => i.medicineName.trim()),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      router.push(`/doctor/prescriptions/${data.prescription.id}`);
    } else {
      setMessage(data.message || "Failed to create");
    }
  };

  const filteredPatients = patients.filter((p) =>
    !patientSearch || p.name?.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone?.includes(patientSearch)
  );
// PART2

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-slate-800">New Prescription</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Patient Selection */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h2 className="font-bold text-slate-800 mb-3">Patient</h2>
          {selectedPatient ? (
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={18} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-800">{selectedPatient.name}</div>
                <div className="text-xs text-slate-500">{selectedPatient.phone || selectedPatient.email}</div>
              </div>
              {!prefillPatientId && (
                <button type="button" onClick={() => setSelectedPatient(null)}
                  className="text-xs text-blue-600 font-medium">Change</button>
              )}
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patient by name or phone..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredPatients.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">No patients found. Book an appointment first.</p>
                ) : (
                  filteredPatients.map((p) => (
                    <button key={p.id} type="button" onClick={() => setSelectedPatient(p)}
                      className="w-full text-left bg-slate-50 hover:bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.phone}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Clinical Notes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <h2 className="font-bold text-slate-800">Clinical Notes</h2>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Chief Complaint</label>
            <textarea value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
              rows={2} placeholder="Patient's main complaint"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Examination Findings</label>
            <textarea value={form.examination} onChange={(e) => setForm({ ...form, examination: e.target.value })}
              rows={2} placeholder="Physical examination, vitals, etc."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Diagnosis</label>
            <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              placeholder="Primary diagnosis"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Investigations</label>
            <textarea value={form.investigations} onChange={(e) => setForm({ ...form, investigations: e.target.value })}
              rows={2} placeholder="Lab tests, imaging, etc."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-800">Medicines (Rx)</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1 text-sm text-blue-600 font-medium">
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-500">Rx #{idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <input required value={item.medicineName}
                  onChange={(e) => updateItem(idx, "medicineName", e.target.value)}
                  placeholder="Medicine name *"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2" />

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input value={item.strength} onChange={(e) => updateItem(idx, "strength", e.target.value)}
                    placeholder="Strength (500mg)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <input value={item.dosage} onChange={(e) => updateItem(idx, "dosage", e.target.value)}
                    placeholder="Dosage (1 tablet)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input value={item.frequency} onChange={(e) => updateItem(idx, "frequency", e.target.value)}
                    placeholder="Frequency (1+0+1)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <input value={item.duration} onChange={(e) => updateItem(idx, "duration", e.target.value)}
                    placeholder="Duration (7 days)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select value={item.beforeAfterMeal} onChange={(e) => updateItem(idx, "beforeAfterMeal", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="">Meal timing</option>
                    <option value="Before meal">Before meal</option>
                    <option value="After meal">After meal</option>
                    <option value="Empty stomach">Empty stomach</option>
                  </select>
                  <input value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    placeholder="Qty (optional)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>

                <input value={item.instructions} onChange={(e) => updateItem(idx, "instructions", e.target.value)}
                  placeholder="Special instructions (optional)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mt-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Advice & Follow-up */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <h2 className="font-bold text-slate-800">Advice & Follow-up</h2>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Advice</label>
            <textarea value={form.advice} onChange={(e) => setForm({ ...form, advice: e.target.value })}
              rows={2} placeholder="Lifestyle, diet, precautions"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Follow-up Date</label>
            <input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Follow-up Notes</label>
            <input value={form.followUpNotes} onChange={(e) => setForm({ ...form, followUpNotes: e.target.value })}
              placeholder="e.g. Bring reports, fasting required"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
        </div>

        {message && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{message}</div>
        )}
      </form>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
        <div className="max-w-4xl mx-auto">
          <button onClick={handleSubmit} disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={16} /> {saving ? "Saving..." : "Create Prescription"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewPrescriptionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading...</div>}>
      <NewPrescriptionForm />
    </Suspense>
  );
}

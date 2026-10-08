"use client";
import InteractionWarning from "@/components/InteractionWarning";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Save, ArrowLeft, User, Search, X } from "lucide-react";

function NewLocalRxForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const prefillPatientId = searchParams.get("patientId") || "";

  const [patients, setPatients] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedChamberId, setSelectedChamberId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", phone: "", age: "", gender: "" });
  const [saving, setSaving] = useState(false);
  const [interactionWarnings, setInteractionWarnings] = useState<any[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    chiefComplaint: "",
    examination: "",
    diagnosis: "",
    investigations: "",
    advice: "",
    followUpDate: "",
    followUpNotes: "",
    notes: "",
    fee: 0,
  });

  const [items, setItems] = useState<any[]>([
    { medicineName: "", strength: "", dosage: "", frequency: "", duration: "", quantity: "", beforeAfterMeal: "", instructions: "" },
  ]);

  const loadPatients = async () => {
    const res = await fetch("/api/doctor/local-patients", { credentials: "include" });
    const data = await res.json();
    setPatients(data.patients || []);
    return data.patients || [];
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([
      loadPatients(),
      fetch("/api/doctor/chambers", { credentials: "include" }).then(r => r.json()),
    ]).then(([pList, cRes]) => {
      setChambers(cRes.chambers || []);
      const primary = (cRes.chambers || []).find((c: any) => c.isPrimary);
      if (primary) {
        setSelectedChamberId(primary.id);
        setForm(f => ({ ...f, fee: Number(primary.defaultFee) || 0 }));
      }
      if (prefillPatientId) {
        const p = pList.find((x: any) => x.id === prefillPatientId);
        if (p) setSelectedPatient(p);
      }
    });
  }, [user, prefillPatientId]);

  const handleCreatePatient = async () => {
    if (!newPatient.name.trim()) { setMessage("Name required"); return; }
    setSaving(true);
    const res = await fetch("/api/doctor/local-patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...newPatient,
        age: newPatient.age ? Number(newPatient.age) : undefined,
        gender: newPatient.gender || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setSelectedPatient(data.patient);
      setShowNewPatientForm(false);
      setShowPatientPicker(false);
      setNewPatient({ name: "", phone: "", age: "", gender: "" });
      loadPatients();
    } else {
      setMessage(data.message || "Failed");
    }
  };

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

  const handleChamberChange = (id: string) => {
    setSelectedChamberId(id);
    const c = chambers.find((x: any) => x.id === id);
    if (c) setForm(f => ({ ...f, fee: Number(c.defaultFee) || 0 }));
  };

  const checkDrugInteractions = async () => {
    const names = items.filter(i => i.medicineName.trim()).map(i => i.medicineName.trim());
    if (names.length < 2) return [];
    try {
      const res = await fetch("/api/pharmacy/interactions/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ medicineNames: names }),
      });
      const data = await res.json();
      return data.warnings || [];
    } catch { return []; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check interactions first
    const warnings = await checkDrugInteractions();
    if (warnings.length > 0 && !showWarning) {
      setInteractionWarnings(warnings);
      setShowWarning(true);
      return;
    }
    if (!selectedPatient) { setMessage("Please select a patient"); return; }
    if (items.some(i => !i.medicineName.trim())) { setMessage("All medicine names required"); return; }
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/doctor/local-prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        localPatientId: selectedPatient.id,
        chamberId: selectedChamberId || undefined,
        ...form,
        items: items.filter(i => i.medicineName.trim()),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      router.push(`/doctor/local-rx/${data.prescription.id}`);
    } else {
      setMessage(data.message || "Failed");
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
        {/* Patient */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h2 className="font-bold text-slate-800 mb-3">Patient</h2>
          {selectedPatient ? (
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={18} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-800">{selectedPatient.name}</div>
                <div className="text-xs text-slate-500">
                  {selectedPatient.phone || "—"} {selectedPatient.age && `• ${selectedPatient.age}y`}
                </div>
              </div>
              <button type="button" onClick={() => { setSelectedPatient(null); setShowPatientPicker(true); }}
                className="text-xs text-blue-600 font-medium">Change</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowPatientPicker(true)}
              className="w-full flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-3 text-slate-500 hover:border-blue-400">
              <User size={18} />
              <span className="text-sm">Select or add patient</span>
            </button>
          )}
        </div>

        {/* Chamber */}
        {chambers.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Chamber (optional)</label>
            <select value={selectedChamberId} onChange={(e) => handleChamberChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
              <option value="">— No chamber —</option>
              {chambers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.isPrimary ? " ⭐" : ""}</option>
              ))}
            </select>
          </div>
        )}

        {/* Clinical Notes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <h2 className="font-bold text-slate-800">Clinical Notes</h2>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Chief Complaint</label>
            <textarea value={form.chiefComplaint}
              onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
              rows={2} placeholder="e.g. Fever, cough for 3 days"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Examination</label>
            <textarea value={form.examination}
              onChange={(e) => setForm({ ...form, examination: e.target.value })}
              rows={2} placeholder="Vitals, physical findings"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Diagnosis</label>
            <input value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              placeholder="Primary diagnosis"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Investigations</label>
            <textarea value={form.investigations}
              onChange={(e) => setForm({ ...form, investigations: e.target.value })}
              rows={2} placeholder="Tests, imaging"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
        </div>
// PART3

        {/* Medicines */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-800">Medicines</h2>
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
                    placeholder="Dosage (1 tab)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
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
                  placeholder="Special instructions"
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
            <input type="date" value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Follow-up Notes</label>
            <input value={form.followUpNotes}
              onChange={(e) => setForm({ ...form, followUpNotes: e.target.value })}
              placeholder="e.g. Bring reports"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Consultation Fee (৳)</label>
            <input type="number" min={0} value={form.fee}
              onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            <p className="text-[10px] text-slate-500 mt-1">
              This will auto-create a walk-in earning entry.
            </p>
          </div>
        </div>

        {message && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{message}</div>
        )}
      </form>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Total Fee</p>
            <p className="text-xl font-bold text-slate-800">৳ {form.fee.toFixed(2)}</p>
          </div>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50">
            <Save size={16} /> {saving ? "Saving..." : "Save Prescription"}
          </button>
        </div>
      </div>

      {/* Patient Picker Modal */}
      {showPatientPicker && !showNewPatientForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Select Patient</h2>
              <button onClick={() => setShowPatientPicker(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patient..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              <button onClick={() => setShowNewPatientForm(true)}
                className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                <Plus size={16} /> Add New Patient
              </button>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredPatients.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">No patients found</p>
                ) : (
                  filteredPatients.map((p) => (
                    <button key={p.id} onClick={() => { setSelectedPatient(p); setShowPatientPicker(false); }}
                      className="w-full text-left bg-slate-50 hover:bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.phone} {p.age && `• ${p.age}y`}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Patient Modal */}
      {showNewPatientForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">Add New Patient</h2>
              <button onClick={() => setShowNewPatientForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                placeholder="Full name *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                placeholder="Phone" type="tel"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                  placeholder="Age" type="number" min={0} max={150}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <select value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="">Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button onClick={handleCreatePatient} disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Add Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading...</div>}>
      <NewLocalRxForm />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Heart, AlertTriangle, Pill, Users, Plus, X, Trash2, Activity
} from "lucide-react";

const ALLERGY_TYPES = ["DRUG", "FOOD", "ENVIRONMENTAL", "OTHER"];
const SEVERITY = ["MILD", "MODERATE", "SEVERE", "LIFE_THREATENING"];
const CONDITION_TYPES = ["CONDITION", "SURGERY", "HOSPITALIZATION", "PROCEDURE"];

export default function MedicalHistoryPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"allergies" | "conditions" | "medications" | "family">("allergies");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [allergyForm, setAllergyForm] = useState({ allergen: "", type: "DRUG", severity: "MODERATE", reaction: "" });
  const [conditionForm, setConditionForm] = useState({ name: "", type: "CONDITION", diagnosedDate: "", hospital: "", doctorName: "", notes: "", isChronic: false });
  const [medicationForm, setMedicationForm] = useState({ medicineName: "", dosage: "", frequency: "", startDate: "", isOngoing: true, prescribedBy: "", notes: "" });
  const [familyForm, setFamilyForm] = useState({ relation: "", condition: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/patients/me/medical-history", { credentials: "include" });
    const d = await res.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleAdd = async (kind: string, payload: any) => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/patients/me/medical-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ kind, data: payload }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setAllergyForm({ allergen: "", type: "DRUG", severity: "MODERATE", reaction: "" });
      setConditionForm({ name: "", type: "CONDITION", diagnosedDate: "", hospital: "", doctorName: "", notes: "", isChronic: false });
      setMedicationForm({ medicineName: "", dosage: "", frequency: "", startDate: "", isOngoing: true, prescribedBy: "", notes: "" });
      setFamilyForm({ relation: "", condition: "", notes: "" });
      load();
    } else {
      setMessage(d.message || "Failed");
    }
  };

  const handleDelete = async (id: string, kind: string) => {
    if (!confirm("Remove this record?")) return;
    const res = await fetch(`/api/patients/me/medical-history?id=${id}&kind=${kind}`, {
      method: "DELETE", credentials: "include",
    });
    if (res.ok) load();
  };
// PART2

  const severityColor = (s: string) => {
    switch (s) {
      case "LIFE_THREATENING": return "bg-red-100 text-red-700";
      case "SEVERE": return "bg-orange-100 text-orange-700";
      case "MODERATE": return "bg-amber-100 text-amber-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  const tabs = [
    { k: "allergies", label: "Allergies", icon: AlertTriangle, count: data?.allergies?.length || 0 },
    { k: "conditions", label: "Conditions", icon: Heart, count: data?.conditions?.length || 0 },
    { k: "medications", label: "Medications", icon: Pill, count: data?.medications?.length || 0 },
    { k: "family", label: "Family", icon: Users, count: data?.familyHistory?.length || 0 },
  ];

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Medical History</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        This history will be visible to doctors you grant access to.
      </p>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition ${
                tab === t.k ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-700"
              }`}>
              <Icon size={18} />
              <span className="text-[10px] font-medium">{t.label}</span>
              {t.count > 0 && (
                <span className={`text-[10px] font-bold ${tab === t.k ? "text-white" : "text-blue-600"}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Allergies */}
      {tab === "allergies" && (
        <div className="space-y-2">
          {(data?.allergies || []).length === 0 ? (
            <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">
              No allergies recorded.
            </div>
          ) : (
            data.allergies.map((a: any) => (
              <div key={a.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800">{a.allergen}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${severityColor(a.severity)}`}>
                      {a.severity.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{a.type}</div>
                  {a.reaction && <div className="text-xs text-slate-600 mt-1">Reaction: {a.reaction}</div>}
                </div>
                <button onClick={() => handleDelete(a.id, "ALLERGY")} className="text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Conditions */}
      {tab === "conditions" && (
        <div className="space-y-2">
          {(data?.conditions || []).length === 0 ? (
            <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">
              No medical conditions recorded.
            </div>
          ) : (
            data.conditions.map((c: any) => (
              <div key={c.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800">{c.name}</span>
                    {c.isChronic && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">Chronic</span>}
                  </div>
                  <div className="text-xs text-slate-500">{c.type}</div>
                  {c.diagnosedDate && <div className="text-xs text-slate-500">Diagnosed: {new Date(c.diagnosedDate).toLocaleDateString()}</div>}
                  {c.hospital && <div className="text-xs text-slate-500">Hospital: {c.hospital}</div>}
                  {c.notes && <div className="text-xs text-slate-600 mt-1">{c.notes}</div>}
                </div>
                <button onClick={() => handleDelete(c.id, "CONDITION")} className="text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Medications */}
      {tab === "medications" && (
        <div className="space-y-2">
          {(data?.medications || []).length === 0 ? (
            <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">
              No current medications.
            </div>
          ) : (
            data.medications.map((m: any) => (
              <div key={m.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{m.medicineName} {m.dosage && `— ${m.dosage}`}</div>
                  {m.frequency && <div className="text-xs text-slate-500">{m.frequency}</div>}
                  {m.prescribedBy && <div className="text-xs text-slate-500">Prescribed by: {m.prescribedBy}</div>}
                  {m.startDate && <div className="text-xs text-slate-500">Since {new Date(m.startDate).toLocaleDateString()}</div>}
                </div>
                <button onClick={() => handleDelete(m.id, "MEDICATION")} className="text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Family History */}
      {tab === "family" && (
        <div className="space-y-2">
          {(data?.familyHistory || []).length === 0 ? (
            <div className="bg-white p-6 text-center rounded-2xl text-slate-500 text-sm">
              No family history recorded.
            </div>
          ) : (
            data.familyHistory.map((f: any) => (
              <div key={f.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{f.relation} — {f.condition}</div>
                  {f.notes && <div className="text-xs text-slate-600 mt-1">{f.notes}</div>}
                </div>
                <button onClick={() => handleDelete(f.id, "FAMILY")} className="text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
// PART3

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Add {tab.charAt(0).toUpperCase() + tab.slice(1, -1)}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>

            <div className="p-4 space-y-3">
              {tab === "allergies" && (
                <>
                  <input value={allergyForm.allergen} onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
                    placeholder="Allergen (e.g. Penicillin) *"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <select value={allergyForm.type} onChange={(e) => setAllergyForm({ ...allergyForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                    {ALLERGY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={allergyForm.severity} onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                    {SEVERITY.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                  <textarea value={allergyForm.reaction} onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
                    rows={2} placeholder="Reaction (rash, swelling, etc.)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <button onClick={() => handleAdd("ALLERGY", allergyForm)} disabled={saving || !allergyForm.allergen}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                    {saving ? "Saving..." : "Add Allergy"}
                  </button>
                </>
              )}

              {tab === "conditions" && (
                <>
                  <input value={conditionForm.name} onChange={(e) => setConditionForm({ ...conditionForm, name: e.target.value })}
                    placeholder="Condition name *"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <select value={conditionForm.type} onChange={(e) => setConditionForm({ ...conditionForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                    {CONDITION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="date" value={conditionForm.diagnosedDate}
                    onChange={(e) => setConditionForm({ ...conditionForm, diagnosedDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={conditionForm.hospital} onChange={(e) => setConditionForm({ ...conditionForm, hospital: e.target.value })}
                    placeholder="Hospital (optional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={conditionForm.doctorName} onChange={(e) => setConditionForm({ ...conditionForm, doctorName: e.target.value })}
                    placeholder="Doctor name (optional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <textarea value={conditionForm.notes} onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
                    rows={2} placeholder="Notes" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={conditionForm.isChronic}
                      onChange={(e) => setConditionForm({ ...conditionForm, isChronic: e.target.checked })} />
                    Chronic condition
                  </label>
                  <button onClick={() => handleAdd("CONDITION", conditionForm)} disabled={saving || !conditionForm.name}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                    {saving ? "Saving..." : "Add Condition"}
                  </button>
                </>
              )}

              {tab === "medications" && (
                <>
                  <input value={medicationForm.medicineName} onChange={(e) => setMedicationForm({ ...medicationForm, medicineName: e.target.value })}
                    placeholder="Medicine name *"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={medicationForm.dosage} onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                      placeholder="Dosage (500mg)"
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                    <input value={medicationForm.frequency} onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                      placeholder="Frequency (1+0+1)"
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <input type="date" value={medicationForm.startDate}
                    onChange={(e) => setMedicationForm({ ...medicationForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={medicationForm.prescribedBy} onChange={(e) => setMedicationForm({ ...medicationForm, prescribedBy: e.target.value })}
                    placeholder="Prescribed by (optional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={medicationForm.isOngoing}
                      onChange={(e) => setMedicationForm({ ...medicationForm, isOngoing: e.target.checked })} />
                    Currently taking
                  </label>
                  <button onClick={() => handleAdd("MEDICATION", medicationForm)} disabled={saving || !medicationForm.medicineName}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                    {saving ? "Saving..." : "Add Medication"}
                  </button>
                </>
              )}

              {tab === "family" && (
                <>
                  <input value={familyForm.relation} onChange={(e) => setFamilyForm({ ...familyForm, relation: e.target.value })}
                    placeholder="Relation (Father, Mother, etc.) *"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={familyForm.condition} onChange={(e) => setFamilyForm({ ...familyForm, condition: e.target.value })}
                    placeholder="Condition (Diabetes, etc.) *"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <textarea value={familyForm.notes} onChange={(e) => setFamilyForm({ ...familyForm, notes: e.target.value })}
                    rows={2} placeholder="Notes" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <button onClick={() => handleAdd("FAMILY", familyForm)}
                    disabled={saving || !familyForm.relation || !familyForm.condition}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                    {saving ? "Saving..." : "Add Family History"}
                  </button>
                </>
              )}

              {message && <p className="text-sm text-red-600">{message}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

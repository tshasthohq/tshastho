"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Save, Stethoscope, User, Search, X } from "lucide-react";

export default function NewReferralPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const [form, setForm] = useState({
    priority: "ROUTINE",
    reason: "",
    clinicalSummary: "",
    questionForSpecialist: "",
  });

  useEffect(() => {
    if (!user) return;
    fetch("/api/doctors?limit=200", { credentials: "include" })
      .then(r => r.json())
      .then(d => setDoctors(d.doctors || []));

    // Load local patients for this doctor
    fetch("/api/doctor/local-patients", { credentials: "include" })
      .then(r => r.json())
      .then(d => setPatients(d.patients || []));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) { setMessage("Select consulting doctor"); return; }
    if (!selectedPatient) { setMessage("Select patient"); return; }
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/doctor/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        consultingDoctorId: selectedDoctor.id,
        patientId: selectedPatient.linkedUserId || selectedPatient.userId || selectedPatient.id,
        ...form,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      router.push("/doctor/referrals");
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const filteredDoctors = doctors.filter(d =>
    !doctorSearch || d.user?.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const filteredPatients = patients.filter(p =>
    !patientSearch || p.name?.toLowerCase().includes(patientSearch.toLowerCase())
  );
// PART2

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-slate-800">New Referral</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Consulting Doctor */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h2 className="font-bold text-slate-800 mb-3">Refer to Specialist</h2>
          {selectedDoctor ? (
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Stethoscope className="text-white" size={18} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-800">Dr. {selectedDoctor.user?.name}</div>
                <div className="text-xs text-slate-500">{selectedDoctor.specialty}</div>
              </div>
              <button type="button" onClick={() => setSelectedDoctor(null)} className="text-xs text-blue-600 font-medium">Change</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowDoctorPicker(true)}
              className="w-full flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-3 text-slate-500 hover:border-blue-400">
              <Stethoscope size={18} />
              <span className="text-sm">Select consulting doctor</span>
            </button>
          )}
        </div>

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
                <div className="text-xs text-slate-500">{selectedPatient.phone}</div>
              </div>
              <button type="button" onClick={() => setSelectedPatient(null)} className="text-xs text-blue-600 font-medium">Change</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowPatientPicker(true)}
              className="w-full flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-3 text-slate-500 hover:border-blue-400">
              <User size={18} />
              <span className="text-sm">Select patient</span>
            </button>
          )}
        </div>

        {/* Priority */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="text-xs font-medium text-slate-600 mb-2 block">Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {["ROUTINE", "URGENT", "EMERGENCY"].map(p => (
              <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  form.priority === p ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <h2 className="font-bold text-slate-800">Clinical Information</h2>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Reason for Referral</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Cardiac evaluation needed"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Clinical Summary</label>
            <textarea value={form.clinicalSummary} onChange={(e) => setForm({ ...form, clinicalSummary: e.target.value })}
              rows={4} placeholder="History, examination findings, investigations..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Question for Specialist</label>
            <textarea value={form.questionForSpecialist} onChange={(e) => setForm({ ...form, questionForSpecialist: e.target.value })}
              rows={3} placeholder="What specific advice/opinion do you need?"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
        </div>

        {message && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{message}</div>}
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
        <div className="max-w-3xl mx-auto">
          <button onClick={handleSubmit} disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={16} /> {saving ? "Sending..." : "Send Referral"}
          </button>
        </div>
      </div>

      {/* Doctor Picker */}
      {showDoctorPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Select Doctor</h2>
              <button onClick={() => setShowDoctorPicker(false)}><X size={20} /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)}
                  placeholder="Search by name or specialty..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-1">
                {filteredDoctors.map((d) => (
                  <button key={d.id} onClick={() => { setSelectedDoctor(d); setShowDoctorPicker(false); }}
                    className="w-full text-left bg-slate-50 hover:bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="text-blue-600" size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">Dr. {d.user?.name}</div>
                      <div className="text-xs text-slate-500 truncate">{d.specialty}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Picker */}
      {showPatientPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Select Patient</h2>
              <button onClick={() => setShowPatientPicker(false)}><X size={20} /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patients..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-1">
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
                        <div className="text-xs text-slate-500">{p.phone}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

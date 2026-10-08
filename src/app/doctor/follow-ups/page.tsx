"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Plus, X, CheckCircle, Clock, User } from "lucide-react";

export default function FollowUpsPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "overdue" | "completed">("upcoming");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [form, setForm] = useState({ reminderDate: "", reason: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const [rRes, pRes] = await Promise.all([
      fetch(`/api/doctor/follow-ups?filter=${filter}`, { credentials: "include" }).then(r => r.json()),
      fetch("/api/doctor/local-patients", { credentials: "include" }).then(r => r.json()),
    ]);
    setReminders(rRes.reminders || []);
    setPatients(pRes.patients || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !form.reminderDate) { setMessage("Patient and date required"); return; }
    setSaving(true);
    const res = await fetch("/api/doctor/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        patientId: selectedPatient.linkedUserId || selectedPatient.userId || selectedPatient.id,
        reminderDate: form.reminderDate,
        reason: form.reason,
        notes: form.notes,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ reminderDate: "", reason: "", notes: "" });
      setSelectedPatient(null);
      load();
    } else {
      const d = await res.json();
      setMessage(d.message || "Failed");
    }
  };

  const filteredPatients = patients.filter(p =>
    !patientSearch || p.name?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const isOverdue = (date: string) => new Date(date) < new Date();

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Bell className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Follow-ups</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { k: "upcoming", l: "Upcoming" },
          { k: "overdue", l: "Overdue" },
          { k: "completed", l: "Completed" },
        ].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k as any)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${
              filter === t.k ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>{t.l}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : reminders.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Bell className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No {filter} reminders.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                r.isCompleted ? "bg-green-100" : isOverdue(r.reminderDate) ? "bg-red-100" : "bg-blue-100"
              }`}>
                {r.isCompleted ? <CheckCircle className="text-green-600" size={18} /> :
                 isOverdue(r.reminderDate) ? <Clock className="text-red-600" size={18} /> :
                 <Bell className="text-blue-600" size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">{r.patient?.name}</div>
                {r.reason && <div className="text-xs text-slate-600 truncate">{r.reason}</div>}
                <div className={`text-xs mt-1 flex items-center gap-1 ${
                  isOverdue(r.reminderDate) && !r.isCompleted ? "text-red-600" : "text-slate-500"
                }`}>
                  <Clock size={10} />
                  {new Date(r.reminderDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Add Follow-up</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {selectedPatient ? (
                <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-xl">
                  <User className="text-blue-600" size={16} />
                  <span className="text-sm">{selectedPatient.name}</span>
                  <button type="button" onClick={() => setSelectedPatient(null)} className="text-xs text-blue-600 ml-auto">Change</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowPatientPicker(true)}
                  className="w-full border-2 border-dashed border-slate-300 rounded-xl p-3 text-slate-500 text-sm">
                  Select patient *
                </button>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Reminder Date *</label>
                <input type="date" value={form.reminderDate}
                  onChange={(e) => setForm({ ...form, reminderDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Reason (e.g. Check BP after 2 weeks)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3} placeholder="Notes"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Add Reminder"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPatientPicker && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold">Select Patient</h2>
              <button onClick={() => setShowPatientPicker(false)}><X size={20} /></button>
            </div>
            <div className="p-4">
              <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-3" />
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredPatients.map((p) => (
                  <button key={p.id} onClick={() => { setSelectedPatient(p); setShowPatientPicker(false); }}
                    className="w-full text-left bg-slate-50 hover:bg-blue-50 p-2 rounded-lg">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.phone}</div>
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

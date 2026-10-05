"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar, Clock, User, CheckCircle, XCircle, AlertCircle,
  RotateCcw, X, Phone, Mail, Ban
} from "lucide-react";

const TABS = [
  { k: "", label: "Active" },
  { k: "REQUESTED", label: "Requested" },
  { k: "CONFIRMED", label: "Confirmed" },
  { k: "PATIENT_CONFIRMED", label: "Patient Confirmed" },
  { k: "COMPLETED", label: "Completed" },
  { k: "CANCELLED", label: "Cancelled" },
];

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const url = tab ? `/api/doctor/appointments?status=${tab}` : "/api/doctor/appointments";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setAppointments(data.appointments || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, tab]);

  const openAction = (apt: any, actionType: string) => {
    setSelected(apt);
    setAction(actionType);
    setReason("");
    setNotes("");
    setNewDate(apt.date);
    setNewTime(apt.time);
    setMessage("");
  };

  const closeModal = () => {
    setSelected(null);
    setAction("");
    setMessage("");
  };

  const handleAction = async () => {
    if (!selected) return;
    setProcessing(true);
    setMessage("");

    const body: any = { action };
    if (reason) body.reason = reason;
    if (action === "RESCHEDULE") {
      body.newDate = newDate;
      body.newTime = newTime;
    }
    if (action === "COMPLETE" && notes) body.notes = notes;

    const res = await fetch(`/api/doctor/appointments/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setProcessing(false);

    if (res.ok) {
      setMessage("✅ Success!");
      setTimeout(() => { closeModal(); load(); }, 800);
    } else {
      setMessage(data.message || "Action failed");
    }
  };
// PART2

  const statusColor = (s: string) => {
    switch (s) {
      case "REQUESTED": return "bg-amber-100 text-amber-700";
      case "CONFIRMED": return "bg-blue-100 text-blue-700";
      case "PATIENT_CONFIRMED": return "bg-indigo-100 text-indigo-700";
      case "RESCHEDULED": return "bg-purple-100 text-purple-700";
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "NO_SHOW": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Appointments</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              tab === t.k ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No appointments in this category.
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="text-blue-600" size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800">{apt.patient?.name || "Patient"}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <Phone size={10} /> {apt.patient?.phone || "—"}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColor(apt.status)}`}>
                  {apt.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-1.5">
                  <Calendar size={12} className="text-slate-500" />
                  <span className="font-medium">{apt.date}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-500" />
                  <span className="font-medium">{apt.time}</span>
                </div>
              </div>

              {apt.symptoms && (
                <div className="text-xs text-slate-600 bg-amber-50 p-2 rounded-lg mb-3">
                  <span className="font-medium">Symptoms:</span> {apt.symptoms}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {apt.status === "REQUESTED" && (
                  <>
                    <button onClick={() => openAction(apt, "CONFIRM")}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                      <CheckCircle size={12} /> Confirm
                    </button>
                    <button onClick={() => openAction(apt, "RESCHEDULE")}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                      <RotateCcw size={12} /> Reschedule
                    </button>
                    <button onClick={() => openAction(apt, "CANCEL")}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                      <XCircle size={12} /> Cancel
                    </button>
                  </>
                )}

                {(apt.status === "CONFIRMED" || apt.status === "PATIENT_CONFIRMED" || apt.status === "RESCHEDULED") && (
                  <>
                    <button onClick={() => openAction(apt, "COMPLETE")}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                      <CheckCircle size={12} /> Complete
                    </button>
                    <button onClick={() => openAction(apt, "RESCHEDULE")}
                      className="bg-purple-50 text-purple-600 py-2 px-3 rounded-lg text-xs font-medium">
                      <RotateCcw size={12} />
                    </button>
                    <button onClick={() => openAction(apt, "NO_SHOW")}
                      className="bg-slate-100 text-slate-700 py-2 px-3 rounded-lg text-xs font-medium">
                      <Ban size={12} />
                    </button>
                    <button onClick={() => openAction(apt, "CANCEL")}
                      className="bg-red-50 text-red-600 py-2 px-3 rounded-lg text-xs font-medium">
                      <XCircle size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold capitalize">{action.replace(/_/g, " ").toLowerCase()}</h2>
              <button onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl text-sm">
                <div className="font-medium">{selected.patient?.name}</div>
                <div className="text-xs text-slate-500">{selected.date} • {selected.time}</div>
              </div>

              {action === "RESCHEDULE" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">New Date *</label>
                    <input type="date" value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">New Time *</label>
                    <input type="time" value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                </>
              )}

              {action === "COMPLETE" && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Consultation Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    rows={3} placeholder="Notes for patient record"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
              )}

              {(action === "CANCEL" || action === "NO_SHOW") && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    {action === "CANCEL" ? "Cancellation Reason" : "Reason (optional)"}
                  </label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                    rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
              )}

              {message && <p className="text-sm text-center text-blue-600">{message}</p>}

              <button onClick={handleAction} disabled={processing}
                className={`w-full py-3 rounded-xl font-medium disabled:opacity-50 ${
                  action === "CANCEL" || action === "NO_SHOW" ? "bg-red-600 text-white" :
                  action === "CONFIRM" || action === "COMPLETE" ? "bg-green-600 text-white" :
                  "bg-blue-600 text-white"
                }`}>
                {processing ? "Processing..." : `Confirm ${action.replace(/_/g, " ").toLowerCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

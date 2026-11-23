"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageProvider";
import Link from "next/link";
import {
  Calendar, Clock, CheckCircle, XCircle, RotateCcw,
  X, Stethoscope, AlertCircle, History, Video, Plus
} from "lucide-react";

const TABS = ["", "REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const { t: tr } = useLanguage();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("");

  const [selected, setSelected] = useState<any>(null);
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const url = tab ? `/api/appointments/list?status=${tab}` : "/api/appointments/list";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {
      setAppointments([]);
    }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, tab]);

  const openAction = (apt: any, actionType: string) => {
    setSelected(apt);
    setAction(actionType);
    setReason("");
    setNewDate(apt.date);
    setNewTime(apt.time);
    setMessage("");
  };

  const closeModal = () => { setSelected(null); setAction(""); setMessage(""); };

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

    try {
      const res = await fetch(`/api/appointments/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setProcessing(false);

      if (res.ok) {
        setMessage("✅ " + tr("ap.success", "Success!"));
        setTimeout(() => { closeModal(); load(); }, 800);
      } else {
        setMessage(data.message || tr("ap.failed", "Action failed"));
      }
    } catch {
      setProcessing(false);
      setMessage(tr("ap.failed", "Action failed"));
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "REQUESTED": return "bg-amber-50 text-amber-700 border-amber-200";
      case "CONFIRMED": return "bg-blue-50 text-blue-700 border-blue-200";
      case "PATIENT_CONFIRMED": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "RESCHEDULED": return "bg-purple-50 text-purple-700 border-purple-200";
      case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELLED": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const statusLabel = (s: string) =>
    tr("ap.st." + s, tr("ap.tab." + s, String(s).replace(/_/g, " ")));

  const today = new Date(new Date().toDateString());

  const upcoming = appointments.filter(a =>
    !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status) &&
    new Date(a.date) >= today
  );

  const past = appointments.filter(a =>
    ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status) ||
    new Date(a.date) < today
  );

  const renderCard = (apt: any) => (
    <div key={apt.id} className="bg-white/90 backdrop-blur p-4 rounded-3xl border border-white shadow-[0_8px_30px_-10px_rgba(30,64,175,0.15)] relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl flex items-center justify-center shrink-0 text-blue-600">
            <Stethoscope size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-800 text-[15px] leading-snug break-words">
              {apt.doctor?.user?.name
                ? tr("ap.dr", "Dr.") + " " + apt.doctor.user.name
                : tr("ap.doctor", "Doctor")}
            </h3>
            <p className="text-xs text-blue-600 font-semibold mt-0.5 break-words">
              {apt.doctor?.specialty || tr("ap.specialist", "Specialist")}
            </p>
          </div>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusColor(apt.status)}`}>
          {statusLabel(apt.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-slate-50 rounded-2xl p-2.5 flex items-center gap-2 text-sm">
          <Calendar size={16} className="text-slate-400 shrink-0" />
          <span className="font-bold text-slate-700">{apt.date}</span>
        </div>
        <div className="bg-slate-50 rounded-2xl p-2.5 flex items-center gap-2 text-sm">
          <Clock size={16} className="text-slate-400 shrink-0" />
          <span className="font-bold text-slate-700">{apt.time}</span>
        </div>
      </div>

      {apt.consultationFee > 0 && (
        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
          {tr("ap.fee", "Consultation Fee")}: <span className="font-extrabold text-slate-800">৳{Number(apt.consultationFee).toFixed(0)}</span>
        </div>
      )}

      {apt.symptoms && (
        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mb-3 border border-slate-100">
          <span className="font-bold text-slate-800 block mb-1">{tr("ap.symptoms", "Symptoms:")}</span>
          {apt.symptoms}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
        {apt.telemedicine && ["SCHEDULED", "WAITING", "ACTIVE"].includes(apt.telemedicine.status) && (
          <Link href={`/telemedicine/${apt.telemedicine.id}`} className="flex-1 min-w-[120px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 transition-all">
            <Video size={14} /> {tr("ap.join", "Join Video Call")}
          </Link>
        )}

        {apt.status === "CONFIRMED" && (
          <button onClick={() => openAction(apt, "PATIENT_CONFIRM")} className="flex-1 min-w-[100px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all">
            <CheckCircle size={14} /> {tr("ap.confirm", "Confirm")}
          </button>
        )}

        {["REQUESTED", "CONFIRMED", "PATIENT_CONFIRMED", "RESCHEDULED"].includes(apt.status) && (
          <>
            <button onClick={() => openAction(apt, "RESCHEDULE")} className="flex-1 min-w-[100px] bg-purple-50 text-purple-700 hover:bg-purple-100 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
              <RotateCcw size={14} /> {tr("ap.reschedule", "Reschedule")}
            </button>
            <button onClick={() => openAction(apt, "CANCEL")} className="flex-1 min-w-[100px] bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
              <XCircle size={14} /> {tr("ap.cancel", "Cancel")}
            </button>
          </>
        )}

        {apt.status === "COMPLETED" && (
          <Link href="/doctors" className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
            <History size={14} /> {tr("ap.bookAgain", "Book Again")}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "linear-gradient(180deg,#eaf3ff 0%,#f6f9ff 60%,#ffffff 100%)" }}>
      <div className="p-4 max-w-3xl mx-auto pb-28">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Calendar className="text-blue-600 shrink-0" size={22} /> {tr("ap.title", "My Appointments")}
            </h1>
            <p className="text-slate-500 text-[13px] mt-1">{tr("ap.sub", "Manage your health consultations")}</p>
          </div>
          <Link href="/doctors" className="shrink-0 bg-gradient-to-r from-blue-600 to-sky-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all">
            <Plus size={16} /> {tr("ap.bookNew", "Book New")}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
          {TABS.map((k) => (
            <button
              key={k || "ALL"}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                tab === k
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/25"
                  : "bg-white/90 text-slate-600 border border-white shadow-sm"
              }`}
            >
              {tr("ap.tab." + (k || "ALL"), k || "All")}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-48 bg-white/70 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white/90 backdrop-blur p-10 text-center rounded-3xl border border-white shadow-[0_8px_30px_-10px_rgba(30,64,175,0.15)]">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">{tr("ap.emptyTitle", "No appointments found")}</h3>
            <p className="text-slate-500 text-sm mb-6">{tr("ap.emptySub", "You don't have any appointments in this category.")}</p>
            <Link href="/doctors" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md shadow-blue-500/25">
              <Stethoscope size={16} /> {tr("ap.find", "Find a Doctor")}
            </Link>
          </div>
        ) : tab === "" && upcoming.length > 0 ? (
          <div className="space-y-7">
            <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">{tr("ap.upcoming", "Upcoming")}</h2>
              <div className="space-y-4">{upcoming.map(renderCard)}</div>
            </div>
            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">{tr("ap.past", "Past")}</h2>
                <div className="space-y-4">{past.map(renderCard)}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(renderCard)}
          </div>
        )}

        {/* Action Modal */}
        {selected && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <h2 className="font-black text-lg text-slate-800">{tr("ap.act." + action, action)}</h2>
                <button onClick={closeModal} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="font-extrabold text-slate-800">
                    {tr("ap.dr", "Dr.")} {selected.doctor?.user?.name}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <Calendar size={14} /> {selected.date} <Clock size={14} /> {selected.time}
                  </div>
                </div>

                {action === "RESCHEDULE" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">{tr("ap.newDate", "New Date")}</label>
                      <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">{tr("ap.newTime", "New Time")}</label>
                      <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">{tr("ap.reasonOpt", "Reason (Optional)")}</label>
                      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder={tr("ap.reschedulePh", "Why do you want to reschedule?")} />
                    </div>
                  </div>
                )}

                {action === "CANCEL" && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">{tr("ap.cancelReason", "Cancellation Reason")}</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder={tr("ap.cancelPh", "Please let us know why...")} />
                  </div>
                )}

                {action === "PATIENT_CONFIRM" && (
                  <div className="text-center p-2">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={32} className="text-emerald-500" />
                    </div>
                    <p className="text-slate-600 text-sm">
                      {tr("ap.confirmText", "Confirm that you'll attend this appointment on {d} at {t}.")
                        .replace("{d}", selected.date)
                        .replace("{t}", selected.time)}
                    </p>
                  </div>
                )}

                {message && (
                  <p className={`text-center text-sm font-semibold p-3 rounded-2xl ${message.includes("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{message}</p>
                )}

                <button
                  onClick={handleAction}
                  disabled={processing}
                  className={`w-full py-3.5 rounded-2xl font-black text-white transition-all disabled:opacity-50 shadow-lg ${
                    action === "CANCEL" ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/20" :
                    action === "PATIENT_CONFIRM" ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20" :
                    "bg-gradient-to-r from-blue-600 to-sky-500 shadow-blue-500/20"
                  }`}
                >
                  {processing ? tr("ap.processing", "Processing...") : tr("ap.btn." + action, "Confirm")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

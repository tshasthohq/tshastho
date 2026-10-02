"use client";
import PermissionGuard from "@/components/staff/PermissionGuard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Users, Clock, CheckCircle, AlertCircle, XCircle, MapPin, Plus, X, Save, TrendingUp, Loader2, Eye, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function AttendancePageInner() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, completed: 0, late: 0, absent: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"today" | "monthly">("today");
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualStaffId, setManualStaffId] = useState("");
  const [manualForm, setManualForm] = useState({ date: "", checkInTime: "09:00", checkOutTime: "18:00", status: "PRESENT", note: "" });
  const [manualSaving, setManualSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadToday = () => {
    const email = localStorage.getItem("userEmail");
    if (!email) { setLoading(false); return; }

    fetch("/api/pharmacy/attendance/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, date: selectedDate }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.records) setRecords(data.records);
      if (data.summary) setSummary(data.summary);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  useEffect(() => { loadToday(); }, [selectedDate]);

  const loadMonthly = () => {
    setMonthlyLoading(true);
    const email = localStorage.getItem("userEmail");
    fetch("/api/pharmacy/attendance/monthly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, month: monthlyMonth }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.report) setMonthlyData(data.report);
      setMonthlyLoading(false);
    })
    .catch(() => setMonthlyLoading(false));
  };

  useEffect(() => {
    if (tab === "monthly") loadMonthly();
  }, [tab, monthlyMonth]);

  const handleManualSave = async () => {
    if (!manualStaffId) { setMessage("Please select a staff"); return; }
    if (!manualForm.date) { setMessage("Please select date"); return; }

    setManualSaving(true);
    const email = localStorage.getItem("userEmail");
    const res = await fetch("/api/pharmacy/attendance/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, staffId: manualStaffId, ...manualForm }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Manual entry saved!");
      setShowManual(false);
      setManualForm({ date: "", checkInTime: "09:00", checkOutTime: "18:00", status: "PRESENT", note: "" });
      setManualStaffId("");
      loadToday();
    } else {
      setMessage(data.message || "Failed");
    }
    setManualSaving(false);
    setTimeout(() => setMessage(""), 2500);
  };

  const formatTime = (d: any) => {
    if (!d) return "--:--";
    return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">Attendance</h1>
        <button onClick={() => setShowManual(true)} className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <Plus size={20} className="text-purple-600" />
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setTab("today")}
            className={"flex-1 py-2.5 rounded-xl text-sm font-medium transition " + (tab === "today" ? "bg-teal-600 text-white" : "text-slate-600")}
          >
            Today
          </button>
          <button
            onClick={() => setTab("monthly")}
            className={"flex-1 py-2.5 rounded-xl text-sm font-medium transition " + (tab === "monthly" ? "bg-teal-600 text-white" : "text-slate-600")}
          >
            Monthly Report
          </button>
        </div>

        {message && (
          <p className={"text-center text-sm font-medium mb-4 " + (message.includes("✅") ? "text-green-600" : "text-red-500")}>{message}</p>
        )}

        {tab === "today" && (
          <>
            {/* Date Picker */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-2">Select Date</label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
                <Users size={18} className="text-slate-600 mb-2 mx-auto" />
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-xl font-bold text-slate-800">{summary.total}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl border border-green-200 text-center">
                <CheckCircle size={18} className="text-green-600 mb-2 mx-auto" />
                <p className="text-xs text-green-700">Working</p>
                <p className="text-xl font-bold text-green-700">{summary.present}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-center">
                <Clock size={18} className="text-blue-600 mb-2 mx-auto" />
                <p className="text-xs text-blue-700">Completed</p>
                <p className="text-xl font-bold text-blue-700">{summary.completed}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 text-center">
                <AlertCircle size={18} className="text-orange-600 mb-2 mx-auto" />
                <p className="text-xs text-orange-700">Late</p>
                <p className="text-xl font-bold text-orange-700">{summary.late}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-center">
                <XCircle size={18} className="text-red-600 mb-2 mx-auto" />
                <p className="text-xs text-red-700">Absent</p>
                <p className="text-xl font-bold text-red-700">{summary.absent}</p>
              </div>
            </div>

            {/* Staff Attendance List */}
            {loading ? (
              <p className="text-center text-slate-500 py-8">Loading...</p>
            ) : records.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
                <Users size={64} className="mx-auto text-slate-300 mb-4" />
                <h2 className="text-lg font-bold text-slate-800 mb-2">No staff added yet</h2>
                <p className="text-sm text-slate-500 mb-4">Add staff first to track attendance</p>
                <button onClick={() => router.push("/pharmacy/staff")} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium">
                  Add Staff
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((r) => {
                  const att = r.attendance;
                  const isLate = att?.status === "LATE";
                  const isWorking = r.status === "WORKING";
                  const isCompleted = r.status === "COMPLETED";
                  const isAbsent = r.status === "ABSENT";

                  return (
                    <div key={r.staff.id} className={"bg-white p-4 rounded-2xl shadow-sm border " + (isAbsent ? "border-red-200" : isWorking ? "border-green-300" : "border-slate-100")}>
                      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-slate-100">
                        {/* Selfie Thumbnail */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
                          {att?.checkInSelfie ? (
                            <img
                              src={att.checkInSelfie}
                              alt="selfie"
                              onClick={() => setSelectedPhoto(att.checkInSelfie)}
                              className="w-full h-full object-cover cursor-pointer"
                            />
                          ) : (
                            <Camera size={22} className="text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-slate-800 text-sm truncate">{r.staff.name}</h3>
                            {r.staff.staffRole && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                                {r.staff.staffRole}
                              </span>
                            )}
                            {isWorking && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500 text-white font-bold">● WORKING</span>}
                            {isCompleted && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold">✓ DONE</span>}
                            {isLate && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold">⚠ LATE</span>}
                            {isAbsent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">✗ ABSENT</span>}
                          </div>
                          <p className="text-xs text-slate-500">{r.staff.phone}</p>
                        </div>
                      </div>

                      {att && (
                        <>
                          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                              <p className="text-[10px] text-slate-500">Check In</p>
                              <p className="font-bold text-slate-800">{formatTime(att.checkInTime)}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                              <p className="text-[10px] text-slate-500">Check Out</p>
                              <p className="font-bold text-slate-800">{formatTime(att.checkOutTime)}</p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-lg text-center">
                              <p className="text-[10px] text-blue-700">Hours</p>
                              <p className="font-bold text-blue-700">{att.totalHours ? parseFloat(att.totalHours).toFixed(1) + "h" : "--"}</p>
                            </div>
                          </div>

                          {att.checkInLat && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <MapPin size={10} /> {att.checkInLat}, {att.checkInLng}
                            </div>
                          )}
                        </>
                      )}

                      {isAbsent && (
                        <p className="text-xs text-red-500 text-center py-2">No check-in today</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "monthly" && (
          <>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-2">Select Month</label>
              <Input type="month" value={monthlyMonth} onChange={(e) => setMonthlyMonth(e.target.value)} />
            </div>

            {monthlyLoading ? (
              <div className="text-center py-8"><Loader2 size={32} className="animate-spin text-teal-600 mx-auto" /></div>
            ) : monthlyData.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
                <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No data for this month</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyData.map((r: any) => (
                  <div key={r.staff.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                        {r.staff.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 text-sm">{r.staff.name}</h3>
                        <p className="text-xs text-slate-500">{r.staff.staffRole}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Total Hours</p>
                        <p className="font-bold text-teal-700">{r.totalHours.toFixed(1)}h</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-green-50 p-2 rounded-lg text-center">
                        <p className="text-[10px] text-green-700">Present</p>
                        <p className="font-bold text-green-700">{r.present}</p>
                      </div>
                      <div className="bg-orange-50 p-2 rounded-lg text-center">
                        <p className="text-[10px] text-orange-700">Late</p>
                        <p className="font-bold text-orange-700">{r.late}</p>
                      </div>
                      <div className="bg-red-50 p-2 rounded-lg text-center">
                        <p className="text-[10px] text-red-700">Absent</p>
                        <p className="font-bold text-red-700">{r.absent}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <p className="text-[10px] text-slate-600">Working Days</p>
                        <p className="font-bold text-slate-700">{r.workingDays}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-6 right-6 text-white p-2" onClick={() => setSelectedPhoto(null)}>
            <X size={28} />
          </button>
          <img src={selectedPhoto} alt="Selfie" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-slate-800">Manual Attendance Entry</h2>
              <button onClick={() => setShowManual(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Staff *</label>
                <select value={manualStaffId} onChange={(e) => setManualStaffId(e.target.value)} className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  <option value="">-- Choose Staff --</option>
                  {records.map(r => (
                    <option key={r.staff.id} value={r.staff.id}>{r.staff.name} ({r.staff.staffRole})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date *</label>
                <Input type="date" value={manualForm.date} onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Check In</label>
                  <Input type="time" value={manualForm.checkInTime} onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Check Out</label>
                  <Input type="time" value={manualForm.checkOutTime} onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select value={manualForm.status} onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })} className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Note (Optional)</label>
                <Input value={manualForm.note} onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })} placeholder="e.g., Emergency leave" />
              </div>

              <Button onClick={handleManualSave} disabled={manualSaving} className="w-full">
                <Save size={16} className="mr-2" />
                {manualSaving ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// WRAPPED WITH PERMISSION GUARD
export default function AttendancePage() {
  return (
    <PermissionGuard permission={["view_attendance","manage_staff"]}>
      <AttendancePageInner />
    </PermissionGuard>
  );
}

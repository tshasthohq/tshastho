"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Plus, Trash2, Save, Clock, X, CalendarX } from "lucide-react";

const DAYS = [
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
];

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"schedule" | "leaves">("schedule");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: "", endDate: "", reason: "" });

  const load = async () => {
    setLoading(true);
    const [s, l] = await Promise.all([
      fetch("/api/doctor/schedule", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
      fetch("/api/doctor/leaves", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]);
    setSchedules(s.schedules || []);
    setLeaves(l.leaves || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const addSlot = (dayOfWeek: string) => {
    setSchedules([...schedules, {
      dayOfWeek,
      startTime: "09:00",
      endTime: "13:00",
      slotDuration: 30,
      maxPatients: 10,
      slotType: "IN_PERSON",
      chamberAddress: "",
      consultationFee: 0,
    }]);
  };

  const removeSlot = (idx: number) => {
    setSchedules(schedules.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, field: string, value: any) => {
    setSchedules(schedules.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const saveSchedule = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/doctor/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ schedules }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("✅ Schedule saved!");
      load();
    } else {
      const d = await res.json();
      setMessage(d.message || "Failed");
    }
  };
// PART2

  const addLeave = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate) {
      setMessage("Please enter start and end dates");
      return;
    }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/doctor/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(leaveForm),
    });
    setSaving(false);
    if (res.ok) {
      setShowLeaveForm(false);
      setLeaveForm({ startDate: "", endDate: "", reason: "" });
      load();
      setMessage("✅ Leave added!");
    } else {
      const d = await res.json();
      setMessage(d.message || "Failed");
    }
  };

  const removeLeave = async (id: string) => {
    if (!confirm("Remove this leave?")) return;
    const res = await fetch(`/api/doctor/leaves?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  const schedulesByDay = DAYS.map(d => ({
    ...d,
    slots: schedules.map((s, idx) => ({ ...s, _idx: idx })).filter(s => s.dayOfWeek === d.value),
  }));
// PART3

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Schedule & Availability</h1>
      </div>

      <div className="flex gap-2 mb-4 bg-white rounded-xl p-1 border border-slate-100">
        <button onClick={() => setTab("schedule")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === "schedule" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
          Weekly Schedule
        </button>
        <button onClick={() => setTab("leaves")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === "leaves" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
          Leaves
        </button>
      </div>

      {message && <p className="mb-3 text-sm text-center text-green-600">{message}</p>}

      {tab === "schedule" && (
        <>
          <div className="space-y-4">
            {schedulesByDay.map((day) => (
              <div key={day.value} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800">{day.label}</h3>
                  <button onClick={() => addSlot(day.value)}
                    className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                    <Plus size={14} /> Add Slot
                  </button>
                </div>

                {day.slots.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">No slots</p>
                ) : (
                  <div className="space-y-2">
                    {day.slots.map((slot) => (
                      <div key={slot._idx} className="bg-slate-50 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                            <Clock size={12} /> Time Slot
                          </div>
                          <button onClick={() => removeSlot(slot._idx)} className="text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 block">Start</label>
                            <input type="time" value={slot.startTime}
                              onChange={(e) => updateSlot(slot._idx, "startTime", e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">End</label>
                            <input type="time" value={slot.endTime}
                              onChange={(e) => updateSlot(slot._idx, "endTime", e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm" />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 block">Slot (min)</label>
                            <input type="number" value={slot.slotDuration}
                              onChange={(e) => updateSlot(slot._idx, "slotDuration", Number(e.target.value))}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Max Patients</label>
                            <input type="number" value={slot.maxPatients}
                              onChange={(e) => updateSlot(slot._idx, "maxPatients", Number(e.target.value))}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Fee (৳)</label>
                            <input type="number" value={slot.consultationFee || 0}
                              onChange={(e) => updateSlot(slot._idx, "consultationFee", Number(e.target.value))}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 block">Type</label>
                            <select value={slot.slotType}
                              onChange={(e) => updateSlot(slot._idx, "slotType", e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm bg-white">
                              <option value="IN_PERSON">In-Person</option>
                              <option value="ONLINE">Online</option>
                              <option value="BOTH">Both</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Chamber</label>
                            <input value={slot.chamberAddress || ""}
                              onChange={(e) => updateSlot(slot._idx, "chamberAddress", e.target.value)}
                              placeholder="Optional"
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
            <div className="max-w-5xl mx-auto">
              <button onClick={saveSchedule} disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={16} /> {saving ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        </>
      )}

      {tab === "leaves" && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowLeaveForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
              <Plus size={16} /> Add Leave
            </button>
          </div>

          {leaves.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
              No leaves scheduled.
            </div>
          ) : (
            <div className="space-y-2">
              {leaves.map((l) => (
                <div key={l.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <CalendarX className="text-red-500 mt-0.5" size={18} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                    </div>
                    {l.reason && <div className="text-xs text-slate-500 mt-0.5">{l.reason}</div>}
                  </div>
                  <button onClick={() => removeLeave(l.id)} className="text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showLeaveForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="font-bold">Add Leave</h2>
                  <button onClick={() => setShowLeaveForm(false)}><X size={20} /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Start Date *</label>
                    <input type="date" value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">End Date *</label>
                    <input type="date" value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Reason</label>
                    <input value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      placeholder="Optional" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <button onClick={addLeave} disabled={saving}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                    {saving ? "Adding..." : "Add Leave"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

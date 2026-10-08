"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Users, MapPin, Clock, AlertTriangle, CheckCircle, Camera, User, Building2 } from "lucide-react";

export default function StaffAttendanceDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/doctor/staff-attendance/today", { credentials: "include" });
    const d = await res.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const interval = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-center text-slate-500">No data</div>;

  const presentCount = data.staff.filter((s: any) => s.attendance?.isPresent).length;
  const totalCount = data.staff.length;
  const lateCount = data.staff.filter((s: any) => s.attendance?.isLate).length;
  const absentCount = data.staff.filter((s: any) => !s.attendance).length;

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Users className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Staff Attendance</h1>
        </div>
        <Link href="/doctor/staff"
          className="text-sm text-blue-600 font-medium">Manage Staff →</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-green-50 border border-green-100 p-3 rounded-2xl">
          <div className="text-xs text-green-700 mb-1 flex items-center gap-1">
            <CheckCircle size={12} /> Present
          </div>
          <div className="text-2xl font-bold text-green-700">{presentCount}</div>
        </div>
        <div className="bg-red-50 border border-red-100 p-3 rounded-2xl">
          <div className="text-xs text-red-700 mb-1 flex items-center gap-1">
            <AlertTriangle size={12} /> Late
          </div>
          <div className="text-2xl font-bold text-red-700">{lateCount}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Clock size={12} /> Absent
          </div>
          <div className="text-2xl font-bold text-slate-700">{absentCount}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl">
          <div className="text-xs text-blue-700 mb-1 flex items-center gap-1">
            <User size={12} /> Total
          </div>
          <div className="text-2xl font-bold text-blue-700">{totalCount}</div>
        </div>
      </div>

      {/* Live Staff List */}
      <h2 className="text-sm font-bold text-slate-600 mb-2">Today — {new Date(data.today).toLocaleDateString()}</h2>

      {data.staff.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Users className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm mb-3">No active staff.</p>
          <Link href="/doctor/staff" className="text-blue-600 text-sm font-medium">
            Add staff →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {data.staff.map((s: any) => {
            const att = s.attendance;
            const status = !att ? "ABSENT" : att.isPresent ? "PRESENT" : "CHECKED_OUT";
            const statusColor = {
              PRESENT: "bg-green-100 text-green-700",
              CHECKED_OUT: "bg-blue-100 text-blue-700",
              ABSENT: "bg-slate-100 text-slate-600",
            }[status];

            return (
              <div key={s.staffId} className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-blue-600" size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">{s.name}</div>
                      <div className="text-xs text-slate-500">
                        {s.role} {s.phone && `• ${s.phone}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor}`}>
                      {status === "CHECKED_OUT" ? "DONE" : status}
                    </span>
                    {att?.isLate && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-red-100 text-red-700">
                        Late {att.lateMinutes}m
                      </span>
                    )}
                    {att?.isEarlyLeave && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-orange-100 text-orange-700">
                        Early {att.earlyMinutes}m
                      </span>
                    )}
                  </div>
                </div>

                {s.chambers?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {s.chambers.map((c: any) => (
                      <span key={c.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] flex items-center gap-1">
                        <Building2 size={9} /> {c.name}
                      </span>
                    ))}
                  </div>
                )}

                {att ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-50 p-2 rounded-lg">
                      <div className="text-green-700 text-[10px]">In</div>
                      <div className="font-bold text-slate-800">
                        {new Date(att.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {att.chamber && (
                        <div className="text-[9px] text-slate-500 truncate">{att.chamber}</div>
                      )}
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-slate-500 text-[10px]">Out</div>
                      <div className="font-bold text-slate-800">
                        {att.checkOutAt
                          ? new Date(att.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-2">
                    Not checked in today
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center text-[10px] text-slate-400">
        Auto-refreshing every 30 seconds
      </div>
    </div>
  );
}

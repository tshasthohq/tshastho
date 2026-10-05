"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Briefcase, Calendar, Users, FileText, Clock, CheckCircle, Building2, LogIn, LogOut } from "lucide-react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/staff/self", { credentials: "include" });
    const d = await res.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleClock = async () => {
    setClocking(true);
    setMessage("");
    const res = await fetch("/api/staff/self", {
      method: "POST",
      credentials: "include",
    });
    const d = await res.json();
    setClocking(false);
    if (res.ok) {
      setMessage(d.action === "CHECKIN" ? "✅ Checked in!" : "✅ Checked out!");
      setTimeout(() => setMessage(""), 2000);
      load();
    } else {
      setMessage(d.message || "Failed");
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!data?.staff) return <div className="p-6 text-center text-slate-500">Not a staff member</div>;

  const { staff, todayAttendance } = data;
  const perms = staff.permissions || {};
  const isCheckedIn = todayAttendance && !todayAttendance.checkOutAt;
  const hasClockedToday = !!todayAttendance;

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Briefcase className="text-blue-600" size={22} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-800">{staff.user?.name}</h1>
          <p className="text-xs text-slate-500">
            {staff.role} • Dr. {staff.doctor?.user?.name}
          </p>
        </div>
      </div>

      {/* Clock In/Out */}
      <div className={`rounded-2xl p-4 mb-4 border ${
        isCheckedIn ? "bg-green-50 border-green-200" : "bg-white border-slate-200"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Today's Attendance</div>
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock size={14} />
              {todayAttendance ? (
                isCheckedIn ? (
                  <>Checked in at {new Date(todayAttendance.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                ) : (
                  <>Complete • {new Date(todayAttendance.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(todayAttendance.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                )
              ) : (
                "Not clocked in"
              )}
            </div>
          </div>
          <button onClick={handleClock} disabled={clocking}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 ${
              isCheckedIn ? "bg-red-50 text-red-600" : "bg-green-600 text-white"
            }`}>
            {isCheckedIn ? <><LogOut size={14} /> Check Out</> : <><LogIn size={14} /> Check In</>}
          </button>
        </div>
        {message && <p className="text-xs text-green-600 mt-2">{message}</p>}
      </div>

      {/* Assigned Chambers */}
      {staff.chamberAssignments?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
          <h2 className="text-xs font-bold text-slate-600 uppercase mb-2">Assigned Chambers</h2>
          <div className="space-y-1.5">
            {staff.chamberAssignments.map((ca: any) => (
              <div key={ca.id} className="flex items-center gap-2 text-sm text-slate-700">
                <Building2 size={14} className="text-blue-600" />
                {ca.chamber?.name}
                {ca.chamber?.address && <span className="text-xs text-slate-500">• {ca.chamber.address}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions / Quick Actions */}
      <h2 className="text-sm font-bold text-slate-600 mb-2">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {perms.canViewAppointments !== false && (
          <Link href="/doctor/appointments"
            className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-600" size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Appointments</div>
              <div className="text-[10px] text-slate-500">View & manage</div>
            </div>
          </Link>
        )}

        {perms.canViewPatients !== false && (
          <Link href="/doctor/local-patients"
            className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Users className="text-green-600" size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Patients</div>
              <div className="text-[10px] text-slate-500">Local records</div>
            </div>
          </Link>
        )}

        {perms.canCreateLocalRx && (
          <Link href="/doctor/local-rx/new"
            className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <FileText className="text-indigo-600" size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">New Rx</div>
              <div className="text-[10px] text-slate-500">Walk-in</div>
            </div>
          </Link>
        )}

        {perms.canRecordEarnings && (
          <Link href="/doctor/walk-in-earnings"
            className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-amber-600" size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Earnings</div>
              <div className="text-[10px] text-slate-500">Record</div>
            </div>
          </Link>
        )}
      </div>

      {/* Role Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="text-xs text-slate-500 mb-1">Your Role</div>
        <div className="font-bold text-slate-800">{staff.role}</div>
        <div className="text-xs text-slate-500 mt-2">
          Joined {new Date(staff.joinedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

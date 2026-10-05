"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Download, Calendar, User } from "lucide-react";

export default function AttendanceReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = async () => {
    setLoading(true);
    const from = new Date(month + "-01");
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);

    const res = await fetch(`/api/doctor/staff-attendance?from=${from.toISOString()}&to=${to.toISOString()}`, { credentials: "include" });
    const d = await res.json();
    setData(d.attendance || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, month]);

  // Group by staff
  const staffStats: any = {};
  data.forEach((a: any) => {
    const sid = a.staffId;
    if (!staffStats[sid]) {
      staffStats[sid] = {
        staff: a.staff,
        present: 0,
        absent: 0,
        late: 0,
        earlyLeave: 0,
        totalMinutes: 0,
        days: [],
      };
    }
    const s = staffStats[sid];
    s.present++;
    if (a.isLate) s.late++;
    if (a.isEarlyLeave) s.earlyLeave++;
    if (a.checkOutAt) {
      s.totalMinutes += (new Date(a.checkOutAt).getTime() - new Date(a.checkInAt).getTime()) / 60000;
    }
    s.days.push(a);
  });

  const staffList = Object.values(staffStats);

  const downloadCsv = () => {
    const rows = [["Staff", "Date", "Check In", "Check Out", "Status", "Late (min)", "Early (min)", "Chamber"]];

    data.forEach((a: any) => {
      rows.push([
        a.staff?.user?.name || "",
        a.date,
        new Date(a.checkInAt).toLocaleString(),
        a.checkOutAt ? new Date(a.checkOutAt).toLocaleString() : "",
        a.status,
        String(a.lateMinutes || 0),
        String(a.earlyMinutes || 0),
        a.chamber?.name || "",
      ]);
    });

    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Attendance Report</h1>
        </div>
        <button onClick={downloadCsv}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Download size={16} /> CSV
        </button>
      </div>

      <div className="mb-4">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : staffList.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No attendance records for this month.
        </div>
      ) : (
        <div className="space-y-3">
          {staffList.map((s: any) => (
            <div key={s.staff.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="text-blue-600" size={18} />
                </div>
                <div>
                  <div className="font-bold text-slate-800">{s.staff.user?.name}</div>
                  <div className="text-xs text-slate-500">{s.staff.role}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="bg-green-50 p-2 rounded-lg">
                  <div className="text-green-700 text-[10px]">Present</div>
                  <div className="font-bold text-slate-800">{s.present}</div>
                </div>
                <div className="bg-red-50 p-2 rounded-lg">
                  <div className="text-red-700 text-[10px]">Late</div>
                  <div className="font-bold text-slate-800">{s.late}</div>
                </div>
                <div className="bg-orange-50 p-2 rounded-lg">
                  <div className="text-orange-700 text-[10px]">Early</div>
                  <div className="font-bold text-slate-800">{s.earlyLeave}</div>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <div className="text-blue-700 text-[10px]">Hours</div>
                  <div className="font-bold text-slate-800">{Math.round(s.totalMinutes / 60)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

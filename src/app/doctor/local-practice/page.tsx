"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  Briefcase, Wallet, Users, FileText, Building2, TrendingUp,
  ArrowRight, Calendar, Plus, Stethoscope
} from "lucide-react";

export default function LocalPracticePage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/doctor/local-overview", { credentials: "include" })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-center text-slate-500">No data</div>;

  const { today, month, lifetime, counts, chambers, recentPrescriptions, todayEarningsList } = data;

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Local Practice</h1>
      </div>

      {/* Today's Total */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white mb-4 shadow-lg">
        <div className="text-xs text-blue-100 mb-1">Today's Total Income</div>
        <div className="text-3xl font-bold mb-3">৳ {today.totalIncome.toFixed(2)}</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/10 rounded-lg p-2">
            <div className="text-blue-100">Walk-in</div>
            <div className="font-bold">৳ {today.walkInEarnings.toFixed(0)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <div className="text-blue-100">Platform</div>
            <div className="font-bold">৳ {today.platformEarnings.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Users size={12} /> Patients
          </div>
          <div className="text-lg font-bold text-slate-800">{counts.localPatients}</div>
          <div className="text-[10px] text-slate-500">Local records</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Building2 size={12} /> Chambers
          </div>
          <div className="text-lg font-bold text-slate-800">{counts.chambers}</div>
          <div className="text-[10px] text-slate-500">Active</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <FileText size={12} /> Today
          </div>
          <div className="text-lg font-bold text-slate-800">{today.prescriptions}</div>
          <div className="text-[10px] text-slate-500">Prescriptions</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Calendar size={12} /> Today
          </div>
          <div className="text-lg font-bold text-slate-800">{today.walkInCount}</div>
          <div className="text-[10px] text-slate-500">Walk-in visits</div>
        </div>
      </div>

      {/* This Month */}
      <h2 className="text-sm font-bold text-slate-600 mb-2 mt-4">This Month</h2>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <div className="text-[10px] text-slate-500">Walk-in</div>
            <div className="text-base font-bold text-green-600">৳ {month.walkInEarnings.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Platform</div>
            <div className="text-base font-bold text-blue-600">৳ {month.platformEarnings.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Total</div>
            <div className="text-base font-bold text-slate-800">৳ {month.totalIncome.toFixed(0)}</div>
          </div>
        </div>
        <div className="flex justify-between text-xs border-t border-slate-100 pt-2">
          <span className="text-slate-500">{month.prescriptions} prescriptions</span>
          <span className="text-slate-500">{month.walkInCount} walk-ins</span>
        </div>
      </div>

      {/* Chamber Breakdown */}
      {Object.keys(month.chamberBreakdown || {}).length > 0 && (
        <>
          <h2 className="text-sm font-bold text-slate-600 mb-2">Chamber-wise Income (This Month)</h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 mb-4">
            {Object.entries(month.chamberBreakdown).map(([name, val]: any) => (
              <div key={name} className="p-3 flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-slate-800">{name}</div>
                  <div className="text-xs text-slate-500">{val.count} visits</div>
                </div>
                <div className="font-bold text-slate-800">৳ {val.amount.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <h2 className="text-sm font-bold text-slate-600 mb-2">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <Link href="/doctor/local-rx/new"
          className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <Plus className="text-blue-600" size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">New Rx</div>
            <div className="text-[10px] text-slate-500">Walk-in</div>
          </div>
        </Link>
        <Link href="/doctor/local-patients"
          className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-2">
          <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
            <Users className="text-green-600" size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Patients</div>
            <div className="text-[10px] text-slate-500">{counts.localPatients} total</div>
          </div>
        </Link>
        <Link href="/doctor/walk-in-earnings"
          className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-2">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <Wallet className="text-amber-600" size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Earnings</div>
            <div className="text-[10px] text-slate-500">Cash entry</div>
          </div>
        </Link>
        <Link href="/doctor/chambers"
          className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-2">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
            <Building2 className="text-purple-600" size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Chambers</div>
            <div className="text-[10px] text-slate-500">{counts.chambers} active</div>
          </div>
        </Link>
        <Link href="/doctor/prescriptions"
          className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Stethoscope className="text-indigo-600" size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Online Rx</div>
            <div className="text-[10px] text-slate-500">Digital</div>
          </div>
        </Link>
        <Link href="/doctor/appointments"
          className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-blue-300 flex items-center gap-2">
          <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
            <Calendar className="text-rose-600" size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Appointments</div>
            <div className="text-[10px] text-slate-500">Queue</div>
          </div>
        </Link>
      </div>
// PART2

      {/* Today's Earnings List */}
      {todayEarningsList?.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-slate-600 mb-2">Today's Walk-in Earnings</h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 mb-4">
            {todayEarningsList.map((e: any) => (
              <div key={e.id} className="p-3 flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    {e.patientName || "Walk-in"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {e.chamber?.name || "No chamber"} • {e.method}
                  </div>
                </div>
                <div className="font-bold text-green-600">+৳ {Number(e.amount).toFixed(0)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent Prescriptions */}
      {recentPrescriptions?.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-slate-600">Recent Prescriptions</h2>
            <Link href="/doctor/local-patients" className="text-xs text-blue-600 flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {recentPrescriptions.map((rx: any) => (
              <Link key={rx.id} href={`/doctor/local-rx/${rx.id}`}
                className="p-3 flex justify-between items-center hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {rx.localPatient?.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">{rx.prescriptionNo}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(rx.visitDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-800">৳ {Number(rx.fee).toFixed(0)}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Lifetime */}
      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-600 uppercase mb-2">Lifetime (Walk-in)</h3>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Total Earned</span>
          <span className="font-bold text-slate-800">৳ {lifetime.walkInEarnings.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Total Visits</span>
          <span className="font-bold text-slate-800">{lifetime.walkInCount}</span>
        </div>
      </div>
    </div>
  );
}

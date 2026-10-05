"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Wallet, TrendingUp, Clock, CheckCircle, ArrowRight, DollarSign } from "lucide-react";

export default function DoctorEarningsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/doctor/earnings", { credentials: "include" })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-center text-slate-500">No data</div>;

  const s = data.summary;

  const statusColor = (st: string) => {
    switch (st) {
      case "AVAILABLE": return "bg-green-100 text-green-700";
      case "PAID": return "bg-blue-100 text-blue-700";
      case "PENDING": return "bg-amber-100 text-amber-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="text-green-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Earnings</h1>
        </div>
        <Link href="/doctor/payouts"
          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          Payouts <ArrowRight size={14} />
        </Link>
      </div>

      {/* Available Balance */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white mb-4 shadow-lg">
        <div className="text-xs text-green-100 mb-1 flex items-center gap-1">
          <CheckCircle size={12} /> Available for Payout
        </div>
        <div className="text-3xl font-bold mb-2">৳ {s.available.amount.toFixed(2)}</div>
        <div className="text-xs text-green-100">{s.available.count} appointments available</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Clock size={12} /> Pending
          </div>
          <div className="text-lg font-bold text-amber-600">৳ {s.pending.amount.toFixed(0)}</div>
          <div className="text-xs text-slate-500">{s.pending.count} pending</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <CheckCircle size={12} /> Paid
          </div>
          <div className="text-lg font-bold text-blue-600">৳ {s.paid.amount.toFixed(0)}</div>
          <div className="text-xs text-slate-500">{s.paid.count} paid</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100 col-span-2 md:col-span-1">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <TrendingUp size={12} /> Lifetime
          </div>
          <div className="text-lg font-bold text-slate-800">৳ {s.lifetime.net.toFixed(0)}</div>
          <div className="text-xs text-slate-500">{s.lifetime.count} appointments</div>
        </div>
      </div>

      {/* Lifetime breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
        <h3 className="text-xs font-bold text-slate-600 uppercase mb-2">Lifetime Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Gross Earnings</span>
            <span className="font-medium">৳ {s.lifetime.gross.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Platform Fee</span>
            <span className="font-medium text-red-600">-৳ {s.lifetime.platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2">
            <span className="text-slate-800 font-bold">Net Earnings</span>
            <span className="font-bold text-green-600">৳ {s.lifetime.net.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Recent Earnings */}
      <h2 className="text-sm font-bold text-slate-600 mb-2">Recent Earnings</h2>
      {data.earnings.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No earnings yet. Complete appointments to start earning.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {data.earnings.map((e: any) => (
            <div key={e.id} className="p-3 flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {e.patient?.name || "Patient"}
                </div>
                <div className="text-xs text-slate-500">
                  {e.appointment ? `${e.appointment.date} • ${e.appointment.time}` : new Date(e.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">৳ {Number(e.netAmount).toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">Gross ৳{Number(e.grossAmount).toFixed(0)}</div>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(e.status)}`}>
                  {e.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

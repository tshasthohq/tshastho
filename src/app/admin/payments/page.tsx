"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function AdminPaymentsPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const url = filter ? `/api/admin/payments?status=${filter}` : "/api/admin/payments";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setPayments(data.payments || []);
    setStats(data.stats || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const totalCompleted = stats.find((s) => s.status === "COMPLETED")?._sum?.amount || 0;
  const totalPending = stats.find((s) => s.status === "PENDING")?._sum?.amount || 0;
  const totalRefunded = stats.find((s) => s.status === "REFUNDED")?._sum?.amount || 0;
  const countCompleted = stats.find((s) => s.status === "COMPLETED")?._count?._all || 0;

  const statusColor = (s: string) => {
    switch (s) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "FAILED": return "bg-red-100 text-red-700";
      case "REFUNDED": return "bg-purple-100 text-purple-700";
      case "PARTIALLY_REFUNDED": return "bg-orange-100 text-orange-700";
      case "CANCELLED": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
            <CheckCircle size={14} /> Completed Total
          </div>
          <div className="text-xl font-bold text-slate-800">
            ৳ {Number(totalCompleted).toFixed(2)}
          </div>
          <div className="text-xs text-slate-500">{countCompleted} transactions</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
            <Clock size={14} /> Pending
          </div>
          <div className="text-xl font-bold text-slate-800">
            ৳ {Number(totalPending).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
            <XCircle size={14} /> Refunded
          </div>
          <div className="text-xl font-bold text-slate-800">
            ৳ {Number(totalRefunded).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
            <TrendingUp size={14} /> Total Records
          </div>
          <div className="text-xl font-bold text-slate-800">{payments.length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["", "COMPLETED", "PENDING", "FAILED", "REFUNDED", "CANCELLED"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="p-6 text-center text-slate-500">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="p-6 text-center text-slate-500 bg-white rounded-2xl">
          No payments found
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Payment #</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Method</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="p-3 font-mono text-xs">{p.paymentNumber}</td>
                    <td className="p-3">
                      <div className="font-medium">{p.user?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{p.user?.email}</div>
                    </td>
                    <td className="p-3 font-bold">৳ {Number(p.amount).toFixed(2)}</td>
                    <td className="p-3">{p.method}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

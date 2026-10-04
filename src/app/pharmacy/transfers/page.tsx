"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowLeftRight, Plus, CheckCircle, Clock } from "lucide-react";

export default function TransfersPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const url = statusFilter ? `/api/pharmacy/transfers?status=${statusFilter}` : "/api/pharmacy/transfers";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setTransfers(data.transfers || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this transfer?")) return;
    const res = await fetch(`/api/pharmacy/transfers/${id}/approve`, { method: "POST", credentials: "include" });
    if (res.ok) load();
    else alert("Failed");
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Complete this transfer? Stock will be moved between branches.")) return;
    setProcessing(id);
    const res = await fetch(`/api/pharmacy/transfers/${id}/complete`, { method: "POST", credentials: "include" });
    setProcessing(null);
    if (res.ok) load();
    else {
      const d = await res.json();
      alert(d.message || "Failed");
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "APPROVED": return "bg-blue-100 text-blue-700";
      case "IN_TRANSIT": return "bg-amber-100 text-amber-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "CANCELLED": return "bg-slate-100 text-slate-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };
// CONTINUES

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Branch Transfers</h1>
        </div>
        <Link href="/pharmacy/transfers/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New
        </Link>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["", "PENDING", "APPROVED", "COMPLETED"].map((s) => (
          <button key={s || "all"} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : transfers.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">No transfers.</div>
      ) : (
        <div className="space-y-3">
          {transfers.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-mono text-xs text-slate-500">{t.transferNumber}</div>
                  <div className="text-sm mt-1">
                    <span className="font-medium text-slate-800">{t.fromBranch?.name}</span>
                    <span className="text-slate-400 mx-1">→</span>
                    <span className="font-medium text-slate-800">{t.toBranch?.name}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(t.status)}`}>
                  {t.status}
                </span>
              </div>

              <div className="text-xs text-slate-500 mb-2">
                {t.items?.length || 0} items • {new Date(t.createdAt).toLocaleDateString()}
              </div>

              {t.status === "PENDING" && (
                <button onClick={() => handleApprove(t.id)}
                  className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1">
                  <CheckCircle size={14} /> Approve
                </button>
              )}
              {t.status === "APPROVED" && (
                <button onClick={() => handleComplete(t.id)} disabled={processing === t.id}
                  className="w-full bg-green-600 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50">
                  <CheckCircle size={14} /> {processing === t.id ? "Processing..." : "Complete Transfer"}
                </button>
              )}
              {t.status === "COMPLETED" && (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-600" />
                  Completed {new Date(t.completedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/context/BranchContext";
import Link from "next/link";
import { 
  ArrowLeftRight, Plus, CheckCircle, Clock, XCircle, 
  ArrowLeft, RefreshCw, FileText, ArrowRight 
} from "lucide-react";
import PharmacyNav from "@/components/pharmacy/PharmacyNav";

export default function TransfersPage() {
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const url = `/api/pharmacy/transfers?status=${statusFilter}&branchId=${activeBranch?.id || "ALL"}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setTransfers(data.transfers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user, statusFilter, activeBranch?.id]);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this transfer?")) return;
    try {
      const res = await fetch(`/api/pharmacy/transfers/${id}/approve`, { method: "POST", credentials: "include" });
      if (res.ok) load();
      else alert("Failed to approve");
    } catch (e) {
      alert("Network error");
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Complete this transfer? Stock will be moved between branches.")) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/pharmacy/transfers/${id}/complete`, { method: "POST", credentials: "include" });
      if (res.ok) load();
      else {
        const d = await res.json();
        alert(d.message || "Failed to complete");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "APPROVED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
      case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      <PharmacyNav />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pharmacy" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <ArrowLeftRight className="text-indigo-600" size={20}/> Branch Transfers
            </h1>
          </div>
          <Link href="/pharmacy/transfers/new" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all">
            <Plus size={16} /> New Transfer
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-5 mt-2">
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {["", "PENDING", "APPROVED", "COMPLETED"].map((s) => (
            <button 
              key={s} 
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                statusFilter === s 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s || "All Status"}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : transfers.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm mt-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No transfers found</h3>
            <p className="text-slate-500 text-sm">Create a new transfer to move stock between branches.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transfers.map((t) => (
              <div key={t.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-mono font-bold text-slate-800 text-base">{t.transferNumber}</h3>
                    <p className="text-xs text-slate-500 mt-1">{new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(t.status)}`}>
                    {t.status}
                  </span>
                </div>

                {/* Route Display */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-sm">
                  <div className="font-semibold text-slate-700 truncate">{t.fromBranch?.name || "Unknown"}</div>
                  <ArrowRight size={16} className="text-indigo-400 shrink-0 mx-2" />
                  <div className="font-semibold text-slate-700 truncate text-right">{t.toBranch?.name || "Unknown"}</div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FileText size={14} />
                  {t.items?.length || 0} items requested • {new Date(t.createdAt).toLocaleDateString()}
                </div>

                <div className="mt-auto pt-2">
                  {t.status === "PENDING" && (
                    <button onClick={() => handleApprove(t.id)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5">
                      <CheckCircle size={14} /> Approve Transfer
                    </button>
                  )}
                  {t.status === "APPROVED" && (
                    <button onClick={() => handleComplete(t.id)} disabled={processing === t.id} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50">
                      {processing === t.id ? <RefreshCw size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
                      {processing === t.id ? "Processing..." : "Complete Transfer"}
                    </button>
                  )}
                  {t.status === "COMPLETED" && (
                    <div className="w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center border border-emerald-100 flex items-center justify-center gap-1.5">
                      <CheckCircle size={14} /> Transfer Completed
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

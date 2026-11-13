"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/context/BranchContext";
import Link from "next/link";
import { 
  RotateCcw, Plus, CheckCircle, Clock, XCircle, Search, 
  ArrowLeft, RefreshCw, FileText
} from "lucide-react";

export default function ReturnsPage() {
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      
      params.set("branchId", activeBranch?.id || "ALL");
      const res = await fetch(`/api/pharmacy/returns?${params}`, { credentials: "include" });
      const data = await res.json();
      setReturns(data.returns || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, typeFilter, statusFilter, activeBranch?.id]);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this return?")) return;
    try {
      const res = await fetch(`/api/pharmacy/returns/${id}/approve`, { method: "POST", credentials: "include" });
      if (res.ok) load(); else alert("Failed to approve");
    } catch { alert("Network error"); }
  };

  const handleProcess = async (id: string) => {
    if (!confirm("Process this return? Stock and ledger will be updated.")) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/pharmacy/returns/${id}/process`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) load(); 
      else alert(data.message || "Failed to process");
    } catch { alert("Network error"); }
    setProcessing(null);
  };

  const getTypeStyle = (t: string) => {
    switch (t) {
      case "CUSTOMER_RETURN": return "bg-blue-50 text-blue-700 border-blue-200";
      case "SUPPLIER_RETURN": return "bg-purple-50 text-purple-700 border-purple-200";
      case "DAMAGE_WRITE_OFF": return "bg-red-50 text-red-700 border-red-200";
      case "EXPIRED_WRITE_OFF": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "PROCESSED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "APPROVED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const filteredReturns = returns.filter(r => 
    !search || 
    r.returnNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pharmacy" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <RotateCcw className="text-indigo-600" size={20}/> Returns & Refunds
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Manage customer returns & damages</p>
            </div>
          </div>
          <Link href="/pharmacy/returns/new" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all">
            <Plus size={16} /> New Return
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-5 mt-2">
        
        {/* Filters & Search */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by return number or customer..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {["", "CUSTOMER_RETURN", "SUPPLIER_RETURN", "DAMAGE_WRITE_OFF", "EXPIRED_WRITE_OFF"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  typeFilter === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}>
                {t ? t.replace(/_/g, " ") : "All Types"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {["", "PENDING", "APPROVED", "PROCESSED"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === s ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}>
                {s || "All Status"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm mt-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No returns found</h3>
            <p className="text-slate-500 text-sm">Create a new return to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReturns.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-mono font-bold text-slate-800 text-base">{r.returnNumber}</h3>
                    <p className="text-xs text-slate-500 mt-1">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(r.status)}`}>
                    {r.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getTypeStyle(r.type)}`}>
                    {r.type.replace(/_/g, " ")}
                  </span>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {r.items?.length || 0} Items
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  {r.customerName && <div className="flex justify-between"><span className="text-slate-500">Customer:</span> <span className="font-semibold text-slate-800">{r.customerName}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-500">Total Refund:</span> <span className="font-bold text-indigo-600">৳{Number(r.totalAmount).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Method:</span> <span className="font-semibold text-slate-800">{r.refundMethod}</span></div>
                </div>

                <div className="mt-auto pt-2">
                  {r.status === "PENDING" && (
                    <button onClick={() => handleApprove(r.id)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5">
                      <CheckCircle size={14} /> Approve Return
                    </button>
                  )}
                  {r.status === "APPROVED" && (
                    <button onClick={() => handleProcess(r.id)} disabled={processing === r.id} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50">
                      {processing === r.id ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
                      {processing === r.id ? "Processing..." : (r.type === 'SUPPLIER_RETURN' ? "Process (Remove Stock)" : "Process (Add Stock)")}
                    </button>
                  )}
                  {r.status === "PROCESSED" && (
                    <div className="w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center border border-emerald-100 flex items-center justify-center gap-1.5">
                      <CheckCircle size={14} /> {r.type === 'SUPPLIER_RETURN' ? "Processed & Removed" : "Processed & Restocked"}
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

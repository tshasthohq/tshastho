"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { 
  Trash2, CheckCircle, XCircle, Clock, Calendar, 
  ArrowLeft, Package, AlertTriangle, ShieldCheck
, Search } from "lucide-react";

export default function ExpiryWriteOffPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pharmacy/expiry-write-off", { credentials: "include" });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleAction = async (id: string, action: string) => {
    if (action === "COMPLETE" && !confirm("This will permanently write off the stock. Continue?")) return;
    setProcessing(id);
    try {
      const res = await fetch("/api/pharmacy/expiry-write-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) load();
      else alert("Action failed");
    } catch (e) {
      alert("Network error");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "APPROVED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const pendingCount = requests.filter(r => r.status === "PENDING").length;
  const filteredRequests = requests.filter(r => 
    !search || 
    r.medicine?.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.batch?.batchNumber?.toLowerCase().includes(search.toLowerCase())
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
            <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Trash2 className="text-red-500" size={20}/> Expiry Write-off
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-5 mt-2">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by medicine name or batch..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>

        {/* Alert Banner */}
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <AlertTriangle className="text-amber-500" size={24} />
            <div>
              <p className="font-bold text-amber-800">Action Required</p>
              <p className="text-xs text-amber-700">{pendingCount} expired batch(es) need write-off approval.</p>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm mt-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-400" size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No pending write-offs</h3>
            <p className="text-slate-500 text-sm">Your inventory is clean and up to date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
                
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                      <Package size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{r.medicine?.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Batch: {r.batch?.batchNumber || "N/A"}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(r.status)}`}>
                    {r.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Quantity</p>
                    <p className="font-bold text-slate-800 text-sm">{r.quantity} pcs</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Expiry Date</p>
                    <p className="font-bold text-red-600 text-sm">{r.batch?.expiryDate ? new Date(r.batch.expiryDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Reason: <span className="font-medium text-slate-700">{r.reason}</span>
                </div>

                {/* Actions */}
                {r.status === "PENDING" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => handleAction(r.id, "APPROVE")} disabled={processing === r.id} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50">
                      <ShieldCheck size={14} /> Approve
                    </button>
                    <button onClick={() => handleAction(r.id, "REJECT")} disabled={processing === r.id} className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}

                {r.status === "APPROVED" && (
                  <button onClick={() => handleAction(r.id, "COMPLETE")} disabled={processing === r.id} className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 transition-colors disabled:opacity-50">
                    <Trash2 size={14} /> Complete Write-off
                  </button>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

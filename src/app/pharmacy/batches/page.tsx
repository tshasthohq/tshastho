"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { 
  Package, AlertTriangle, Clock, Search, ArrowLeft, 
  Calendar, CheckCircle2, Truck, Box
} from "lucide-react";

export default function BatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "expiring" | "expired">("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      let url = "/api/pharmacy/batches";
      if (tab === "expiring") url += "?expiring=true";
      
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      let list = data.batches || [];

      if (tab === "expired") {
        list = list.filter((b: any) => new Date(b.expiryDate) < new Date());
      }

      setBatches(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user, tab]);

  const daysUntilExpiry = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return "bg-red-50 text-red-700 border-red-200";
    if (days < 30) return "bg-orange-50 text-orange-700 border-orange-200";
    if (days < 90) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const expiringCount = batches.filter((b) => {
    const days = daysUntilExpiry(b.expiryDate);
    return days >= 0 && days <= 90;
  }).length;

  const expiredCount = batches.filter((b) => daysUntilExpiry(b.expiryDate) < 0).length;

  const filteredBatches = batches.filter(b => 
    !search || 
    b.medicine?.name?.toLowerCase().includes(search.toLowerCase()) || 
    b.batchNumber?.toLowerCase().includes(search.toLowerCase())
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
              <Box className="text-indigo-600" size={20}/> Batches & Expiry
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-5 mt-2">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Batches</p>
            <p className="text-xl font-black text-slate-800">{batches.length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm text-center">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Expiring &lt; 90d</p>
            <p className="text-xl font-black text-orange-700">{expiringCount}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm text-center">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Expired</p>
            <p className="text-xl font-black text-red-700">{expiredCount}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medicine name or batch no..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { key: "all", label: "All Batches", icon: <Package size={14}/> },
              { key: "expiring", label: "Expiring Soon", icon: <AlertTriangle size={14}/> },
              { key: "expired", label: "Expired", icon: <Clock size={14}/> }
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  tab === t.key 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm mt-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No batches found</h3>
            <p className="text-slate-500 text-sm">Batches are created when you receive a purchase order.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBatches.map((b) => {
              const days = daysUntilExpiry(b.expiryDate);
              return (
                <div key={b.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight">{b.medicine?.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{b.medicine?.brand || "No brand"}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getExpiryColor(days)}`}>
                      {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                    </span>
                  </div>

                  {/* Batch Info */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Batch No</p>
                      <p className="font-mono text-sm font-semibold text-slate-700">{b.batchNumber}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Quantity</p>
                      <p className="font-bold text-sm text-slate-800">{b.quantity} pcs</p>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex flex-col gap-1.5 mt-auto pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-indigo-400" />
                      Expiry: <span className="font-medium text-slate-700">{new Date(b.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-emerald-400" />
                      Supplier: <span className="font-medium text-slate-700">{b.supplier?.name || "N/A"}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import PermissionGuard from "@/components/staff/PermissionGuard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Package, AlertTriangle, XCircle, DollarSign, 
  Calendar, CheckCircle2, ChevronRight, Activity, Clock, AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

function PharmacyInventoryPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0, lowStock: 0, outOfStock: 0, totalStockValue: 0,
    expired: 0, expiringSoon: 0, expiringWarning: 0, safe: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetch("/api/pharmacy/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const stockStats = [
    { label: "Total Items", value: stats.totalItems, icon: Package, color: "bg-blue-50 text-blue-600 border-blue-100" },
    { label: "Low Stock", value: stats.lowStock, icon: AlertTriangle, color: "bg-amber-50 text-amber-600 border-amber-100" },
    { label: "Out of Stock", value: stats.outOfStock, icon: XCircle, color: "bg-red-50 text-red-600 border-red-100" },
    { label: "Stock Value", value: "৳" + stats.totalStockValue.toFixed(0), icon: DollarSign, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  ];

  const expiryStats = [
    { label: "Expired", value: stats.expired, color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
    { label: "Expiring < 30d", value: stats.expiringSoon, color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
    { label: "Warning < 90d", value: stats.expiringWarning, color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    { label: "Safe", value: stats.safe, color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Activity className="text-indigo-600" size={20}/> Inventory Overview
            </h1>
          </div>
          <Link href="/pharmacy/medicines" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all">
            Manage <ChevronRight size={16} />
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-6 mt-2">
        
        {/* Stock Overview */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Stock Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {stockStats.map((s, i) => (
              <div key={i} className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 ${s.color}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/60 shadow-sm border border-inherit`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{s.label}</p>
                  <p className="text-xl font-black text-slate-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expiry Overview */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Expiry Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {expiryStats.map((s, i) => (
              <div key={i} className={`rounded-2xl p-4 border flex flex-col justify-center ${s.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`}></div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
                </div>
                <p className="text-2xl font-black">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action / Info Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 text-white flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <CheckCircle2 size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">All Stats are Live!</h3>
              <p className="text-indigo-100 text-sm mt-0.5">Your inventory is synced with the database.</p>
            </div>
          </div>
          <Link href="/pharmacy/medicines" className="w-full md:w-auto px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl text-center hover:bg-slate-50 transition-colors shadow-sm">
            Go to Medicines List
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function PharmacyInventoryPage() {
  return (
    <PermissionGuard permission={["view_inventory"]}>
      <PharmacyInventoryPageInner />
    </PermissionGuard>
  );
}

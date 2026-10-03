"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Package, AlertTriangle, Calendar, Clock, Filter } from "lucide-react";

export default function BatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "expiring" | "expired">("all");

  const load = async () => {
    setLoading(true);
    let url = "/api/pharmacy/batches";
    if (tab === "expiring") url += "?expiring=true";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    let list = data.batches || [];

    if (tab === "expired") {
      list = list.filter((b: any) => new Date(b.expiryDate) < new Date());
    }

    setBatches(list);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, tab]);

  const daysUntilExpiry = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const expiryColor = (days: number) => {
    if (days < 0) return "bg-red-100 text-red-700 border-red-200";
    if (days < 30) return "bg-red-50 text-red-600 border-red-100";
    if (days < 90) return "bg-amber-50 text-amber-600 border-amber-100";
    return "bg-green-50 text-green-600 border-green-100";
  };

  const expiringCount = batches.filter((b) => {
    const days = daysUntilExpiry(b.expiryDate);
    return days >= 0 && days <= 90;
  }).length;

  const expiredCount = batches.filter((b) => daysUntilExpiry(b.expiryDate) < 0).length;

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Batches & Expiry</h1>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Total Batches</div>
          <div className="text-lg font-bold text-slate-800">{batches.length}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
          <div className="text-xs text-amber-700 mb-1">Expiring Soon</div>
          <div className="text-lg font-bold text-amber-700">{expiringCount}</div>
        </div>
        <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
          <div className="text-xs text-red-700 mb-1">Expired</div>
          <div className="text-lg font-bold text-red-700">{expiredCount}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { k: "all", label: "All", icon: Package },
          { k: "expiring", label: "Expiring (90d)", icon: AlertTriangle },
          { k: "expired", label: "Expired", icon: Clock },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                tab === t.k ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-200"
              }`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : batches.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No batches found. Batches are created when you receive a purchase order.
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((b) => {
            const days = daysUntilExpiry(b.expiryDate);
            return (
              <div key={b.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{b.medicine?.name}</h3>
                    <p className="text-xs text-slate-500">{b.medicine?.brand || b.medicine?.genericName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${expiryColor(days)}`}>
                    {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-500">Batch #</div>
                    <div className="font-medium text-slate-800 font-mono">{b.batchNumber}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-500">Quantity</div>
                    <div className="font-medium text-slate-800">{b.quantity} / {b.initialQty}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-500">Expiry</div>
                    <div className="font-medium text-slate-800">{new Date(b.expiryDate).toLocaleDateString()}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-500">Supplier</div>
                    <div className="font-medium text-slate-800">{b.supplier?.name || "—"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

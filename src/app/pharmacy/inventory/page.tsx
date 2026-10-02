"use client";
import PermissionGuard from "@/components/staff/PermissionGuard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, AlertTriangle, XCircle, DollarSign, Pill, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function PharmacyInventoryPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0, lowStock: 0, outOfStock: 0, totalStockValue: 0,
    expired: 0, expiringSoon: 0, expiringWarning: 0, safe: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = user?.email;
    if (!email) { setLoading(false); return; }

    fetch("/api/pharmacy/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.medicines) setMedicines(data.medicines);
      if (data.stats) setStats(data.stats);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  const stockStats = [
    { label: "Total Items", value: stats.totalItems, icon: Package, color: "bg-blue-100 text-blue-600" },
    { label: "Low Stock", value: stats.lowStock, icon: AlertTriangle, color: "bg-yellow-100 text-yellow-600" },
    { label: "Out of Stock", value: stats.outOfStock, icon: XCircle, color: "bg-red-100 text-red-600" },
    { label: "Stock Value", value: "৳" + stats.totalStockValue.toFixed(0), icon: DollarSign, color: "bg-green-100 text-green-600" },
  ];

  const expiryStats = [
    { label: "Expired", value: stats.expired, color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50 border-red-200" },
    { label: "Expiring <30d", value: stats.expiringSoon, color: "bg-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-50 border-orange-200" },
    { label: "Warning <90d", value: stats.expiringWarning, color: "bg-yellow-500", textColor: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200" },
    { label: "Safe", value: stats.safe, color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-50 border-green-200" },
  ];

  const getImages = (m: any): string[] => {
    if (!m.images) return [];
    if (Array.isArray(m.images)) return m.images;
    return [];
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const now = new Date();
    const exp = new Date(expiryDate);
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: "EXPIRED", color: "bg-red-100 text-red-700" };
    if (daysLeft <= 30) return { label: daysLeft + "d", color: "bg-orange-100 text-orange-700" };
    if (daysLeft <= 90) return { label: daysLeft + "d", color: "bg-yellow-100 text-yellow-700" };
    return { label: exp.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">Inventory</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Stock Overview */}
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Package size={16} className="text-blue-600" /> Stock Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stockStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                <div className={"w-10 h-10 " + s.color + " rounded-full flex items-center justify-center mx-auto mb-2"}>
                  <Icon size={18} />
                </div>
                <p className="text-lg font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Expiry Stats */}
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-orange-600" /> Expiry Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {expiryStats.map((s, i) => (
            <div key={i} className={"rounded-2xl p-4 border-2 text-center " + s.bgColor}>
              <div className={"w-2 h-2 " + s.color + " rounded-full mx-auto mb-2"}></div>
              <p className={"text-xl font-bold " + s.textColor}>{s.value}</p>
              <p className={"text-xs font-medium " + s.textColor}>{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500 text-center">Loading...</p>
        ) : medicines.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
            <Package size={64} className="mx-auto text-green-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">Inventory is empty</h2>
            <p className="text-sm text-slate-500">Add medicines to track your stock levels</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medicines.map((med) => {
              const imgs = getImages(med);
              const expBadge = getExpiryBadge(med.expiryDate);
              return (
                <div key={med.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden bg-purple-100 flex items-center justify-center text-purple-600">
                    {imgs.length > 0 ? (
                      <img src={imgs[0]} alt={med.name} className="w-full h-full object-cover" />
                    ) : (
                      <Pill size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{med.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{med.brand} • {med.genericName}</p>
                    {expBadge && (
                      <span className={"inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium " + expBadge.color}>
                        {expBadge.label}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={"font-bold text-sm " + (med.stock > 10 ? "text-green-600" : med.stock > 0 ? "text-yellow-600" : "text-red-600")}>
                      {med.stock} {med.unit}
                    </p>
                    <p className="text-xs text-slate-400">৳{parseFloat(med.sellingPrice).toFixed(2)}</p>
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

// WRAPPED WITH PERMISSION GUARD
export default function PharmacyInventoryPage() {
  return (
    <PermissionGuard permission={"view_inventory"}>
      <PharmacyInventoryPageInner />
    </PermissionGuard>
  );
}

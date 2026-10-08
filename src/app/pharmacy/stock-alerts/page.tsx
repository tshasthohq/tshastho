"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Package, ShoppingCart, CheckCircle, XCircle } from "lucide-react";

export default function StockAlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/stock-alerts", { credentials: "include" });
    const data = await res.json();
    setAlerts(data.alerts || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const updateStatus = async (id: string, status: string) => {
    setProcessing(id);
    await fetch("/api/pharmacy/stock-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, status }),
    });
    setProcessing(null);
    load();
  };

  const handleAutoPO = async (id: string) => {
    if (!confirm("Auto-generate a purchase order for this item?")) return;
    setProcessing(id);
    const res = await fetch(`/api/pharmacy/stock-alerts/${id}/auto-po`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    setProcessing(null);
    if (res.ok) {
      alert(`✅ PO ${data.purchaseOrder.purchaseNumber} created!`);
      load();
    } else {
      alert(data.message || "Failed to create PO");
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "ORDERED": return "bg-blue-100 text-blue-700";
      case "RECEIVED": return "bg-green-100 text-green-700";
      case "CANCELLED": return "bg-slate-100 text-slate-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-amber-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Low Stock Alerts</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <p className="text-sm text-amber-800">
          <strong>{alerts.length}</strong> item{alerts.length !== 1 ? "s" : ""} need restocking.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <CheckCircle className="mx-auto text-green-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">All stock levels are healthy.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 truncate">{a.medicine?.name}</div>
                  <div className="text-xs text-slate-500">{a.medicine?.brand}</div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-medium">
                      Stock: {a.currentStock}
                    </span>
                    <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded">
                      Reorder at: {a.reorderLevel}
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      Suggest: {a.suggestedQty}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(a.status)}`}>
                  {a.status}
                </span>
              </div>

              {a.status === "PENDING" && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(a.id, "ORDERED")} disabled={processing === a.id}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50">
                    <ShoppingCart size={12} /> Mark Ordered
                  </button>
                  <button onClick={() => handleAutoPO(a.id)} disabled={processing === a.id}
                    className="bg-green-600 text-white py-2 px-3 rounded-xl text-xs font-medium disabled:opacity-50"
                    title="Auto-generate Purchase Order">
                    Auto PO
                  </button>
                  <button onClick={() => updateStatus(a.id, "CANCELLED")} disabled={processing === a.id}
                    className="bg-slate-100 text-slate-600 py-2 px-3 rounded-xl text-xs font-medium disabled:opacity-50">
                    Skip
                  </button>
                </div>
              )}
              {a.status === "ORDERED" && (
                <button onClick={() => updateStatus(a.id, "RECEIVED")} disabled={processing === a.id}
                  className="w-full bg-green-600 text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50">
                  <CheckCircle size={12} /> Mark Received
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

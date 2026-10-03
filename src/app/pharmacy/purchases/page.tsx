"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Plus, FileText, Package, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";

export default function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [receiving, setReceiving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const url = filter ? `/api/pharmacy/purchases?status=${filter}` : "/api/pharmacy/purchases";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setPurchases(data.purchases || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filter]);

  const handleReceive = async (id: string) => {
    if (!confirm("Receive this purchase order? This will create batches and add stock.")) return;
    setReceiving(id);
    const res = await fetch(`/api/pharmacy/purchases/${id}/receive`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    setReceiving(null);
    if (res.ok) {
      load();
    } else {
      alert(data.message || "Failed to receive");
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "RECEIVED": return "bg-green-100 text-green-700";
      case "ORDERED": return "bg-blue-100 text-blue-700";
      case "PARTIAL": return "bg-amber-100 text-amber-700";
      case "DRAFT": return "bg-slate-100 text-slate-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">Purchase Orders</h1>
        <Link href="/pharmacy/purchases/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New Purchase
        </Link>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["", "ORDERED", "RECEIVED", "CANCELLED"].map((s) => (
          <button key={s || "all"} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
              filter === s ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-200"
            }`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : purchases.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No purchase orders. Create your first purchase.
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-800 font-mono text-sm">{p.purchaseNumber}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.supplier?.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Total</div>
                  <div className="font-bold text-slate-800">৳ {Number(p.totalAmount).toFixed(0)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Items</div>
                  <div className="font-bold text-slate-800">{p.items?.length || 0}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500">Date</div>
                  <div className="font-bold text-slate-800">
                    {new Date(p.orderDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {p.status === "ORDERED" && (
                <button onClick={() => handleReceive(p.id)} disabled={receiving === p.id}
                  className="w-full bg-green-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {receiving === p.id ? (
                    <><RefreshCw size={14} className="animate-spin" /> Receiving...</>
                  ) : (
                    <><CheckCircle size={14} /> Receive & Add Stock</>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

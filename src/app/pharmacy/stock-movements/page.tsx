"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ArrowDown, ArrowUp, History, Filter } from "lucide-react";

export default function StockMovementsPage() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const url = filter ? `/api/pharmacy/stock-movements?type=${filter}` : "/api/pharmacy/stock-movements";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setMovements(data.movements || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filter]);

  const typeColor = (t: string) => {
    switch (t) {
      case "PURCHASE":
      case "RETURN_IN":
      case "OPENING":
      case "TRANSFER_IN": return "bg-green-100 text-green-700";
      case "SALE":
      case "RETURN_OUT":
      case "TRANSFER_OUT": return "bg-blue-100 text-blue-700";
      case "DAMAGE":
      case "EXPIRED": return "bg-red-100 text-red-700";
      case "ADJUSTMENT": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const isInward = (t: string) => ["PURCHASE", "RETURN_IN", "OPENING", "TRANSFER_IN"].includes(t);

  const filters = [
    { k: "", label: "All" },
    { k: "PURCHASE", label: "Purchases" },
    { k: "SALE", label: "Sales" },
    { k: "ADJUSTMENT", label: "Adjustments" },
    { k: "DAMAGE", label: "Damages" },
    { k: "EXPIRED", label: "Expired" },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <History className="text-blue-600" size={24} />
        <h1 className="text-xl font-bold text-slate-800">Stock Movements</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {filters.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
              filter === f.k ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-200"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : movements.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No stock movements found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {movements.map((m) => {
              const inward = isInward(m.type);
              return (
                <div key={m.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        inward ? "bg-green-100" : "bg-red-100"
                      }`}>
                        {inward ? (
                          <ArrowDown size={16} className="text-green-600" />
                        ) : (
                          <ArrowUp size={16} className="text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 truncate">{m.medicine?.name}</h3>
                        <p className="text-xs text-slate-500">
                          {m.batch ? `Batch: ${m.batch.batchNumber}` : "No batch"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${inward ? "text-green-600" : "text-red-600"}`}>
                        {inward ? "+" : ""}{m.quantity}
                      </div>
                      <div className="text-xs text-slate-500">{m.previousStock} → {m.newStock}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor(m.type)}`}>
                      {m.type}
                    </span>
                    <div className="text-xs text-slate-400">
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {m.reason && (
                    <p className="text-xs text-slate-500 mt-2 italic">"{m.reason}"</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

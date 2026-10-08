"use client";

import { useEffect, useState } from "react";
import { X, Package, TrendingDown, TrendingUp, ShoppingCart } from "lucide-react";

interface Substitute {
  id: string;
  name: string;
  brand?: string;
  genericName?: string;
  sellingPrice: number;
  stock: number;
  matchType: "CURATED" | "GENERIC" | "CATEGORY";
  savings?: number;
  reason?: string;
}

interface Props {
  medicineId: string;
  medicineName: string;
  onSelect: (sub: Substitute) => void;
  onClose: () => void;
}

export default function SubstituteModal({ medicineId, medicineName, onSelect, onClose }: Props) {
  const [subs, setSubs] = useState<Substitute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pharmacy/medicines/${medicineId}/substitutes-v2`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        // Item 35: rank by in-stock + savings
        const ranked = (d.substitutes || []).slice().sort((a: Substitute, b: Substitute) => {
          const aStock = a.stock > 0 ? 1 : 0;
          const bStock = b.stock > 0 ? 1 : 0;
          if (aStock !== bStock) return bStock - aStock;
          return Number(b.savings ?? 0) - Number(a.savings ?? 0);
        });
        setSubs(ranked);
      })
      .finally(() => setLoading(false));
  }, [medicineId]);

  const matchColor = (t: string) => {
    switch (t) {
      case "CURATED": return "bg-green-100 text-green-700";
      case "GENERIC": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <div>
            <h2 className="font-bold">Substitutes</h2>
            <p className="text-xs text-slate-500">for {medicineName}</p>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="relative p-4">
          {loading ? (
            <div className="text-center text-slate-500 py-6">Finding substitutes...</div>
          ) : subs.length === 0 ? (
            <div className="text-center py-6">
              <Package className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-slate-500 text-sm">No substitutes found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subs.map((s, idx) => (
                <>
                /* Item 35: Best value highlight */
                {idx === 0 && s.stock > 0 && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">BEST</span>
                )}
                <button
                  key={s.id}
                  onClick={() => onSelect(s)}
                  disabled={s.stock === 0}
                  className={`w-full text-left p-3 rounded-xl border-2 transition ${
                    s.stock > 0
                      ? "bg-white border-slate-100 hover:border-blue-400"
                      : "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate">{s.name}</div>
                      {s.brand && <div className="text-xs text-slate-500">{s.brand}</div>}
                      {s.genericName && <div className="text-[10px] text-slate-400">{s.genericName}</div>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${matchColor(s.matchType)}`}>
                      {s.matchType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className={`px-2 py-0.5 rounded ${s.stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      Stock: {s.stock}
                    </span>
                    <div className="flex items-center gap-2">
                      {s.savings !== undefined && s.savings !== 0 && (
                        <span className={`flex items-center gap-0.5 ${s.savings > 0 ? "text-red-600" : "text-green-600"}`}>
                          {s.savings > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          ৳{Math.abs(s.savings).toFixed(2)}
                        </span>
                      )}
                      <span className="font-bold text-slate-800">৳{s.sellingPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {s.reason && (
                    <div className="text-[10px] text-blue-700 bg-blue-50 p-1.5 rounded mt-2">
                      💡 {s.reason}
                    </div>
                  )}

                  {s.stock > 0 && (
                    <div className="flex items-center justify-end gap-1 text-[10px] text-blue-600 mt-2">
                      <ShoppingCart size={10} /> Tap to add
                    </div>
                  )}
                </button>
                </>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

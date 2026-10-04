"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Receipt, TrendingUp, DollarSign, Clock, Eye, X } from "lucide-react";

export default function POSSalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ count: 0, totalSales: 0, totalProfit: 0, totalDue: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "all">("today");
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const url = filter === "today" ? "/api/pharmacy/pos/sales?today=true" : "/api/pharmacy/pos/sales";
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setSales(data.sales || []);
    setSummary(data.summary || {});
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filter]);
// PART2

  const methodColor = (m: string) => {
    switch (m) {
      case "CASH": return "bg-green-100 text-green-700";
      case "CARD": return "bg-blue-100 text-blue-700";
      case "BKASH": return "bg-pink-100 text-pink-700";
      case "NAGAD": return "bg-orange-100 text-orange-700";
      case "DUE": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="text-blue-600" size={24} />
        <h1 className="text-xl font-bold text-slate-800">POS Sales</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Receipt size={12} /> Sales</div>
          <div className="text-lg font-bold text-slate-800">{summary.count || 0}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><DollarSign size={12} /> Revenue</div>
          <div className="text-lg font-bold text-slate-800">৳ {Number(summary.totalSales || 0).toFixed(0)}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><TrendingUp size={12} /> Profit</div>
          <div className="text-lg font-bold text-green-600">৳ {Number(summary.totalProfit || 0).toFixed(0)}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock size={12} /> Due</div>
          <div className="text-lg font-bold text-red-600">৳ {Number(summary.totalDue || 0).toFixed(0)}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("today")}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            filter === "today" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>
          Today
        </button>
        <button onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            filter === "all" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
          }`}>
          All Time
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : sales.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No sales yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {sales.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-slate-500">{s.saleNumber}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${methodColor(s.paymentMethod)}`}>
                    {s.paymentMethod}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-800 truncate">
                  {s.customerName || "Walk-in"}{s.customerPhone ? ` • ${s.customerPhone}` : ""}
                </div>
                <div className="text-xs text-slate-500">
                  {s.items?.length || 0} items • {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">৳ {Number(s.totalAmount).toFixed(2)}</div>
                {Number(s.dueAmount) > 0 && (
                  <div className="text-xs text-red-600 font-medium">Due: ৳ {Number(s.dueAmount).toFixed(2)}</div>
                )}
                <button onClick={() => setSelected(s)}
                  className="text-xs text-blue-600 mt-1 flex items-center gap-1 justify-end">
                  <Eye size={12} /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Sale Details</h3>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="text-center mb-3 pb-3 border-b border-dashed">
              <p className="text-xs text-slate-500 font-mono">{selected.saleNumber}</p>
              <p className="text-xs text-slate-400">{new Date(selected.createdAt).toLocaleString()}</p>
            </div>
            <div className="space-y-1 text-xs mb-3">
              {selected.items?.map((i: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.quantity} × {i.medicineName}</span>
                  <span>৳ {Number(i.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed pt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>৳ {Number(selected.subtotal).toFixed(2)}</span></div>
              {Number(selected.discountAmount) > 0 && (
                <div className="flex justify-between text-red-600"><span>Discount</span><span>-৳ {Number(selected.discountAmount).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total</span><span>৳ {Number(selected.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">Paid</span><span>৳ {Number(selected.paidAmount).toFixed(2)}</span></div>
              {Number(selected.dueAmount) > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Due</span><span>৳ {Number(selected.dueAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

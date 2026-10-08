"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, TrendingUp, TrendingDown, Users, Package, AlertTriangle } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<"overview" | "top" | "dead" | "categories" | "margins" | "customers">("overview");

  const load = async () => {
    setLoading(true);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`/api/pharmacy/analytics?from=${from}`, { credentials: "include" });
    const d = await res.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, days]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-center text-slate-500">No data</div>;

  const totalSales = data.trend.reduce((s: number, d: any) => s + d.sales, 0);
  const totalProfit = data.trend.reduce((s: number, d: any) => s + d.profit, 0);
  const maxDaySale = Math.max(...data.trend.map((d: any) => d.sales), 1);

  const tabs = [
    { k: "overview", l: "Overview", i: BarChart3 },
    { k: "top", l: "Top Selling", i: TrendingUp },
    { k: "dead", l: "Dead Stock", i: AlertTriangle },
    { k: "categories", l: "Categories", i: Package },
    { k: "margins", l: "Margins", i: TrendingUp },
    { k: "customers", l: "Customers", i: Users },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-green-50 border border-green-100 p-3 rounded-2xl">
          <div className="text-xs text-green-700 mb-1">Total Sales</div>
          <div className="text-lg font-bold text-green-700">৳{totalSales.toFixed(0)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl">
          <div className="text-xs text-blue-700 mb-1">Profit</div>
          <div className="text-lg font-bold text-blue-700">৳{totalProfit.toFixed(0)}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1">Items</div>
          <div className="text-lg font-bold text-slate-700">{data.topSelling.length}</div>
        </div>
        <div className="bg-red-50 border border-red-100 p-3 rounded-2xl">
          <div className="text-xs text-red-700 mb-1">Dead Stock</div>
          <div className="text-lg font-bold text-red-700">{data.deadStock.length}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.i;
          return (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
                tab === t.k ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
              }`}>
              <Icon size={12} /> {t.l}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Daily Sales Trend ({days}d)</h3>
          <div className="flex items-end gap-1 h-40">
            {data.trend.slice(-30).map((d: any, i: number) => {
              const h = (d.sales / maxDaySale) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition"
                    style={{ height: `${h}%`, minHeight: d.sales > 0 ? "4px" : "0" }}
                    title={`${d.date}: ৳${d.sales.toFixed(0)} (${d.count} sales)`} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-2">
            <span>{data.trend[0]?.date}</span>
            <span>{data.trend[data.trend.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {tab === "top" && (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {data.topSelling.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No sales data</div>
          ) : (
            data.topSelling.map((s: any, i: number) => (
              <div key={s.medicineId} className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                }`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{s.medicine?.name}</div>
                  <div className="text-xs text-slate-500">{s.saleCount} sales</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-800">{s.quantity} pcs</div>
                  <div className="text-xs text-green-600">৳{s.revenue.toFixed(0)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "dead" && (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {data.deadStock.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No dead stock 🎉</div>
          ) : (
            data.deadStock.map((m: any) => (
              <div key={m.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.category || "Uncategorized"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Stock: {m.stock}</div>
                    <div className="text-xs text-red-600 font-medium">৳{m.tiedCapital.toFixed(0)} tied</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "categories" && (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {data.categories.map((c: any) => (
            <div key={c.category} className="p-3 flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-slate-800">{c.category}</div>
                <div className="text-xs text-slate-500">{c.qty} units</div>
              </div>
              <div className="font-bold text-green-600">৳{c.revenue.toFixed(0)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "margins" && (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {data.margins.map((m: any) => (
            <div key={m.medicineId} className="p-3 flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{m.name}</div>
                <div className="text-xs text-slate-500">{m.quantity} sold</div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${m.margin > 30 ? "text-green-600" : m.margin > 15 ? "text-amber-600" : "text-red-600"}`}>
                  {m.margin.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500">৳{m.profit.toFixed(0)} profit</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "customers" && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(data.segments).map(([seg, count]: any) => (
            <div key={seg} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">{seg}</div>
              <div className="text-2xl font-bold text-slate-800">{count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

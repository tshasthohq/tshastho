"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, ShoppingBag, Calendar, DollarSign, Loader2 } from "lucide-react";

interface ChartsData {
  dailySales: { date: string; sales: number; orders: number }[];
  topMedicines: { name: string; qty: number; revenue: number }[];
  categorySales: { name: string; value: number }[];
  summary: {
    todaySales: number;
    weekSales: number;
    monthSales: number;
    totalOrders: number;
  };
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

export default function DashboardCharts() {
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const loadData = async () => {
    setLoading(true);
    const email = localStorage.getItem("userEmail");
    if (!email) return;

    try {
      const res = await fetch("/api/pharmacy/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, days }),
      });
      const d = await res.json();
      if (!d.error) setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [days]);

  const formatDay = (date: string) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const formatTaka = (n: number) => {
    if (n >= 100000) return "৳" + (n / 1000).toFixed(0) + "k";
    if (n >= 1000) return "৳" + (n / 1000).toFixed(1) + "k";
    return "৳" + n.toFixed(0);
  };

  if (loading) return (
    <div className="p-10 text-center">
      <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
      <p className="text-slate-500 text-sm mt-3">Loading charts...</p>
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* ===== Time Range Selector ===== */}
      <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 w-fit">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={"px-3 py-1.5 rounded-lg text-xs font-bold transition " +
              (days === d ? "bg-blue-600 text-white" : "text-slate-600")}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* ===== Summary Cards ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={<DollarSign size={16} />}
          label="Today"
          value={formatTaka(data.summary.todaySales)}
          color="green"
        />
        <SummaryCard
          icon={<Calendar size={16} />}
          label="This Week"
          value={formatTaka(data.summary.weekSales)}
          color="blue"
        />
        <SummaryCard
          icon={<TrendingUp size={16} />}
          label="This Month"
          value={formatTaka(data.summary.monthSales)}
          color="purple"
        />
        <SummaryCard
          icon={<ShoppingBag size={16} />}
          label="Orders"
          value={String(data.summary.totalOrders)}
          color="orange"
        />
      </div>

      {/* ===== Line Chart: Daily Sales ===== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-600" /> Daily Sales Trend
        </h3>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={data.dailySales} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => "৳" + (v / 1000).toFixed(0) + "k"} />
              <Tooltip
                formatter={(v) => ["৳" + Number(v).toFixed(0), "Sales"] as [string, string]}
                labelFormatter={(l) => new Date(l as string).toDateString()}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Bar Chart: Top Medicines ===== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <ShoppingBag size={16} className="text-purple-600" /> Top 5 Medicines (qty sold)
        </h3>
        {data.topMedicines.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">No sales data yet</p>
        ) : (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={data.topMedicines} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v, n) => [v as number, n === "qty" ? "Qty" : "Revenue"] as [number, string]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="qty" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ===== Pie Chart: Category Sales ===== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-600" /> Category-wise Sales
        </h3>
        {data.categorySales.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">No category data</p>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.categorySales}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  paddingAngle={2}
                  label={(e: { name?: string }) => e.name || ""}
                  labelLine={false}
                  fontSize={10}
                >
                  {data.categorySales.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => "৳" + Number(v).toFixed(0)}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string;
  color: "green" | "blue" | "purple" | "orange";
}) {
  const colorMap = {
    green: "from-green-500 to-emerald-600",
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-pink-600",
    orange: "from-orange-500 to-red-500",
  };
  return (
    <div className={"bg-gradient-to-br " + colorMap[color] + " text-white rounded-2xl p-3 shadow-sm"}>
      <div className="flex items-center gap-1.5 mb-1 opacity-90">
        {icon}
        <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

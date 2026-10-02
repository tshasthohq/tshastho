"use client";
import PermissionGuard from "@/components/staff/PermissionGuard";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, FileText, ShoppingBag, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function OrderHistoryPageInner() {
  const router = useRouter();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dateRange, setDateRange] = useState("TODAY");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const loadOrders = () => {
    setLoading(true);
    const email = localStorage.getItem("userEmail");
    if (!email) { setLoading(false); return; }

    fetch("/api/pharmacy/orders/all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.orders) setAllOrders(data.orders);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  // Client-side filtering
  const filtered = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let start: Date | null = null;
    let end: Date | null = null;

    if (dateRange === "TODAY") start = today;
    else if (dateRange === "YESTERDAY") {
      start = new Date(today); start.setDate(start.getDate() - 1);
      end = new Date(today); end.setDate(end.getDate() - 1);
    }
    else if (dateRange === "WEEK") {
      start = new Date(today);
      const d = today.getDay();
      const diffToSat = d >= 6 ? 0 : d + 1;
      start.setDate(start.getDate() - diffToSat);
    }
    else if (dateRange === "MONTH") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    else if (dateRange === "CUSTOM") {
      if (customStart) start = new Date(customStart);
      if (customEnd) { end = new Date(customEnd); end.setHours(23, 59, 59); }
    }

    const q = search.toLowerCase().trim();

    return allOrders.filter(o => {
      const t = new Date(o.createdAt).getTime();
      if (start && t < start.getTime()) return false;
      if (end && t > end.getTime()) return false;
      if (status !== "ALL" && o.status !== status) return false;
      if (q) {
        const inOrderNo = o.orderNumber.toLowerCase().includes(q);
        const inName = (o.patient?.name || "").toLowerCase().includes(q);
        const inPhone = (o.patient?.phone || "").includes(q);
        if (!inOrderNo && !inName && !inPhone) return false;
      }
      return true;
    });
  }, [allOrders, dateRange, status, search, customStart, customEnd]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [dateRange, status, search, customStart, customEnd]);

  // Summary
  const summary = useMemo(() => {
    let totalRevenue = 0, totalCost = 0, totalProfit = 0;
    for (const o of filtered) {
      totalRevenue += parseFloat(o.totalAmount.toString());
      totalCost += parseFloat(o.totalCost.toString());
      totalProfit += parseFloat(o.netProfit.toString());
    }
    return { totalRevenue, totalCost, totalProfit, count: filtered.length };
  }, [filtered]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const formatDate = (d: string) => new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const dateTabs = [
    { key: "ALL", label: "All Time" },
    { key: "TODAY", label: "Today" },
    { key: "YESTERDAY", label: "Yesterday" },
    { key: "WEEK", label: "This Week" },
    { key: "MONTH", label: "This Month" },
    { key: "CUSTOM", label: "Custom" },
  ];

  const statusTabs = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "OUT_FOR_DELIVERY", label: "Delivering" },
    { key: "DELIVERED", label: "Delivered" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">Order History</h1>
        <button onClick={loadOrders} className="p-2 text-blue-600" disabled={loading}>
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500">Orders</p>
            <p className="text-xl font-bold text-slate-800">{summary.count}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <p className="text-xs text-blue-700">Revenue</p>
            <p className="text-xl font-bold text-blue-700">৳{summary.totalRevenue.toFixed(0)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
            <p className="text-xs text-orange-700">Cost</p>
            <p className="text-xl font-bold text-orange-700">৳{summary.totalCost.toFixed(0)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
            <p className="text-xs text-green-700">Profit</p>
            <p className="text-xl font-bold text-green-700">৳{summary.totalProfit.toFixed(0)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number, name, or phone..."
            className="pl-10"
          />
        </div>

        {/* Date Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {dateTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setDateRange(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${dateRange === t.key ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {dateRange === "CUSTOM" && (
          <div className="bg-white p-3 rounded-xl mb-3 flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-500">From</label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500">To</label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {statusTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${status === t.key ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl text-center">
            <RefreshCw size={32} className="animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm text-slate-500">Loading orders...</p>
          </div>
        ) : paged.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
            <ShoppingBag size={64} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">No orders found</h2>
            <p className="text-sm text-slate-500">Try a different filter</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paged.map((order) => (
                <Link key={order.id} href={`/pharmacy/orders/${order.id}`} className="block bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        👤 {order.patient?.name} • {order.patient?.phone}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0 ${
                      order.status === "PENDING" ? "bg-yellow-100 text-yellow-600" :
                      order.status === "ACCEPTED" ? "bg-blue-100 text-blue-600" :
                      order.status === "OUT_FOR_DELIVERY" ? "bg-purple-100 text-purple-600" :
                      order.status === "DELIVERED" ? "bg-green-100 text-green-600" :
                      "bg-red-100 text-red-600"
                    }`}>{order.status.replace(/_/g, " ")}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <p className="text-slate-500">Amount</p>
                      <p className="font-bold text-slate-800">৳{parseFloat(order.totalAmount).toFixed(0)}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <p className="text-slate-500">Cost</p>
                      <p className="font-bold text-red-500">−৳{parseFloat(order.totalCost).toFixed(0)}</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg">
                      <p className="text-green-700">Profit</p>
                      <p className="font-bold text-green-700">৳{parseFloat(order.netProfit).toFixed(0)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <p className="text-slate-500">{order.itemCount} item{order.itemCount > 1 ? "s" : ""}</p>
                    <span className="text-blue-600 font-medium flex items-center gap-1">
                      <FileText size={12} /> View Memo
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </Button>
                <span className="text-sm text-slate-600 font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// WRAPPED WITH PERMISSION GUARD
export default function OrderHistoryPage() {
  return (
    <PermissionGuard permission={"view_orders"}>
      <OrderHistoryPageInner />
    </PermissionGuard>
  );
}

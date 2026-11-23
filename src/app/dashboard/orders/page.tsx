"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Store, Calendar, ChevronRight, Clock, CheckCircle2, Truck, Pill, Download, RefreshCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t: tr } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  const tabs = ["All", "Pending", "Accepted", "Delivering", "Delivered"];

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (authLoading || !user) return;

    fetch("/api/orders/my-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: user?.email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, authLoading, router]);

  const filteredOrders = activeTab === "All"
    ? orders
    : orders.filter((o) => { const st = o.status.toUpperCase(); const tb = activeTab.toUpperCase(); return st === tb || (tb === "DELIVERING" && st === "OUT_FOR_DELIVERY"); });

  const getStatusStep = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return 1;
      case "ACCEPTED": return 2;
      case "DELIVERING":
      case "OUT_FOR_DELIVERY": return 3;
      case "DELIVERED": return 4;
      default: return 0; // Cancelled
    }
  };

  const renderTimeline = (status: string) => {
    const step = getStatusStep(status);
    if (status.toUpperCase() === "CANCELLED") {
      return <div className="text-red-500 text-sm font-bold w-full text-center bg-red-50 py-2 rounded-xl border border-red-100">{tr("or.cancelled", "Order Cancelled")}</div>;
    }

    const steps = [
      { icon: Clock, label: tr("or.placed", "Placed"), active: step >= 1 },
      { icon: CheckCircle2, label: tr("or.accepted", "Accepted"), active: step >= 2 },
      { icon: Truck, label: tr("or.onWay", "On Way"), active: step >= 3 },
      { icon: Package, label: tr("or.delivered", "Delivered"), active: step >= 4 },
    ];

    return (
      <div className="flex items-center justify-between w-full mt-4 relative">
        <div className="absolute start-0 end-0 top-3.5 h-1 bg-slate-100 rounded-full z-0"></div>
        <div
          className="absolute start-0 top-3.5 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full z-0 transition-all duration-500"
          style={{ width: `${(Math.max(0, step - 1) / 3) * 100}%` }}
        ></div>
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center relative z-10 gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${s.active ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/30" : "bg-white text-slate-300 border-2 border-slate-100"}`}>
              <s.icon size={14} strokeWidth={3} />
            </div>
            <span className={`text-[11px] font-bold ${s.active ? "text-blue-700" : "text-slate-400"}`}>{s.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const bg = { background: "linear-gradient(180deg,#dbeafe 0%,#eff6ff 38%,#f8fafc 100%)" };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bg}>
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 font-sans" style={bg}>
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/70 sticky top-0 z-40 px-4 pt-6 pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/25">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{tr("or.title", "My Orders")}</h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">{tr("or.sub", "Track and manage your medicine deliveries")}</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow-md shadow-blue-500/20"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tr("or.tab." + tab, tab)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white/95 backdrop-blur-xl p-10 rounded-3xl text-center border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] mt-6">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Package size={42} className="text-blue-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">{tr("or.none", "No orders found")}</h2>
            <p className="text-base text-slate-500 mb-6">{tr("or.noneSub", "You haven't placed any orders here yet.")}</p>
            <Link href="/medicines" className="inline-flex h-12 items-center justify-center px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-base font-bold shadow-lg shadow-blue-500/25">
              {tr("or.start", "Start Shopping")}
            </Link>
          </div>
        ) : (
          filteredOrders.map((order: any) => (
            <div key={order.id} className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] hover:shadow-[0_12px_36px_rgba(30,64,175,0.14)] transition-all relative overflow-hidden">
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-base break-all">{order.orderNumber}</h3>
                  <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium mt-1">
                    <Store size={14} /> {order.pharmacy?.shopName || tr("or.pharmacy", "Pharmacy")}
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{tr("or.total", "Total")}</p>
                  <p className="font-black text-slate-900 text-xl leading-none">৳{Number(order.finalAmount ?? order.totalAmount).toFixed(2)}</p>
                </div>
              </div>

              {renderTimeline(order.status)}

              <div className="bg-slate-50/80 rounded-2xl p-3.5 mt-4 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-2 rtl:space-x-reverse">
                    {order.items?.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center overflow-hidden z-10">
                        {item.images?.length > 0 ? (
                          <img src={item.images[0]} alt={item.medicineName} className="w-full h-full object-cover" />
                        ) : (
                          <Pill size={16} className="text-blue-300" />
                        )}
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-slate-600 z-0">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-slate-800 truncate">
                      {order.items?.[0]?.medicineName || tr("or.medicine", "Medicine")}{" "}
                      {order.items?.length > 1 ? "+ " + (order.items.length - 1) + " " + tr("or.more", "more") : ""}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Link href={`/dashboard/orders/${order.id}`} className="flex-1">
                  <button className="w-full h-11 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm px-4 rounded-2xl transition-colors">
                    {tr("or.details", "View Details")} <ChevronRight size={16} className="rtl:rotate-180" />
                  </button>
                </Link>
                <Link href={`/dashboard/orders/${order.id}/memo`} className="h-11 flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-4 rounded-2xl transition-colors border border-slate-200">
                  <Download size={16} /> {tr("or.memo", "Memo")}
                </Link>
                <button className="h-11 w-11 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl transition-colors border border-emerald-100" title={tr("or.reorder", "Reorder")}>
                  <RefreshCcw size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

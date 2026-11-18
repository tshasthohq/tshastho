"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Package, Store, Calendar, ChevronRight, 
  Clock, CheckCircle2, Truck, XCircle, Pill, 
  Download, RefreshCcw, MessageCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
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
      credentials: 'include',
      body: JSON.stringify({ email: user?.email })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, authLoading, router]);

  const filteredOrders = activeTab === "All" 
    ? orders 
    : orders.filter(o => o.status.toUpperCase() === activeTab.toUpperCase());

  const getStatusStep = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return 1;
      case "ACCEPTED": return 2;
      case "DELIVERING": return 3;
      case "DELIVERED": return 4;
      default: return 0; // Cancelled
    }
  };

  const renderTimeline = (status: string) => {
    const step = getStatusStep(status);
    if (status.toUpperCase() === "CANCELLED") {
      return <div className="text-red-500 text-xs font-bold w-full text-center bg-red-50 py-1.5 rounded-lg border border-red-100">Order Cancelled</div>;
    }

    return (
      <div className="flex items-center justify-between w-full mt-4 relative">
        {/* Background Line */}
        <div className="absolute left-0 right-0 top-2.5 h-1 bg-slate-100 rounded-full z-0"></div>
        
        {/* Progress Line */}
        <div className="absolute left-0 top-2.5 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>

        {[
          { icon: Clock, label: "Placed", active: step >= 1 },
          { icon: CheckCircle2, label: "Accepted", active: step >= 2 },
          { icon: Truck, label: "On Way", active: step >= 3 },
          { icon: Package, label: "Delivered", active: step >= 4 }
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center relative z-10 gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${s.active ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30" : "bg-white text-slate-300 border-2 border-slate-100"}`}>
              <s.icon size={12} strokeWidth={3} />
            </div>
            <span className={`text-[9px] font-bold ${s.active ? "text-indigo-700" : "text-slate-400"}`}>{s.label}</span>
          </div>
        ))}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      
      {/* Premium Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 px-4 pt-6 pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Package size={20} />
             </div>
             <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">My Orders</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Track and manage your medicine deliveries</p>
             </div>
          </div>

          {/* Premium Tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab 
                    ? "bg-slate-900 text-white shadow-md" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl text-center border border-slate-100 shadow-sm mt-8 animate-in fade-in">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={40} className="text-indigo-300" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">No orders found</h2>
            <p className="text-slate-500 mb-8 text-sm">You haven't placed any {activeTab !== "All" ? activeTab.toLowerCase() : ""} orders yet.</p>
            <Link href="/medicines">
              <button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          filteredOrders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.1)] transition-all group overflow-hidden relative">
              
              {/* Order Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-[15px]">{order.orderNumber}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1">
                    <Store size={12} /> {order.pharmacy?.shopName || "Pharmacy"}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                  <p className="font-black text-slate-900 text-lg leading-none">৳{Number(order.totalAmount).toFixed(2)}</p>
                </div>
              </div>

              {/* Timeline */}
              {renderTimeline(order.status)}

              {/* Order Items Summary with Mock Images */}
              <div className="bg-slate-50/80 rounded-2xl p-3.5 mt-4 border border-slate-100/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                     {order.items?.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="w-8 h-8 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center overflow-hidden z-10">
                           {item.images?.length > 0 ? (
                             <img src={item.images[0]} alt={item.medicineName} className="w-full h-full object-cover" />
                           ) : (
                             <Pill size={14} className="text-indigo-300" />
                           )}
                        </div>
                     ))}
                     {order.items?.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-600 z-0">
                           +{order.items.length - 3}
                        </div>
                     )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                      {order.items?.[0]?.medicineName || "Medicine"} {order.items?.length > 1 ? `+ ${order.items.length - 1} more` : ""}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1"><Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center gap-2 mt-4">
                <Link href={`/dashboard/orders/${order.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors">
                    View Details <ChevronRight size={14} />
                  </button>
                </Link>
                <Link href={`/dashboard/orders/${order.id}/memo`} className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors border border-slate-200">
                  <Download size={14} /> Memo
                </Link>
                <button className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors border border-emerald-100" title="Reorder">
                  <RefreshCcw size={14} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

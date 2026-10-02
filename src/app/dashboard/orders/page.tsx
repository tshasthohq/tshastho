"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Package, Clock, CheckCircle, Truck, XCircle, Store, Pill } from "lucide-react";

export default function PatientOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) { setLoading(false); return; }

    fetch("/api/orders/my-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.orders) setOrders(data.orders);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  const statusInfo = (status: string) => {
    switch (status) {
      case "PENDING": return { icon: Clock, color: "bg-yellow-100 text-yellow-600", label: "Pending" };
      case "ACCEPTED": return { icon: CheckCircle, color: "bg-blue-100 text-blue-600", label: "Accepted" };
      case "OUT_FOR_DELIVERY": return { icon: Truck, color: "bg-purple-100 text-purple-600", label: "On the way" };
      case "DELIVERED": return { icon: CheckCircle, color: "bg-green-100 text-green-600", label: "Delivered" };
      case "REJECTED": return { icon: XCircle, color: "bg-red-100 text-red-600", label: "Rejected" };
      case "CANCELLED": return { icon: XCircle, color: "bg-slate-100 text-slate-600", label: "Cancelled" };
      default: return { icon: Package, color: "bg-slate-100 text-slate-600", label: status };
    }
  };

  const filterButtons = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "OUT_FOR_DELIVERY", label: "Delivering" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">My Orders</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filterButtons.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filter === f.key ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
          <ShoppingBag size={64} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">No orders found</h2>
          <p className="text-sm text-slate-500 mb-6">Start ordering medicines from nearby pharmacies</p>
          <Link href="/medicines" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">
            Browse Medicines
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const s = statusInfo(order.status);
            const StatusIcon = s.icon;
            return (
              <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{order.orderNumber}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Store size={12} />
                      <span className="truncate">{order.pharmacy?.shopName}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${s.color}`}>
                    <StatusIcon size={12} />
                    {s.label}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-slate-600">
                      <Pill size={12} className="text-purple-500" />
                      <span className="truncate">{item.medicineName} × {item.quantity}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-slate-400">+{order.items.length - 3} more items</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500">Total Amount</p>
                    <p className="font-bold text-green-700">৳{parseFloat(order.finalAmount).toFixed(2)}</p>
                  </div>
                  <Link href={`/dashboard/orders/${order.id}`} className="text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-medium">
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Crown, Star, UserPlus, ShoppingBag, TrendingUp, DollarSign, Package, Clock, CheckCircle, XCircle, Truck, Pill, Wallet, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function CustomerDetailPage() {
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    const email = user?.email;
    if (!email) { router.push("/login"); return; }

    fetch("/api/pharmacy/customers/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, customerId }),
    })
    .then(res => res.json())
    .then(d => {
      if (d.customer) setData(d);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [customerId]);

  const formatDate = (d: string) => new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const getTagStyle = (tag: string) => {
    if (tag === "VIP") return { bg: "bg-yellow-500", text: "text-white", icon: Crown, label: "VIP Customer" };
    if (tag === "REGULAR") return { bg: "bg-blue-500", text: "text-white", icon: Star, label: "Regular Customer" };
    return { bg: "bg-slate-500", text: "text-white", icon: UserPlus, label: "New Customer" };
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-center text-slate-500">Customer not found</div>;

  const { customer, orders, stats, favoriteMedicines, dues } = data;
  const tagStyle = getTagStyle(stats.tag);
  const TagIcon = tagStyle.icon;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">Customer Details</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* Customer Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-start gap-4 mb-4">
            <div className={"w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold " + tagStyle.bg}>
              {customer.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-slate-800 truncate">{customer.name}</h2>
                <span className={"text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 " + tagStyle.bg + " " + tagStyle.text}>
                  <TagIcon size={11} /> {tagStyle.label}
                </span>
              </div>
              <div className="space-y-1">
                {customer.phone && (
                  <a href={"tel:" + customer.phone} className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} /> {customer.phone}
                  </a>
                )}
                {customer.email && (
                  <p className="flex items-center gap-2 text-sm text-slate-600 truncate">
                    <Mail size={14} /> {customer.email}
                  </p>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                <Clock size={11} className="inline mr-1" /> 
                {stats.daysSinceLast === 0 ? "Active today" : stats.daysSinceLast + " days since last order"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <ShoppingBag size={18} className="text-blue-600 mb-2" />
            <p className="text-xs text-slate-500">Total Orders</p>
            <p className="text-xl font-bold text-slate-800">{stats.totalOrders}</p>
            <p className="text-[10px] text-slate-400 mt-1">{stats.deliveredCount} delivered</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
            <TrendingUp size={18} className="text-green-600 mb-2" />
            <p className="text-xs text-green-700">Total Spent</p>
            <p className="text-xl font-bold text-green-700">৳{stats.totalSpent.toFixed(0)}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <DollarSign size={18} className="text-blue-600 mb-2" />
            <p className="text-xs text-blue-700">Your Profit</p>
            <p className="text-xl font-bold text-blue-700">৳{stats.totalProfit.toFixed(0)}</p>
          </div>
          <div className={stats.totalDue > 0 ? "bg-red-50 p-4 rounded-2xl border border-red-200" : "bg-slate-50 p-4 rounded-2xl border border-slate-200"}>
            <Wallet size={18} className={stats.totalDue > 0 ? "text-red-600 mb-2" : "text-slate-500 mb-2"} />
            <p className={stats.totalDue > 0 ? "text-xs text-red-700" : "text-xs text-slate-500"}>Due</p>
            <p className={"text-xl font-bold " + (stats.totalDue > 0 ? "text-red-600" : "text-slate-500")}>৳{stats.totalDue.toFixed(0)}</p>
          </div>
        </div>

        {/* Favorite Medicines */}
        {favoriteMedicines.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Award size={16} className="text-purple-600" /> Most Bought Medicines
            </h3>
            <div className="space-y-2">
              {favoriteMedicines.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-xs font-medium text-slate-800 truncate">{m.name}</p>
                  </div>
                  <span className="text-xs font-bold text-purple-700 flex-shrink-0">{m.totalQty} qty</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dues Section */}
        {dues.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-red-600" /> Customer Dues
            </h3>
            <div className="space-y-2">
              {dues.map((d: any) => {
                const remaining = parseFloat(d.amount.toString()) - parseFloat(d.paidAmount.toString());
                return (
                  <div key={d.id} className="bg-red-50 border border-red-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-slate-600">{formatDate(d.createdAt)}</p>
                      <span className={"text-[10px] px-2 py-0.5 rounded-full font-bold " + (d.status === "PAID" ? "bg-green-100 text-green-600" : d.status === "PARTIAL" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600")}>
                        {d.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] text-slate-500">Total</p>
                        <p className="text-xs font-bold text-slate-800">৳{parseFloat(d.amount.toString()).toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500">Paid</p>
                        <p className="text-xs font-bold text-green-600">৳{parseFloat(d.paidAmount.toString()).toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500">Remaining</p>
                        <p className="text-xs font-bold text-red-600">৳{remaining.toFixed(0)}</p>
                      </div>
                    </div>
                    {d.note && <p className="text-[10px] text-slate-500 mt-1">{d.note}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order History */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Package size={16} className="text-blue-600" /> Order History ({orders.length})
          </h3>

          {orders.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <Link key={order.id} href={"/pharmacy/orders/" + order.id} className="block bg-slate-50 p-3 rounded-xl hover:bg-blue-50 transition border border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">{order.orderNumber}</p>
                      <p className="text-[10px] text-slate-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className={"text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 " + (
                      order.status === "PENDING" ? "bg-yellow-100 text-yellow-600" :
                      order.status === "ACCEPTED" ? "bg-blue-100 text-blue-600" :
                      order.status === "OUT_FOR_DELIVERY" ? "bg-purple-100 text-purple-600" :
                      order.status === "DELIVERED" ? "bg-green-100 text-green-600" :
                      "bg-red-100 text-red-600"
                    )}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="space-y-1 mb-2">
                    {order.items.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 text-[10px] text-slate-600">
                        <Pill size={10} className="text-purple-500 flex-shrink-0" />
                        <span className="truncate">{item.medicineName} × {item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-[10px] text-slate-400">+{order.items.length - 3} more</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                    <div>
                      <p className="text-[9px] text-slate-500">Total</p>
                      <p className="text-xs font-bold text-slate-800">৳{parseFloat(order.finalAmount).toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500">Paid</p>
                      <p className="text-xs font-bold text-green-600">৳{parseFloat(order.paidAmount || 0).toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500">Due</p>
                      <p className={"text-xs font-bold " + (parseFloat(order.dueAmount) > 0 ? "text-red-600" : "text-slate-500")}>
                        ৳{parseFloat(order.dueAmount || 0).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

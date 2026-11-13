"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Clock, CheckCircle, Truck, XCircle, Phone, MapPin, Eye, ShieldCheck, User, FileText, CheckCircle2, X, Printer, Banknote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/context/BranchContext";
import PermissionGuard from "@/components/staff/PermissionGuard";

function PharmacyOrdersPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [updating, setUpdating] = useState<string | null>(null);
  const [imageViewer, setImageViewer] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const url = `/api/pharmacy/orders?status=${filter}&branchId=${activeBranch?.id || 'ALL'}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user, filter, activeBranch?.id]);

  const updateStatus = async (orderId: string, status: string) => {
    let reason = "";
    if (status === "REJECTED") {
      reason = prompt("Rejection reason:") || "Out of stock";
    }
    setUpdating(orderId);
    try {
      await fetch('/api/pharmacy/orders/update', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status, reason }),
      });
      loadOrders();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const handleCollectCash = async (orderId: string, amount: number) => {
    if (!confirm(`Confirm collected cash: ৳${amount.toFixed(2)}?`)) return;
    setUpdating(orderId);
    try {
      await fetch('/api/pharmacy/orders/collect-cash', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount }),
      });
      loadOrders();
    } catch (err) {
      alert("Failed to collect cash");
    } finally {
      setUpdating(null);
    }
  };

  const filterButtons = [
    { key: "PENDING", label: "New", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { key: "ACCEPTED", label: "Accepted", icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100" },
    { key: "OUT_FOR_DELIVERY", label: "Delivering", icon: Truck, color: "text-purple-600", bg: "bg-purple-100" },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors">
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-800 text-lg tracking-tight flex items-center gap-2">
              Orders <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{activeBranch?.name || 'All'}</span>
            </h1>
          </div>
        </div>
        <Link href="/pharmacy/orders/history" className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl border border-indigo-100 transition-colors">
          History
        </Link>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-4 gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto hide-scrollbar">
          {filterButtons.map((f) => {
            const Icon = f.icon;
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${isActive ? "bg-slate-800 text-white shadow-md" : "bg-transparent text-slate-500 hover:bg-slate-50"}`}
              >
                <Icon size={18} className={isActive ? "text-white" : f.color} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{f.label}</span>
              </button>
            );
          })}
        </div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-64 bg-slate-200/50 animate-pulse rounded-[24px]"></div>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 rounded-[24px] text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={32} className="text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">No {filter.toLowerCase()} orders</h2>
            <p className="text-sm text-slate-500">There are no orders to show for this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="font-bold text-slate-800 text-base">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-indigo-600">৳{parseFloat(order.finalAmount).toFixed(2)}</span>
                    <span className={`block text-[10px] uppercase font-bold px-2 py-0.5 rounded mt-1 ${
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'OUT_FOR_DELIVERY' ? 'bg-purple-100 text-purple-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>{order.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                      <User size={16} className="text-indigo-500" /> {order.patient?.name || "Customer"}
                    </div>
                    <a href={`tel:${order.deliveryPhone}`} className="flex items-center gap-2 text-sm text-slate-700 font-medium hover:text-indigo-600 transition-colors">
                      <Phone size={16} className="text-emerald-500" /> {order.deliveryPhone}
                    </a>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{order.deliveryAddress}</span>
                  </div>

                  {order.prescriptionUrl && (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-sky-200 bg-sky-50 shadow-sm">
                      <div className="flex items-center gap-2 text-sm text-sky-700 font-bold">
                        <FileText size={16} /> Prescription Attached
                      </div>
                      <button onClick={() => setImageViewer(order.prescriptionUrl)} className="p-2 bg-white rounded-lg shadow-sm text-sky-600 hover:bg-sky-100 transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                  )}

                  <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">{item.medicineName} <span className="text-slate-400 text-xs ml-1">x{item.quantity}</span></span>
                        <span className="font-bold text-slate-800">৳{parseFloat(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-sm text-amber-800">
                      <span className="font-bold">Note:</span> {order.notes}
                    </div>
                  )}
                </div>
                <div className="p-5 border-t border-slate-100 bg-slate-50/30">
                  {order.status === "PENDING" && (
                    <div className="flex gap-3">
                      <button disabled={updating === order.id} onClick={() => updateStatus(order.id, "ACCEPTED")} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                        {updating === order.id ? <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' /> : <><CheckCircle size={18} /> Accept Order</>}
                      </button>
                      <button disabled={updating === order.id} onClick={() => updateStatus(order.id, "REJECTED")} className="flex-1 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                        {updating === order.id ? <div className='w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin' /> : <><XCircle size={18} /> Reject</>}
                      </button>
                    </div>
                  )}
                  {order.status === "ACCEPTED" && (
                    <div className="flex gap-3">
                      <button onClick={() => window.open(`/pharmacy/orders/${order.id}/memo`, '_blank')} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                        <Printer size={18} /> Print Memo
                      </button>
                      <button disabled={updating === order.id} onClick={() => updateStatus(order.id, "OUT_FOR_DELIVERY")} className="flex-[2] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                        {updating === order.id ? <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' /> : <><Truck size={18} /> Send For Delivery</>}
                      </button>
                    </div>
                  )}

                  {(order.status === "OUT_FOR_DELIVERY" || order.status === "DELIVERED") && parseFloat(order.dueAmount) > 0 && (
                     <div className="mt-3">
                       <button disabled={updating === order.id} onClick={() => handleCollectCash(order.id, parseFloat(order.dueAmount))} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2">
                        {updating === order.id ? <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' /> : <><Banknote size={18} /> Collect Cash (৳{parseFloat(order.dueAmount).toFixed(2)})</>}
                       </button>
                     </div>
                  )}
                  {order.status === "OUT_FOR_DELIVERY" && (
                    <button disabled={updating === order.id} onClick={() => updateStatus(order.id, "DELIVERED")} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2">
                      {updating === order.id ? <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' /> : <><ShieldCheck size={18} /> Mark as Delivered</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔥 Premium Image Viewer Modal */}
      {imageViewer && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setImageViewer(null)}>
          <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-sky-600"/> Prescription</h3>
              <button onClick={() => setImageViewer(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-2 bg-slate-50 flex items-center justify-center h-[60vh] overflow-hidden">
              <img src={imageViewer} alt="Prescription" className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PharmacyOrdersPage() {
  return (
    <PermissionGuard permission="view_orders">
      <PharmacyOrdersPageInner />
    </PermissionGuard>
  );
}

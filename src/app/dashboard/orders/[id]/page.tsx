"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MapPin, Store, Pill, FileText, Package, Truck, CheckCircle, Clock, XCircle, Wallet, DollarSign, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function PatientOrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const { t: tr } = useLanguage();

  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    if (!orderId) return;

    const email = user.email;
    setLoading(true);

    fetch("/api/orders/my-detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId, user, authLoading, router]);

  const formatDate = (d: string) => new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const bg = { background: "linear-gradient(180deg,#dbeafe 0%,#eff6ff 38%,#f8fafc 100%)" };
  const cardCls = "bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] text-slate-900";

  if (loading || authLoading) return <div className="min-h-screen p-6 text-center text-slate-500 font-medium animate-pulse" style={bg}>{tr("od.loading", "Loading order details...")}</div>;
  if (!order) return <div className="min-h-screen p-6 text-center text-slate-500" style={bg}>{tr("od.notFound", "Order not found")}</div>;

  const finalAmount = parseFloat(order.finalAmount);
  const paidAmount = parseFloat(order.paidAmount || 0);
  const dueAmount = parseFloat(order.dueAmount || 0);
  const isFullyPaid = paidAmount >= finalAmount;
  const isPartial = paidAmount > 0 && paidAmount < finalAmount;
  const isFullDue = paidAmount === 0;

  const steps = [
    { key: "PENDING", icon: Clock },
    { key: "ACCEPTED", icon: CheckCircle },
    { key: "OUT_FOR_DELIVERY", icon: Truck },
    { key: "DELIVERED", icon: CheckCircle },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const isRejected = order.status === "REJECTED" || order.status === "CANCELLED";
  const stLabel = (k: string) => tr("od.st." + k, k.replace(/_/g, " "));

  const badge =
    order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
    order.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" :
    order.status === "OUT_FOR_DELIVERY" ? "bg-purple-100 text-purple-700" :
    order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
    "bg-red-100 text-red-700";

  return (
    <div className="min-h-screen pb-10 text-slate-900" style={bg}>
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-white/70 flex items-center justify-between px-4 sticky top-0 z-40">
        <button onClick={() => router.back()} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors">
          <ArrowLeft size={20} className="rtl:rotate-180" />
        </button>
        <h1 className="font-black text-slate-900 text-lg">{tr("od.title", "Order Details")}</h1>
        <div className="w-11"></div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Order header */}
        <div className={cardCls}>
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{tr("od.number", "Order Number")}</p>
              <p className="font-black text-slate-900 text-lg break-all">{order.orderNumber}</p>
              <p className="text-sm text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold shrink-0 ${badge}`}>{stLabel(order.status)}</span>
          </div>
        </div>

        {/* Payment status */}
        {isFullyPaid && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><CheckCircle size={24} /></div>
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-green-100">{tr("od.payment", "Payment")}</p>
                <p className="text-xl font-bold">{tr("od.fullyPaid", "FULLY PAID")}</p>
              </div>
            </div>
          </div>
        )}

        {isPartial && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-3xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Wallet size={24} /></div>
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-amber-100">{tr("od.payment", "Payment")}</p>
                <p className="text-xl font-bold">{tr("od.partial", "PARTIALLY PAID")}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-white/10 rounded-2xl p-3">
              <div className="text-center">
                <p className="text-xs text-amber-100">{tr("od.total", "Total")}</p>
                <p className="text-base font-bold">৳{finalAmount.toFixed(2)}</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-xs text-amber-100">{tr("od.paid", "Paid")}</p>
                <p className="text-base font-bold text-green-100">৳{paidAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-amber-100">{tr("od.due", "Due")}</p>
                <p className="text-base font-bold text-red-100">৳{dueAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {isFullDue && order.status !== "PENDING" && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><DollarSign size={24} /></div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-red-100">{tr("od.dueAmount", "Due Amount")}</p>
                  <p className="text-2xl font-bold">৳{dueAmount.toFixed(2)}</p>
                </div>
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-bold">{tr("od.unpaid", "UNPAID")}</span>
            </div>
          </div>
        )}

        {/* Progress */}
        {!isRejected && (
          <div className={cardCls}>
            <h2 className="font-bold text-slate-900 text-base mb-5">{tr("od.progress", "Order Progress")}</h2>
            <div className="flex items-center justify-between">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const done = i <= currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    {i < steps.length - 1 && (
                      <div className={`absolute top-5 start-1/2 w-full h-1 rounded-full ${i < currentStepIndex ? "bg-gradient-to-r from-blue-600 to-cyan-500" : "bg-slate-200"}`} />
                    )}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center z-10 ${done ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/30" : "bg-slate-200 text-slate-400"}`}>
                      <Icon size={19} />
                    </div>
                    <p className={`text-xs mt-2 text-center font-semibold ${done ? "text-blue-700" : "text-slate-400"}`}>{stLabel(step.key)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 p-5 rounded-3xl border border-red-200">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle size={22} />
              <p className="font-bold text-base">{order.status === "REJECTED" ? tr("od.rejected", "Order Rejected") : tr("od.cancelled", "Order Cancelled")}</p>
            </div>
          </div>
        )}

        {/* Pharmacy */}
        <div className={cardCls}>
          <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
            <Store size={18} className="text-blue-600" /> {tr("od.pharmacy", "Pharmacy")}
          </h2>
          <div className="flex items-center gap-3">
            {order.pharmacy?.logo ? (
              <img src={order.pharmacy.logo} alt="logo" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                {order.pharmacy?.shopName?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">{order.pharmacy?.shopName}</p>
              <p className="text-sm text-slate-500 truncate">{order.pharmacy?.area}, {order.pharmacy?.city}</p>
            </div>
            {order.pharmacy?.phone && (
              <a href={`tel:${order.pharmacy.phone}`} className="w-11 h-11 flex items-center justify-center bg-green-100 rounded-xl text-green-600">
                <Phone size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Delivery address */}
        <div className={cardCls}>
          <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-blue-600" /> {tr("od.address", "Delivery Address")}
          </h2>
          <p className="text-[15px] text-slate-700 leading-relaxed">{order.deliveryAddress}</p>
          <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5"><Phone size={14} /> {order.deliveryPhone}</p>
        </div>

        {/* Items */}
        <div className={cardCls}>
          <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
            <Package size={18} className="text-orange-500" /> {tr("od.items", "Items")} ({order.items.length})
          </h2>
          <div className="space-y-1">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Pill size={16} className="text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-slate-900 truncate">{item.medicineName}</p>
                    <p className="text-sm text-slate-500">
                      ৳{parseFloat(item.unitPrice).toFixed(2)} × {item.quantity}
                      {item.unitType && item.unitType !== "piece" && ` (${tr("cart.unit." + String(item.unitType).toLowerCase(), item.unitType)})`}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-slate-900 shrink-0">৳{parseFloat(item.subtotal).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment summary */}
        <div className={cardCls}>
          <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
            <Wallet size={18} className="text-green-600" /> {tr("od.paySummary", "Payment Summary")}
          </h2>
          <div className="space-y-2.5 text-[15px]">
            <div className="flex justify-between">
              <span className="text-slate-600">{tr("od.subtotal", "Subtotal")}</span>
              <span className="font-semibold text-slate-900">৳{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
            {parseFloat(order.deliveryFee) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">{tr("od.deliveryFee", "Delivery Fee")}</span>
                <span className="font-semibold text-slate-900">৳{parseFloat(order.deliveryFee).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(order.discountAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">{tr("od.discount", "Discount")}</span>
                <span className="font-semibold text-red-500">- ৳{parseFloat(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black pt-3 border-t border-slate-100">
              <span className="text-slate-900">{tr("od.total", "Total")}</span>
              <span className="text-blue-600">৳{finalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 font-medium">{tr("od.paid", "Paid")}</span>
              <span className="font-semibold text-green-700">৳{paidAmount.toFixed(2)}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between pt-2 border-t border-red-100">
                <span className="font-bold text-red-600">{tr("od.due", "Due")}</span>
                <span className="font-bold text-red-600">৳{dueAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-3 mt-1 border-t border-slate-100 flex justify-between text-sm">
              <span className="text-slate-500">{tr("od.method", "Payment Method")}</span>
              <span className="font-semibold text-slate-700">
                {order.paymentMethod === "COD" ? tr("co.cod", "Cash on Delivery") : order.paymentMethod === "ONLINE" ? tr("co.mobile", "Mobile Banking") : order.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-yellow-50 p-5 rounded-3xl border border-yellow-200">
            <h2 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
              <FileText size={18} className="text-yellow-600" /> {tr("od.notes", "Your Notes")}
            </h2>
            <p className="text-[15px] text-slate-700">{order.notes}</p>
          </div>
        )}

        <Link href="/medicines" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-base font-bold shadow-lg shadow-blue-500/25">
          <ShoppingBag size={18} /> {tr("od.more", "Order More Medicines")}
        </Link>
      </div>
    </div>
  );
}

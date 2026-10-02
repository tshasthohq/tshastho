"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MapPin, Store, Pill, FileText, Package, Truck, CheckCircle, Clock, XCircle, Wallet, DollarSign, ShoppingBag } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { useAuth } from "@/hooks/useAuth";

export default function PatientOrderDetailPage() {
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const { branding } = useBranding();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const email = user?.email;
    if (!email) { router.push("/login"); return; }

    fetch("/api/orders/my-detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.order) setOrder(data.order);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [orderId]);

  const formatDate = (d: string) => new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!order) return <div className="p-6 text-center text-slate-500">Order not found</div>;

  const finalAmount = parseFloat(order.finalAmount);
  const paidAmount = parseFloat(order.paidAmount || 0);
  const dueAmount = parseFloat(order.dueAmount || 0);
  const isFullyPaid = paidAmount >= finalAmount;
  const isPartial = paidAmount > 0 && paidAmount < finalAmount;
  const isFullDue = paidAmount === 0;

  const steps = [
    { key: "PENDING", label: "Pending", icon: Clock },
    { key: "ACCEPTED", label: "Accepted", icon: CheckCircle },
    { key: "OUT_FOR_DELIVERY", label: "Delivering", icon: Truck },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const isRejected = order.status === "REJECTED" || order.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-slate-800">Order Details</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Order Header */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500">Order Number</p>
              <p className="font-bold text-slate-800">{order.orderNumber}</p>
              <p className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              order.status === "PENDING" ? "bg-yellow-100 text-yellow-600" :
              order.status === "ACCEPTED" ? "bg-blue-100 text-blue-600" :
              order.status === "OUT_FOR_DELIVERY" ? "bg-purple-100 text-purple-600" :
              order.status === "DELIVERED" ? "bg-green-100 text-green-600" :
              "bg-red-100 text-red-600"
            }`}>{order.status.replace(/_/g, " ")}</span>
          </div>
        </div>

        {/* Payment Status Card */}
        {isFullyPaid && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-green-100">Payment</p>
                <p className="text-xl font-bold">FULLY PAID</p>
              </div>
            </div>
          </div>
        )}

        {isPartial && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-amber-100">Payment</p>
                <p className="text-xl font-bold">PARTIALLY PAID</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-white/10 rounded-xl p-3">
              <div className="text-center">
                <p className="text-[9px] text-amber-100">Total</p>
                <p className="text-sm font-bold">৳{finalAmount.toFixed(2)}</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-[9px] text-amber-100">Paid</p>
                <p className="text-sm font-bold text-green-200">৳{paidAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-amber-100">Due</p>
                <p className="text-sm font-bold text-red-200">৳{dueAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {isFullDue && order.status !== "PENDING" && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-red-100">Due Amount</p>
                  <p className="text-2xl font-bold">৳{dueAmount.toFixed(2)}</p>
                </div>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-bold">UNPAID</span>
            </div>
          </div>
        )}

        {/* Progress Tracker */}
        {!isRejected && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm mb-4">Order Progress</h2>
            <div className="flex items-center justify-between">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const done = i <= currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    {i < steps.length - 1 && (
                      <div className={`absolute top-5 left-1/2 w-full h-0.5 ${i < currentStepIndex ? "bg-green-500" : "bg-slate-200"}`} />
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${done ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                      <Icon size={18} />
                    </div>
                    <p className={`text-[10px] mt-2 text-center font-medium ${done ? "text-green-600" : "text-slate-400"}`}>{step.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 p-5 rounded-2xl border border-red-200">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle size={20} />
              <p className="font-bold text-sm">{order.status === "REJECTED" ? "Order Rejected" : "Order Cancelled"}</p>
            </div>
          </div>
        )}

        {/* Pharmacy Info */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Store size={16} className="text-purple-600" /> Pharmacy
          </h2>
          <div className="flex items-center gap-3">
            {order.pharmacy?.logo ? (
              <img src={order.pharmacy.logo} alt="logo" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                {order.pharmacy?.shopName?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{order.pharmacy?.shopName}</p>
              <p className="text-xs text-slate-500 truncate">{order.pharmacy?.area}, {order.pharmacy?.city}</p>
            </div>
            {order.pharmacy?.phone && (
              <a href={`tel:${order.pharmacy.phone}`} className="p-2 bg-green-100 rounded-lg text-green-600">
                <Phone size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-blue-600" /> Delivery Address
          </h2>
          <p className="text-sm text-slate-700">{order.deliveryAddress}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Phone size={12} /> {order.deliveryPhone}
          </p>
        </div>

        {/* Items */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Package size={16} className="text-orange-600" /> Items ({order.items.length})
          </h2>
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Pill size={14} className="text-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-slate-800 truncate">{item.medicineName}</p>
                    <p className="text-xs text-slate-400">
                      ৳{parseFloat(item.unitPrice).toFixed(2)} × {item.quantity} {item.unitType !== "piece" && `(${item.unitType})`}
                    </p>
                  </div>
                </div>
                <p className="font-medium text-slate-800 flex-shrink-0">৳{parseFloat(item.subtotal).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Wallet size={16} className="text-green-600" /> Payment Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">৳{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
            {parseFloat(order.deliveryFee) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Delivery Fee</span>
                <span className="font-medium">৳{parseFloat(order.deliveryFee).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(order.discountAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="font-medium text-red-500">− ৳{parseFloat(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-100">
              <span>Total</span>
              <span className="text-slate-800">৳{finalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Paid</span>
              <span className="font-medium text-green-700">৳{paidAmount.toFixed(2)}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between pt-1 border-t border-red-100">
                <span className="font-bold text-red-600">Due</span>
                <span className="font-bold text-red-600">৳{dueAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-medium text-slate-700">{order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-200">
            <h2 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
              <FileText size={16} className="text-yellow-600" /> Your Notes
            </h2>
            <p className="text-sm text-slate-700">{order.notes}</p>
          </div>
        )}

        {/* CTA */}
        <Link href="/medicines" className="block">
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
            <ShoppingBag size={16} /> Order More Medicines
          </button>
        </Link>
      </div>
    </div>
  );
}

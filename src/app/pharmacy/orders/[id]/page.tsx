"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Printer, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TshasthoLogo } from "@/components/brand/TshasthoLogo";
import { useBranding } from "@/hooks/useBranding";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const { branding } = useBranding();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    fetch("/api/orders/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.order) setOrder(data.order);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [orderId]);

  const handlePrint = () => window.print();

  const formatDate = (d: string) => new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!order) return <div className="p-6 text-center text-slate-500">Order not found</div>;

  const shopInitial = order.pharmacy?.shopName?.charAt(0)?.toUpperCase() || "P";
  const shopLogo = order.pharmacy?.logo;
  const isDue = order.isDue && parseFloat(order.dueAmount) > 0;
  const isPaid = !order.isDue || order.status === "DELIVERED" && !isDue;

  return (
    <div className="min-h-screen bg-slate-50 pb-10 print:min-h-0 print:pb-0 print:bg-white">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-slate-800">Order Memo</h1>
        <button onClick={handlePrint} className="p-2 text-blue-600">
          <Printer size={20} />
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-4 print:p-0 print:max-w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none memo-print-container">
          
          {/* ============ HEADER ============ */}
          <div className="flex items-start justify-between gap-4 pb-6 mb-6 border-b-2 border-slate-800">
            {/* Pharmacy Logo + Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {shopLogo ? (
                <img 
                  src={shopLogo} 
                  alt={order.pharmacy?.shopName} 
                  className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 flex-shrink-0 bg-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {shopInitial}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">
                  {order.pharmacy?.shopName}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 truncate">
                  {order.pharmacy?.address}
                </p>
                <p className="text-xs text-slate-600">
                  {order.pharmacy?.area}, {order.pharmacy?.city}
                </p>
                {order.pharmacy?.phone && (
                  <p className="text-xs text-slate-700 mt-1 font-medium flex items-center gap-1">
                    <Phone size={11} /> {order.pharmacy.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Tshastho Badge */}
            <div className="flex flex-col items-end flex-shrink-0">
              <TshasthoLogo size={30} showText={true} />
              <p className="text-[9px] text-slate-500 mt-1 text-right">
                Connected Healthcare. Trusted Care.
              </p>
            </div>
          </div>

          {/* ============ TITLE ============ */}
          <div className="text-center mb-6">
            <div className="inline-block bg-slate-900 text-white px-8 py-2.5 rounded-lg">
              <h1 className="text-base font-bold tracking-widest">SALE MEMO</h1>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-mono">
              Order #{order.orderNumber}
            </p>
          </div>

          {/* ============ PAYMENT STATUS BADGE ============ */}
          {order.status === "DELIVERED" && (
            <>
              {parseFloat(order.paidAmount) >= parseFloat(order.finalAmount) ? (
                /* FULLY PAID */
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 mb-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-green-100">Payment Status</p>
                      <p className="text-2xl font-bold">FULLY PAID</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-green-100">Paid</p>
                    <p className="text-lg font-bold">৳{parseFloat(order.paidAmount).toFixed(2)}</p>
                  </div>
                </div>
              ) : parseFloat(order.paidAmount) > 0 ? (
                /* PARTIAL PAYMENT */
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl p-4 mb-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-amber-100">Partial Payment</p>
                        <p className="text-xl font-bold">PARTIALLY PAID</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-white/10 rounded-lg p-2">
                    <div className="text-center">
                      <p className="text-[9px] text-amber-100">Total</p>
                      <p className="text-sm font-bold">৳{parseFloat(order.finalAmount).toFixed(2)}</p>
                    </div>
                    <div className="text-center border-x border-white/20">
                      <p className="text-[9px] text-amber-100">Paid</p>
                      <p className="text-sm font-bold text-green-200">৳{parseFloat(order.paidAmount).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-amber-100">Due</p>
                      <p className="text-sm font-bold text-red-200">৳{parseFloat(order.dueAmount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* FULL DUE */
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-4 mb-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-red-100">Due Amount</p>
                      <p className="text-2xl font-bold">৳{parseFloat(order.dueAmount).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-red-100">Status</p>
                    <p className="text-sm font-bold">UNPAID</p>
                  </div>
                </div>
              )}
            </>
          )}

          {order.status === "PENDING" && (
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl p-4 mb-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-yellow-100">Status</p>
                  <p className="text-xl font-bold">PENDING</p>
                </div>
              </div>
            </div>
          )}


          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Bill To
              </p>
              <p className="text-sm font-bold text-slate-900">
                {order.patient?.name || "Customer"}
              </p>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <Phone size={11} /> {order.deliveryPhone}
              </p>
              <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                <MapPin size={11} className="mt-0.5 flex-shrink-0" />
                <span>{order.deliveryAddress}</span>
              </p>
              {order.receiverPhone && (
                <p className="text-[10px] text-slate-500 mt-2 italic">
                  Receiver: {order.receiverPhone}
                </p>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Order Information
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-900 font-medium">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span className="text-slate-900 font-medium">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-bold ${
                    order.status === "DELIVERED" ? "text-green-700" :
                    order.status === "PENDING" ? "text-yellow-700" :
                    order.status === "REJECTED" ? "text-red-700" :
                    "text-blue-700"
                  }`}>{order.status.replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============ ITEMS TABLE ============ */}
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider w-10">#</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider">Medicine</th>
                  <th className="py-2.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider w-16">Qty</th>
                  <th className="py-2.5 px-3 text-right text-[10px] font-bold uppercase tracking-wider w-24">Rate</th>
                  <th className="py-2.5 px-3 text-right text-[10px] font-bold uppercase tracking-wider w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any, i: number) => (
                  <tr key={item.id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                    <td className="py-3 px-3 text-xs text-slate-500 font-medium">{i + 1}</td>
                    <td className="py-3 px-3">
                      <p className="text-xs font-semibold text-slate-900">{item.medicineName}</p>
                      {item.unitType !== "piece" && (
                        <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                          (per {item.unitType})
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-slate-700 font-medium">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-xs text-slate-700">৳{parseFloat(item.unitPrice).toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-slate-900">৳{parseFloat(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============ TOTALS ============ */}
          <div className="flex justify-end mb-6">
            <div className="w-full max-w-xs">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-slate-900">৳{parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
                {parseFloat(order.deliveryFee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Delivery Fee</span>
                    <span className="text-slate-900">৳{parseFloat(order.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(order.discountAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Discount</span>
                    <span className="text-red-600">− ৳{parseFloat(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t-2 border-slate-900 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900">TOTAL</span>
                <span className="text-xl font-bold text-green-700">৳{parseFloat(order.finalAmount).toFixed(2)}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-bold text-green-700">PAID NOW</span>
                <span className="text-lg font-bold text-green-700">৳{parseFloat(order.paidAmount || 0).toFixed(2)}</span>
              </div>
              {parseFloat(order.dueAmount) > 0 && (
                <div className="mt-1 pt-1 border-t border-red-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-red-600">DUE</span>
                  <span className="text-lg font-bold text-red-600">৳{parseFloat(order.dueAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ============ VERIFIED BADGE ============ */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-green-300 rounded-2xl p-4 mb-6 verified-section">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">VERIFIED TRANSACTION</p>
                <p className="text-[10px] text-green-700">Powered by Tshastho</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mb-3">
              This sale has been processed through <strong>Tshastho</strong> — Bangladesh's trusted digital healthcare platform.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-1 text-slate-700">
                <span className="text-green-600">✓</span> Verified Pharmacy
              </div>
              <div className="flex items-center gap-1 text-slate-700">
                <span className="text-green-600">✓</span> Genuine Medicine
              </div>
              <div className="flex items-center gap-1 text-slate-700">
                <span className="text-green-600">✓</span> Secure Transaction
              </div>
              <div className="flex items-center gap-1 text-slate-700">
                <span className="text-green-600">✓</span> Trusted Platform
              </div>
            </div>
          </div>

          {/* ============ FOOTER ============ */}
          <div className="text-center pt-4 border-t border-slate-200 footer-section">
            <p className="text-sm font-bold text-slate-800 mb-1">
              Thank you for your purchase!
            </p>
            <p className="text-[10px] text-slate-500">
              For support: <strong>{branding.supportPhone}</strong>
            </p>
            <div className="flex justify-center mt-3">
              <TshasthoLogo size={22} showText={true} />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 italic">
              {branding.tagline || "Better Health, Brighter Tomorrow"}
            </p>
            <p className="text-[8px] text-slate-300 mt-2">
              This is a computer-generated memo. No signature required.
            </p>
          </div>
        </div>

        <Button onClick={handlePrint} className="w-full mt-4 print:hidden">
          <Printer size={16} className="mr-2" /> Print / Save PDF
        </Button>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 6mm;
          }
          html, body {
            background: white !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11px !important;
          }
          .print\\:hidden { display: none !important; }
          .min-h-screen {
            min-height: 0 !important;
            padding-bottom: 0 !important;
          }
          /* Scale content slightly for tighter fit */
          .memo-print-container {
            transform: scale(0.92);
            transform-origin: top center;
            width: 108%;
            margin-left: -4%;
          }
          /* Prevent awkward breaks */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          .verified-section { page-break-inside: avoid; }
          .footer-section { page-break-inside: avoid; }
          /* Reduce padding for print */
          .bg-slate-50 { padding: 6px !important; }
          .mb-6 { margin-bottom: 8px !important; }
          .pb-6 { padding-bottom: 8px !important; }
          .pt-4 { padding-top: 8px !important; }
          .p-4 { padding: 8px !important; }
        }
      `}</style>
    </div>
  );
}

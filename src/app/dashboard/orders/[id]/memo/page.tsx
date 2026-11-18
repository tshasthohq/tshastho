"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, ShieldCheck, AlertTriangle, CheckCircle2, QrCode, MapPin, Phone, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";

export default function MemoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders/my-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.orders) {
          const found = data.orders.find((o: any) => o.id === resolvedParams.id);
          setOrder(found);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, resolvedParams.id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Order not found</div>;

  const subtotal = Number(order.totalAmount) || 0;
  const deliveryFee = Number(order.deliveryFee) || 0;
  const vatPercent = Number(order.vatPercent ?? order.pharmacy?.vatPercent) || 0;
  const vat = (subtotal * vatPercent) / 100;
  const grandTotal = subtotal + deliveryFee + vat;
  const paidAmount = Number(order.paidAmount) || 0;
  const dueAmount = grandTotal - paidAmount;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' | ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex justify-center items-start py-8 px-4 print:p-0 print:bg-white print:min-h-0 print:h-auto font-sans">
      
      
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 5mm; } /* মার্জিন কমিয়ে ৫ মিলিমিটার করা হলো */
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
        html, body { height: auto !important; min-height: 0 !important; }
        body { zoom: 0.85; }
          
          /* প্রিন্টের সময় সব প্যাডিং এবং মার্জিন ছোট করা */
          .print-px-0 { padding-left: 0 !important; padding-right: 0 !important; }
          .print-py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
          .print-mb-2 { margin-bottom: 8px !important; }
          .print-gap-2 { gap: 8px !important; }
          .print-text-sm { font-size: 11px !important; }
        }
      `}</style>


      {/* Top Action Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b p-4 flex justify-between items-center z-50 print:hidden max-w-5xl mx-auto shadow-sm">
        <button onClick={() => router.back()} className="text-slate-600 hover:text-indigo-600 font-bold text-sm flex items-center gap-2 transition-colors">
          <ArrowLeft size={18} /> Back to Orders
        </button>
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl px-6">
          <Printer size={16} className="mr-2" /> Download / Print
        </Button>
      </div>

      {/* Invoice Container (No min-height, no flex-1) */}
      <div className="w-full max-w-3xl mt-16 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden print:shadow-none print:mt-0 print:rounded-none border border-slate-200 print:border-none relative print:p-4">
        
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
          <h1 className="text-[150px] font-black uppercase tracking-widest text-slate-900 opacity-[0.03] print:opacity-[0.03] rotate-[-30deg]">{dueAmount > 0 ? "UNPAID" : "PAID"}</h1>
        </div>

        {/* Main Content */}
        <div className="p-5 md:p-8 print:p-4 relative z-10">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2 print-avoid-break">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <img src="/logo.png" alt="Tshastho" className="h-10 object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                 <div className="hidden text-2xl font-black text-indigo-900 tracking-tight">Tshastho</div>
              </div>
              <p className="text-sm text-slate-500 font-medium">Connected Healthcare. Trusted Care.</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">INVOICE</h2>
              <p className="text-sm font-bold text-indigo-600 mb-1">#{order.orderNumber}</p>
              <p className="text-xs text-slate-500 font-medium">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 mb-3 print-avoid-break">
             <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fulfilled By</h3>
                <div className="flex items-start gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {order.pharmacy?.logo ? (
                        <img src={order.pharmacy.logo} alt="Pharmacy" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-lg font-black text-indigo-600">{order.pharmacy?.shopName?.charAt(0) || 'P'}</span>
                      )}
                   </div>
                   <div>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {order.pharmacy?.shopName} <ShieldCheck size={14} className="text-emerald-500" />
                      </p>
                      <div className="text-[11px] text-slate-500 mt-1 leading-relaxed space-y-0.5">
                        <p>{order.pharmacy?.address || order.pharmacy?.area || "Address not available"}</p>
                        <p>Ph: {order.pharmacy?.phone || "Not set"} | Lic: {order.pharmacy?.drugLicense || "Not set"}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</h3>
                <p className="font-bold text-slate-900 text-sm">{user?.name || "Customer"}</p>
                <div className="text-[11px] text-slate-600 mt-1 leading-relaxed space-y-0.5">
                  <p>{order.deliveryAddress?.replace(/,\s*$/, '') || "Address not provided"}</p>
                  <p>Phone: {order.deliveryPhone}</p>
                </div>
             </div>
          </div>

          {/* Status Bar */}
          <div className={`flex justify-between items-center p-4 rounded-xl mb-6 border print-avoid-break ${dueAmount > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            <div className="flex items-center gap-2">
              {dueAmount > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
              <span className="font-black text-sm uppercase tracking-wider">{dueAmount > 0 ? `Payment Due (${order.paymentMethod || "COD"})` : "Paid in Full"}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">৳{dueAmount > 0 ? dueAmount.toFixed(2) : grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mb-6 rounded-xl border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100/80 print:hidden">
                  <th className="py-1.5 px-2 print:py-1 print:px-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-12">#</th>
                  <th className="py-1.5 px-2 print:py-1 print:px-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                  <th className="py-1.5 px-2 print:py-1 print:px-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Qty</th>
                  <th className="py-1.5 px-2 print:py-1 print:px-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Rate</th>
                  <th className="py-1.5 px-2 print:py-1 print:px-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {order.items.map((item: any, idx: number) => {
                  const rate = Number(item.unitPrice) || Number(item.sellingPrice) || Number(item.price) || 0;
                  const amount = rate * item.quantity;
                  return (
                    <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors even:bg-slate-50/30 print-avoid-break">
                      <td className="py-1.5 px-2 print:py-1 print:px-2 text-xs font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-1.5 px-2 print:py-1 print:px-2">
                        <p className="font-bold text-slate-900 text-sm">{item.medicineName}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{item.unitType || 'Piece'}</p>
                      </td>
                      <td className="py-1.5 px-2 print:py-1 print:px-2 text-center text-sm font-bold text-slate-700">{item.quantity}</td>
                      <td className="py-1.5 px-2 print:py-1 print:px-2 text-right text-sm font-medium text-slate-600">৳{rate.toFixed(2)}</td>
                      <td className="py-1.5 px-2 print:py-1 print:px-2 text-right text-sm font-black text-slate-900">৳{amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes */}
          <div className="flex flex-col md:flex-row print:flex-row justify-between items-start gap-6 mb-3 print-avoid-break">
            <div className="w-full md:w-1/2 print:w-1/2">
               <div className="flex items-center gap-2 mb-2">
                 <FileText size={14} className="text-slate-400" />
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terms & Conditions</h4>
               </div>
               <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-4 font-medium leading-relaxed">
                 <li>Medicines cannot be returned or exchanged once sold (except damaged/expired).</li>
                 <li>For refunds on damaged items, please contact the pharmacy within 24 hours.</li>
                 <li>Keep all medicines out of reach of children.</li>
                 <li>Store in a cool, dry place away from direct sunlight.</li>
               </ul>
            </div>

            <div className="w-full md:w-1/2 print:w-1/2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
                <span>Subtotal</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
                <span>VAT ({vatPercent}%)</span>
                <span>৳{vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-600 pb-2 border-b border-slate-200 border-dashed">
                <span>Delivery Fee</span>
                <span>৳{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-slate-900 mt-2">
                <span>Total Amount</span>
                <span className="text-indigo-600">৳{grandTotal.toFixed(2)}</span>
              </div>
              {paidAmount > 0 && (
                <div className="flex justify-between text-sm font-bold text-slate-600 mt-1">
                  <span>Paid</span>
                  <span className="text-slate-800">৳{paidAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Verified Transaction Section */}
          <div className="bg-slate-900 rounded-2xl p-4 flex flex-col md:flex-row print:flex-row items-start md:items-center print:items-center justify-between mb-8 text-white shadow-lg gap-4 print-avoid-break">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck className="text-emerald-400" size={24} />
               </div>
               <div>
                 <p className="text-sm font-black tracking-wide">VERIFIED TRANSACTION</p>
                 <p className="text-[10px] text-slate-300 mt-0.5">Digitally verified and processed securely through Tshastho.</p>
               </div>
             </div>
             <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-400"/> Verified Pharmacy</span>
                <span className="text-[10px] font-bold text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-400"/> Secure Transaction</span>
             </div>
          </div>

          {/* Footer Section (No mt-auto, just sits at the bottom of content) */}
          <div className="flex flex-col md:flex-row print:flex-row items-end justify-between pt-4 border-t border-slate-100 gap-4 print-avoid-break">
             <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1 shadow-sm">
                   <QRCodeSVG value={`https://tshastho.com/track/${order.orderNumber}`} size={52} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Scan to Track</p>
                  <p className="text-[9px] text-slate-400">Verify this invoice online</p>
                </div>
             </div>

             <div className="text-center">
                <div className="w-40 border-b border-slate-300 mb-1"></div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorized Signature</p>
             </div>

             <div className="text-right">
                <img src="/logo.png" alt="Tshastho" className="h-7 ml-auto" onError={(e) => e.currentTarget.style.display='none'} />
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-1">Computer Generated Invoice</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

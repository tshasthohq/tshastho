"use client";

import { useEffect, useState, use } from "react";
import { Printer, ArrowLeft, MapPin, Phone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function OrderMemoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pharmacy/orders/${resolvedParams.id}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.order) setOrder(data.order);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.id]);

  const handlePrint = () => { window.print(); };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Memo...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">Order not found!</div>;

  const dueAmount = parseFloat(order.dueAmount);
  const isDue = dueAmount > 0;

  return (
    /* 🔥 Wrapper class updated: added print:min-h-0 print:h-auto */
    <div className="memo-wrapper min-h-screen bg-[#F1F5F9] pb-10 print:bg-white print:pb-0 print:min-h-0 print:h-auto font-sans">
      
      {/* 🔥 ULTIMATE PRINT CSS FIX */}
      <style jsx global>{`
        @media print {
          @page { margin: 8mm; size: A4 portrait; }
          body, html { 
            height: auto !important; 
            min-height: 0 !important; 
            overflow: hidden !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .memo-wrapper { 
            height: auto !important; 
            min-height: 0 !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important;
          }
          .memo-container { 
            box-shadow: none !important; 
            margin: 0 auto !important; 
            padding: 0 !important; 
            width: 100% !important; 
            max-width: 100% !important; 
            border: none !important; 
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top Action Bar */}
      <div className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <button onClick={() => router.push('/pharmacy/orders')} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95">
          <Printer size={18} /> Print / Save PDF
        </button>
      </div>

      {/* Memo Paper Container */}
      <div className="memo-container max-w-[750px] mx-auto mt-8 bg-white p-10 shadow-2xl rounded-2xl border border-slate-200 print:p-0 print:mt-0">
        
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
               {order.pharmacy?.logo ? (
                  <img src={order.pharmacy.logo} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-2xl font-black text-indigo-200">{order.pharmacy?.shopName?.charAt(0) || "P"}</span>
               )}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{order.pharmacy?.shopName || "T Pharmacy"}</h1>
              <p className="text-[11px] text-slate-600 mt-1.5 font-medium">{order.pharmacy?.address}, {order.pharmacy?.city}</p>
              <p className="text-[11px] text-slate-600 font-medium">Ph: {order.pharmacy?.phone}</p>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Drug Lic: {order.pharmacy?.drugLicense || "DL-TEST-001"}</p>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <Image src="/logo.png" alt="Tshastho" width={120} height={30} className="object-contain" priority />
            <p className="text-[8px] text-slate-500 mt-2 uppercase tracking-widest font-bold text-right">Connected Healthcare.<br/>Trusted Care.</p>
          </div>
        </div>

        {/* Title & Info */}
        <div className="flex justify-between items-end mb-4">
          <div>
             <div className="border-2 border-slate-900 text-slate-900 px-5 py-1 rounded-full font-black tracking-widest text-xs inline-block">SALE MEMO</div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order No</p>
             <p className="text-sm font-black text-slate-900">{order.orderNumber}</p>
             <p className="text-[10px] font-medium text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleString("en-GB")}</p>
          </div>
        </div>

        {/* Due Banner */}
        <div className={`rounded-xl p-3 flex items-center justify-between text-white mb-4 ${isDue ? 'bg-[#E11D48]' : 'bg-emerald-600'}`}>
          <div className="flex items-center gap-3">
            {isDue ? <AlertTriangle size={22} className="opacity-90" /> : <CheckCircle2 size={22} className="opacity-90" />}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-90">Due Amount</p>
              <p className="text-2xl font-black leading-none mt-0.5">৳{isDue ? dueAmount.toFixed(2) : parseFloat(order.finalAmount).toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right border-l border-white/20 pl-4">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-90">Status</p>
            <p className="font-black text-xs tracking-wider mt-0.5">{isDue ? 'UNPAID' : 'PAID'}</p>
          </div>
        </div>
        {/* Bill To & Order Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-slate-200 rounded-lg p-2.5">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">BILL TO</p>
            <p className="font-bold text-slate-900 text-xs">{order.patient?.name || "Customer"}</p>
            <p className="text-[11px] text-slate-700 flex items-center gap-1.5 mt-1 font-medium"><Phone size={10} className="text-slate-400"/> {order.deliveryPhone}</p>
            <p className="text-[11px] text-slate-700 flex items-start gap-1.5 mt-0.5 font-medium"><MapPin size={10} className="text-slate-400 mt-0.5 shrink-0"/> {order.deliveryAddress}</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-2.5">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">ORDER INFO</p>
            <div className="grid grid-cols-2 gap-y-1 text-[11px]">
              <span className="text-slate-500 font-medium">Date:</span>
              <span className="text-slate-900 font-bold text-right">{new Date(order.createdAt).toLocaleDateString("en-GB")}</span>
              <span className="text-slate-500 font-medium">Payment:</span>
              <span className="text-slate-900 font-bold text-right uppercase">{order.paymentMethod}</span>
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="text-slate-900 font-bold text-right uppercase">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Premium Table */}
        <table className="w-full text-[11px] mb-4">
          <thead>
            <tr className="bg-slate-100 text-left border-y-2 border-slate-800">
              <th className="py-1.5 px-2 font-black text-slate-900 w-8">#</th>
              <th className="py-1.5 px-2 font-black text-slate-900">MEDICINE</th>
              <th className="py-1.5 px-2 font-black text-slate-900 text-center w-12">QTY</th>
              <th className="py-1.5 px-2 font-black text-slate-900 text-right w-16">RATE</th>
              <th className="py-1.5 px-2 font-black text-slate-900 text-right w-20">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item: any, idx: number) => (
              <tr key={item.id}>
                <td className="py-1.5 px-2 text-slate-500 font-medium">{idx + 1}</td>
                <td className="py-1.5 px-2 text-slate-900 font-bold">{item.medicineName}</td>
                <td className="py-1.5 px-2 text-center text-slate-700 font-medium">{item.quantity}</td>
                <td className="py-1.5 px-2 text-right text-slate-600 font-medium">{parseFloat(item.unitPrice).toFixed(2)}</td>
                <td className="py-1.5 px-2 text-right text-slate-900 font-bold">{parseFloat(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-4">
          <div className="w-[50%] space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal</span>
              <span className="text-slate-900">৳{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Delivery Fee</span>
              <span className="text-slate-900">৳{parseFloat(order.deliveryFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-xs pt-1.5 border-t-2 border-slate-800 mt-1">
              <span>TOTAL</span>
              <span>৳{parseFloat(order.finalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium mt-0.5">
              <span>PAID NOW</span>
              <span className="text-emerald-600 font-bold">৳{parseFloat(order.paidAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#E11D48] font-black text-xs mt-0.5">
              <span>DUE</span>
              <span>৳{parseFloat(order.dueAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Verified Transaction Box */}
        <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-2.5 mb-4 relative overflow-hidden">
          <div className="flex items-center gap-1.5 mb-0.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <p className="font-black text-emerald-900 text-[10px] tracking-wider uppercase">Verified Transaction</p>
          </div>
          <p className="text-[9px] text-slate-600 mb-1.5 font-medium">This sale has been processed through Tshastho — Bangladesh's trusted digital healthcare platform.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-700 font-bold">
            <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500"/> Verified Pharmacy</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500"/> Genuine Medicine</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500"/> Secure Transaction</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500"/> Trusted Platform</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 border-t border-slate-300 border-dashed">
          <p className="font-black text-slate-800 text-xs mb-0.5">Thank you for your purchase!</p>
          <p className="text-[9px] text-slate-500 font-medium">For support: {order.pharmacy?.phone || '01737326555'}</p>
          <div className="flex justify-center mt-1 mb-1">
             <Image src="/logo.png" alt="Tshastho" width={70} height={18} className="object-contain opacity-70" />
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">This is a computer-generated memo. No signature required.</p>
        </div>

      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Store, MapPin } from "lucide-react";

export default function VerifyReceiptPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) return;
    
    fetch(`/api/verify/receipt/${params.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.sale);
        else setError(d.message || "Invalid Receipt");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-red-100">
          <XCircle className="text-red-500 mx-auto mb-4" size={64} />
          <h1 className="text-2xl font-black text-slate-800 mb-2">Invalid Receipt</h1>
          <p className="text-slate-500 text-sm">{error}</p>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">This receipt was not found in our secure database. It may be fake or altered.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-emerald-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
        
        <div className="text-center mb-6 mt-2">
          <CheckCircle2 className="text-emerald-500 mx-auto mb-3" size={56} />
          <h1 className="text-2xl font-black text-slate-800">Verified Receipt</h1>
          <p className="text-sm text-emerald-600 font-bold tracking-wide uppercase mt-1">100% Authentic</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2 border border-slate-100">
          <div className="flex justify-between text-sm"><span className="text-slate-500">Invoice:</span> <span className="font-bold text-slate-800">{data.saleNumber}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Date:</span> <span className="font-medium text-slate-800">{new Date(data.createdAt).toLocaleDateString()}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Total Paid:</span> <span className="font-bold text-indigo-600">৳{Number(data.totalAmount).toFixed(2)}</span></div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-2">
            {data.pharmacy?.logo ? <img src={data.pharmacy.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" /> : <Store size={20} className="text-indigo-600" />}
            <span className="font-bold text-slate-800">{data.pharmacy?.shopName}</span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {data.pharmacy?.address}, {data.pharmacy?.city}</p>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-[10px] text-slate-400">Verified by Tshastho Secure System</p>
        </div>
      </div>
    </div>
  );
}

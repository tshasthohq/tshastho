"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, ShieldCheck, MapPin, Pill, CheckCircle2, Info, Activity, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const getFallbackImage = (unit: string) => {
  const u = (unit || "").toLowerCase();
  if (u.includes("syrup") || u.includes("bottle") || u.includes("ml")) return "https://cdn-icons-png.flaticon.com/512/2936/2936789.png";
  if (u.includes("injection") || u.includes("vial")) return "https://cdn-icons-png.flaticon.com/512/3063/3063822.png";
  if (u.includes("ointment") || u.includes("cream")) return "https://cdn-icons-png.flaticon.com/512/3022/3022292.png";
  return "https://cdn-icons-png.flaticon.com/512/2913/2913461.png";
};

export default function MedicineDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/medicines/${resolvedParams.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.medicine) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.id]);

  const addToCart = async (medicineId: string) => {
    if (!user?.email) { router.push("/login"); return; }
    setAdding(medicineId);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, medicineId, quantity: 1 }),
      });
      if (res.ok) {
        setAdded(true);
        setTimeout(() => { setAdded(false); setAdding(null); }, 2000);
      } else {
        setAdding(null);
      }
    } catch {
      setAdding(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  }

  if (!data || !data.medicine) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]"><h2 className="text-xl font-bold text-slate-800">Medicine Not Found</h2><Button onClick={() => router.back()} className="mt-4">Go Back</Button></div>;
  }

  const { medicine, allPharmacies, substitutes } = data;
  const img = medicine.images?.length > 0 ? medicine.images[0] : getFallbackImage(medicine.unit);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Premium Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 flex items-center justify-between px-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} className="text-slate-700" />
        </button>
        <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">Medicine Details</h1>
        <Link href="/cart" className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors">
          <ShoppingCart size={20} />
        </Link>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="w-full md:w-1/3 aspect-square bg-slate-50 rounded-2xl flex items-center justify-center p-6 border border-slate-100 shrink-0">
            <img src={img} alt={medicine.name} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackImage(medicine.unit); }} />
          </div>
          
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase">{medicine.category || "Tablet"}</span>
              {medicine.strength && <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{medicine.strength}</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-1">{medicine.name}</h1>
            <p className="text-sm text-slate-500 font-medium mb-4">{medicine.brand} <span className="mx-2 text-slate-300">|</span> {medicine.genericName || "No Generic"}</p>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 mb-6">
               <div className="flex items-center gap-2 text-sm text-slate-700"><Activity size={16} className="text-indigo-500"/> <span className="font-semibold">Unit:</span> {medicine.unit}</div>
               <div className="flex items-center gap-2 text-sm text-slate-700"><Info size={16} className="text-indigo-500"/> <span className="font-semibold">Manufacturer:</span> {medicine.manufacturer || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Available Pharmacies Section */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Store className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Available Pharmacies</h2>
          </div>
          
          <div className="space-y-3">
            {allPharmacies?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Currently out of stock in all pharmacies.</p>
            ) : (
              allPharmacies?.map((pharm: any) => {
                const totalStock = pharm.branchStocks.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
                return (
                  <div key={pharm.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800">{pharm.pharmacy.shopName}</h3>
                        {pharm.pharmacy.isVerified && <ShieldCheck size={14} className="text-emerald-500" />}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500"><MapPin size={12} /> {pharm.pharmacy.city || "Location N/A"}</div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-1">In Stock: {totalStock} {pharm.unit}(s)</div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price</p>
                        <p className="text-xl font-black text-slate-900">৳{pharm.sellingPrice}</p>
                      </div>
                      <Button 
                        onClick={() => addToCart(pharm.id)} 
                        disabled={adding === pharm.id || added}
                        className={`rounded-xl px-6 h-10 font-bold shadow-md transition-all ${added ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                      >
                        {adding === pharm.id ? "Adding..." : added ? <><CheckCircle2 size={16} className="mr-1"/> Added</> : "Add"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Substitutes Section */}
        {substitutes?.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
             <h2 className="text-lg font-bold text-slate-800 mb-4">Generic Alternatives</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {substitutes.map((sub: any) => (
                  <Link href={`/medicines/${sub.id}`} key={sub.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{sub.name}</p>
                      <p className="text-[11px] text-slate-500">{sub.brand}</p>
                    </div>
                    <p className="font-black text-slate-700">৳{sub.sellingPrice}</p>
                  </Link>
                ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

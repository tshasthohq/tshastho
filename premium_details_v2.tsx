"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, ShoppingCart, ShieldCheck, MapPin, 
  CheckCircle2, Info, Activity, Store, AlertTriangle, 
  Pill, FileText, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const getFallbackImage = (unit: string) => {
  const u = (unit || "").toLowerCase();
  if (u.includes("syrup") || u.includes("bottle") || u.includes("ml")) return "https://cdn-icons-png.flaticon.com/512/2936/2936789.png";
  if (u.includes("injection") || u.includes("vial")) return "https://cdn-icons-png.flaticon.com/512/3063/3063822.png";
  if (u.includes("ointment") || u.includes("cream")) return "https://cdn-icons-png.flaticon.com/512/3022/3022292.png";
  return "https://cdn-icons-png.flaticon.com/512/2913/2913461.png"; // Tablet default
};

export default function MedicineDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "availability" | "alternatives">("overview");

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
  const description = medicine.masterMedicine?.description || `${medicine.name} is a ${medicine.category?.toLowerCase() || 'medicine'} containing ${medicine.genericName || 'active ingredients'}. It is commonly prescribed for the treatment of related conditions. Always consult your doctor before use.`;
  
  // সবচেয়ে কম দামের ফার্মেসি বের করা
  const bestPharmacy = allPharmacies?.length > 0 ? allPharmacies[0] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 font-sans">
      {/* Premium Header */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 flex items-center justify-between px-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} className="text-slate-700" />
        </button>
        <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">Medicine Details</h1>
        <Link href="/cart" className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors">
          <ShoppingCart size={20} />
        </Link>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="bg-white p-6 rounded-b-[40px] shadow-sm border-b border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          {/* Background decorative circle */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -z-10"></div>
          
          <div className="w-40 h-40 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-center p-4 mb-4">
            <img src={img} alt={medicine.name} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackImage(medicine.unit); }} />
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase">{medicine.category || "Tablet"}</span>
            {medicine.strength && <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{medicine.strength}</span>}
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1"><ShieldCheck size={10}/> Verified</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-1">{medicine.name}</h1>
          <p className="text-sm text-slate-500 font-medium">{medicine.brand} <span className="mx-1 text-slate-300">|</span> {medicine.genericName || "No Generic"}</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 mt-6 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab("overview")} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === "overview" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-white text-slate-600 border border-slate-200"}`}>Overview</button>
          <button onClick={() => setActiveTab("availability")} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === "availability" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-white text-slate-600 border border-slate-200"}`}>Availability ({allPharmacies?.length || 0})</button>
          <button onClick={() => setActiveTab("alternatives")} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === "alternatives" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-white text-slate-600 border border-slate-200"}`}>Alternatives</button>
        </div>

        <div className="p-4 space-y-6">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Description</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </div>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Basic Information</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Unit</p>
                    <p className="text-sm font-semibold text-slate-800">{medicine.unit}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Manufacturer</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{medicine.manufacturer || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Safety Warning</h3>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">Always consult with a registered physician before taking any medication. Do not self-medicate.</p>
                </div>
              </div>
            </div>
          )}

          {/* AVAILABILITY TAB */}
          {activeTab === "availability" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {allPharmacies?.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-100">
                  <Store className="mx-auto text-slate-300 mb-3" size={40} />
                  <p className="text-slate-500 font-medium">Currently out of stock in all pharmacies.</p>
                </div>
              ) : (
                allPharmacies?.map((pharm: any) => {
                  const totalStock = pharm.branchStocks.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
                  return (
                    <div key={pharm.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800">{pharm.pharmacy.shopName}</h3>
                          {pharm.pharmacy.user?.isVerified && <ShieldCheck size={14} className="text-emerald-500" />}
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
          )}

          {/* ALTERNATIVES TAB */}
          {activeTab === "alternatives" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {substitutes?.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-100">
                  <Pill className="mx-auto text-slate-300 mb-3" size={40} />
                  <p className="text-slate-500 font-medium">No alternatives found for this medicine.</p>
                </div>
              ) : (
                substitutes.map((sub: any) => (
                  <Link href={`/medicines/${sub.id}`} key={sub.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all group">
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{sub.name}</p>
                      <p className="text-[11px] text-slate-500">{sub.brand}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-slate-700">৳{sub.sellingPrice}</p>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Starting From</p>
            <p className="text-2xl font-black text-slate-900">৳{bestPharmacy ? bestPharmacy.sellingPrice : medicine.sellingPrice || '0.00'}</p>
          </div>
          <Button 
            onClick={() => { if(bestPharmacy) addToCart(bestPharmacy.id); else setActiveTab("availability"); }} 
            disabled={added}
            className={`rounded-xl px-8 h-12 font-bold text-md shadow-lg transition-all ${!bestPharmacy ? 'bg-slate-200 text-slate-500 shadow-none' : added ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}
          >
            {added ? <><CheckCircle2 size={18} className="mr-2"/> Added</> : bestPharmacy ? "Add to Cart" : "Check Availability"}
          </Button>
        </div>
      </div>
    </div>
  );
}

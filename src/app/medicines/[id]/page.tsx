"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, ShoppingCart, ShieldCheck, MapPin, 
  CheckCircle2, Activity, Store, AlertTriangle, 
  Pill, FileText, ChevronRight, ChevronDown, 
  Minus, Plus, Shield, Info, HeartPulse, Stethoscope, Star, Package
} from "lucide-react";
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
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "stores" | "alternatives">("overview");

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
        body: JSON.stringify({ email: user.email, medicineId, quantity }),
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  if (!data || !data.medicine) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]"><h2 className="text-xl font-bold text-slate-800">Medicine Not Found</h2><Button onClick={() => router.back()} className="mt-4">Go Back</Button></div>;

  const { medicine, allPharmacies, substitutes, sameBrandMeds } = data;
  const img = (medicine.images?.length > 0 && medicine.images[0]) ? medicine.images[0] : (medicine.masterMedicine?.imageUrl ? medicine.masterMedicine.imageUrl : getFallbackImage(medicine.unit));
  const bestPharmacy = allPharmacies?.length > 0 ? allPharmacies[0] : null;
  const generic = medicine.genericName || "the active ingredient";
  const unitPrice = Number(bestPharmacy ? bestPharmacy.sellingPrice : medicine.sellingPrice);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans">
      
      {/* Header */}
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
        <div className="bg-white p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-48 h-48 md:w-56 md:h-56 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center shrink-0 p-4 shadow-sm relative group">
              <img src={img} alt={medicine.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.src = getFallbackImage(medicine.unit); }} />
            </div>
            
            <div className="flex-1 text-center md:text-left mt-2 md:mt-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">{medicine.name}</h1>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{medicine.category || "Tablet"}</span>
                {medicine.strength && <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">{medicine.strength}</span>}
              </div>
              
              <p className="text-lg font-semibold text-indigo-600 mb-1">{generic}</p>
              <p className="text-sm font-medium text-slate-600 mb-3">{medicine.manufacturer || medicine.brand}</p>
              
              {/* Rating & Strip/Box Price */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                 <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                   <span className="text-amber-500 font-bold text-sm">4.5</span>
                   <Star size={14} className="text-amber-500 fill-amber-500" />
                   <span className="text-[10px] text-slate-500 ml-1">(124 Reviews)</span>
                 </div>
                 <div className="flex gap-3 text-xs text-slate-600 font-medium">
                   <span>Strip (10): <span className="font-bold text-slate-800">৳{(unitPrice * 10).toFixed(2)}</span></span>
                   <span>Box (100): <span className="font-bold text-slate-800">৳{(unitPrice * 100).toFixed(2)}</span></span>
                 </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3">
                 <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                   <ShieldCheck size={16}/> Verified
                 </span>
                 {bestPharmacy && (
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1.5 shadow-sm">
                      <Store size={16}/> Available in {allPharmacies.length} store(s)
                    </span>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Also Available As */}
        {sameBrandMeds && sameBrandMeds.length > 0 && (
          <div className="bg-white px-6 py-4 border-b border-slate-200">
             <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Also Available As:</h3>
             <div className="flex flex-wrap gap-2">
                {sameBrandMeds.filter((m: any) => m.strength && m.strength !== 'N/A' && m.strength !== 'null' && m.strength.trim() !== '').map((m: any) => (
                  <Link key={m.id} href={`/medicines/${m.id}`} className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                    {m.strength} ({m.category})
                  </Link>
                ))}
             </div>
          </div>
        )}

        {/* Pricing Banner */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
            <div>
               <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-0.5">Unit Price</p>
               <p className="text-2xl font-black text-white">৳{unitPrice}</p>
            </div>
            <div className="text-right">
               <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-0.5">Availability</p>
               <p className="text-sm font-bold text-white">{allPharmacies?.length > 0 ? `In Stock` : "Out of Stock"}</p>
            </div>
        </div>
        {/* Tabs */}
        <div className="px-4 mt-6">
          <div className="flex bg-slate-200/60 p-1.5 rounded-2xl">
            <button onClick={() => setActiveTab("overview")} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Overview</button>
            <button onClick={() => setActiveTab("stores")} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === "stores" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Stores ({allPharmacies?.length || 0})</button>
            <button onClick={() => setActiveTab("alternatives")} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === "alternatives" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Alternatives</button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === "overview" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Description */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <FileText className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Description</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">{medicine.name} is a {medicine.category?.toLowerCase() || 'medicine'} containing {generic}. It is commonly prescribed for the treatment of related conditions. Always consult your doctor before use.</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Form</p>
                    <p className="text-sm font-semibold text-slate-800">{medicine.category || 'Tablet'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Unit</p>
                    <p className="text-sm font-semibold text-slate-800">{medicine.unit}</p>
                  </div>
                </div>
              </div>

              {/* Indications */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <Stethoscope className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Indications</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">{medicine.name} is indicated for the symptomatic relief of conditions associated with <strong>{generic}</strong>. It is commonly prescribed for treating related ailments and improving patient outcomes when used as directed by a healthcare professional.</p>
                <p className="mt-3 text-slate-500 italic text-sm">* রেজিস্টার্ড চিকিৎসকের পরামর্শ মোতাবেক ঔষধ সেবন করুন।</p>
              </div>

              {/* Pharmacology */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <Activity className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Pharmacology</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed text-justify"><strong>{generic}</strong> exhibits its therapeutic action by modulating specific physiological pathways in the body. It works primarily by inhibiting the release of certain chemical messengers that cause pain and inflammation, thereby providing relief to the patient.</p>
              </div>

              {/* Dosage */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <Pill className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Dosage & Administration</h2>
                </div>
                <p className="text-sm text-slate-600 mb-3">Always follow your physician's prescription. The dosage depends on age, medical condition, and response to treatment.</p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                  <li><strong>Adults:</strong> 1-2 tablets every 4 to 6 hours as needed. Do not exceed the maximum daily limit.</li>
                  <li><strong>Children:</strong> Dosage must be adjusted according to body weight and age. Consult a pediatrician.</li>
                </ul>
              </div>

              {/* Interaction & Side Effects */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <AlertTriangle className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Interaction & Side Effects</h2>
                </div>
                <p className="text-sm text-slate-800 font-semibold mb-1">Interactions:</p>
                <p className="text-sm text-slate-600 mb-3 text-justify">Patients taking other medications should consult a doctor. Chronic ingestion of certain drugs may alter the metabolism of {generic}.</p>
                <p className="text-sm text-slate-800 font-semibold mb-1">Side Effects:</p>
                <p className="text-sm text-slate-600 text-justify">Side effects are usually mild. However, if you experience severe allergic reactions, difficulty breathing, or persistent symptoms, seek immediate medical attention.</p>
              </div>

              {/* Contraindications */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <Shield className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Contraindications</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">It is contraindicated in patients with known hypersensitivity to {generic} or any of its excipients. Do not use if you have severe liver disease.</p>
              </div>

              {/* Pregnancy & Lactation */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <HeartPulse className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Pregnancy & Lactation</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">Epidemiological studies have shown no significant ill effects due to {generic} when used in recommended doses. However, patients should always follow the advice of their doctor regarding its use during pregnancy or breastfeeding.</p>
              </div>

              {/* Chemical Structure & Special Populations */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <Info className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Chemical Structure & Special Populations</h2>
                </div>
                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-sm font-bold text-slate-700 mb-1">Molecular Formula: C<sub>8</sub>H<sub>9</sub>NO<sub>2</sub></p>
                  <p className="text-[10px] text-slate-400 italic">Chemical structure image not available.</p>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 text-justify">
                  <li><strong>Pediatric Use:</strong> Safety and effectiveness in pediatric patients should be monitored by a physician.</li>
                  <li><strong>Geriatric Use:</strong> No overall differences in safety or effectiveness were observed between elderly and younger patients.</li>
                  <li><strong>Hepatic/Renal Impairment:</strong> Use with caution in patients with severe liver or kidney disease. A reduced dose may be required.</li>
                </ul>
              </div>

              {/* Precautions */}
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Shield className="text-amber-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-amber-800">Precautions & Warnings</h3>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed text-justify">Care is advised in administration to patients with severe renal or hepatic impairment. Do not exceed the stated dose.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-t border-amber-200/50 pt-3">
                   <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                   <div>
                     <h3 className="text-sm font-bold text-amber-800">Overdose Effects</h3>
                     <p className="text-xs text-amber-700 mt-1 leading-relaxed text-justify">Liver damage is possible in adults who have taken a large dose. Seek emergency medical help immediately if overdose is suspected.</p>
                   </div>
                </div>
              </div>

              {/* Misc, Storage & Reviews */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <Package className="text-indigo-500" size={18} />
                  <h2 className="text-md font-bold text-slate-800">Additional Info & Reviews</h2>
                </div>
                <div className="mb-3">
                   <p className="text-sm text-slate-800 font-semibold mb-1">Storage Conditions:</p>
                   <p className="text-sm text-slate-600 text-justify">Keep in a dry place away from light and heat. Keep out of the reach of children.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                   <div className="flex items-center gap-2 mb-2">
                     <span className="font-bold text-sm text-slate-800">Rahim Uddin</span>
                     <span className="text-xs text-slate-400">2 days ago</span>
                     <div className="flex text-amber-500 ml-auto"><Star size={10} className="fill-amber-500"/><Star size={10} className="fill-amber-500"/><Star size={10} className="fill-amber-500"/><Star size={10} className="fill-amber-500"/><Star size={10} className="fill-amber-500"/></div>
                   </div>
                   <p className="text-xs text-slate-600">খুব দ্রুত কাজ করে। জ্বরের জন্য দারুণ কার্যকরী।</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === "stores" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {allPharmacies?.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-100">
                  <Store className="mx-auto text-slate-300 mb-3" size={40} />
                  <p className="text-slate-500 font-medium">Currently out of stock in all pharmacies.</p>
                </div>
              ) : (
                allPharmacies?.map((pharm: any, idx: number) => {
                  const totalStock = pharm.branchStocks.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
                  return (
                    <div key={pharm.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
                      {idx === 0 && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg">BEST PRICE</div>}
                      
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800">{pharm.pharmacy.shopName}</h3>
                          {pharm.pharmacy.user?.isVerified && <ShieldCheck size={14} className="text-emerald-500" />}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500"><MapPin size={12} /> {pharm.pharmacy.city || "Location N/A"}</div>
                        <div className="text-[11px] text-emerald-600 font-bold mt-1 bg-emerald-50 w-fit px-2 py-0.5 rounded">In Stock: {totalStock}</div>
                      </div>
                      
                      <div className="flex items-center justify-between w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price</p>
                          <p className="text-xl font-black text-slate-900">৳{pharm.sellingPrice}</p>
                        </div>
                        <Button onClick={() => addToCart(pharm.id)} disabled={adding === pharm.id || added} className={`rounded-xl px-6 h-10 font-bold shadow-md transition-all ${added ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                          {adding === pharm.id ? "..." : added ? <CheckCircle2 size={16} /> : "Add"}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "alternatives" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {substitutes?.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-100">
                  <Pill className="mx-auto text-slate-300 mb-3" size={40} />
                  <p className="text-slate-500 font-medium">No alternatives found.</p>
                </div>
              ) : (
                substitutes.map((sub: any) => (
                  <Link href={`/medicines/${sub.id}`} key={sub.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500"><Pill size={20}/></div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600">{sub.name}</p>
                        <p className="text-[11px] text-slate-500">{sub.brand}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-slate-700">৳{sub.sellingPrice}</p>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 z-50 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl border border-slate-200">
             <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-indigo-600"><Minus size={14}/></button>
             <span className="font-bold text-slate-800 w-6 text-center">{quantity}</span>
             <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-indigo-600"><Plus size={14}/></button>
          </div>

          <Button 
            onClick={() => { if(bestPharmacy) addToCart(bestPharmacy.id); else setActiveTab("stores"); }} 
            disabled={added || !bestPharmacy}
            className={`flex-1 rounded-xl h-12 font-bold text-md shadow-lg transition-all ${!bestPharmacy ? 'bg-slate-200 text-slate-500 shadow-none' : added ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}
          >
            {added ? <><CheckCircle2 size={18} className="mr-2"/> Added</> : bestPharmacy ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </div>
    </div>
  );
}

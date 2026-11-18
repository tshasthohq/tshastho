"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, MapPin, Phone, User, Store, ChevronRight, 
  UploadCloud, X, ShieldCheck, CheckCircle2, CreditCard, 
  Banknote, Smartphone, FileText, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [groupedPharmacies, setGroupedPharmacies] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [routedBranch, setRoutedBranch] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    deliveryAddress: "",
    deliveryPhone: "",
    receiverPhone: "",
    branchId: "",
    paymentMethod: "COD",
    notes: "",
  });

  const [prescriptionUrl, setPrescriptionUrl] = useState("");
  const [prescriptionPreview, setPrescriptionPreview] = useState("");
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);
  const rxInputRef = useRef<HTMLInputElement>(null);

  const [paidInput, setPaidInput] = useState<string>("0");
  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [deliverySlot, setDeliverySlot] = useState("INSTANT");
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (authLoading || !user) return;

    const loadCheckoutData = async () => {
      try {
        const email = user.email;
        const cartRes = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
        const cartData = await cartRes.json().catch(() => ({}));

        if (cartData.items && cartData.items.length > 0) {
          setItems(cartData.items);
          
          const grouped: any = {};
          cartData.items.forEach((item: any) => {
            const pId = item.medicine.pharmacyId;
            const pName = item.medicine.pharmacy?.shopName || "Pharmacy";
            if (!grouped[pId]) {
              grouped[pId] = { name: pName, items: [], subtotal: 0, deliveryFee: 60 };
            }
            grouped[pId].items.push(item);
            
            const selling = parseFloat(item.medicine.sellingPrice);
            const discount = parseFloat(item.medicine.discountPercent) || 0;
            const unitPrice = selling - (selling * discount) / 100;
            grouped[pId].subtotal += unitPrice * item.quantity;
          });
          setGroupedPharmacies(grouped);
          
        } else { router.push("/cart"); }
        
        if (user.phone) setFormData(prev => ({ ...prev, deliveryPhone: user.phone || "" }));
        if (user.address) setFormData(prev => ({ ...prev, deliveryAddress: user.address || "" }));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadCheckoutData();
  }, [user, authLoading, router]);

  
  useEffect(() => {
    const fetchSmartRoute = async () => {
      if (formData.deliveryAddress.length > 5 && items.length > 0) {
        try {
          const res = await fetch("/api/orders/smart-route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: formData.deliveryAddress,
              cartItems: items.map((i: any) => ({ medicineId: i.medicineId, quantity: i.quantity }))
            })
          });
          const data = await res.json();
          if (data.success) {
            setRoutedBranch(data);
            setFormData(prev => ({ ...prev, branchId: data.branchId }));
          }
        } catch (e) { console.error(e); }
      }
    };
    
    const timer = setTimeout(fetchSmartRoute, 1000); // ১ সেকেন্ড পর কল হবে (Debounce)
    return () => clearTimeout(timer);
  }, [formData.deliveryAddress, items]);


  const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPrescriptionUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrescriptionUrl(reader.result as string);
      setPrescriptionPreview(reader.result as string);
      setPrescriptionUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removePrescription = () => {
    setPrescriptionUrl(""); setPrescriptionPreview("");
    if (rxInputRef.current) rxInputRef.current.value = "";
  };

  const subTotal = Object.values(groupedPharmacies).reduce((sum: number, p: any) => sum + p.subtotal, 0);
  const deliveryFee = Object.keys(groupedPharmacies).length * 60;
  const vatAmount = 0;
  const finalAmount = Math.max(0, subTotal + deliveryFee + vatAmount - discountAmount);
  const parsedPaid = parseFloat(paidInput) || 0;
  const paidAmount = Math.min(Math.max(parsedPaid, 0), finalAmount);
  const dueAmount = Math.max(0, finalAmount - paidAmount);
  const isDue = dueAmount > 0;

  const isValidPhone = /^01[3-9]\d{8}$/.test(formData.deliveryPhone);

  const handlePlaceOrder = async () => {
    if (!formData.deliveryAddress || !isValidPhone) {
      setMessage("Please fill all required fields with a valid phone number."); return;
    }
    if (!agreeTerms) {
      setMessage("Please agree to the Terms & Conditions."); return;
    }
    setPlacing(true); setMessage("");
    try {
      const res = await fetch("/api/orders/place", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, deliverySlot, paidInput: paidAmount, deliveryCharge: deliveryFee, discountAmount, prescriptionUrl: prescriptionUrl || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { router.push("/dashboard/orders"); } 
      else { setMessage(data.message || "Failed to place order."); setPlacing(false); }
    } catch (err) { setMessage("Network error."); setPlacing(false); }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading Checkout...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-32 font-sans relative">
      
      {/* Premium Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
        <div className="h-16 flex items-center justify-between px-4 max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors">
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">Secure Checkout</h1>
          <div className="w-10 h-10 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-full border border-emerald-100">
            <ShieldCheck size={20} />
          </div>
        </div>
        
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 pb-4 pt-1 max-w-sm mx-auto">
          <div className="flex items-center text-indigo-600 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center mr-1.5"><CheckCircle2 size={12}/></span> Cart
          </div>
          <div className="w-8 h-px bg-indigo-200"></div>
          <div className="flex items-center text-indigo-600 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-1.5">2</span> Delivery
          </div>
          <div className="w-8 h-px bg-slate-200"></div>
          <div className="flex items-center text-slate-400 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mr-1.5">3</span> Payment
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
        {message && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl border border-red-100 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle size={16} /> {message}
          </div>
        )}

        {/* Delivery Address */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-200/60">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><MapPin size={16} /></div>
            <h2 className="text-base font-bold text-slate-900">Delivery Address</h2>
          </div>
          
          <div className="space-y-3">
            <div className="relative group">
              <MapPin className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <textarea 
                value={formData.deliveryAddress} 
                onChange={e => setFormData({...formData, deliveryAddress: e.target.value})}
                placeholder="Full delivery address (House, Road, Area)" 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none h-24 shadow-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <Phone className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="tel" value={formData.deliveryPhone} 
                  onChange={e => setFormData({...formData, deliveryPhone: e.target.value})}
                  placeholder="Receiver Phone" 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  required
                />
              </div>
              <div className="relative group">
                <User className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="text" value={formData.receiverPhone} 
                  onChange={e => setFormData({...formData, receiverPhone: e.target.value})}
                  placeholder="Receiver Name (Optional)" 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Upload */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-200/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><FileText size={16} /></div>
            <h2 className="text-base font-bold text-slate-900">Prescription (Optional)</h2>
          </div>
          <input type="file" accept="image/*" ref={rxInputRef} onChange={handlePrescriptionUpload} className="hidden" />
          
          {prescriptionPreview ? (
            <div className="relative w-full h-32 rounded-xl border border-slate-200 overflow-hidden group">
              <img src={prescriptionPreview} alt="Prescription" className="w-full h-full object-cover" />
              <button onClick={removePrescription} className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-red-50 transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div onClick={() => rxInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors">
              <UploadCloud size={24} className="text-indigo-500 mb-1" />
              <p className="text-xs font-bold text-indigo-700">Click to upload prescription</p>
            </div>
          )}
        </div>

        {/* Fulfillment Summary (High Contrast) */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-200/60">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Store size={16} /></div>
            <h2 className="text-base font-bold text-slate-900">Fulfillment Summary</h2>
            {routedBranch && (
              <div className="ml-auto bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-in zoom-in">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700">Auto-Routed: {routedBranch.pharmacyName}</span>
              </div>
            )}

          </div>
          
          {Object.keys(groupedPharmacies).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(groupedPharmacies).map(([pId, data]: any) => (
                <div key={pId} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 shadow-sm">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                    <span className="font-bold text-sm text-slate-900">{data.name}</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">{data.items.length} items</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-700 font-medium mb-1">
                    <span>Subtotal</span>
                    <span>৳{data.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-700 font-medium">
                    <span>Delivery Fee</span>
                    <span>৳{data.deliveryFee.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 font-medium text-center">Loading order summary...</p>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-200/60">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><CreditCard size={16} /></div>
            <h2 className="text-base font-bold text-slate-900">Payment Method</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setFormData({...formData, paymentMethod: "COD"})}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === "COD" ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
            >
              <Banknote className={formData.paymentMethod === "COD" ? "text-indigo-600" : "text-slate-400"} size={24} />
              <span className={`text-xs font-bold ${formData.paymentMethod === "COD" ? "text-indigo-700" : "text-slate-600"}`}>Cash on Delivery</span>
            </button>
            <button 
              onClick={() => setFormData({...formData, paymentMethod: "ONLINE"})}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === "ONLINE" ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
            >
              <Smartphone className={formData.paymentMethod === "ONLINE" ? "text-indigo-600" : "text-slate-400"} size={24} />
              <span className={`text-xs font-bold ${formData.paymentMethod === "ONLINE" ? "text-indigo-700" : "text-slate-600"}`}>Mobile Banking</span>
            </button>
          </div>
        </div>

        {/* Totals Summary (High Contrast) */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-200/60">
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm text-slate-600 font-semibold">
              <span>Subtotal ({items.length} items)</span>
              <span>৳{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 font-semibold">
              <span>Delivery Fee</span>
              <span>৳{deliveryFee.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold">
                <span>Discount Applied</span>
                <span>-৳{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center mt-2">
              <span className="text-slate-900 font-black text-lg">Total Amount</span>
              <span className="text-indigo-600 font-black text-2xl">৳{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-xs text-slate-600 leading-relaxed font-medium">I agree to the <Link href="/terms" className="text-indigo-600 font-bold hover:underline">Terms & Conditions</Link> and confirm that the information provided is accurate.</span>
          </label>
        </div>
      </div>

      {/* Floating Sticky Checkout Bar (Premium) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] rounded-[28px] p-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-full">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
            <p className="text-3xl font-black text-slate-900">৳{finalAmount.toFixed(2)}</p>
          </div>
          
          <Button 
            onClick={handlePlaceOrder} 
            disabled={placing || !agreeTerms}
            className={`flex-1 h-14 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${placing || !agreeTerms ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/40'}`}
          >
            {placing ? "Placing..." : "Confirm Order"}
            {!placing && <ChevronRight size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

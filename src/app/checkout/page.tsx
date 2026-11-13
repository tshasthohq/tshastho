"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Store, ShoppingBag, CreditCard, UploadCloud, FileText, CheckCircle2, ChevronRight, X, Banknote, User, FileText as NotesIcon, ShieldCheck, Clock, Tag, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [items, setItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  // 🔥 নতুন স্টেটসমূহ
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
          const pid = cartData.items[0].medicine.pharmacyId;
          const branchRes = await fetch(`/api/pharmacy/branches?pharmacyId=${pid}`);
          const bData = await branchRes.json().catch(() => ({}));
          if (bData.branches) setBranches(bData.branches);
        } else { router.push("/cart"); }

        if (user.phone) setFormData(prev => ({ ...prev, deliveryPhone: user.phone || "" }));
        if (user.address) setFormData(prev => ({ ...prev, deliveryAddress: user.address || "" }));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadCheckoutData();
  }, [user, authLoading, router]);

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

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "SAVE10") {
      setDiscountAmount(subtotal * 0.10);
      setMessage("Promo applied: 10% off!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Invalid promo code.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.medicine.sellingPrice) * item.quantity), 0);
  const deliveryFee = 0;
  const vatAmount = 0; 
  const finalAmount = Math.max(0, subtotal + deliveryFee + vatAmount - discountAmount);
  const parsedPaid = parseFloat(paidInput) || 0;
  const paidAmount = Math.min(Math.max(parsedPaid, 0), finalAmount);
  const dueAmount = Math.max(0, finalAmount - paidAmount);
  const isDue = dueAmount > 0;

  // 🔥 ফোন নাম্বার ভ্যালিডেশন
  const isValidPhone = /^01[3-9]\d{8}$/.test(formData.deliveryPhone);

  const handlePlaceOrder = async () => {
    if (!formData.deliveryAddress || !isValidPhone || !formData.branchId) {
      setMessage("Please fill all required fields with a valid phone number."); return;
    }
    if (!agreeTerms) {
      setMessage("Please agree to the Terms & Conditions."); return;
    }
    setPlacing(true); setMessage("");
    try {
      const res = await fetch("/api/orders/place", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          deliverySlot,
          paidInput: paidAmount, 
          deliveryCharge: deliveryFee, 
          discountAmount,
          prescriptionUrl: prescriptionUrl || null 
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { router.push("/dashboard/orders"); } 
      else { setMessage(data.message || "Failed to place order."); setPlacing(false); }
    } catch (err) { setMessage("Network error."); setPlacing(false); }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans">
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-center px-4 sticky top-0 z-40 shadow-sm">
        <button onClick={() => router.back()} className="absolute left-4 w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors"><ArrowLeft size={20} className="text-slate-700" /></button>
        <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">Checkout</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
        {/* 🔥 Stepper */}
        <div className="flex items-center justify-center gap-3 mb-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center text-indigo-600 font-bold text-xs"><span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center mr-1.5">1</span> Cart</div>
          <ChevronRight size={14} className="text-slate-300" />
          <div className="flex items-center text-indigo-600 font-bold text-xs"><span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-1.5">2</span> Details</div>
          <ChevronRight size={14} className="text-slate-300" />
          <div className="flex items-center text-slate-400 font-medium text-xs"><span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mr-1.5">3</span> Payment</div>
        </div>
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2"><div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><ShoppingBag size={18} /></div>Order Summary</h2>
            <Link href="/cart" className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"><Edit3 size={12} /> Edit Cart</Link>
          </div>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">{item.medicine.name} <span className="text-slate-400 text-xs ml-1">x{item.quantity}</span></span>
                <span className="font-bold text-slate-800">৳{(parseFloat(item.medicine.sellingPrice) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span className="font-medium text-slate-700">৳{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-slate-500"><span>Delivery Fee</span><span className="font-medium text-emerald-600">Free</span></div>
            <div className="flex justify-between text-sm text-slate-500"><span>VAT/Tax</span><span className="font-medium text-slate-700">৳{vatAmount.toFixed(2)}</span></div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold"><span>Discount</span><span>- ৳{discountAmount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="font-bold text-slate-800 text-base">Total</span>
              <span className="font-extrabold text-indigo-600 text-xl">৳{finalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          {/* 🔥 Promo Code */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Tag size={16} className="absolute left-3 top-3 text-slate-400" />
              <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Have a promo code?" className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900" />
            </div>
            <Button onClick={handleApplyPromo} variant="outline" className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50">Apply</Button>
          </div>
        </div>
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><MapPin size={18} /></div>Delivery Details</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Delivery Branch *</label>
              <div className="relative">
                <Store size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <select value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none" required>
                  <option value="" disabled>Select nearest branch</option>
                  {branches.map(b => (<option key={b.id} value={b.id}>{b.name} {b.isMainBranch ? "(Main)" : ""}</option>))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${deliverySlot === "INSTANT" ? "border-indigo-600 bg-indigo-50/30" : "border-slate-200"}`}>
                <input type="radio" checked={deliverySlot === "INSTANT"} onChange={() => setDeliverySlot("INSTANT")} className="hidden" />
                <Clock size={16} className={deliverySlot === "INSTANT" ? "text-indigo-600" : "text-slate-400"} />
                <span className="text-sm font-bold text-slate-800">Instant</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${deliverySlot === "SCHEDULED" ? "border-indigo-600 bg-indigo-50/30" : "border-slate-200"}`}>
                <input type="radio" checked={deliverySlot === "SCHEDULED"} onChange={() => setDeliverySlot("SCHEDULED")} className="hidden" />
                <Clock size={16} className={deliverySlot === "SCHEDULED" ? "text-indigo-600" : "text-slate-400"} />
                <span className="text-sm font-bold text-slate-800">Scheduled</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Address *</label>
              <textarea value={formData.deliveryAddress} onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })} placeholder="House/Road/Area, City" rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Your Phone *</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <Input value={formData.deliveryPhone} onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })} placeholder="01XXXXXXXXX" className={`pl-11 py-6 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500 focus-visible:ring-2 transition-all ${formData.deliveryPhone && !isValidPhone ? "border-red-500 focus-visible:ring-red-500" : ""}`} required />
                </div>
                {formData.deliveryPhone && !isValidPhone && <p className="text-[10px] text-red-500 mt-1">Enter a valid 11-digit BD number.</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Receiver Phone (Optional)</label>
                <div className="relative"><User size={18} className="absolute left-4 top-3.5 text-slate-400" /><Input value={formData.receiverPhone} onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })} placeholder="If delivered to someone else" className="pl-11 py-6 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500 focus-visible:ring-2 transition-all" /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg"><FileText size={18} /></div>Prescription (Optional)</h2>
          {prescriptionPreview ? (
            <div className="relative w-full h-32 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
              <img src={prescriptionPreview} alt="Prescription" className="h-full object-contain" />
              <button onClick={removePrescription} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md"><X size={14} /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-sky-200 rounded-xl cursor-pointer hover:bg-sky-50/50 hover:border-sky-400 transition-all bg-slate-50/50 group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud size={28} className={prescriptionUploading ? "text-sky-500 animate-pulse" : "text-sky-500"} />
                <p className="text-sm font-bold text-slate-700 mt-2">{prescriptionUploading ? "Uploading..." : "Tap to Upload Prescription"}</p>
              </div>
              <input type="file" accept="image/*" onChange={handlePrescriptionUpload} disabled={prescriptionUploading} className="hidden" ref={rxInputRef} />
            </label>
          )}
        </div>

        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Banknote size={18} /></div>Partial Payment (Optional)</h2>
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Pay Now (৳)</label>
            <Input type="number" value={paidInput} onChange={(e) => setPaidInput(e.target.value)} placeholder="0 = Full Due, Total = Full Paid" className="bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-amber-500 focus-visible:ring-2 transition-all" />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => setPaidInput("0")} className="py-2 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-amber-200 transition-all">Full Due (৳0)</button>
            <button onClick={() => setPaidInput(finalAmount.toString())} className="py-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-emerald-200 transition-all">Full Paid</button>
            <button onClick={() => setPaidInput((finalAmount / 2).toString())} className="py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-indigo-200 transition-all">Half (50%)</button>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500"><span>Total Amount:</span><span className="font-medium text-slate-700">৳{finalAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Paying Now:</span><span className="font-bold text-emerald-600">৳{paidAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200"><span className="font-bold text-slate-700">Due Amount:</span><span className="font-bold text-red-500">৳{dueAmount.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CreditCard size={18} /></div>Payment Method</h2>
          <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all mb-3 ${formData.paymentMethod === "COD" ? "border-indigo-600 bg-indigo-50/30" : "border-slate-200 hover:border-slate-300"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === "COD" ? "border-indigo-600" : "border-slate-300"}`}>{formData.paymentMethod === "COD" && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}</div>
              <div><p className="font-bold text-slate-800 text-sm">Cash on Delivery</p><p className="text-xs text-slate-500 mt-0.5">Pay at door / partial okay</p></div>
            </div>
            <input type="radio" className="hidden" checked={formData.paymentMethod === "COD"} onChange={() => setFormData({ ...formData, paymentMethod: "COD" })} />
          </label>
          <div className="space-y-2 opacity-60">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-not-allowed">
              <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full border-2 border-slate-300"></div><p className="font-bold text-slate-600 text-sm">bKash</p></div><span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded">Coming soon</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-not-allowed">
              <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full border-2 border-slate-300"></div><p className="font-bold text-slate-600 text-sm">Nagad</p></div><span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded">Coming soon</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <h2 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><div className="p-1 bg-slate-100 text-slate-500 rounded"><NotesIcon size={14} /></div>Notes (Optional)</h2>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special instructions..." rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" />
        </div>

        {/* 🔥 Trust Badges */}
        <div className="flex items-center justify-center gap-6 py-4 opacity-70">
          <div className="flex items-center gap-2 text-slate-600"><ShieldCheck size={18} className="text-emerald-500"/> <span className="text-xs font-bold">100% Authentic</span></div>
          <div className="flex items-center gap-2 text-slate-600"><CheckCircle2 size={18} className="text-indigo-500"/> <span className="text-xs font-bold">Secure Checkout</span></div>
        </div>

        {/* 🔥 Terms & Conditions */}
        <label className="flex items-start gap-3 px-2 cursor-pointer">
          <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          <span className="text-xs text-slate-500 leading-relaxed">I agree to the <a href="#" className="text-indigo-600 font-bold hover:underline">Terms & Conditions</a> and <a href="#" className="text-indigo-600 font-bold hover:underline">Return Policy</a> of Tshastho.</span>
        </label>

        {message && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
            <CheckCircle2 size={18} className="rotate-180" /> {message}
          </div>
        )}
      </div>

      {/* Sticky Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 p-4 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total to Pay</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-slate-900">৳{finalAmount.toFixed(2)}</p>
              {isDue && <span className="text-xs font-bold text-red-500">Due: ৳{dueAmount.toFixed(2)}</span>}
            </div>
          </div>
          <Button onClick={handlePlaceOrder} disabled={placing || !agreeTerms || !isValidPhone} className="flex-1 max-w-[220px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            {placing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Place Order <ChevronRight size={18} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}

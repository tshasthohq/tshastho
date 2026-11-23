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
import PublicHeader from "@/components/PublicHeader";
import PageTitleBar from "@/components/PageTitleBar";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t: tr } = useLanguage();

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
      setMessage(tr("co.errFill", "Please fill all required fields with a valid phone number.")); return;
    }
    if (!agreeTerms) {
      setMessage(tr("co.errTerms", "Please agree to the Terms & Conditions.")); return;
    }
    setPlacing(true); setMessage("");
    try {
      const res = await fetch("/api/orders/place", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, deliverySlot, paidInput: paidAmount, deliveryCharge: deliveryFee, discountAmount, prescriptionUrl: prescriptionUrl || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { router.push("/dashboard/orders"); } 
      else { setMessage(data.message || tr("co.errFail", "Failed to place order.")); setPlacing(false); }
    } catch (err) { setMessage(tr("co.errNet", "Network error.")); setPlacing(false); }
  };

  const bg = { background: "linear-gradient(180deg,#dbeafe 0%,#eff6ff 38%,#f8fafc 100%)" };
  const cardCls = "bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5";
  const inputCls = "w-full h-14 ps-11 pe-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bg}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">{tr("co.loading", "Loading Checkout...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 font-sans" style={bg}>
      <PublicHeader />
      <PageTitleBar title={tr("co.title", "Secure Checkout")} />

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm font-bold">
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center"><CheckCircle2 size={15} /></span>
            {tr("co.stepCart", "Cart")}
          </div>
          <div className="w-8 h-px bg-blue-200"></div>
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center text-xs">2</span>
            {tr("co.stepDelivery", "Delivery")}
          </div>
          <div className="w-8 h-px bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs">3</span>
            {tr("co.stepPayment", "Payment")}
          </div>
        </div>

        {message && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-[15px] font-bold flex items-center gap-2">
            <AlertCircle size={18} /> {message}
          </div>
        )}

        {/* Delivery */}
        <div className={cardCls}>
          <Sec icon={<MapPin size={18} />} title={tr("co.delivery", "Delivery Address")} />
          <div className="space-y-3">
            <div className="relative">
              <MapPin className="absolute start-3.5 top-4 text-slate-400" size={18} />
              <textarea
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                placeholder={tr("co.phAddress", "Full delivery address (House, Road, Area)")}
                className={inputCls.replace("h-14", "h-28 py-3.5") + " resize-none"}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="tel" inputMode="tel" value={formData.deliveryPhone}
                  onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })}
                  placeholder={tr("co.phPhone", "Receiver Phone")} className={inputCls} required />
              </div>
              <div className="relative">
                <User className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={formData.receiverPhone}
                  onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                  placeholder={tr("co.phName", "Receiver Name (Optional)")} className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* Prescription */}
        <div className={cardCls}>
          <Sec icon={<FileText size={18} />} title={tr("co.rx", "Prescription (Optional)")} />
          <input type="file" accept="image/*" ref={rxInputRef} onChange={handlePrescriptionUpload} className="hidden" />
          {prescriptionPreview ? (
            <div className="relative w-full h-40 rounded-2xl border border-slate-200 overflow-hidden">
              <img src={prescriptionPreview} alt="Prescription" className="w-full h-full object-cover" />
              <button onClick={removePrescription} className="absolute top-2 end-2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-red-50 transition-colors">
                <X size={18} />
              </button>
            </div>
          ) : (
            <div onClick={() => rxInputRef.current?.click()} className="w-full h-28 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors">
              <UploadCloud size={28} className="text-blue-500 mb-1" />
              <p className="text-sm font-bold text-blue-700">{tr("co.rxUpload", "Click to upload prescription")}</p>
            </div>
          )}
        </div>

        {/* Fulfillment summary */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Store size={18} /></div>
            <h2 className="text-lg font-bold text-slate-900">{tr("co.fulfil", "Fulfillment Summary")}</h2>
            {routedBranch && (
              <div className="ms-auto bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">{tr("co.autoRouted", "Auto-Routed")}: {routedBranch.pharmacyName}</span>
              </div>
            )}
          </div>
          {Object.keys(groupedPharmacies).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(groupedPharmacies).map(([pId, data]: any) => (
                <div key={pId} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                    <span className="font-bold text-base text-slate-900">{data.name}</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">{data.items.length} {tr("co.items", "items")}</span>
                  </div>
                  <div className="flex justify-between text-[15px] text-slate-700 font-medium mb-1">
                    <span>{tr("co.subtotal", "Subtotal")}</span><span>৳{data.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[15px] text-slate-700 font-medium">
                    <span>{tr("co.deliveryFee", "Delivery Fee")}</span><span>৳{data.deliveryFee.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 font-medium text-center">{tr("co.loadingSummary", "Loading order summary...")}</p>
          )}
        </div>

        {/* Payment */}
        <div className={cardCls}>
          <Sec icon={<CreditCard size={18} />} title={tr("co.payment", "Payment Method")} />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormData({ ...formData, paymentMethod: "COD" })}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === "COD" ? "border-blue-600 bg-blue-50/60" : "border-slate-100 hover:border-slate-300 bg-white"}`}
            >
              <Banknote className={formData.paymentMethod === "COD" ? "text-blue-600" : "text-slate-400"} size={28} />
              <span className={`text-sm font-bold ${formData.paymentMethod === "COD" ? "text-blue-700" : "text-slate-600"}`}>{tr("co.cod", "Cash on Delivery")}</span>
            </button>
            <button
              onClick={() => setFormData({ ...formData, paymentMethod: "ONLINE" })}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === "ONLINE" ? "border-blue-600 bg-blue-50/60" : "border-slate-100 hover:border-slate-300 bg-white"}`}
            >
              <Smartphone className={formData.paymentMethod === "ONLINE" ? "text-blue-600" : "text-slate-400"} size={28} />
              <span className={`text-sm font-bold ${formData.paymentMethod === "ONLINE" ? "text-blue-700" : "text-slate-600"}`}>{tr("co.mobile", "Mobile Banking")}</span>
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className={cardCls}>
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-[15px] text-slate-600 font-semibold">
              <span>{tr("co.subtotal", "Subtotal")} ({items.length} {tr("co.items", "items")})</span>
              <span>৳{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[15px] text-slate-600 font-semibold">
              <span>{tr("co.deliveryFee", "Delivery Fee")}</span>
              <span>৳{deliveryFee.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[15px] text-emerald-600 font-bold">
                <span>{tr("co.discount", "Discount Applied")}</span>
                <span>-৳{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="text-slate-900 font-black text-lg">{tr("co.totalAmount", "Total Amount")}</span>
              <span className="text-blue-600 font-black text-2xl">৳{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0" />
            <span className="text-sm text-slate-600 leading-relaxed font-medium">
              {tr("co.agree1", "I agree to the")} <Link href="/terms" className="text-blue-600 font-bold hover:underline">{tr("co.terms", "Terms & Conditions")}</Link> {tr("co.agree2", "and confirm that the information provided is accurate.")}
            </span>
          </label>
        </div>
      </div>

      {/* Sticky confirm bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
        <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-2xl border border-white/70 shadow-[0_-10px_40px_-10px_rgba(30,64,175,0.2)] rounded-3xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{tr("co.total", "Total")}</p>
            <p className="text-2xl font-black text-slate-900">৳{finalAmount.toFixed(2)}</p>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={placing || !agreeTerms}
            className={`flex-1 h-14 rounded-2xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${placing || !agreeTerms ? "bg-slate-200 text-slate-400" : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25"}`}
          >
            {placing ? tr("co.placing", "Placing...") : tr("co.confirm", "Confirm Order")}
            {!placing && <ChevronRight size={20} className="rtl:rotate-180" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Sec({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">{icon}</div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, CreditCard, Wallet, FileText, ShoppingBag, Pill, Truck, User, DollarSign, Calculator, Upload, Image as ImageIcon, Loader2, X, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryFree, setDeliveryFree] = useState(false);
  const [threshold, setThreshold] = useState(0);
  const [payNow, setPayNow] = useState("");
  const [prescriptionUrl, setPrescriptionUrl] = useState("");
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);
  const [prescriptionPreview, setPrescriptionPreview] = useState("");
  const rxInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    deliveryPhone: "",
    receiverPhone: "",
    paymentMethod: "COD",
    notes: "",
  });

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) { router.push("/login"); return; }

    fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        setFormData(prev => ({
          ...prev,
          deliveryPhone: data.user.phone || "",
          deliveryAddress: data.user.address || "",
          receiverPhone: data.user.phone || "",
        }));
      }
    });

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.items) setItems(data.items);
      setLoading(false);
    })
    .catch(() => setLoading(false));

    fetch("/api/settings/delivery")
      .then(res => res.json())
      .then(data => {
        if (data.charge !== undefined) setDeliveryCharge(data.charge);
        if (data.free !== undefined) setDeliveryFree(data.free);
        if (data.threshold !== undefined) setThreshold(data.threshold);
      })
      .catch(() => {});
  }, []);

  const getUnitPrice = (medicine: any, unitType: string) => {
    const selling = parseFloat(medicine.sellingPrice);
    const discount = parseFloat(medicine.discountPercent) || 0;
    const discountedPiecePrice = selling - (selling * discount) / 100;
    if (unitType === "strip") return discountedPiecePrice * (medicine.stripSize || 10);
    if (unitType === "box") return discountedPiecePrice * (medicine.boxSize || 100);
    return discountedPiecePrice;
  };

  const computeItemTotal = (item: any) => {
    return getUnitPrice(item.medicine, item.unitType || "piece") * item.quantity;
  };

  const subtotal = items.reduce((sum, item) => sum + computeItemTotal(item), 0);

  let finalDelivery = deliveryCharge;
  let freeReason = "";
  if (deliveryFree) { finalDelivery = 0; freeReason = "Free on all orders"; }
  else if (threshold > 0 && subtotal >= threshold) { finalDelivery = 0; freeReason = `Free on orders ৳${threshold}+`; }

  const total = subtotal + finalDelivery;
  const payNowNum = Math.min(Math.max(parseFloat(payNow) || 0, 0), total);
  const dueAmount = total - payNowNum;

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Prescription file too large (max 5MB)");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPrescriptionPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setPrescriptionUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setPrescriptionUrl(data.url);
      } else {
        setMessage("Prescription upload failed");
        setPrescriptionPreview("");
      }
    } catch {
      setMessage("Prescription upload error");
    }
    setPrescriptionUploading(false);
  };

  const removePrescription = () => {
    setPrescriptionUrl("");
    setPrescriptionPreview("");
    if (rxInputRef.current) rxInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { setMessage("Cart is empty"); return; }

    setPlacing(true);
    setMessage("");

    const email = localStorage.getItem("userEmail");
    const res = await fetch("/api/orders/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...formData, deliveryCharge: finalDelivery, paidAmount: payNowNum, prescriptionUrl: prescriptionUrl || null }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Order placed successfully!");
      setTimeout(() => router.push("/dashboard/orders"), 1500);
    } else {
      setMessage(data.message || "Failed to place order");
      setPlacing(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-slate-800">Checkout</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Order Summary */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Pill size={18} className="text-purple-600" /> Order Summary
          </h2>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600 truncate">
                  {item.medicine.name} × {item.quantity} <span className="text-xs text-slate-400">({item.unitType || "piece"})</span>
                </span>
                <span className="font-medium text-slate-800">৳{computeItemTotal(item).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm mt-3 pt-3 border-t border-slate-100">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium text-slate-800">৳{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Delivery Fee</span>
            {finalDelivery === 0 ? (
              <span className="font-medium text-green-600">FREE</span>
            ) : (
              <span className="font-medium text-slate-800">৳{finalDelivery.toFixed(2)}</span>
            )}
          </div>
          {freeReason && <p className="text-[10px] text-green-600 mt-1">🎉 {freeReason}</p>}
          <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-slate-100">
            <span className="text-slate-800">Total</span>
            <span className="text-green-700">৳{total.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Delivery Info */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-blue-600" /> Delivery Info
            </h2>

            <label className="block text-xs font-medium text-slate-700 mb-1 mt-3">Delivery Address *</label>
            <textarea
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              placeholder="House/Road/Area, City"
              rows={2}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="block text-xs font-medium text-slate-700 mb-1 mt-3">Your Phone *</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={formData.deliveryPhone} onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })} placeholder="017XXXXXXXX" className="pl-10" required />
            </div>

            <label className="block text-xs font-medium text-slate-700 mb-1 mt-3">Receiver Phone (Optional)</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={formData.receiverPhone} onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })} placeholder="If delivered to someone else" className="pl-10" />
            </div>
          </div>

          {/* PRESCRIPTION UPLOAD SECTION */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-2xl border-2 border-blue-200 mb-4">
            <h2 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" /> Prescription (Optional)
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Upload your doctor's prescription for antibiotic or controlled medicines
            </p>

            {prescriptionPreview ? (
              <div className="relative">
                <img
                  src={prescriptionPreview}
                  alt="Prescription"
                  className="w-full max-h-48 object-contain rounded-xl border-2 border-blue-300 bg-white"
                />
                {prescriptionUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={removePrescription}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                >
                  <X size={18} />
                </button>
                {prescriptionUrl && !prescriptionUploading && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle size={12} /> Uploaded
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => rxInputRef.current?.click()}
                disabled={prescriptionUploading}
                className="w-full bg-white border-2 border-dashed border-blue-300 py-6 rounded-xl flex flex-col items-center justify-center text-blue-600 hover:bg-blue-50 transition"
              >
                {prescriptionUploading ? (
                  <Loader2 size={28} className="animate-spin mb-2" />
                ) : (
                  <Upload size={28} className="mb-2" />
                )}
                <p className="text-sm font-medium">
                  {prescriptionUploading ? "Uploading..." : "Tap to Upload Prescription"}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG — Max 5MB</p>
              </button>
            )}

            <input
              ref={rxInputRef}
              type="file"
              accept="image/*"
              onChange={handlePrescriptionUpload}
              className="hidden"
            />

            {prescriptionUrl && (
              <div className="mt-3 bg-blue-100 rounded-xl p-2 flex items-start gap-2">
                <AlertTriangle size={14} className="text-blue-700 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-800">
                  Pharmacist will verify your prescription before processing the order.
                </p>
              </div>
            )}
          </div>

          {/* PARTIAL PAYMENT SECTION */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-200 mb-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Calculator size={18} className="text-amber-600" /> Partial Payment (Optional)
            </h2>

            <label className="block text-xs font-medium text-slate-700 mb-1">Pay Now (৳)</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                max={total}
                value={payNow}
                onChange={(e) => setPayNow(e.target.value)}
                placeholder="0 = Full Due, Total = Full Paid"
                className="pl-10 bg-white"
              />
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setPayNow("0")} className="flex-1 bg-white border border-amber-300 text-amber-700 py-1.5 rounded-lg text-xs font-medium">
                Full Due (৳0)
              </button>
              <button type="button" onClick={() => setPayNow(total.toFixed(2))} className="flex-1 bg-white border border-green-300 text-green-700 py-1.5 rounded-lg text-xs font-medium">
                Full Paid
              </button>
              <button type="button" onClick={() => setPayNow((total / 2).toFixed(2))} className="flex-1 bg-white border border-blue-300 text-blue-700 py-1.5 rounded-lg text-xs font-medium">
                Half (50%)
              </button>
            </div>

            {/* Payment breakdown */}
            <div className="mt-3 bg-white rounded-xl p-3 border border-amber-200">
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">Total Amount:</span>
                <span className="font-medium text-slate-800">৳{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-green-700">Paying Now:</span>
                <span className="font-bold text-green-700">৳{payNowNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 mt-1 border-t border-slate-200">
                <span className={`font-bold ${dueAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {dueAmount > 0 ? "Due Amount:" : "Status:"}
                </span>
                <span className={`font-bold ${dueAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {dueAmount > 0 ? `৳${dueAmount.toFixed(2)}` : "FULLY PAID"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Wallet size={18} className="text-green-600" /> Payment Method
            </h2>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${formData.paymentMethod === "COD" ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                <input type="radio" name="payment" value="COD" checked={formData.paymentMethod === "COD"} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="accent-blue-600" />
                <Wallet size={20} className="text-slate-600" />
                <div>
                  <p className="font-medium text-sm text-slate-800">Cash on Delivery</p>
                  <p className="text-xs text-slate-500">Pay at door / partial okay</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${formData.paymentMethod === "BKASH" ? "border-pink-500 bg-pink-50" : "border-slate-200"}`}>
                <input type="radio" name="payment" value="BKASH" checked={formData.paymentMethod === "BKASH"} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="accent-pink-600" />
                <CreditCard size={20} className="text-pink-600" />
                <div>
                  <p className="font-medium text-sm text-slate-800">bKash</p>
                  <p className="text-xs text-slate-500">Coming soon</p>
                </div>
              </label>
            </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer border-slate-200">
            <input type="radio" name="payment" value="NAGAD"
              checked={formData.paymentMethod === "NAGAD"}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="accent-orange-600" />
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wallet size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-slate-800">Nagad</p>
              <p className="text-xs text-slate-500">Coming soon</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer border-slate-200">
            <input type="radio" name="payment" value="CARD"
              checked={formData.paymentMethod === "CARD"}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="accent-blue-600" />
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-slate-800">Card / Bank</p>
              <p className="text-xs text-slate-500">Coming soon</p>
            </div>
          </label>
          </div>

          {/* Notes */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FileText size={18} className="text-slate-600" /> Notes (Optional)
            </h2>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special instructions..." rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {message && (
            <p className={`text-center text-sm font-medium mb-3 ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-50">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-xl font-bold text-slate-800">৳{total.toFixed(2)}</p>
                {dueAmount > 0 && (
                  <p className="text-[10px] text-red-600 font-medium">Due: ৳{dueAmount.toFixed(2)}</p>
                )}
              </div>
              <Button type="submit" disabled={placing} className="flex-1 flex items-center justify-center gap-2">
                <ShoppingBag size={16} /> {placing ? "Placing..." : "Place Order"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

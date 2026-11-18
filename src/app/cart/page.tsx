"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Trash2, ShieldCheck, Minus, Plus, ChevronRight, Store, Pill, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = () => {
    const email = user?.email;
    if (!email) { setLoading(false); return; }

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
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadCart();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const updateCart = async (cartItemId: string, quantity: number, unitType: string) => {
    setItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
    await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity, unitType }),
    });
    loadCart();
  };

  const removeItem = async (cartItemId: string) => {
    if (!confirm("Remove this item from your cart?")) return;
    setItems(prev => prev.filter(item => item.id !== cartItemId));
    await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId }),
    });
    loadCart();
  };

  const getUnitPrice = (medicine: any, unitType: string) => {
    const selling = parseFloat(medicine.sellingPrice);
    const discount = parseFloat(medicine.discountPercent) || 0;
    const discountedPrice = selling - (selling * discount) / 100;

    if (unitType === "strip") return discountedPrice * (medicine.stripSize || 10);
    if (unitType === "box") return discountedPrice * (medicine.boxSize || 100);
    return discountedPrice;
  };

  const computeItemTotal = (item: any) => {
    return getUnitPrice(item.medicine, item.unitType || "piece") * item.quantity;
  };

  const subTotal = items.reduce((sum, item) => sum + computeItemTotal(item), 0);
  const deliveryFee = subTotal > 0 ? 60 : 0;
  const grandTotal = subTotal + deliveryFee;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-36 font-sans relative">
      
      {/* Premium Header */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 flex items-center justify-between px-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} className="text-slate-700" />
        </button>
        <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">My Cart ({items.length})</h1>
        <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full">
          <ShoppingCart size={20} />
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
        {items.length === 0 ? (
          <div className="bg-white p-10 rounded-[32px] text-center border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] mt-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-28 h-28 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShoppingCart size={48} className="text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Your cart is empty</h2>
            <p className="text-slate-500 mb-8 font-medium">Looks like you haven't added any medicines yet.</p>
            <Link href="/medicines">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl px-8 py-6 text-base font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                Browse Medicines
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const med = item.medicine;
              const imgs = Array.isArray(med.images) ? med.images : [];
              const unitPrice = getUnitPrice(med, item.unitType || "piece");
              const itemTotal = unitPrice * item.quantity;
              
              return (
                <div key={item.id} className="bg-white p-3.5 rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] border border-slate-100 flex gap-4 relative overflow-hidden group hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.12)] transition-all duration-300">
                  
                  {/* Sleek Delete Button (Top Right) */}
                  <button onClick={() => removeItem(item.id)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors z-10">
                    <X size={14} strokeWidth={3} />
                  </button>

                  {/* Image Container */}
                  <div className="w-[84px] h-[84px] rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-center shrink-0 p-2">
                    {imgs.length > 0 ? (
                      <img src={imgs[0]} alt={med.name} className="w-full h-full object-contain" />
                    ) : (
                      <Pill size={32} className="text-indigo-200" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between pr-6">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-[15px] leading-tight pr-2">{med.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{med.brand} <span className="text-slate-300 mx-1">•</span> {med.genericName}</p>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">{med.category || 'Tablet'}</span>
                        {med.strength && <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{med.strength}</span>}
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.unitType || 'Piece'}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Total Price</p>
                        <p className="font-black text-slate-900 text-[17px] leading-none">৳{itemTotal.toFixed(2)}</p>
                      </div>

                      {/* Premium Quantity Selector */}
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                        <button 
                          onClick={() => updateCart(item.id, Math.max(1, item.quantity - 1), item.unitType)} 
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                          <Minus size={12} strokeWidth={3}/>
                        </button>
                        <span className="font-bold text-slate-800 text-[13px] w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateCart(item.id, item.quantity + 1, item.unitType)} 
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                          <Plus size={12} strokeWidth={3}/>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Sticky Checkout Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
          <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[28px] p-5 animate-in slide-in-from-bottom-full">
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-semibold text-slate-700">৳{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium flex items-center gap-1.5"><Store size={14}/> Delivery Fee</span>
                <span className="font-semibold text-slate-700">৳{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between">
                <span className="text-slate-800 font-black text-base">Total</span>
                <span className="font-black text-indigo-600 text-xl">৳{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              onClick={() => router.push("/checkout")} 
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-base shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-between px-5"
            >
              <span>Proceed to Checkout</span>
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

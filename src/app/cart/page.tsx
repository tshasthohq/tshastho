"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Pill, Trash2, Store, Minus, Plus, ShieldCheck } from "lucide-react";
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

  // 🔥 BUG FIX: Added user and authLoading to dependency array
  useEffect(() => { 
    if (!authLoading && user) {
      loadCart(); 
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const updateCart = async (cartItemId: string, quantity: number, unitType: string) => {
    // Optimistic UI update for faster feel
    setItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
    
    await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity, unitType }),
    });
    loadCart();
  };

  const removeItem = async (cartItemId: string) => {
    if (!confirm("Remove this item?")) return;
    // Optimistic UI update
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
    const discountedPiecePrice = selling - (selling * discount) / 100;

    if (unitType === "strip") return discountedPiecePrice * (medicine.stripSize || 10);
    if (unitType === "box") return discountedPiecePrice * (medicine.boxSize || 100);
    return discountedPiecePrice;
  };

  const computeItemTotal = (item: any) => {
    return getUnitPrice(item.medicine, item.unitType || "piece") * item.quantity;
  };

  const total = items.reduce((sum, item) => sum + computeItemTotal(item), 0);

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
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans">
      {/* Premium Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 sticky top-0 z-40">
        <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} className="text-slate-700" />
        </button>
        <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">My Cart</h1>
        <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full font-bold">
          {items.length}
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        {items.length === 0 ? (
          <div className="bg-white p-12 rounded-[24px] text-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart size={48} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 text-sm mb-8">Looks like you haven't added any medicines yet.</p>
            <Link href="/medicines">
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-6 text-base font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5">
                <Pill size={18} className="mr-2" /> Browse Medicines
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const med = item.medicine;
              const imgs = Array.isArray(med.images) ? med.images : [];
              const unitPrice = getUnitPrice(med, item.unitType || "piece");

              return (
                <div key={item.id} className="bg-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col sm:flex-row gap-5 relative group transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  
                  {/* Image Container */}
                  <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                    {imgs.length > 0 ? (
                      <img src={imgs[0]} alt={med.name} className="w-full h-full object-cover" />
                    ) : (
                      <Pill size={32} className="text-indigo-200" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg leading-tight">{med.name}</h3>
                          <p className="text-sm text-slate-500 font-medium">{med.brand}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                        <Store size={12} />
                        <span className="truncate max-w-[150px]">{med.pharmacy?.shopName || "Pharmacy"}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      <div>
                        <p className="text-lg font-extrabold text-indigo-600">
                          ৳{unitPrice.toFixed(2)} 
                          <span className="text-xs text-slate-400 font-medium ml-1">/ {item.unitType || "piece"}</span>
                        </p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200">
                        <button
                          onClick={() => updateCart(item.id, item.quantity - 1, item.unitType || "piece")}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateCart(item.id, item.quantity + 1, item.unitType || "piece")}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600"
                        >
                          <Plus size={14} />
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

      {/* Sticky Bottom Checkout Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 p-4 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-2xl font-extrabold text-slate-900">৳{total.toFixed(2)}</p>
            </div>
            <Link href="/checkout" className="flex-1 max-w-[200px]">
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
                <ShieldCheck size={18} /> Checkout
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

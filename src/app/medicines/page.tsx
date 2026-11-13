"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Pill, Store, MapPin, ArrowLeft, ShoppingCart, Plus, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function MedicinesSearchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const loadCart = () => {
    const email = user?.email;
    if (!email) return;
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.items) setCartCount(data.items.length);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadCart();
    }
    // Initial load
    fetch("/api/medicines/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "" }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.medicines) setMedicines(data.medicines);
      });
  }, [user, authLoading]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetch("/api/medicines/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.medicines) setMedicines(data.medicines);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const addToCart = async (medicineId: string) => {
    const email = user?.email;
    if (!email) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, medicineId, quantity: 1 }),
    });

    if (res.ok) {
      loadCart();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Premium Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
        <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} className="text-slate-700" />
        </button>
        <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">Find Medicines</h1>
        <Link href="/cart" className="relative p-2 w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md shadow-red-500/30">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, brand, or generic..."
            className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-base focus-visible:ring-indigo-500 focus-visible:ring-2 transition-all"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-500">
            {loading ? "Searching..." : `${medicines.length} medicines found`}
          </p>
        </div>

        {medicines.length === 0 && loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-slate-200/50 animate-pulse rounded-[24px]"></div>
            ))}
          </div>
        ) : medicines.length === 0 && !loading ? (
          <div className="bg-white p-12 rounded-[24px] text-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No medicines found</h3>
            <p className="text-slate-500 text-sm">Try searching with a different keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medicines.map((med) => {
              const imgs = Array.isArray(med.images) ? med.images : [];
              const selling = parseFloat(med.sellingPrice);
              const discount = parseFloat(med.discountPercent) || 0;
              const finalPrice = selling - (selling * discount) / 100;

              return (
                <div key={med.id} className="bg-white p-4 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                  
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link href={`/medicines/${med.id}`} className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                      {imgs.length > 0 ? (
                        <img src={imgs[0]} alt={med.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <Pill size={28} className="text-indigo-200" />
                      )}
                      {discount > 0 && (
                        <div className="absolute top-0 left-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg rounded-tl-xl z-10 flex items-center gap-0.5 shadow-sm">
                          <Tag size={8} /> {discount}%
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/medicines/${med.id}`}>
                        <h3 className="font-bold text-slate-900 text-base truncate leading-tight group-hover:text-indigo-600 transition-colors">{med.name}</h3>
                        <p className="text-xs font-medium text-slate-500 truncate mt-1">
                          {med.brand && `${med.brand} • `}{med.genericName || "Generic"}
                        </p>
                      </Link>
                      
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 w-fit px-1.5 py-0.5 rounded border border-slate-100">
                          <Store size={10} className="text-indigo-400" />
                          <span className="truncate max-w-[120px]">{med.pharmacy?.shopName || "Pharmacy"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin size={10} />
                          <span className="truncate">{med.pharmacy?.area}, {med.pharmacy?.city}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Add Button */}
                  <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-100">
                    <div>
                      {discount > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-extrabold text-green-600">৳{finalPrice.toFixed(2)}</span>
                          <span className="text-xs text-slate-400 line-through">৳{selling.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-extrabold text-slate-800">৳{selling.toFixed(2)}</span>
                      )}
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">per {med.unit}</p>
                    </div>

                    <Button 
                      onClick={() => addToCart(med.id)} 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md shadow-indigo-500/20 px-4 py-2 h-auto text-sm font-semibold transition-all active:scale-95"
                    >
                      <Plus size={16} className="mr-1" /> Add
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

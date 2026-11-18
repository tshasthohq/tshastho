"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Pill, Store, MapPin, ArrowLeft, ShoppingCart, Plus, Tag, ShieldCheck, Check, Star, ShoppingBag } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";


const getFallbackImage = (unit: string) => {
  const u = (unit || "").toLowerCase();
  if (u.includes("syrup") || u.includes("bottle") || u.includes("ml")) return "https://cdn-icons-png.flaticon.com/512/2936/2936789.png";
  if (u.includes("injection") || u.includes("vial")) return "https://cdn-icons-png.flaticon.com/512/3063/3063822.png";
  if (u.includes("ointment") || u.includes("cream")) return "https://cdn-icons-png.flaticon.com/512/3022/3022292.png";
  return "https://cdn-icons-png.flaticon.com/512/2913/2913461.png";
};

export default function MedicinesSearchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [medicines, setMedicines] = useState<any[]>([]);
const [loading, setLoading] = useState(false);

  // --- START: PREMIUM SEARCH & INFINITE SCROLL LOGIC ---
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const fetchingRef = useRef(false);

  const loadPublicMedicines = async (pageNum = 1, isLoadMore = false, searchQuery = "") => {
    if (isLoadMore && fetchingRef.current) return;
    if (isLoadMore) fetchingRef.current = true;
    else setLoading(true);

    try {
      const res = await fetch("/api/medicines/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, page: pageNum, limit: 40 }),
      });
      const data = await res.json();
      
      if (data.medicines) {
        if (isLoadMore) {
          setMedicines(prev => {
            const existingIds = new Set(prev.map((m: any) => m.id));
            const newItems = data.medicines.filter((m: any) => !existingIds.has(m.id));
            return [...prev, ...newItems];
          });
        } else {
          setMedicines(data.medicines);
        }
        setPage(pageNum);
        setHasMore(data.hasMore);
      }
      setLoading(false);
      setIsFetchingMore(false);
      fetchingRef.current = false;
    } catch (err) {
      setLoading(false);
      setIsFetchingMore(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMedicines([]);
      loadPublicMedicines(1, false, query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 300) {
        if (hasMore && !isFetchingMore && !loading) {
          loadPublicMedicines(page + 1, true, query);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isFetchingMore, loading, page, query]);

  const groupedMedicines = useMemo(() => {
    const grouped = new Map();
    medicines.forEach((med: any) => {
      const key = `${med.name}-${med.strength || ''}-${med.brand || ''}-${med.category || ''}`.toLowerCase();
      
      const isAvailable = med.stock > 0 || (med.branchStocks && med.branchStocks.length > 0);

      if (!grouped.has(key)) {
        grouped.set(key, { ...med, allPharmacies: [med] });
      } else {
        const existing = grouped.get(key);
        existing.allPharmacies.push(med);
        
        const existingIsAvailable = existing.stock > 0 || (existing.branchStocks && existing.branchStocks.length > 0);

        // যদি নতুনটায় স্টক থাকে আর আগেরটায় না থাকে, তবে নতুনটাকে দেখাবে
        if (isAvailable && !existingIsAvailable) {
          Object.assign(existing, { ...med, allPharmacies: existing.allPharmacies });
        } 
        // যদি দুটোতেই স্টক থাকে বা দুটোতেই না থাকে, তবে কম দামেরটা দেখাবে
        else if (isAvailable === existingIsAvailable && Number(med.sellingPrice) < Number(existing.sellingPrice)) {
          Object.assign(existing, { ...med, allPharmacies: existing.allPharmacies });
        }
      }
    });
    return Array.from(grouped.values()).sort((a: any, b: any) => {
      const aAvailable = a.stock > 0 || (a.branchStocks && a.branchStocks.length > 0);
      const bAvailable = b.stock > 0 || (b.branchStocks && b.branchStocks.length > 0);
      
      // ১. স্টক থাকা ওষুধ আগে আসবে
      if (aAvailable && !bAvailable) return -1;
      if (!aAvailable && bAvailable) return 1;
      
      // ২. দুটোই স্টকে থাকলে বা দুটোই আউট অফ স্টক হলে নাম অনুযায়ী সাজবে (A-Z)
      return a.name.localeCompare(b.name);
    });
  }, [medicines]);
  // --- END: PREMIUM SEARCH & INFINITE SCROLL LOGIC ---

  const [cartCount, setCartCount] = useState(0);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const cartIconRef = useRef<HTMLAnchorElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Tablet", "Syrup", "Injection", "Ointment", "Others"];

  const loadCart = () => {
    const email = user?.email;
    if (!email) return;
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(res => res.json())
      .then(data => { if (data.items) setCartCount(data.items.length); })
      .catch(() => {});
  };

  
  
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
    if (res.ok) loadCart();
  };
return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Premium Header */}
      
      <style jsx global>{`
        @keyframes cartBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .cart-bounce {
          animation: cartBounce 0.3s ease-in-out;
        }
      `}</style>


      <style jsx global>{`
        @keyframes bounceCustom {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.1); }
        }
        .animate-bounce-custom {
          animation: bounceCustom 0.5s ease-in-out;
        }
      `}</style>

<header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
        <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} className="text-slate-700" />
        </button>
        <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">Find Medicines</h1>
        <Link href="/cart" ref={cartIconRef} className="relative w-11 h-11 flex items-center justify-center bg-white rounded-full shadow-[0_4px_15px_-3px_rgba(79,70,229,0.15)] border border-slate-100 hover:bg-indigo-50 transition-all group transition-transform">
          <ShoppingCart size={22} strokeWidth={2.5} className="text-slate-800 group-hover:text-indigo-600 transition-all duration-300 group-hover:-rotate-12" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center bg-gradient-to-r from-rose-500 to-red-600 text-white text-[11px] font-black rounded-full border-[2.5px] border-white shadow-[0_0_10px_rgba(225,29,72,0.6)] animate-in zoom-in group-hover:animate-pulse">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative group max-w-2xl mx-auto">
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

        <div className="flex items-center justify-between max-w-2xl mx-auto">
          
        {/* 🔥 Categories Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar max-w-2xl mx-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      
        <p className="text-sm font-semibold text-slate-500">
            {loading ? "Searching..." : `${groupedMedicines.length} medicines found`}
          </p>
        </div>

        {medicines.length === 0 && loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-56 bg-slate-200/50 animate-pulse rounded-[24px]"></div>
            ))}
          </div>
        ) : medicines.length === 0 && !loading ? (
          <div className="bg-white p-12 rounded-[24px] text-center border border-slate-100 shadow-sm max-w-2xl mx-auto">
            <Pill size={40} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No medicines found</h3>
            <p className="text-slate-500 text-sm">Try searching with a different keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isFetchingMore && <div className="text-center py-4 text-sm text-indigo-600 font-bold w-full col-span-full">Loading more medicines...</div>}
          {groupedMedicines.filter((m: any) => selectedCategory === "All" || (m.category && m.category.toLowerCase().includes(selectedCategory.toLowerCase()))).map((med) => {
              const imgs = Array.isArray(med.images) ? med.images : [];
    const img = imgs.length > 0 ? imgs[0] : getFallbackImage(med.unit);
              const selling = parseFloat(med.sellingPrice);
              const discount = parseFloat(med.discountPercent) || 0;
              const finalPrice = selling - (selling * discount) / 100;
              
              // 🔥 Determine Branch Availability
              const rawBranches: string[] = med.branchStocks?.map((bs: any) => bs.branch.name) || [];
              const availableBranches: string[] = Array.from(new Set(rawBranches)); // Remove duplicates
              const isAvailable = med.stock > 0 || availableBranches.length > 0;
              // 🔥 সব ব্রাঞ্চের নাম কমা দিয়ে জোড়া লাগানো হলো
              const branchText = availableBranches.length > 0 ? availableBranches.join(", ") : (med.stock > 0 ? "Main Branch" : "Out of Stock");

              return (
                <div key={med.id} className="bg-white rounded-[24px] p-2.5 border border-slate-100/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.12)] hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300 flex flex-col group relative overflow-hidden">
                  
                  {/* Image Container - Premium Background & Grayscale for OOS */}
                  <div className="relative w-full aspect-square bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-[18px] overflow-hidden mb-3 p-3">
                    {img ? (
                      <img 
                        src={img} 
                        alt={med.name} 
                        className={`w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out ${!(med.stock > 0 || (med.branchStocks && med.branchStocks.length > 0)) ? 'grayscale opacity-60' : ''}`} 
                        onError={(e) => { e.currentTarget.src = getFallbackImage(med.unit); }} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Pill size={40} className="text-indigo-200" />
                      </div>
                    )}
                    
                    {/* Premium Floating Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      {med.strength && (
                        <span className="bg-white/95 backdrop-blur-md text-indigo-700 text-[9px] font-black px-2 py-1 rounded-md shadow-sm border border-indigo-50 uppercase tracking-wider">
                          {med.strength}
                        </span>
                      )}
                    </div>
                    {med.discountPercent > 0 && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md shadow-red-500/20 z-10">
                        -{med.discountPercent}%
                      </div>
                    )}

                    {/* Out of Stock Overlay on Image */}
                    {!(med.stock > 0 || (med.branchStocks && med.branchStocks.length > 0)) && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-0">
                         <span className="bg-slate-800/80 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider">OUT OF STOCK</span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="px-1.5 flex flex-col flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{med.category || 'Tablet'}</span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ShieldCheck size={10}/> Verified</span>
                    </div>
                    
                    <h3 className="font-black text-slate-900 text-[16px] leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">{med.name || 'Unknown'}</h3>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5 mb-2">{med.brand} <span className="text-slate-300 mx-0.5">•</span> {med.genericName || 'No Generic'}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2.5 bg-amber-50/40 w-fit px-1.5 py-0.5 rounded border border-amber-100/50">
                      <Star size={10} className="text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-black text-slate-700">4.8</span>
                      <span className="text-[9px] text-slate-400 font-medium">(124)</span>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[12px] text-indigo-600 font-bold">৳</span>
                          <span className="font-black text-slate-900 text-[20px] leading-none">{med.sellingPrice || '0.00'}</span>
                        </div>
                      </div>
                      
                      {med.stock > 0 || (med.branchStocks && med.branchStocks.length > 0) ? (
                        <button onClick={() => addToCart(med.id)} className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white flex items-center justify-center gap-1 shadow-lg shadow-indigo-500/30 transition-all active:scale-95 group/btn">
                           <Plus size={14} className="group-hover/btn:rotate-90 transition-transform duration-300" /> 
                           <span className="text-[11px] font-bold">ADD</span>
                        </button>
                      ) : (
                        <button disabled className="h-9 px-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-[10px] border border-slate-200 cursor-not-allowed">
                          Out of Stock
                        </button>
                      )}
                    </div>
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

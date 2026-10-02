"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Pill, Plus, Store, MapPin, ArrowLeft, ShoppingCart } from "lucide-react";
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
    loadCart();
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
  }, []);

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
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-slate-800">Find Medicines</h1>
        <Link href="/cart" className="relative p-2">
          <ShoppingCart size={22} className="text-slate-700" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, brand, or generic..."
            className="pl-10"
          />
        </div>

        <p className="text-xs text-slate-500 mb-3">
          {loading ? "Searching..." : `${medicines.length} medicines found`}
        </p>

        {medicines.length === 0 && !loading ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
            <Pill size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No medicines found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medicines.map((med) => {
              const imgs = Array.isArray(med.images) ? med.images : [];
              const selling = parseFloat(med.sellingPrice);
              const discount = parseFloat(med.discountPercent) || 0;
              const finalPrice = selling - (selling * discount) / 100;

              return (
                <div key={med.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex gap-3">
                    <Link href={`/medicines/${med.id}`} className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-purple-100 flex items-center justify-center text-purple-600">
                      {imgs.length > 0 ? (
                        <img src={imgs[0]} alt={med.name} className="w-full h-full object-cover" />
                      ) : (
                        <Pill size={24} />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/medicines/${med.id}`}>
                        <h3 className="font-semibold text-slate-800 text-sm truncate">{med.name}</h3>
                        <p className="text-xs text-slate-500 truncate">
                          {med.brand && `${med.brand} • `}{med.genericName || ""}
                        </p>
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Store size={12} />
                        <span className="truncate">{med.pharmacy?.shopName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin size={12} />
                        <span className="truncate">{med.pharmacy?.area}, {med.pharmacy?.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div>
                      {discount > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-green-700">৳{finalPrice.toFixed(2)}</span>
                          <span className="text-xs text-slate-400 line-through">৳{selling.toFixed(2)}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">-{discount}%</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-slate-800">৳{selling.toFixed(2)}</span>
                      )}
                      <p className="text-xs text-slate-400">per {med.unit}</p>
                    </div>
                    <Button onClick={() => addToCart(med.id)} size="sm" className="flex items-center gap-1">
                      <Plus size={14} /> Add
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

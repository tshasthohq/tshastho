"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Pill, Trash2, Store, ShoppingBag, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = () => {
    const email = localStorage.getItem("userEmail");
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

  useEffect(() => { loadCart(); }, []);

  const updateCart = async (cartItemId: string, quantity: number, unitType: string) => {
    await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity, unitType }),
    });
    loadCart();
  };

  const removeItem = async (cartItemId: string) => {
    if (!confirm("Remove this item?")) return;
    await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId }),
    });
    loadCart();
  };

  // Compute per-unit price based on unitType
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

  if (loading) return <div className="p-6 text-slate-500 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-slate-800">My Cart</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {items.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100 mt-8">
            <ShoppingCart size={64} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">Your cart is empty</h2>
            <p className="text-sm text-slate-500 mb-6">Add medicines to get started</p>
            <Link href="/medicines">
              <Button className="inline-flex items-center gap-2">
                <Pill size={16} /> Browse Medicines
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => {
                const med = item.medicine;
                const imgs = Array.isArray(med.images) ? med.images : [];
                const unitPrice = getUnitPrice(med, item.unitType || "piece");

                return (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-purple-100 flex items-center justify-center text-purple-600">
                        {imgs.length > 0 ? (
                          <img src={imgs[0]} alt={med.name} className="w-full h-full object-cover" />
                        ) : (
                          <Pill size={24} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">{med.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{med.brand}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Store size={12} />
                          <span className="truncate">{med.pharmacy?.shopName}</span>
                        </div>
                        <p className="text-sm font-bold text-green-700 mt-2">
                          ৳{unitPrice.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ {item.unitType || "piece"}</span>
                        </p>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-red-500 self-start">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 gap-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.unitType || "piece"}
                          onChange={(e) => updateCart(item.id, item.quantity, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white text-slate-700 font-medium"
                        >
                          <option value="piece">Piece</option>
                          <option value="strip">Strip ({med.stripSize || 10})</option>
                          <option value="box">Box ({med.boxSize || 100})</option>
                        </select>
                        <button
                          onClick={() => updateCart(item.id, item.quantity - 1, item.unitType)}
                          className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"
                        >
                          <Minus size={14} />
                        </button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1;
                            setItems(prev => prev.map(p => p.id === item.id ? { ...p, quantity: qty } : p));
                          }}
                          onBlur={(e) => updateCart(item.id, parseInt(e.target.value) || 1, item.unitType)}
                          min={1}
                          className="w-16 text-center font-bold"
                        />
                        <button
                          onClick={() => updateCart(item.id, item.quantity + 1, item.unitType)}
                          className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="font-bold text-slate-800">৳{computeItemTotal(item).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-50">
              <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-xl font-bold text-slate-800">৳{total.toFixed(2)}</p>
                </div>
                <Link href="/checkout" className="flex-1">
                  <Button className="w-full flex items-center justify-center gap-2">
                    <ShoppingBag size={16} /> Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

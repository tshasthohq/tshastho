"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Trash2, ShieldCheck, Minus, Plus, ChevronRight, Store, Pill, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import PublicHeader from "@/components/PublicHeader";
import PageTitleBar from "@/components/PageTitleBar";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t: tr } = useLanguage();
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
    if (!confirm(tr("cart.remove", "Remove this item from your cart?"))) return;
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

  const bg = { background: "linear-gradient(180deg,#dbeafe 0%,#eff6ff 38%,#f8fafc 100%)" };
  const cardCls = "bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)]";
  const gradBtn = "inline-flex h-12 items-center justify-center px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-base font-bold shadow-lg shadow-blue-500/25";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bg}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">{tr("cart.loading", "Loading your cart...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-56 font-sans" style={bg}>
      <PublicHeader />
      <PageTitleBar title={tr("cart.title", "My Cart") + (items.length > 0 ? " (" + items.length + ")" : "")} />

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {!user ? (
          <div className={cardCls + " p-10 text-center"}>
            <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 45%,#06b6d4 100%)" }}>
              <ShoppingCart size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">{tr("cart.loginTitle", "Log in to see your cart")}</h2>
            <p className="text-base text-slate-500 mb-6">{tr("cart.loginSub", "Sign in to view and manage the items in your cart.")}</p>
            <Link href="/login?redirect=/cart" className={gradBtn}>{tr("cart.login", "Log in")}</Link>
          </div>
        ) : items.length === 0 ? (
          <div className={cardCls + " p-10 text-center"}>
            <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center bg-blue-50">
              <ShoppingCart size={44} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">{tr("cart.empty", "Your cart is empty")}</h2>
            <p className="text-base text-slate-500 mb-6">{tr("cart.emptySub", "Looks like you haven't added any medicines yet.")}</p>
            <Link href="/medicines" className={gradBtn}>{tr("cart.browse", "Browse Medicines")}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const med = item.medicine;
              const imgs = Array.isArray(med.images) ? med.images : [];
              const unitPrice = getUnitPrice(med, item.unitType || "piece");
              const itemTotal = unitPrice * item.quantity;
              const formRaw = String(med.category || "Tablet");
              const formSlug = formRaw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
              const unitRaw = String(item.unitType || "Piece");
              const unitText = tr("cart.unit." + unitRaw.toLowerCase(), unitRaw);
              const showStrength = med.strength && !/^n\/?a$/i.test(String(med.strength).trim());

              return (
                <div key={item.id} className={cardCls + " p-4 flex gap-4 relative overflow-hidden"}>
                  <button onClick={() => removeItem(item.id)} aria-label="Remove" className="absolute top-3 end-3 w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors z-10">
                    <X size={16} strokeWidth={3} />
                  </button>

                  <div className="w-24 h-24 shrink-0 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                    {imgs.length > 0 ? (
                      <img src={imgs[0]} alt={med.name} className="w-full h-full object-contain" />
                    ) : (
                      <Pill size={36} className="text-blue-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between pe-9">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-[17px] leading-tight">{med.name}</h3>
                      <p className="text-[13px] text-slate-500 font-medium mt-0.5 truncate">{med.brand} <span className="text-slate-300 mx-1">•</span> {med.genericName}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{tr("med.form." + formSlug, formRaw)}</span>
                        {showStrength && <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{med.strength}</span>}
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">{unitText}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-3 gap-2">
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{tr("cart.total", "Total Price")}</p>
                        <p className="font-black text-slate-900 text-xl leading-none">৳{itemTotal.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-blue-50/70 border border-blue-100 p-1 rounded-2xl">
                        <QtyControl
                          value={item.quantity}
                          onLocal={(n) => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, quantity: n } : x)))}
                          onCommit={(n) => updateCart(item.id, n, item.unitType)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {user && items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
          <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-2xl border border-white/70 shadow-[0_-10px_40px_-10px_rgba(30,64,175,0.2)] rounded-3xl p-5">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-slate-500 font-medium">{tr("cart.subtotal", "Subtotal")}</span>
                <span className="font-semibold text-slate-700">৳{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-slate-500 font-medium flex items-center gap-1.5"><Store size={15} /> {tr("cart.delivery", "Delivery Fee")}</span>
                <span className="font-semibold text-slate-700">৳{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200/70 pt-2 flex items-center justify-between">
                <span className="text-slate-800 font-black text-lg">{tr("cart.grand", "Total")}</span>
                <span className="font-black text-blue-600 text-2xl">৳{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-base shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-between px-6"
            >
              <span>{tr("cart.checkout", "Proceed to Checkout")}</span>
              <ChevronRight size={22} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function QtyControl({ value, onLocal, onCommit }: { value: number; onLocal: (n: number) => void; onCommit: (n: number) => Promise<any> | void }) {
  const MAX = 9999;
  const [txt, setTxt] = useState(String(value));
  const timer = useRef<any>(null);
  const dirty = useRef(false);

  useEffect(() => { if (!dirty.current) setTxt(String(value)); }, [value]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const schedule = (n: number) => {
    dirty.current = true;
    onLocal(n);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { await onCommit(n); } finally { dirty.current = false; }
    }, 500);
  };

  const step = (d: number) => {
    const cur = parseInt(txt, 10) || value;
    const n = Math.min(MAX, Math.max(1, cur + d));
    setTxt(String(n));
    schedule(n);
  };

  const finish = () => {
    let n = parseInt(txt, 10);
    if (!n || n < 1) n = 1;
    n = Math.min(MAX, n);
    setTxt(String(n));
    if (n !== value || dirty.current) schedule(n);
  };

  return (
    <>
      <button type="button" onClick={() => step(-1)} className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-blue-600 active:scale-90 transition-all">
        <Minus size={16} strokeWidth={3} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={txt}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
          setTxt(v);
          const n = parseInt(v, 10);
          if (n >= 1) schedule(Math.min(MAX, n));
        }}
        onBlur={finish}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-12 h-9 text-center font-bold text-slate-800 text-base bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 rounded-lg"
      />
      <button type="button" onClick={() => step(1)} className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-blue-600 active:scale-90 transition-all">
        <Plus size={16} strokeWidth={3} />
      </button>
    </>
  );
}

"use client";
import SplitPaymentModal from "@/components/pharmacy/SplitPaymentModal";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, X, Printer,
  Wallet, CheckCircle, Barcode
} from "lucide-react";

interface CartItem {
  medicineId: string;
  name: string;
  brand?: string;
  unitPrice: number;
  purchasePrice: number;
  quantity: number;
  stock: number;
  discount: number;
}

export default function POSPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shift, setShift] = useState<any>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "BKASH" | "NAGAD" | "DUE">("CASH");
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCash, setClosingCash] = useState(0);
  const searchTimer = useRef<any>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showBarcode, setShowBarcode] = useState(false);

  const loadShift = async () => {
    const res = await fetch("/api/pharmacy/pos/shift/current", { credentials: "include" });
    const data = await res.json();
    setShift(data.shift || null);
  };

  useEffect(() => { if (user) loadShift(); }, [user]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (search.length < 2) { setResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/pharmacy/pos/medicine-search?q=${encodeURIComponent(search)}`, { credentials: "include" });
      const data = await res.json();
      setResults(data.medicines || []);
      setSearching(false);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const addToCart = (med: any) => {
    const existing = cart.find(c => c.medicineId === med.id);
    if (existing) {
      if (existing.quantity >= med.stock) return;
      setCart(cart.map(c => c.medicineId === med.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        medicineId: med.id,
        name: med.name,
        brand: med.brand,
        unitPrice: Number(med.sellingPrice),
        purchasePrice: Number(med.purchasePrice),
        quantity: 1,
        stock: med.stock,
        discount: 0,
      }]);
    }
    setSearch("");
    setResults([]);
  };

  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const res = await fetch(`/api/pharmacy/pos/scan?barcode=${encodeURIComponent(barcodeInput.trim())}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      addToCart(data.medicine);
      setBarcodeInput("");
    } else {
      alert("Barcode not found");
      setBarcodeInput("");
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.medicineId !== id) return c;
      const nq = c.quantity + delta;
      if (nq <= 0) return c;
      if (nq > c.stock) return c;
      return { ...c, quantity: nq };
    }));
  };

  const removeItem = (id: string) => setCart(cart.filter(c => c.medicineId !== id));

  const subtotal = cart.reduce((s, i) => s + (i.unitPrice * i.quantity - i.discount), 0);
  const total = Math.max(0, subtotal - discountAmount);
  const change = Math.max(0, paidAmount - total);
  const due = Math.max(0, total - paidAmount);

  const handleSplitConfirm = async (splits: any[], notes: string) => {
    if (cart.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/pharmacy/pos/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: cart.map(c => ({
          medicineId: c.medicineId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          discount: c.discount,
        })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        discountAmount,
        paymentMethod: "MIXED",
        paidAmount: splits.filter(s => s.method !== "CREDIT" && s.method !== "DUE").reduce((a, b) => a + b.amount, 0),
        notes: notes || undefined,
        splits,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowReceipt(data.receipt);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountAmount(0);
      setPaidAmount(0);
      setNotes("");
      setShowSplitModal(false);
      setShowPayment(false);
      loadShift();
    } else {
      alert(data.message || "Sale failed");
    }
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/pharmacy/pos/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: cart.map(c => ({
          medicineId: c.medicineId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          discount: c.discount,
        })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        discountAmount,
        paymentMethod,
        paidAmount: paymentMethod === "DUE" ? 0 : (paidAmount || total),
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowReceipt(data.receipt);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountAmount(0);
      setPaidAmount(0);
      setNotes("");
      setPaymentMethod("CASH");
      setShowPayment(false);
      loadShift();
    } else {
      alert(data.message || "Sale failed");
    }
  };

  const handleOpenShift = async () => {
    const res = await fetch("/api/pharmacy/pos/shift/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ openingCash }),
    });
    const data = await res.json();
    if (res.ok) {
      setShift(data.shift);
      setShowShiftModal(false);
      setOpeningCash(0);
    }
  };

  const handleCloseShift = async () => {
    const res = await fetch("/api/pharmacy/pos/shift/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ closingCash }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Shift closed.\nExpected: ৳${data.shift.expectedCash}\nCounted: ৳${data.shift.closingCash}\nDifference: ৳${data.shift.difference}`);
      setShift(null);
      setShowShiftModal(false);
      setClosingCash(0);
    }
  };
// PART-2-CONTINUES-HERE

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-blue-600" size={22} />
            <h1 className="font-bold text-slate-800">POS</h1>
          </div>
          <div className="flex items-center gap-2">
            {shift ? (
              <>
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Shift Open
                </span>
                <button onClick={() => setShowShiftModal(true)}
                  className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg font-medium">
                  Close Shift
                </button>
              </>
            ) : (
              <button onClick={() => setShowShiftModal(true)}
                className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg font-medium">
                Open Shift
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-3 gap-4">
        {/* Left: Search & Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine by name, brand, generic..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="button" onClick={() => setShowBarcode(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
              <Barcode size={16} />
            </button>
          </div>

          {/* Search Results */}
          {search.length >= 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {searching ? (
                <div className="p-4 text-center text-slate-500 text-sm">Searching...</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">No medicines found</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {results.map((m) => (
                    <button key={m.id} onClick={() => addToCart(m)}
                      className="w-full p-3 text-left hover:bg-blue-50 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{m.name}</div>
                        <div className="text-xs text-slate-500">
                          {m.brand || m.genericName} • Stock: {m.stock}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-blue-600">৳ {Number(m.sellingPrice).toFixed(2)}</div>
                        <Plus size={14} className="text-slate-400 ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex justify-between">
              <h2 className="font-bold text-slate-800">Cart ({cart.length})</h2>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-500 font-medium">Clear</button>
              )}
            </div>
            {cart.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Cart is empty. Search and add medicines.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.medicineId} className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm truncate">{item.name}</div>
                      <div className="text-xs text-slate-500">৳ {item.unitPrice.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.medicineId, -1)}
                        className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item.medicineId, 1)} disabled={item.quantity >= item.stock}
                        className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center disabled:opacity-30">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-right w-20">
                      <div className="font-bold text-sm">৳ {(item.unitPrice * item.quantity).toFixed(2)}</div>
                    </div>
                    <button onClick={() => removeItem(item.medicineId)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
// PART-3-CONTINUES-HERE

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sticky top-20">
            <h2 className="font-bold text-slate-800 mb-3">Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">৳ {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Discount</span>
                <input type="number" min={0} value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-slate-200 rounded text-right text-sm" />
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold">
                <span>Total</span><span>৳ {total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={() => setShowPayment(true)} disabled={cart.length === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              <Wallet size={16} /> Checkout (৳ {total.toFixed(2)})
            </button>
          </div>
        </div>
      </div>

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">{shift ? "Close Shift" : "Open Shift"}</h2>
            {shift ? (
              <>
                <div className="bg-slate-50 p-3 rounded-xl mb-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Total Sales</span><span className="font-bold">৳ {Number(shift.totalSales).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Cash Sales</span><span className="font-bold">৳ {Number(shift.totalCash).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Sales Count</span><span className="font-bold">{shift.saleCount}</span></div>
                </div>
                <label className="text-xs font-medium text-slate-600">Closing Cash Count</label>
                <input type="number" min={0} value={closingCash}
                  onChange={(e) => setClosingCash(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mt-1 mb-4" />
                <div className="flex gap-2">
                  <button onClick={() => setShowShiftModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 font-medium">Cancel</button>
                  <button onClick={handleCloseShift}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium">Close Shift</button>
                </div>
              </>
            ) : (
              <>
                <label className="text-xs font-medium text-slate-600">Opening Cash Amount</label>
                <input type="number" min={0} value={openingCash}
                  onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mt-1 mb-4" />
                <div className="flex gap-2">
                  <button onClick={() => setShowShiftModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 font-medium">Cancel</button>
                  <button onClick={handleOpenShift}
                    className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium">Open Shift</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">Complete Sale</h2>
              <button onClick={() => setShowPayment(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Customer Name</label>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Optional" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label>
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Optional" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CASH", "CARD", "BKASH", "NAGAD", "DUE"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl text-xs font-medium border ${
                        paymentMethod === m ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200"
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== "DUE" && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Amount Received (৳)</label>
                  <input type="number" min={0} value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl text-sm space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-bold">৳ {total.toFixed(2)}</span></div>
                {paymentMethod !== "DUE" && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Change</span><span className="font-bold text-green-600">৳ {change.toFixed(2)}</span></div>
                    {due > 0 && (
                      <div className="flex justify-between"><span className="text-slate-500">Due</span><span className="font-bold text-red-600">৳ {due.toFixed(2)}</span></div>
                    )}
                  </>
                )}
              </div>

              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)" rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              <button onClick={() => { setShowPayment(false); setShowSplitModal(true); }} type="button"
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                Split Payment
              </button>
              <button onClick={completeSale} disabled={saving}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                <CheckCircle size={16} /> {saving ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <CheckCircle className="text-green-600 mx-auto mb-2" size={40} />
              <h2 className="font-bold text-lg">Sale Complete</h2>
              <p className="text-xs text-slate-500 font-mono">{showReceipt.saleNumber}</p>
            </div>
            <div className="border-t border-dashed border-slate-300 py-3 space-y-1 text-xs">
              {showReceipt.items.map((i: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.qty} × {i.name}</span>
                  <span>৳ {Number(i.subtotal).toFixed(2)}

      {/* Barcode scanning modal */}
      {showBarcode && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Barcode className="text-blue-600" size={24} />
              </div>
              <h2 className="font-bold text-lg">Scan Barcode</h2>
              <p className="text-xs text-slate-500">Use scanner or type barcode number</p>
            </div>
            <form onSubmit={(e) => { handleBarcodeScan(e); if (true) setTimeout(() => setShowBarcode(false), 100); }}>
              <input autoFocus value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan or type barcode..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center font-mono text-lg mb-3" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowBarcode(false); setBarcodeInput(""); }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSplitModal && (
        <SplitPaymentModal
          total={total}
          customerName={customerName || undefined}
          customerPhone={customerPhone || undefined}
          onConfirm={handleSplitConfirm}
          onClose={() => setShowSplitModal(false)}
          processing={saving}
        />
      )}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>৳ {Number(showReceipt.subtotal).toFixed(2)}</span></div>
              {Number(showReceipt.discount) > 0 && (
                <div className="flex justify-between text-red-600"><span>Discount</span><span>-৳ {Number(showReceipt.discount).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-slate-300 pt-2">
                <span>Total</span><span>৳ {Number(showReceipt.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">Paid</span><span>৳ {Number(showReceipt.paid).toFixed(2)}</span></div>
              <div className="flex justify-between text-green-600"><span>Change</span><span>৳ {Number(showReceipt.change).toFixed(2)}</span></div>
              {Number(showReceipt.due) > 0 && (
                <div className="flex justify-between text-red-600 font-medium"><span>Due</span><span>৳ {Number(showReceipt.due).toFixed(2)}</span></div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => window.print()}
                className="flex-1 bg-slate-100 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1">
                <Printer size={14} /> Print
              </button>
              <button onClick={() => setShowReceipt(null)}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

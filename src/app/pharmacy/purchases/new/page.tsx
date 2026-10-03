"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";

interface PurchaseItem {
  medicineId: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  unitCost: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([
    { medicineId: "", batchNumber: "", mfgDate: "", expiryDate: "", quantity: 1, unitCost: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/pharmacy/suppliers", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/pharmacy/medicines", { credentials: "include" }).then((r) => r.json()),
    ]).then(([s, m]) => {
      setSuppliers(s.suppliers || []);
      setMedicines(m.medicines || []);
    });
  }, [user]);

  const addItem = () => {
    setItems([...items, { medicineId: "", batchNumber: "", mfgDate: "", expiryDate: "", quantity: 1, unitCost: 0 }]);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof PurchaseItem, value: any) => {
    const next = [...items];
    (next[idx] as any)[field] = value;
    setItems(next);
  };

  const total = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!supplierId) { setMessage("Please select a supplier"); return; }
    if (items.some((i) => !i.medicineId || !i.batchNumber || !i.expiryDate)) {
      setMessage("Please fill all item fields (medicine, batch number, expiry)");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/pharmacy/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        supplierId,
        invoiceNumber: invoiceNumber || undefined,
        notes: notes || undefined,
        items,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      router.push("/pharmacy/purchases");
    } else {
      setMessage(data.message || "Failed to create purchase");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">New Purchase Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier & Invoice */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Supplier *</label>
            <select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white">
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.companyName ? ` (${s.companyName})` : ""}</option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No suppliers yet. <a href="/pharmacy/suppliers" className="underline">Add one first</a>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Invoice Number</label>
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-800">Items</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1 text-sm text-blue-600 font-medium">
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-500">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <select required value={item.medicineId} onChange={(e) => updateItem(idx, "medicineId", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2 bg-white">
                  <option value="">Select medicine</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} {m.brand ? `- ${m.brand}` : ""}</option>
                  ))}
                </select>

                <input required value={item.batchNumber} onChange={(e) => updateItem(idx, "batchNumber", e.target.value)}
                  placeholder="Batch number *"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2" />

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Mfg Date</label>
                    <input type="date" value={item.mfgDate} onChange={(e) => updateItem(idx, "mfgDate", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Expiry Date *</label>
                    <input required type="date" value={item.expiryDate} onChange={(e) => updateItem(idx, "expiryDate", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Quantity *</label>
                    <input required type="number" min={1} value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Unit Cost (৳) *</label>
                    <input required type="number" min={0} step="0.01" value={item.unitCost}
                      onChange={(e) => updateItem(idx, "unitCost", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="mt-2 text-right text-xs text-slate-500">
                  Subtotal: <span className="font-bold text-slate-800">
                    ৳ {((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Optional"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
        </div>

        {message && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
            {message}
          </div>
        )}
      </form>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Total Amount</p>
            <p className="text-xl font-bold text-slate-800">৳ {total.toFixed(2)}</p>
          </div>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50">
            <Save size={16} /> {saving ? "Creating..." : "Create Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}

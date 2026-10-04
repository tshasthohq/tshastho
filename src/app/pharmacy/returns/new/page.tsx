"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";

const TYPES = [
  { value: "CUSTOMER_RETURN", label: "Customer Return" },
  { value: "SUPPLIER_RETURN", label: "Supplier Return" },
  { value: "DAMAGE_WRITE_OFF", label: "Damage Write-off" },
  { value: "EXPIRED_WRITE_OFF", label: "Expired Write-off" },
];

export default function NewReturnPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    type: "CUSTOMER_RETURN",
    supplierId: "",
    customerName: "",
    customerPhone: "",
    refundMethod: "CASH",
    reason: "",
    notes: "",
  });
  const [items, setItems] = useState<any[]>([
    { medicineId: "", quantity: 1, unitPrice: 0, isRestocked: false, reason: "" },
  ]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/pharmacy/medicines", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/suppliers", { credentials: "include" }).then(r => r.json()),
    ]).then(([m, s]) => {
      setMedicines(m.medicines || []);
      setSuppliers(s.suppliers || []);
    });
  }, [user]);

  const addItem = () => setItems([...items, { medicineId: "", quantity: 1, unitPrice: 0, isRestocked: false, reason: "" }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, field: string, value: any) => {
    setItems(items.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  };

  const totalAmount = items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.medicineId)) { setMessage("Please select all medicines"); return; }
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/pharmacy/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, items }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      router.push("/pharmacy/returns");
    } else {
      setMessage(data.message || "Failed to create return");
    }
  };
// CONTINUES

  const isCustomerReturn = form.type === "CUSTOMER_RETURN";
  const isSupplierReturn = form.type === "SUPPLIER_RETURN";
  const isWriteOff = ["DAMAGE_WRITE_OFF", "EXPIRED_WRITE_OFF"].includes(form.type);

  return (
    <div className="p-4 max-w-5xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">New Return</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <label className="text-xs font-medium text-slate-600 mb-2 block">Return Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  form.type === t.value ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Context fields */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
          {isCustomerReturn && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Customer name" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="Phone" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Refund Method</label>
                <select value={form.refundMethod} onChange={(e) => setForm({ ...form, refundMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="CASH">Cash</option>
                  <option value="ORIGINAL">Original Payment</option>
                  <option value="STORE_CREDIT">Store Credit</option>
                  <option value="NO_REFUND">No Refund</option>
                </select>
              </div>
            </>
          )}

          {isSupplierReturn && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Supplier *</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {(isWriteOff || isSupplierReturn) && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                {isWriteOff ? "Reason for write-off" : "Return reason"}
              </label>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Expired, damaged, wrong item"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-800">Items</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1 text-sm text-blue-600 font-medium">
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-slate-500">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <select required value={item.medicineId}
                  onChange={(e) => updateItem(idx, "medicineId", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white mb-2">
                  <option value="">Select medicine</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-0.5 block">Quantity *</label>
                    <input required type="number" min={1} value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-0.5 block">Unit Price (৳)</label>
                    <input type="number" min={0} step="0.01" value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>

                {isCustomerReturn && (
                  <label className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                    <input type="checkbox" checked={item.isRestocked}
                      onChange={(e) => updateItem(idx, "isRestocked", e.target.checked)}
                      className="rounded" />
                    Restock this item (medicine is usable)
                  </label>
                )}
              </div>
            ))}
          </div>
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
            <p className="text-xl font-bold text-slate-800">৳ {totalAmount.toFixed(2)}</p>
          </div>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50">
            <Save size={16} /> {saving ? "Creating..." : "Create Return"}
          </button>
        </div>
      </div>
    </div>
  );
}

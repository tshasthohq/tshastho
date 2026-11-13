"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/context/BranchContext";
import { 
  Plus, Trash2, Save, ArrowLeft, Search, Truck, 
  User, RefreshCw, AlertCircle, FileText 
} from "lucide-react";
import PharmacyNav from "@/components/pharmacy/PharmacyNav";

const TYPES = [
  { value: "CUSTOMER_RETURN", label: "Customer Return" },
  { value: "SUPPLIER_RETURN", label: "Supplier Return" },
  { value: "DAMAGE_WRITE_OFF", label: "Damage Write-off" },
  { value: "EXPIRED_WRITE_OFF", label: "Expired Write-off" },
];

export default function NewReturnPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [searchingInvoice, setSearchingInvoice] = useState(false);
  
  const [form, setForm] = useState({
    type: "CUSTOMER_RETURN",
    supplierId: "",
    customerName: "",
    customerPhone: "",
    refundMethod: "CASH",
    deductionPercent: 0,
    reason: "",
    notes: "",
    originalSaleId: "",
  });

  const [items, setItems] = useState<any[]>([
    { medicineId: "", quantity: 1, unitPrice: 0, isRestocked: true, reason: "" },
  ]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/pharmacy/medicines", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/suppliers", { credentials: "include" }).then(r => r.json()),
    ]).then(([m, s]) => {
      setMedicines(m.medicines || []);
      setSuppliers(s.suppliers || []);
    }).catch(console.error);
  }, [user]);

  const handleInvoiceSearch = async () => {
    if (!invoiceNumber.trim()) return;
    setSearchingInvoice(true);
    setMessage("");
    try {
      const res = await fetch(`/api/pharmacy/returns/invoice-search?invoice=${invoiceNumber.trim()}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.success) {
        const sale = data.sale;
        setForm(prev => ({
          ...prev,
          type: "CUSTOMER_RETURN",
          customerName: sale.customerName || "",
          customerPhone: sale.customerPhone || "",
          originalSaleId: sale.id
        }));
        const returnItems = sale.items.map((item: any) => ({
          medicineId: item.medicineId,
          quantity: 1,
          unitPrice: Number(item.unitPrice),
          isRestocked: true,
          reason: ""
        }));
        setItems(returnItems);
      } else {
        setMessage(data.message || "Invoice not found");
      }
    } catch (err) {
      setMessage("Failed to search invoice");
    } finally {
      setSearchingInvoice(false);
    }
  };

  const addItem = () => setItems([...items, { medicineId: "", quantity: 1, unitPrice: 0, isRestocked: true, reason: "" }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  
  const updateItem = (i: number, field: string, value: any) => {
    setItems(items.map((it, idx) => {
      if (idx !== i) return it;
      const newItem = { ...it, [field]: value };
      // Auto-fill unit price when medicine is selected
      if (field === 'medicineId') {
        const med = medicines.find(m => m.id === value);
        if (med) {
          // কাস্টমার রিটার্ন হলে সেলিং প্রাইস, অন্যথায় পারচেজ প্রাইস
          newItem.unitPrice = form.type === 'CUSTOMER_RETURN' 
            ? Number(med.sellingPrice) 
            : Number(med.purchasePrice);
        }
      }
      return newItem;
    }));
  };

  const grossTotal = items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
  const deductionAmount = (grossTotal * (Number(form.deductionPercent) || 0)) / 100;
  const netRefund = grossTotal - deductionAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.medicineId)) { setMessage("Please select all medicines"); return; }
    setSaving(true);
    setMessage("");
    
    try {
      const res = await fetch("/api/pharmacy/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
              ...form, // বা UI এর ডেটা
              ...form, items , branchId: activeBranch?.id || null,
              totalAmount: grossTotal || 0,
              refundAmount: netRefund || 0
            }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/pharmacy/returns");
      } else {
        setMessage(data.message || "Failed to create return");
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  };

  const isCustomerReturn = form.type === "CUSTOMER_RETURN";
  const isSupplierReturn = form.type === "SUPPLIER_RETURN";
  const isWriteOff = ["DAMAGE_WRITE_OFF", "EXPIRED_WRITE_OFF"].includes(form.type);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans">
      <PharmacyNav />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="font-bold text-slate-800 text-lg">New Return</h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-5 mt-2">
        
        {/* Invoice Auto-Search */}
        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
          <label className="text-xs font-bold text-indigo-800 mb-2 block uppercase tracking-wider flex items-center gap-1.5">
            <Search size={14}/> Search by Invoice No. (Auto-fill)
          </label>
          <div className="flex gap-2">
            <input 
              value={invoiceNumber} 
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. POS-20261110-0001" 
              className="flex-1 px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
            <button 
              type="button" 
              onClick={handleInvoiceSearch} 
              disabled={searchingInvoice || !invoiceNumber.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {searchingInvoice ? <RefreshCw size={16} className="animate-spin"/> : "Fetch"}
            </button>
          </div>
        </div>

        {/* Return Type */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <label className="text-xs font-bold text-slate-600 mb-3 block uppercase tracking-wider">Return Type *</label>
          <div className="grid grid-cols-2 gap-3">
            {TYPES.map((t) => (
              <button 
                key={t.value} 
                type="button" 
                onClick={() => {
                  setForm({ ...form, type: t.value });
                  // টাইপ চেঞ্জ হলে দামও আপডেট হবে
                  const updatedItems = items.map(item => {
                    if (!item.medicineId) return item;
                    const med = medicines.find(m => m.id === item.medicineId);
                    if (!med) return item;
                    return {
                      ...item,
                      unitPrice: t.value === 'CUSTOMER_RETURN' ? Number(med.sellingPrice) : Number(med.purchasePrice)
                    };
                  });
                  setItems(updatedItems);
                }}
                className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  form.type === t.value 
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Context Fields */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
            {isSupplierReturn ? <Truck size={16}/> : <User size={16}/>} 
            {isSupplierReturn ? "Supplier Details" : "Customer Details"}
          </h2>
          
          {isCustomerReturn && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Customer Name</label>
                  <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Customer name" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
                  <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="Phone number" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Refund Method</label>
                <select value={form.refundMethod} onChange={(e) => setForm({ ...form, refundMethod: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Supplier *</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {(isWriteOff || isSupplierReturn) && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">{isWriteOff ? "Reason for write-off" : "Return reason"}</label>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Expired, damaged, wrong item" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FileText size={16}/> Items</h2>
            <button type="button" onClick={addItem} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Medicine</label>
                    <select required value={item.medicineId} onChange={(e) => updateItem(idx, "medicineId", e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">Select medicine</option>
                      {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Quantity</label>
                      <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                      {isCustomerReturn ? "Selling Price (৳)" : "Purchase Price (৳)"}
                    </label>
                      <input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>

                  {isCustomerReturn && (
                    <label className="flex items-center gap-2 mt-2 text-xs text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={item.isRestocked} onChange={(e) => updateItem(idx, "isRestocked", e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                      Restock this item (medicine is usable)
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deduction & Summary */}
        {isCustomerReturn && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-3">Refund Calculation</h3>
            
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600">Deduction / Restocking Fee (%)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" min={0} max={10} value={form.deductionPercent} 
                  onChange={(e) => setForm({...form, deductionPercent: Math.min(10, Math.max(0, Number(e.target.value)))})}
                  className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-xl text-right font-bold text-red-500 focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Gross Total:</span>
                <span className="font-semibold text-slate-800">৳{grossTotal.toFixed(2)}</span>
              </div>
              {deductionAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Deduction:</span>
                  <span className="font-semibold">-৳{deductionAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-200 mt-2">
                <span className="text-slate-800">Net Refund:</span>
                <span className="text-indigo-600">৳{netRefund.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {message && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold text-center">{message}</div>}
      </form>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Refund Amount</p>
            <p className="text-xl font-black text-indigo-600">৳{isCustomerReturn ? netRefund.toFixed(2) : grossTotal.toFixed(2)}</p>
          </div>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50">
            <Save size={18} /> {saving ? "Saving..." : "Create Return"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { X, Plus } from "lucide-react";

export default function BatchModal({ med, batches, onClose, onRefresh, activeBranch }: any) {
  const [newBatch, setNewBatch] = useState({ batchNumber: "", expiryDate: "", quantity: "", purchasePrice: "", sellingPrice: "" });

  const handleAddBatch = async () => {
    if (!newBatch.quantity) return alert("Quantity required");
    try {
      const res = await fetch("/api/pharmacy/medicines/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newBatch, medicineId: med.id, branchId: activeBranch?.id })
      });
      if (res.ok) {
        alert("✅ Batch added successfully!");
        setNewBatch({ batchNumber: "", expiryDate: "", quantity: "", purchasePrice: "", sellingPrice: "" });
        onRefresh(med.id);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Batches: {med.name}</h2>
            <p className="text-xs text-slate-500">Total Stock: {med.stock}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm mb-4">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-2 rounded-l-lg">Batch No</th>
                <th className="p-2">Expiry</th>
                <th className="p-2">Qty</th>
                <th className="p-2 rounded-r-lg">Price</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr><td colSpan={4} className="text-center p-4 text-slate-400">No batches found</td></tr>
              ) : batches.map((b: any) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-2 font-mono text-xs">{b.batchNumber}</td>
                  <td className="p-2 text-xs text-red-500">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-2 font-bold">{b.quantity}</td>
                  <td className="p-2">৳{b.sellingPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-800 mb-3 uppercase tracking-wider flex items-center gap-2"><Plus size={14}/> Add New Batch</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Batch No." value={newBatch.batchNumber} onChange={e => setNewBatch({...newBatch, batchNumber: e.target.value})} className="p-2 text-sm rounded-lg border border-slate-300" />
              <input type="date" value={newBatch.expiryDate} onChange={e => setNewBatch({...newBatch, expiryDate: e.target.value})} className="p-2 text-sm text-slate-500 rounded-lg border border-slate-300" />
              <input type="number" placeholder="Quantity" value={newBatch.quantity} onChange={e => setNewBatch({...newBatch, quantity: e.target.value})} className="p-2 text-sm rounded-lg border border-slate-300 font-bold" />
              <input type="number" placeholder="Purchase Price" value={newBatch.purchasePrice} onChange={e => setNewBatch({...newBatch, purchasePrice: e.target.value})} className="p-2 text-sm rounded-lg border border-slate-300" />
            </div>
            <button onClick={handleAddBatch} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-sm transition-colors">Save Batch</button>
          </div>
        </div>
      </div>
    </div>
  );
}

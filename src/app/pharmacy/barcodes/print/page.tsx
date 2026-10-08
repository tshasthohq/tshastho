"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Printer, ArrowLeft, X, Minus, Plus, Package } from "lucide-react";

function PrintContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, { qty: number; name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [barcodeData, setBarcodeData] = useState<Record<string, string>>({});

  const initialIds = params.get("ids")?.split(",").filter(Boolean) || [];

  const load = async () => {
    setLoading(true);
    const [mRes, bRes] = await Promise.all([
      fetch("/api/pharmacy/medicines", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/barcodes", { credentials: "include" }).then(r => r.json()),
    ]);
    const meds = mRes.medicines || [];
    setMedicines(meds);

    // Map medicine -> primary barcode
    const bMap: Record<string, string> = {};
    (bRes.barcodes || []).forEach((b: any) => {
      if (!bMap[b.medicineId] || b.isPrimary) {
        bMap[b.medicineId] = b.barcode;
      }
    });
    setBarcodeData(bMap);

    // Prefill selected
    const sel: Record<string, any> = {};
    initialIds.forEach((id) => {
      const m = meds.find((x: any) => x.id === id);
      if (m) sel[id] = { qty: 1, name: m.name };
    });
    setSelected(sel);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const toggle = (m: any) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[m.id]) delete next[m.id];
      else next[m.id] = { qty: 1, name: m.name };
      return next;
    });
  };

  const updateQty = (id: string, delta: number) => {
    setSelected((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      const qty = Math.max(1, Math.min(500, cur.qty + delta));
      return { ...prev, [id]: { ...cur, qty } };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedList = Object.entries(selected).map(([id, s]) => {
    const m = medicines.find((x) => x.id === id);
    const barcode = barcodeData[id] || id.slice(-10);
    return { id, medicine: m, barcode, qty: s.qty };
  });

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="print:hidden bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-slate-800">Barcode Labels</h1>
          </div>
          <button onClick={handlePrint} disabled={selectedList.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            <Printer size={14} /> Print ({selectedList.reduce((a, s) => a + s.qty, 0)})
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid lg:grid-cols-2 gap-4 print:block">
        {/* Selection (hidden on print) */}
        <div className="print:hidden bg-white rounded-2xl border border-slate-100 p-4 max-h-[80vh] overflow-y-auto">
          <h2 className="font-bold text-slate-800 mb-3">Select Medicines</h2>
          {medicines.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No medicines</p>
          ) : (
            <div className="space-y-1">
              {medicines.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg">
                  <input type="checkbox" checked={!!selected[m.id]}
                    onChange={() => toggle(m)}
                    className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{m.name}</div>
                    <div className="text-xs text-slate-500">
                      {m.brand || m.genericName} • Stock: {m.stock}
                    </div>
                  </div>
                  {selected[m.id] && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(m.id, -1)}
                        className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                        <Minus size={10} />
                      </button>
                      <span className="w-8 text-center text-xs font-medium">{selected[m.id].qty}</span>
                      <button onClick={() => updateQty(m.id, 1)}
                        className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                        <Plus size={10} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Print Preview */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 print:border-0 print:p-0 print:rounded-none">
          <h2 className="font-bold text-slate-800 mb-3 print:hidden">Print Preview</h2>
          {selectedList.length === 0 ? (
            <div className="text-center py-12 print:hidden">
              <Package className="mx-auto text-slate-300 mb-2" size={40} />
              <p className="text-sm text-slate-500">Select medicines to preview labels</p>
            </div>
          ) : (
            <div id="labels" className="grid grid-cols-3 gap-2 print:grid-cols-4 print:gap-1">
              {selectedList.flatMap((item) =>
                Array.from({ length: item.qty }).map((_, i) => (
                  <div key={`${item.id}-${i}`}
                    className="border border-slate-300 rounded p-2 print:border-black print:break-inside-avoid"
                    style={{ minHeight: "90px" }}>
                    <div className="text-[9px] font-bold text-slate-800 leading-tight line-clamp-2">
                      {item.medicine?.name}
                    </div>
                    {item.medicine?.genericName && (
                      <div className="text-[7px] text-slate-500 truncate">
                        {item.medicine.genericName}
                      </div>
                    )}
                    <div className="text-[8px] font-medium text-slate-700 mt-1">
                      ৳ {Number(item.medicine?.sellingPrice || 0).toFixed(2)}
                    </div>
                    <div className="mt-1 flex justify-center">
                      <img
                        src={`/api/barcode/${encodeURIComponent(item.barcode)}?format=code128&height=32&text=false`}
                        alt="Barcode"
                        className="w-full h-8 object-contain"
                      />
                    </div>
                    <div className="text-[7px] text-center font-mono text-slate-700 truncate">
                      {item.barcode}
                    </div>
                    <div className="text-[6px] text-center text-slate-400 mt-0.5">
                      Tshastho
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { margin: 8mm; }
        }
      `}</style>
    </div>
  );
}

export default function PrintBarcodesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading...</div>}>
      <PrintContent />
    </Suspense>
  );
}

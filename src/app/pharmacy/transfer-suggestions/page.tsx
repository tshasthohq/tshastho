"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Lightbulb, ArrowRight, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";

export default function TransferSuggestionsPage() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/pharmacy/branch-transfer-suggestions", { credentials: "include" });
    const data = await res.json();
    setSuggestions(data.suggestions || []);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === suggestions.length) setSelected(new Set());
    else setSelected(new Set(suggestions.map(s => s.medicineId + s.fromBranchId + s.toBranchId)));
  };

  const key = (s: any) => s.medicineId + s.fromBranchId + s.toBranchId;

  const handleBulkTransfer = async () => {
    const chosen = suggestions.filter(s => selected.has(key(s)));
    if (chosen.length === 0) return;
    if (!confirm(`Create ${chosen.length} transfer request(s)?`)) return;

    setProcessing(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/branch-transfer-suggestions/bulk-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        suggestions: chosen.map(s => ({
          medicineId: s.medicineId,
          fromBranchId: s.fromBranchId,
          toBranchId: s.toBranchId,
          quantity: s.suggestedQty,
        })),
      }),
    });
    const data = await res.json();
    setProcessing(false);
    if (res.ok) {
      setMessage(`✅ Created ${data.count} transfer(s). Go to Transfers to approve.`);
      load();
      setTimeout(() => setMessage(""), 4000);
    } else {
      setMessage(data.message || "Failed");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-amber-500" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Transfer Suggestions</h1>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        AI suggests moving stock from branches with excess to branches with low stock.
      </p>

      {message && <p className="mb-3 text-sm text-center text-green-600">{message}</p>}

      {loading ? (
        <div className="text-center text-slate-500 p-8">Analyzing stock...</div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <CheckCircle className="mx-auto text-green-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">All branches are balanced! 🎉</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <button onClick={toggleAll}
              className="text-xs text-blue-600 font-medium">
              {selected.size === suggestions.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-xs text-slate-500">{suggestions.length} suggestions</span>
          </div>

          <div className="space-y-2 mb-4">
            {suggestions.map((s) => {
              const k = key(s);
              const isSelected = selected.has(k);
              return (
                <div key={k} className={`bg-white p-4 rounded-2xl border-2 transition ${
                  isSelected ? "border-blue-500 bg-blue-50" : "border-slate-100"
                }`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(k)}
                      className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 truncate">{s.medicineName}</span>
                        {s.severity === "CRITICAL" && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-medium">
                            <AlertTriangle size={9} /> CRITICAL
                          </span>
                        )}
                      </div>
                      {s.medicineBrand && <div className="text-xs text-slate-500 mb-2">{s.medicineBrand}</div>}

                      <div className="flex items-center gap-2 text-xs mb-2">
                        <div className="bg-green-50 text-green-700 px-2 py-1 rounded">
                          <div className="text-[9px]">From</div>
                          <div className="font-medium">{s.fromBranchName} ({s.fromQty})</div>
                        </div>
                        <ArrowRight size={14} className="text-slate-400" />
                        <div className="bg-red-50 text-red-700 px-2 py-1 rounded">
                          <div className="text-[9px]">To</div>
                          <div className="font-medium">{s.toBranchName} ({s.toQty})</div>
                        </div>
                      </div>

                      <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                        Transfer <strong>{s.suggestedQty}</strong> units
                      </div>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>

          {selected.size > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
              <div className="max-w-4xl mx-auto">
                <button onClick={handleBulkTransfer} disabled={processing}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                  {processing ? "Creating..." : `Create ${selected.size} Transfer Request(s)`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, TrendingUp, TrendingDown, ArrowDown, ArrowUp } from "lucide-react";

export default function LedgerPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = async () => {
    setLoading(true);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`/api/pharmacy/finance/ledger?from=${from}`, { credentials: "include" });
    const data = await res.json();
    setEntries(data.entries || []);
    setSummary(data.summary || {});
    setBalance(data.balance || 0);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, days]);

  const typeColor = (t: string) => {
    switch (t) {
      case "SALE":
      case "POS_SALE": return "bg-green-100 text-green-700";
      case "PURCHASE": return "bg-red-100 text-red-700";
      case "EXPENSE": return "bg-orange-100 text-orange-700";
      case "PAYMENT_RECEIVED": return "bg-blue-100 text-blue-700";
      case "REFUND": return "bg-pink-100 text-pink-700";
      case "SETTLEMENT": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };
// CONTINUES

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Ledger</h1>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white mb-4">
        <div className="text-xs text-blue-100 mb-1">Current Balance</div>
        <div className="text-3xl font-bold">৳ {Number(balance).toFixed(2)}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 border border-green-100 p-3 rounded-2xl">
          <div className="flex items-center gap-1 text-xs text-green-700 mb-1"><TrendingUp size={12} /> Credit</div>
          <div className="text-lg font-bold text-green-700">৳ {Number(summary.totalCredit || 0).toFixed(0)}</div>
        </div>
        <div className="bg-red-50 border border-red-100 p-3 rounded-2xl">
          <div className="flex items-center gap-1 text-xs text-red-700 mb-1"><TrendingDown size={12} /> Debit</div>
          <div className="text-lg font-bold text-red-700">৳ {Number(summary.totalDebit || 0).toFixed(0)}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              days === d ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
            }`}>
            {d} days
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500">
          No ledger entries in this period.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {entries.map((e) => (
            <div key={e.id} className="p-3 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                e.direction === "CREDIT" ? "bg-green-100" : "bg-red-100"
              }`}>
                {e.direction === "CREDIT" ? (
                  <ArrowDown size={14} className="text-green-600" />
                ) : (
                  <ArrowUp size={14} className="text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColor(e.entryType)}`}>
                    {e.entryType}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(e.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <div className="text-sm text-slate-700 truncate">{e.description || "—"}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${e.direction === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                  {e.direction === "CREDIT" ? "+" : "-"}৳ {Number(e.amount).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Bal: ৳{Number(e.balance).toFixed(0)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

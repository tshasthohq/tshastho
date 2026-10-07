"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { DollarSign, RefreshCw, Plus, X, TrendingUp, Star } from "lucide-react";

export default function CurrenciesPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [message, setMessage] = useState("");
  const [newCurrency, setNewCurrency] = useState({ code: "", name: "", symbol: "", isActive: true, isBase: false });
  const [newRate, setNewRate] = useState({ fromCode: "", toCode: "BDT", rate: 0 });

  const load = async () => {
    setLoading(true);
    const [cRes, rRes] = await Promise.all([
      fetch("/api/admin/currencies", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin/currencies/rates", { credentials: "include" }).then(r => r.json()),
    ]);
    setCurrencies(cRes.currencies || []);
    setRates(rRes.rates || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    if (!confirm("Seed default currencies (BDT, USD, INR, EUR)?")) return;
    setSeeding(true);
    const res = await fetch("/api/admin/currencies/seed", { method: "POST", credentials: "include" });
    const data = await res.json();
    setSeeding(false);
    if (res.ok) {
      setMessage(`✅ Seeded ${data.seeded} currencies`);
      load();
      setTimeout(() => setMessage(""), 2500);
    }
  };

  const handleAddCurrency = async () => {
    setMessage("");
    const res = await fetch("/api/admin/currencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newCurrency),
    });
    if (res.ok) {
      setShowAdd(false);
      setNewCurrency({ code: "", name: "", symbol: "", isActive: true, isBase: false });
      load();
    } else {
      const d = await res.json();
      setMessage(d.message || "Failed");
    }
  };

  const handleAddRate = async () => {
    setMessage("");
    const res = await fetch("/api/admin/currencies/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newRate),
    });
    if (res.ok) {
      setShowRate(false);
      setNewRate({ fromCode: "", toCode: "BDT", rate: 0 });
      load();
    } else {
      const d = await res.json();
      setMessage(d.message || "Failed");
    }
  };
// PART2

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Currencies</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSeed} disabled={seeding}
            className="flex items-center gap-1 bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50">
            <RefreshCw size={12} className={seeding ? "animate-spin" : ""} /> Seed
          </button>
          <button onClick={() => setShowRate(true)}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium">
            <TrendingUp size={12} /> Rate
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-medium">
            <Plus size={12} /> Currency
          </button>
        </div>
      </div>

      {message && <p className="mb-3 text-sm text-center text-green-600">{message}</p>}

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : currencies.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No currencies. Click "Seed" to add defaults.
        </div>
      ) : (
        <>
          <h2 className="text-sm font-bold text-slate-600 mb-2">Active Currencies</h2>
          <div className="space-y-2 mb-6">
            {currencies.map((c) => (
              <div key={c.code} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-600 text-lg">
                  {c.symbol}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    {c.code}
                    {c.code === "BDT" && <Star size={12} className="text-amber-500 fill-amber-500" />}
                  </div>
                  <div className="text-xs text-slate-500">{c.name}</div>
                </div>
                {c.rate > 0 && c.code !== "BDT" && (
                  <div className="text-right">
                    <div className="text-xs text-slate-500">1 {c.code} =</div>
                    <div className="font-bold text-slate-800">৳{c.rate.toFixed(2)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-sm font-bold text-slate-600 mb-2">Recent Rates</h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {rates.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">No rates configured.</div>
            ) : (
              rates.slice(0, 10).map((r) => (
                <div key={r.id} className="p-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">1 {r.fromCurrency?.code}</span>
                    <span className="text-slate-400 mx-2">=</span>
                    <span className="font-medium">{r.rate} {r.toCurrency?.code}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(r.effectiveFrom).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Add Currency Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">Add Currency</h2>
              <button onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={newCurrency.code} onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                placeholder="Code (USD, EUR)" maxLength={5}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={newCurrency.name} onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                placeholder="Name (US Dollar)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={newCurrency.symbol} onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                placeholder="Symbol ($, €, ৳)" maxLength={5}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newCurrency.isBase}
                  onChange={(e) => setNewCurrency({ ...newCurrency, isBase: e.target.checked })} />
                Set as base currency
              </label>
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button onClick={handleAddCurrency}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rate Modal */}
      {showRate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">Add Exchange Rate</h2>
              <button onClick={() => setShowRate(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={newRate.fromCode} onChange={(e) => setNewRate({ ...newRate, fromCode: e.target.value.toUpperCase() })}
                placeholder="From (USD)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={newRate.toCode} onChange={(e) => setNewRate({ ...newRate, toCode: e.target.value.toUpperCase() })}
                placeholder="To (BDT)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input type="number" min={0} step="0.01" value={newRate.rate}
                onChange={(e) => setNewRate({ ...newRate, rate: Number(e.target.value) })}
                placeholder="Rate (1 USD = ? BDT)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              {message && <p className="text-sm text-red-600">{message}</p>}
              <button onClick={handleAddRate}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-medium">Add Rate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

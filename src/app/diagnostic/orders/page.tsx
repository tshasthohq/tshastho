"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Search } from "lucide-react";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 [color-scheme:light]";

export default function Orders() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const [orders, setOrders] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [q, setQ] = useState("");
  const [dueOnly, setDueOnly] = useState(false);
  const [payFor, setPayFor] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (dueOnly) p.set("due", "1");
    const r = await fetch(`/api/diagnostic/orders?${p}`, { credentials: "include" });
    const d = await r.json();
    if (d.success) { setOrders(d.orders); setTotals(d.totals); }
  }, [q, dueOnly]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [user, load]);

  const pay = async () => {
    setMsg("");
    const r = await fetch(`/api/diagnostic/orders/${payFor.id}/pay`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ amount: Number(amount), method }),
    });
    const d = await r.json();
    if (r.ok) { setPayFor(null); setAmount(""); load(); } else setMsg(d.message || "Failed");
  };

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;

  const stat = [
    { l: "Orders", v: totals.count ?? 0 }, { l: "Total", v: `৳${totals.total ?? 0}` },
    { l: "Paid", v: `৳${totals.paid ?? 0}` }, { l: "Due", v: `৳${totals.due ?? 0}` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Orders</h1>
        <Link href="/diagnostic/reception" className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white">+ New Order</Link>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stat.map((s) => (
          <div key={s.l} className="rounded-xl border border-slate-100 bg-white p-2 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-900">{s.v}</p><p className="text-[10px] text-slate-500">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input className={field + " pl-9"} placeholder="Memo no, patient naam ba phone (shob somoyer)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} /> Shudhu due ache (shob somoyer)
      </label>
      {orders.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">Kono order nai.</p>}
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-slate-100 bg-white p-3 text-slate-900 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold">{o.patient.name}</p>
                <p className="text-xs text-slate-500">{o.orderNo} • {o._count.items} test • {o.patient.phone || ""}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">৳{Number(o.total)}</p>
                <p className={`text-[10px] font-bold ${Number(o.due) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {Number(o.due) > 0 ? `DUE ৳${Number(o.due)}` : "PAID"}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-2 text-xs font-semibold">
              <Link href={`/diagnostic/orders/${o.id}/memo`} className="text-blue-600">Memo / Print</Link>
              <Link href={`/diagnostic/orders/${o.id}`} className="text-slate-700">Details / Edit</Link>
              {Number(o.due) > 0 && o.status !== "CANCELLED" && (
                <button onClick={() => { setPayFor(o); setAmount(String(Number(o.due))); setMsg(""); }} className="text-orange-600">Collect Due</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {payFor && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 sm:items-center" onClick={() => setPayFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-3 rounded-t-2xl bg-white p-4 text-slate-900 sm:rounded-2xl [color-scheme:light]">
            <p className="font-bold">Collect due: {payFor.orderNo}</p>
            <p className="text-xs text-slate-500">Due ৳{Number(payFor.due)}</p>
            {msg && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{msg}</p>}
            <input type="number" min="1" className={field} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <select className={field} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="CASH">Cash</option><option value="BKASH">bKash</option><option value="NAGAD">Nagad</option>
              <option value="CARD">Card</option><option value="BANK">Bank</option><option value="OTHER">Other</option>
            </select>
            <button onClick={pay} className="w-full rounded-lg bg-orange-600 py-2.5 font-bold text-white">Save Payment</button>
          </div>
        </div>
      )}
    </div>
  );
}

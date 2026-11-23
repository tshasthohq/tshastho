"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Download, Droplet, TrendingUp, Trash2, Wallet } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import { api } from "@/components/blood-bank/Sheet";
import { GROUPS, groupLabel } from "@/lib/bd-locations";

const COMP: Record<string, string> = { WHOLE_BLOOD: "Whole blood", RBC: "RBC", PLATELETS: "Platelets", PLASMA: "Plasma" };
const PRESETS: [string, string][] = [["today", "Today"], ["7", "7 days"], ["30", "30 days"], ["month", "This month"], ["custom", "Custom"]];
const ST: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700", PARTIAL: "bg-amber-100 text-amber-700",
  UNPAID: "bg-red-100 text-red-700", WAIVED: "bg-slate-100 text-slate-600",
};
const dateInput =
  "w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500";

const today = () => new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);
const daysAgo = (d: number) => new Date(Date.now() + 6 * 3600000 - d * 86400000).toISOString().slice(0, 10);
const money = (v: number) => `৳${Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const short = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

function presetRange(p: string): [string, string] {
  if (p === "7") return [daysAgo(6), today()];
  if (p === "30") return [daysAgo(29), today()];
  if (p === "month") return [today().slice(0, 8) + "01", today()];
  return [today(), today()];
}

const cell = (v: any) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

function downloadCsv(issues: any[], from: string, to: string) {
  const head = ["Date", "Invoice", "Bag", "Blood group", "Component", "Recipient", "Hospital", "Total", "Paid", "Status"];
  const rows = issues.map((i) => [
    new Date(i.issuedAt).toLocaleString("en-GB"), i.invoice?.invoiceNumber || "", i.bag?.bagNumber || "",
    i.bag ? groupLabel(i.bag.bloodGroup) : "", i.bag ? COMP[i.bag.component] : "", i.recipientName,
    i.hospital || "", i.invoice?.total ?? "", i.invoice?.paid ?? "", i.invoice?.status || "",
  ]);
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `blood-bank-issues-${from}-to-${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [preset, setPreset] = useState("7");
  const [range, setRange] = useState<[string, string]>(presetRange("7"));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setErr("");
    try {
      setData(await api(`/api/blood-bank/reports?from=${from}&to=${to}`, "GET"));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range[0], range[1]); }, [range, load]);

  function pick(p: string) {
    setPreset(p);
    if (p !== "custom") setRange(presetRange(p));
  }

  const s = data?.summary;
  const maxDay = Math.max(1, ...(data?.daily || []).map((d: any) => d.billed));
  const groupTotal = (g: string) => (data?.stock || []).filter((x: any) => x.bloodGroup === g).reduce((a: number, x: any) => a + x.count, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24" style={{ colorScheme: "light" }}>
      <BackHeader title="Reports" />
      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex bg-slate-200/60 p-1.5 rounded-xl overflow-x-auto">
          {PRESETS.map(([v, l]) => (
            <button key={v} onClick={() => pick(v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${preset === v ? "bg-white text-red-700 shadow-sm" : "text-slate-500"}`}>{l}</button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className={dateInput} value={range[0]} onChange={(e) => e.target.value && setRange([e.target.value, range[1]])} />
            <input type="date" className={dateInput} value={range[1]} onChange={(e) => e.target.value && setRange([range[0], e.target.value])} />
          </div>
        )}

        {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{err}</p>}

        {loading && !data ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : data && s ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: "BAGS ISSUED", v: s.issued, icon: Droplet, c: "text-red-600 bg-red-50 border-red-100" },
                { l: "BAGS COLLECTED", v: s.collected, icon: TrendingUp, c: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                { l: "WASTED (EXPIRED + DISCARDED)", v: s.expired + s.discarded, icon: Trash2, c: "text-slate-600 bg-slate-100 border-slate-200" },
                { l: "SERVICE CHARGES BILLED", v: money(s.invoiced), icon: Wallet, c: "text-amber-600 bg-amber-50 border-amber-100" },
              ].map((c) => (
                <div key={c.l} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${c.c}`}><c.icon size={16} /></div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">{c.l}</p>
                  <p className="text-xl font-extrabold text-slate-900">{c.v}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white rounded-2xl border border-slate-100 p-3"><p className="text-[10px] font-bold text-slate-400">COLLECTED</p><p className="font-extrabold text-emerald-700">{money(s.paid)}</p></div>
              <div className="bg-white rounded-2xl border border-slate-100 p-3"><p className="text-[10px] font-bold text-slate-400">DISCOUNTS</p><p className="font-extrabold text-slate-800">{money(s.discount)}</p></div>
              <div className="bg-white rounded-2xl border border-slate-100 p-3"><p className="text-[10px] font-bold text-slate-400">OUTSTANDING DUE</p><p className="font-extrabold text-red-700">{money(s.dueOutstanding)}</p><p className="text-[10px] text-slate-400">{s.dueCount} invoices, all time</p></div>
            </div>

            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h2 className="font-extrabold text-slate-900 mb-3">Stock right now (tested bags)</h2>
              <div className="grid grid-cols-4 gap-2">
                {GROUPS.map((g) => {
                  const c = groupTotal(g.v);
                  return (
                    <div key={g.v} className={`rounded-xl border p-2.5 text-center ${c === 0 ? "bg-red-50 text-red-700 border-red-100" : c <= 3 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                      <p className="text-lg font-black leading-none">{c}</p>
                      <p className="text-xs font-bold mt-1">{g.l}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h2 className="font-extrabold text-slate-900 mb-3">Daily collection</h2>
              {data.daily.length === 0 ? (
                <p className="text-sm text-slate-400">No invoices in this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.daily.map((d: any) => (
                    <div key={d.date}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{short(d.date)}</span>
                        <span className="text-slate-500">{money(d.paid)} paid of {money(d.billed)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600" style={{ width: `${Math.max(3, (d.billed / maxDay) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {data.wasteReasons.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h2 className="font-extrabold text-slate-900 mb-3">Waste and discard reasons</h2>
                <div className="space-y-2">
                  {data.wasteReasons.map((w: any) => (
                    <div key={w.reason} className="flex justify-between text-sm bg-slate-50 rounded-xl px-3 py-2">
                      <span className="text-slate-700 truncate pr-2">{w.reason}</span>
                      <span className="font-bold text-slate-900">{w.count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-extrabold text-slate-900">Issue history</h2>
                {data.issues.length > 0 && (
                  <button onClick={() => downloadCsv(data.issues, data.range.from, data.range.to)} className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg">
                    <Download size={14} /> CSV
                  </button>
                )}
              </div>
              {data.issues.length === 0 ? (
                <p className="text-sm text-slate-400">No bags issued in this period.</p>
              ) : (
                <div className="space-y-2">
                  {data.issues.map((i: any, k: number) => (
                    <div key={k} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <span className="w-10 h-10 rounded-lg bg-red-50 text-red-700 font-extrabold text-sm flex items-center justify-center shrink-0">{i.bag ? groupLabel(i.bag.bloodGroup) : "?"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{i.recipientName}</p>
                        <p className="text-xs text-slate-500 truncate">{short(i.issuedAt)} · Bag {i.bag?.bagNumber}{i.hospital ? ` · ${i.hospital}` : ""}</p>
                      </div>
                      {i.invoice && (
                        <Link href={`/blood-bank/memo/${i.invoice.id}`} className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900">{money(i.invoice.total)}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ST[i.invoice.status] || ""}`}>{i.invoice.status}</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

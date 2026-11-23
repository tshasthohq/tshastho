"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, Loader2, Droplet } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import { groupLabel } from "@/lib/bd-locations";

const COMP: Record<string, string> = { WHOLE_BLOOD: "Whole blood", RBC: "RBC", PLATELETS: "Platelets", PLASMA: "Plasma" };
const STATUS: Record<string, { t: string; c: string }> = {
  PAID: { t: "PAID", c: "text-emerald-700 border-emerald-600" },
  PARTIAL: { t: "PARTIALLY PAID", c: "text-amber-700 border-amber-600" },
  UNPAID: { t: "DUE", c: "text-red-700 border-red-600" },
  WAIVED: { t: "WAIVED", c: "text-slate-600 border-slate-500" },
};

const PRINT_CSS = `
@page { size: A4; margin: 12mm; }
@media print {
  html, body { background: #fff !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const money = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const when = (d: string) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const join = (...p: (string | null | undefined)[]) => p.map((x) => (x || "").trim()).filter(Boolean).join(", ");

export default function MemoPage() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/blood-bank/invoices/${id}`, { credentials: "include" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load");
        setInv(d.invoice);
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  const bag = inv?.issue?.bag;
  const due = inv ? Math.max(0, inv.total - inv.paid) : 0;
  const st = STATUS[inv?.status] || STATUS.UNPAID;

  return (
    <div className="min-h-screen bg-slate-100 pb-24 print:min-h-0 print:bg-white print:pb-0" style={{ colorScheme: "light" }}>
      <style>{PRINT_CSS}</style>
      <div className="print:hidden"><BackHeader title="Memo" /></div>
      <div className="max-w-2xl mx-auto p-4 print:max-w-none print:p-0">
        {err ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{err}</p>
        ) : !inv ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-900 break-inside-avoid print:rounded-none print:shadow-none print:border-0">
              <div className="bg-gradient-to-r from-red-700 to-rose-600 text-white px-6 py-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
                    <Droplet size={22} className="text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold leading-tight">{inv.bloodBank.name}</p>
                    <p className="text-[11px] text-red-100">{join(inv.bloodBank.address, inv.bloodBank.district)}</p>
                    <p className="text-[11px] text-red-100">{inv.bloodBank.phone} · License {inv.bloodBank.dghsLicense}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-red-100">SERVICE INVOICE</p>
                  <p className="text-sm font-extrabold">{inv.invoiceNumber}</p>
                  <p className="text-[11px] text-red-100">{when(inv.createdAt)}</p>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400">BILLED TO</p>
                    <p className="font-bold mt-1">{inv.recipientName}</p>
                    {inv.recipientPhone && <p className="text-xs text-slate-500">{inv.recipientPhone}</p>}
                    {inv.hospital && <p className="text-xs text-slate-500">{inv.hospital}</p>}
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400">BLOOD BAG</p>
                    {bag ? (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="w-10 h-10 rounded-lg bg-red-50 text-red-700 font-extrabold flex items-center justify-center shrink-0">{groupLabel(bag.bloodGroup)}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm">{bag.bagNumber}</p>
                          <p className="text-xs text-slate-500">{COMP[bag.component]}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 mt-1">-</p>
                    )}
                  </div>
                </div>

                <table className="w-full text-sm mt-5">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider">
                      <th className="text-left px-3 py-2 rounded-l-lg">Service</th>
                      <th className="text-center px-2 py-2">Qty</th>
                      <th className="text-right px-2 py-2">Rate</th>
                      <th className="text-right px-3 py-2 rounded-r-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.items.map((i: any, k: number) => (
                      <tr key={k} className="border-b border-slate-100">
                        <td className="px-3 py-2.5 pr-2">{i.name}</td>
                        <td className="px-2 py-2.5 text-center text-slate-600">{i.quantity}</td>
                        <td className="px-2 py-2.5 text-right text-slate-600">{i.unitPrice > 0 ? money(i.unitPrice) : "—"}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{i.amount > 0 ? money(i.amount) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-start justify-between gap-6 mt-5">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block border-2 rounded-lg px-3 py-1 text-sm font-extrabold tracking-widest ${st.c}`}>{st.t}</span>
                    {inv.paymentMethod && <p className="text-xs text-slate-500 mt-3">Payment method: <b className="text-slate-700">{inv.paymentMethod}</b></p>}
                    {inv.note && <p className="text-xs text-slate-500 mt-1">Note: <b className="text-slate-700">{inv.note}</b></p>}
                  </div>
                  <div className="w-56 shrink-0 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(inv.subtotal)}</span></div>
                    {inv.discount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-{money(inv.discount)}</span></div>}
                    <div className="flex justify-between items-center bg-red-600 text-white rounded-lg px-3 py-2 font-extrabold text-base">
                      <span>Total</span><span>{money(inv.total)}</span>
                    </div>
                    <div className="flex justify-between"><span className="text-slate-500">Paid</span><span>{money(inv.paid)}</span></div>
                    <div className="flex justify-between font-bold"><span>Due</span><span>{money(due)}</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 mt-10 text-center text-[11px] text-slate-500">
                  <div className="border-t border-slate-300 pt-1.5">Received by</div>
                  <div className="border-t border-slate-300 pt-1.5">Authorised signature</div>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-[11px] text-slate-500 flex items-center justify-between gap-4">
                <p>This invoice covers service charges only (screening, grouping, crossmatch, processing and consumables). Blood is not sold.</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Tshastho" className="h-5 w-auto opacity-80 shrink-0" />
              </div>
            </div>

            <button onClick={() => window.print()} className="print:hidden w-full mt-4 bg-red-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-200">
              <Printer size={16} /> Print memo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

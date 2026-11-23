"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, Phone, Building2, ClipboardList, Activity, CheckCircle2 } from "lucide-react";
import { GROUPS } from "@/lib/bd-locations";
import { Sheet, Field, fld, api } from "./Sheet";

const METHODS = ["Cash", "bKash", "Nagad", "Card", "Bank transfer", "Due"];

export default function IssueSheet({ bag, onClose, onDone }: { bag: any; onClose: () => void; onDone: () => void }) {
  const needsX = ["WHOLE_BLOOD", "RBC"].includes(bag.component);
  const [f, setF] = useState<any>({ crossmatch: "COMPATIBLE", paymentMethod: "Cash", discount: "", paid: "" });
  const [services, setServices] = useState<any[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const xDone = useRef(false);

  const set = (k: string, v: any) => {
    if (k === "crossmatch" || k === "recipientName" || k === "recipientGroup") xDone.current = false;
    setF((p: any) => ({ ...p, [k]: v }));
  };

  useEffect(() => {
    api("/api/blood-bank/services", "GET")
      .then((d) => {
        const items = (d.items || []).filter((i: any) => i.isActive);
        setServices(items);
        const p: Record<string, boolean> = {};
        items.forEach((i: any) => { p[i.id] = needsX || !/crossmatch/i.test(i.name); });
        setPicked(p);
      })
      .catch(() => {});
  }, [needsX]);

  const subtotal = services.reduce((a, s) => a + (picked[s.id] ? s.price : 0), 0);
  const discount = Math.min(subtotal, Math.max(0, Number(f.discount) || 0));
  const total = subtotal - discount;

  async function run(confirmWarning = false) {
    setBusy(true);
    setMsg("");
    try {
      if (!f.recipientName?.trim() || !f.recipientGroup) throw new Error("Recipient name and blood group are required");

      if (needsX && f.crossmatch !== "RECORDED" && !xDone.current) {
        await api(`/api/blood-bank/bags/${bag.id}/crossmatch`, "POST", {
          patientName: f.recipientName, patientGroup: f.recipientGroup, type: "MAJOR", result: f.crossmatch,
        });
        xDone.current = true;
        if (f.crossmatch === "INCOMPATIBLE") {
          setMsg("Incompatible crossmatch recorded. Do not issue this bag to this patient.");
          return;
        }
      }

      const d = await api(`/api/blood-bank/bags/${bag.id}`, "PATCH", {
        action: "issue",
        recipientName: f.recipientName,
        recipientGroup: f.recipientGroup,
        recipientPhone: f.recipientPhone,
        hospital: f.hospital,
        services: services.filter((s) => picked[s.id]).map((s) => ({ id: s.id, quantity: 1 })),
        discount: f.discount,
        paid: f.paid,
        paymentMethod: f.paymentMethod,
        note: f.note,
        confirmWarning,
      });
      setInvoiceId(d.invoiceId || "done");
    } catch (e: any) {
      if (e.needsConfirm && window.confirm(`${e.message}. Issue anyway?`)) return run(true);
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (invoiceId)
    return (
      <Sheet title="Blood issued" onClose={onDone}>
        <div className="text-center py-4">
          <CheckCircle2 className="mx-auto text-emerald-600 mb-3" size={44} />
          <p className="font-bold text-slate-900">Bag {bag.bagNumber} issued</p>
          <p className="text-sm text-slate-500 mt-1">The invoice has been created.</p>
          {invoiceId !== "done" && (
            <Link href={`/blood-bank/memo/${invoiceId}`} className="block mt-5 bg-red-600 text-white font-bold py-3 rounded-xl">View memo</Link>
          )}
          <button onClick={onDone} className="block w-full mt-3 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl">Done</button>
        </div>
      </Sheet>
    );

  return (
    <Sheet
      title={`Issue bag ${bag.bagNumber}`}
      onClose={onClose}
      footer={
        <>
          {msg && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mb-3">{msg}</p>}
          <button disabled={busy} onClick={() => run()} className="w-full bg-red-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-md shadow-red-200">
            {busy ? "Saving..." : needsX && f.crossmatch === "INCOMPATIBLE" ? "Record incompatible result" : "Confirm issue"}
          </button>
        </>
      }
    >
      <Field label="Recipient name *" icon={User}>
        <input className={fld} placeholder="Patient name" value={f.recipientName || ""} onChange={(e) => set("recipientName", e.target.value)} />
      </Field>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient blood group *</label>
        <div className="grid grid-cols-4 gap-2">
          {GROUPS.map((g) => (
            <button key={g.v} type="button" onClick={() => set("recipientGroup", g.v)} className={`py-2.5 rounded-xl font-extrabold text-sm ${f.recipientGroup === g.v ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-slate-200 text-slate-700"}`}>
              {g.l}
            </button>
          ))}
        </div>
      </div>

      <Field label="Recipient phone" icon={Phone}>
        <input type="tel" inputMode="tel" className={fld} placeholder="01XXXXXXXXX" value={f.recipientPhone || ""} onChange={(e) => set("recipientPhone", e.target.value)} />
      </Field>
      <Field label="Hospital" icon={Building2}>
        <input className={fld} placeholder="Hospital name" value={f.hospital || ""} onChange={(e) => set("hospital", e.target.value)} />
      </Field>

      {needsX && (
        <Field label="Major crossmatch result *" icon={Activity}>
          <select className={fld} value={f.crossmatch} onChange={(e) => set("crossmatch", e.target.value)}>
            <option value="COMPATIBLE">Compatible</option>
            <option value="INCOMPATIBLE">Incompatible</option>
            <option value="RECORDED">Already recorded for this patient</option>
          </select>
        </Field>
      )}

      <div>
        <p className="text-xs font-bold text-slate-700 mb-2">Service charges (not the price of blood)</p>
        {services.length === 0 ? (
          <p className="text-xs text-slate-400">No services in the price list yet.</p>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <label key={s.id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <span className="flex items-center gap-2 text-sm text-slate-800 min-w-0">
                  <input type="checkbox" checked={!!picked[s.id]} onChange={(e) => setPicked((p) => ({ ...p, [s.id]: e.target.checked }))} className="w-4 h-4 accent-red-600 shrink-0" />
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="text-sm font-bold text-slate-900 shrink-0">৳{s.price}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Discount" icon={Activity}>
          <input type="number" className={fld} placeholder="0" value={f.discount} onChange={(e) => set("discount", e.target.value)} />
        </Field>
        <Field label="Payment method" icon={ClipboardList}>
          <select className={fld} value={f.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
            {METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Field label="Amount paid" icon={Activity}>
            <input type="number" className={fld} placeholder="0" value={f.paid} onChange={(e) => set("paid", e.target.value)} />
          </Field>
        </div>
        <button type="button" onClick={() => set("paid", String(total))} className="px-4 py-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">Paid in full</button>
      </div>

      <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl px-4 py-3">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-lg font-extrabold">৳{total}</span>
      </div>

      <Field label="Note" icon={ClipboardList}>
        <input className={fld} placeholder="Optional note" value={f.note || ""} onChange={(e) => set("note", e.target.value)} />
      </Field>
    </Sheet>
  );
}

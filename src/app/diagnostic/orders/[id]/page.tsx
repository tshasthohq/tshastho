"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ui } from "@/lib/diagnostic/ui";
import HistoryPanel from "@/components/diagnostic/HistoryPanel";
import { Pencil, Printer, X, Plus, Search } from "lucide-react";

type Ref = { id: string; name: string; type: string; degree: string | null };
type Test = { id: string; code: string; name: string; price: string };
type CartItem = { id: string; code: string; name: string; price: number };

const taka = (n: any) => `৳${Number(n)}`;

export default function OrderDetail() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const isOwner = user?.role === "DIAGNOSTIC_OWNER";
  const { id } = useParams<{ id: string }>();

  const [o, setO] = useState<any>(null);
  const [err, setErr] = useState("");
  const [refs, setRefs] = useState<Ref[]>([]);
  const [allTests, setAllTests] = useState<Test[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Record<string, any>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tq, setTq] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [hk, setHk] = useState(0);

  const load = useCallback(async () => {
    const r = await fetch(`/api/diagnostic/orders/${id}`, { credentials: "include" });
    const d = await r.json();
    if (d.success) setO(d.order); else setErr(d.message || "Failed");
  }, [id]);

  useEffect(() => {
    if (!user) return;
    load();
    fetch("/api/diagnostic/referrers", { credentials: "include" }).then((r) => r.json()).then((d) => d.success && setRefs(d.referrers));
    fetch("/api/diagnostic/tests", { credentials: "include" }).then((r) => r.json())
      .then((d) => d.success && setAllTests(d.tests.filter((t: any) => t.isActive)));
  }, [user, load]);

  const locked = useMemo(() => !!o && o.items.some((i: any) => i.status !== "PENDING"), [o]);
  const results = useMemo(() => {
    const q = tq.trim().toLowerCase();
    if (!q) return [];
    const have = new Set(cart.map((c) => c.id));
    return allTests.filter((t) => !have.has(t.id) && (t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))).slice(0, 8);
  }, [tq, allTests, cart]);

  const openEdit = () => {
    const p = o.patient;
    setF({
      name: p.name, phone: p.phone || "", age: p.age ?? "", ageUnit: p.ageUnit, gender: p.gender || "", address: p.address || "",
      referrerId: o.referrerId || "", agentId: o.agentId || "", discount: String(Number(o.discount)), note: o.note || "", reason: "",
    });
    setCart(o.items.map((i: any) => ({ id: i.testId, code: i.testCode, name: i.testName, price: Number(i.price) })));
    setTq(""); setMsg(""); setOpen(true);
  };
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    const body: any = {
      reason: f.reason,
      patient: {
        name: f.name, phone: f.phone || null, age: f.age === "" ? null : Number(f.age),
        ageUnit: f.ageUnit, gender: f.gender || null, address: f.address || null,
      },
      referrerId: f.referrerId || null,
      note: f.note || null,
    };
    if (isOwner) {
      body.agentId = f.agentId || null;
      body.discount = Number(f.discount || 0);
      if (!locked) body.testIds = cart.map((c) => c.id);
    }
    const res = await fetch(`/api/diagnostic/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) { setOpen(false); load(); setHk((k) => k + 1); } else setMsg(d.message || "Failed");
  };

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;
  if (err) return <p className="p-6 text-red-600">{err}</p>;
  if (!o) return <p className="p-6 text-slate-500">Loading...</p>;

  const doctors = refs.filter((r) => r.type === "DOCTOR");
  const agents = refs.filter((r) => r.type !== "DOCTOR");
  const stat = [
    { l: "Total", v: taka(o.total), c: "text-slate-900" },
    { l: "Paid", v: taka(o.paid), c: "text-emerald-600" },
    { l: "Due", v: taka(o.due), c: Number(o.due) > 0 ? "text-red-600" : "text-emerald-600" },
    { l: "Tests", v: o.items.length, c: "text-slate-900" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/diagnostic/orders" className="text-xs font-bold text-blue-600">← Orders</Link>
          <h1 className={ui.h1}>Order <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">{o.orderNo}</span></h1>
          <p className={ui.sub}>{new Date(o.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} • {o.status} • {o.payStatus}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/diagnostic/orders/${id}/memo`} className={ui.btnGhost + " flex items-center gap-1.5"}><Printer size={15} /> Memo</Link>
          {o.items.some((i: any) => i.status === "VERIFIED" || i.status === "APPROVED") && (
            <Link href={`/diagnostic/orders/${id}/report`} className={ui.btnGhost + " flex items-center gap-1.5"}><Printer size={15} /> Report</Link>
          )}
          {o.status !== "CANCELLED" && <button onClick={openEdit} className={ui.btn + " flex items-center gap-1.5"}><Pencil size={15} /> Edit</button>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {stat.map((s) => (
          <div key={s.l} className={ui.card + " !p-3 text-center"}>
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p><p className="text-[11px] text-slate-500">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={ui.card}>
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Patient</p>
          <p className="text-base font-black">{o.patient.name}</p>
          <p className="text-sm text-slate-600">{o.patient.patientNo} • {o.patient.phone || "No phone"}</p>
          <p className="text-sm text-slate-600">{o.patient.age ? `${o.patient.age}${o.patient.ageUnit}` : "-"} • {o.patient.gender || "-"}</p>
          {o.patient.address && <p className="text-sm text-slate-600">{o.patient.address}</p>}
        </div>
        <div className={ui.card}>
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Referral</p>
          <p className="text-sm"><b>Doctor:</b> {o.referrer ? `${o.referrer.name}${o.referrer.degree ? ` (${o.referrer.degree})` : ""}` : "Self"}</p>
          <p className="mt-1 text-sm"><b>Agent:</b> {o.agent ? o.agent.name : "None"} <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">internal</span></p>
          {o.note && <p className="mt-2 text-sm text-slate-600">Note: {o.note}</p>}
        </div>
      </div>

      <div className={ui.card}>
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Tests</p>
        <div className="divide-y divide-slate-100">
          {o.items.map((i: any) => (
            <div key={i.id} className="flex items-center justify-between py-2">
              <div><p className="text-sm font-semibold">{i.testName}</p><p className="text-xs text-slate-500">{i.testCode} • {i.status}</p></div>
              <p className="text-sm font-black">{taka(i.price)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
          <p className="flex justify-between"><span>Subtotal</span><span>{taka(o.subtotal)}</span></p>
          <p className="flex justify-between"><span>Discount</span><span>{taka(o.discount)}</span></p>
          <p className="flex justify-between font-black"><span>Total</span><span>{taka(o.total)}</span></p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={ui.card}>
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Payments</p>
          {o.payments.length === 0 && <p className="text-sm text-slate-500">Kono payment nai.</p>}
          {o.payments.map((p: any) => (
            <p key={p.id} className="flex justify-between py-1 text-sm">
              <span>{new Date(p.createdAt).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" })} • {p.method}</span>
              <b>{taka(p.amount)}</b>
            </p>
          ))}
        </div>
        {isOwner && (
          <div className={ui.card}>
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Commission (internal)</p>
            {(!o.commissions || o.commissions.length === 0) && <p className="text-sm text-slate-500">Kono commission nai.</p>}
            {o.commissions?.map((c: any) => (
              <p key={c.id} className="flex items-center justify-between py-1 text-sm">
                <span>{c.referrer.name} <span className="text-xs text-slate-400">({c.role})</span></span>
                <span><b>{taka(c.amount)}</b> <span className={`ml-1 ${ui.pill} ${c.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{c.status}</span></span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className={ui.card}>
        <p className="mb-4 text-xs font-black uppercase tracking-wide text-slate-400">Edit History</p>
        <HistoryPanel entity="ORDER" entityId={id} refreshKey={hk} />
      </div>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 text-slate-900 sm:rounded-3xl [color-scheme:light]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Edit {o.orderNo}</h2>
              <button type="button" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            {msg && <p className="rounded-xl bg-red-50 p-2 text-sm font-semibold text-red-600">{msg}</p>}

            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Patient</p>
            <div><label className={ui.label}>Naam</label><input className={ui.field} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={ui.label}>Phone</label><input className={ui.field} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div><label className={ui.label}>Gender</label>
                <select className={ui.field} value={f.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">--</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                </select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={ui.label}>Age</label><input type="number" min="0" className={ui.field} value={f.age} onChange={(e) => set("age", e.target.value)} /></div>
              <div><label className={ui.label}>Unit</label>
                <select className={ui.field} value={f.ageUnit} onChange={(e) => set("ageUnit", e.target.value)}>
                  <option value="Y">Year</option><option value="M">Month</option><option value="D">Day</option>
                </select></div>
            </div>
            <div><label className={ui.label}>Address</label><input className={ui.field} value={f.address} onChange={(e) => set("address", e.target.value)} /></div>

            <p className="pt-2 text-xs font-black uppercase tracking-wide text-slate-400">Referral</p>
            <div><label className={ui.label}>Doctor</label>
              <select className={ui.field} value={f.referrerId} onChange={(e) => set("referrerId", e.target.value)}>
                <option value="">Self / None</option>
                {doctors.map((r) => <option key={r.id} value={r.id}>{r.name}{r.degree ? ` (${r.degree})` : ""}</option>)}
              </select></div>
            {isOwner && (
              <div><label className={ui.label}>Agent (memo-te print hobe na)</label>
                <select className={ui.field} value={f.agentId} onChange={(e) => set("agentId", e.target.value)}>
                  <option value="">No agent</option>
                  {agents.map((r) => <option key={r.id} value={r.id}>{r.name} • {r.type}</option>)}
                </select></div>
            )}

            {isOwner && (
              <>
                <p className="pt-2 text-xs font-black uppercase tracking-wide text-slate-400">Tests ar Discount</p>
                {locked ? (
                  <p className="rounded-xl bg-amber-50 p-2 text-xs font-semibold text-amber-700">Sample collection shuru hoyeche, test bodlano jabe na.</p>
                ) : (
                  <>
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input className={ui.field + " pl-10"} placeholder="Test add korun..." value={tq} onChange={(e) => setTq(e.target.value)} />
                    </div>
                    {results.map((t) => (
                      <button type="button" key={t.id} onClick={() => { setCart([...cart, { id: t.id, code: t.code, name: t.name, price: Number(t.price) }]); setTq(""); }}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-2.5 text-left">
                        <span className="text-sm font-semibold">{t.name}</span><span className="flex items-center gap-1 text-sm font-black">{taka(t.price)} <Plus size={14} className="text-blue-600" /></span>
                      </button>
                    ))}
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                      {cart.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2.5">
                          <span className="text-sm font-semibold">{t.name}</span>
                          <span className="flex items-center gap-3"><b className="text-sm">{taka(t.price)}</b>
                            <button type="button" disabled={cart.length === 1} onClick={() => setCart(cart.filter((c) => c.id !== t.id))}><X size={15} className="text-red-500" /></button></span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div><label className={ui.label}>Discount (৳)</label><input type="number" min="0" className={ui.field} value={f.discount} onChange={(e) => set("discount", e.target.value)} /></div>
              </>
            )}

            <div><label className={ui.label}>Note</label><input className={ui.field} value={f.note} onChange={(e) => set("note", e.target.value)} /></div>
            <div className="rounded-2xl bg-amber-50 p-3">
              <label className="mb-1.5 block text-xs font-black text-amber-800">Edit-er karon (bddhotamulok) *</label>
              <input required minLength={3} className={ui.field} placeholder="jemon: patient-er naam bhul chhilo" value={f.reason} onChange={(e) => set("reason", e.target.value)} />
            </div>
            <button disabled={saving} className={ui.btn + " w-full"}>{saving ? "Saving..." : "Save changes"}</button>
          </form>
        </div>
      )}
    </div>
  );
}

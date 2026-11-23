"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ui } from "@/lib/diagnostic/ui";
import { Search, X, Plus, UserPlus, Stethoscope, Briefcase, Wallet, FlaskConical, User } from "lucide-react";

type Patient = { id: string; patientNo: string; name: string; phone: string | null; age: number | null; ageUnit: string; gender: string | null };
type Test = { id: string; code: string; name: string; price: string; isActive: boolean; department: { name: string } | null };
type Ref = { id: string; name: string; type: string; degree: string | null };

function Step({ n, icon: Icon, title, hint }: { n: number; icon: any; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-black text-slate-900">{n}. {title}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

function QuickAdd({ type, onAdded }: { type: "DOCTOR" | "AGENT"; onAdded: (r: Ref) => void }) {
  const [name, setName] = useState("");
  const [degree, setDegree] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (name.trim().length < 2) return;
    setBusy(true);
    const r = await fetch("/api/diagnostic/referrers", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ name: name.trim(), type, degree: degree.trim() || undefined }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.success) { onAdded(d.referrer); setName(""); setDegree(""); }
  };
  return (
    <div className="mt-2 flex gap-2">
      <input className={ui.field} placeholder={type === "DOCTOR" ? "Notun doctor-er naam" : "Notun agent-er naam"} value={name} onChange={(e) => setName(e.target.value)} />
      {type === "DOCTOR" && <input className={ui.field + " max-w-[140px]"} placeholder="Degree" value={degree} onChange={(e) => setDegree(e.target.value)} />}
      <button disabled={busy} onClick={add} className="rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-60">Add</button>
    </div>
  );
}

export default function Reception() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const router = useRouter();

  const [tests, setTests] = useState<Test[]>([]);
  const [refs, setRefs] = useState<Ref[]>([]);
  const [pq, setPq] = useState("");
  const [found, setFound] = useState<Patient[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [np, setNp] = useState({ name: "", phone: "", age: "", ageUnit: "Y", gender: "", address: "" });
  const [tq, setTq] = useState("");
  const [cart, setCart] = useState<Test[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [discount, setDiscount] = useState("");
  const [paid, setPaid] = useState("");
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/diagnostic/tests", { credentials: "include" }).then((r) => r.json())
      .then((d) => d.success && setTests(d.tests.filter((t: Test) => t.isActive)));
    fetch("/api/diagnostic/referrers", { credentials: "include" }).then((r) => r.json())
      .then((d) => d.success && setRefs(d.referrers));
  }, [user]);

  useEffect(() => {
    if (!user || patient || pq.trim().length < 2) { setFound([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/diagnostic/patients?q=${encodeURIComponent(pq.trim())}`, { credentials: "include" })
        .then((r) => r.json()).then((d) => d.success && setFound(d.patients));
    }, 300);
    return () => clearTimeout(t);
  }, [pq, user, patient]);

  const results = useMemo(() => {
    const q = tq.trim().toLowerCase();
    if (!q) return [];
    const inCart = new Set(cart.map((c) => c.id));
    return tests.filter((t) => !inCart.has(t.id) && (t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))).slice(0, 12);
  }, [tq, tests, cart]);

  const doctors = refs.filter((r) => r.type === "DOCTOR");
  const agents = refs.filter((r) => r.type !== "DOCTOR");

  const subtotal = cart.reduce((s, t) => s + Number(t.price), 0);
  const disc = Math.min(Number(discount || 0), subtotal);
  const total = subtotal - disc;
  const paidN = Number(paid || 0);
  const due = total - paidN;

  const submit = async () => {
    setMsg("");
    if (!patient && !(isNew && np.name.trim().length >= 2)) return setMsg("Patient select korun ba notun patient-er naam din");
    if (cart.length === 0) return setMsg("Kompokkhe ekta test select korun");
    if (Number(discount || 0) > subtotal) return setMsg("Discount total er beshi");
    if (paidN > total) return setMsg("Paid amount total er beshi");
    setSaving(true);
    const body: any = {
      testIds: cart.map((t) => t.id),
      referrerId: doctorId || null,
      agentId: agentId || null,
      discount: Number(discount || 0),
      paid: paidN, method,
      reference: reference || undefined,
      note: note || undefined,
    };
    if (patient) body.patientId = patient.id;
    else body.patient = {
      name: np.name, phone: np.phone || undefined, age: np.age ? Number(np.age) : undefined,
      ageUnit: np.ageUnit, gender: np.gender || undefined, address: np.address || undefined,
    };
    try {
      const r = await fetch("/api/diagnostic/orders", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body),
      });
      const d = await r.json();
      if (r.ok) router.push(`/diagnostic/orders/${d.order.id}/memo`);
      else setMsg(d.message || "Failed");
    } catch { setMsg("Server error"); }
    setSaving(false);
  };

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-36">
      <div>
        <h1 className={ui.h1}>New <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Order</span></h1>
        <p className={ui.sub}>Patient, test, doctor ar payment, shob ek jaygay.</p>
      </div>

      <div className={ui.card}>
        <Step n={1} icon={User} title="Patient" />
        {patient ? (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3">
            <div>
              <p className="text-sm font-bold">{patient.name}</p>
              <p className="text-xs text-slate-600">{patient.patientNo} • {patient.phone || "No phone"}{patient.age ? ` • ${patient.age}${patient.ageUnit}` : ""}</p>
            </div>
            <button onClick={() => { setPatient(null); setPq(""); }}><X size={18} /></button>
          </div>
        ) : isNew ? (
          <div className="space-y-3">
            <div><label className={ui.label}>Naam *</label><input className={ui.field} value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={ui.label}>Phone</label><input className={ui.field} value={np.phone} onChange={(e) => setNp({ ...np, phone: e.target.value })} /></div>
              <div><label className={ui.label}>Gender</label>
                <select className={ui.field} value={np.gender} onChange={(e) => setNp({ ...np, gender: e.target.value })}>
                  <option value="">--</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                </select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={ui.label}>Age</label><input type="number" min="0" className={ui.field} value={np.age} onChange={(e) => setNp({ ...np, age: e.target.value })} /></div>
              <div><label className={ui.label}>Unit</label>
                <select className={ui.field} value={np.ageUnit} onChange={(e) => setNp({ ...np, ageUnit: e.target.value })}>
                  <option value="Y">Year</option><option value="M">Month</option><option value="D">Day</option>
                </select></div>
            </div>
            <div><label className={ui.label}>Address</label><input className={ui.field} value={np.address} onChange={(e) => setNp({ ...np, address: e.target.value })} /></div>
            <button onClick={() => setIsNew(false)} className="text-xs font-bold text-blue-600">Purono patient khujun</button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input className={ui.field + " pl-10"} placeholder="Phone, naam ba Patient ID..." value={pq} onChange={(e) => setPq(e.target.value)} />
            </div>
            {found.map((p) => (
              <button key={p.id} onClick={() => { setPatient(p); setFound([]); }} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300">
                <p className="text-sm font-bold">{p.name}</p>
                <p className="text-xs text-slate-500">{p.patientNo} • {p.phone || "No phone"}</p>
              </button>
            ))}
            <button onClick={() => setIsNew(true)} className="flex items-center gap-1.5 text-sm font-bold text-blue-600"><UserPlus size={16} /> Notun patient</button>
          </div>
        )}
      </div>

      <div className={ui.card}>
        <Step n={2} icon={FlaskConical} title="Tests" />
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input className={ui.field + " pl-10"} placeholder="Test naam ba code (CBC, MRI...)" value={tq} onChange={(e) => setTq(e.target.value)} />
        </div>
        {tests.length === 0 && <p className="mt-2 text-xs text-red-500">Kono active test nai. Age Test Catalog-e price boshiye active korun.</p>}
        <div className="mt-2 space-y-2">
          {results.map((t) => (
            <button key={t.id} onClick={() => { setCart([...cart, t]); setTq(""); }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300">
              <div><p className="text-sm font-bold">{t.name}</p><p className="text-xs text-slate-500">{t.code} • {t.department?.name || ""}</p></div>
              <div className="flex items-center gap-2"><span className="text-sm font-black">৳{Number(t.price)}</span><Plus size={16} className="text-blue-600" /></div>
            </button>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50">
            {cart.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3">
                <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-slate-500">{t.code}</p></div>
                <div className="flex items-center gap-3"><span className="text-sm font-black">৳{Number(t.price)}</span>
                  <button onClick={() => setCart(cart.filter((c) => c.id !== t.id))}><X size={16} className="text-red-500" /></button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={ui.card}>
        <Step n={3} icon={Stethoscope} title="Referral" hint="Doctor-er naam memo-te print hobe" />
        <label className={ui.label}>Referred by (Doctor)</label>
        <select className={ui.field} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">Self / None</option>
          {doctors.map((r) => <option key={r.id} value={r.id}>{r.name}{r.degree ? ` (${r.degree})` : ""}</option>)}
        </select>
        <QuickAdd type="DOCTOR" onAdded={(r) => { setRefs((x) => [...x, r]); setDoctorId(r.id); }} />

        <div className="mt-5 flex items-center gap-2">
          <Briefcase size={14} className="text-slate-400" />
          <label className="text-xs font-bold text-slate-700">Agent (optional)</label>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Memo-te print hobe na</span>
        </div>
        <select className={ui.field + " mt-1.5"} value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          <option value="">No agent</option>
          {agents.map((r) => <option key={r.id} value={r.id}>{r.name} • {r.type}</option>)}
        </select>
        <QuickAdd type="AGENT" onAdded={(r) => { setRefs((x) => [...x, r]); setAgentId(r.id); }} />
      </div>

      <div className={ui.card}>
        <Step n={4} icon={Wallet} title="Payment" />
        <div className="grid grid-cols-2 gap-3">
          <div><label className={ui.label}>Discount (৳)</label><input type="number" min="0" className={ui.field} value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
          <div><label className={ui.label}>Paid (৳)</label><input type="number" min="0" className={ui.field} value={paid} onChange={(e) => setPaid(e.target.value)} /></div>
        </div>
        <button onClick={() => setPaid(String(total))} className="mt-2 text-xs font-bold text-blue-600">Full paid</button>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><label className={ui.label}>Method</label>
            <select className={ui.field} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="CASH">Cash</option><option value="BKASH">bKash</option><option value="NAGAD">Nagad</option>
              <option value="CARD">Card</option><option value="BANK">Bank</option><option value="OTHER">Other</option>
            </select></div>
          <div><label className={ui.label}>Trx ID / Ref</label><input className={ui.field} value={reference} onChange={(e) => setReference(e.target.value)} /></div>
        </div>
        <div className="mt-3"><label className={ui.label}>Note</label><input className={ui.field} value={note} onChange={(e) => setNote(e.target.value)} /></div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/85 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto max-w-2xl">
          {msg && <p className="mb-2 rounded-xl bg-red-50 p-2 text-xs font-semibold text-red-600">{msg}</p>}
          <div className="mb-2 flex justify-between text-xs text-slate-600">
            <span>Subtotal ৳{subtotal}</span><span>Disc ৳{disc}</span>
            <span className="font-black text-slate-900">Total ৳{total}</span>
            <span className={due > 0 ? "font-black text-red-600" : "font-black text-emerald-600"}>Due ৳{Math.max(due, 0)}</span>
          </div>
          <button disabled={saving} onClick={submit} className={ui.btn + " w-full py-3.5 text-base"}>
            {saving ? "Saving..." : "Save & Print Memo"}
          </button>
        </div>
      </div>
    </div>
  );
}

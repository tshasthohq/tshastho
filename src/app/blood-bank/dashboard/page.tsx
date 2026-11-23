"use client";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import {
  Droplet, Clock, MapPin, ShieldCheck, Loader2, Plus, AlertTriangle, LogOut, X,
  Calendar, User, Phone, Activity, Hash, Trash2, Building2, ClipboardList,
} from "lucide-react";
import { GROUPS, groupLabel } from "@/lib/bd-locations";
import TestsSheet from "@/components/blood-bank/TestsSheet";
import IssueSheet from "@/components/blood-bank/IssueSheet";

const LOGO = "/logo.png";

const DASH_CSS = `
@keyframes dash-up { from { opacity: 0; transform: translateY(16px) scale(0.985); } to { opacity: 1; transform: none; } }
@keyframes dash-pop { from { opacity: 0; transform: translateY(10px) scale(0.92); } to { opacity: 1; transform: none; } }
.dash-stagger > * { animation: dash-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
.dash-stagger > *:nth-child(1) { animation-delay: 0.02s; }
.dash-stagger > *:nth-child(2) { animation-delay: 0.08s; }
.dash-stagger > *:nth-child(3) { animation-delay: 0.14s; }
.dash-stagger > *:nth-child(4) { animation-delay: 0.20s; }
.dash-stagger > *:nth-child(5) { animation-delay: 0.26s; }
.dash-stagger > *:nth-child(6) { animation-delay: 0.32s; }
.dash-cards > * { animation: dash-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
.dash-cards > *:nth-child(1) { animation-delay: 0.16s; }
.dash-cards > *:nth-child(2) { animation-delay: 0.24s; }
.dash-cards > *:nth-child(3) { animation-delay: 0.32s; }
.dash-cards > *:nth-child(4) { animation-delay: 0.40s; }
.dash-cards > *:active { transform: scale(0.97); }
`;

const COMP: Record<string, string> = { WHOLE_BLOOD: "Whole blood", RBC: "RBC", PLATELETS: "Platelets", PLASMA: "Plasma" };
const COMP_TABS: [string, string][] = [["ALL", "All"], ["WHOLE_BLOOD", "Whole"], ["RBC", "RBC"], ["PLATELETS", "Platelets"], ["PLASMA", "Plasma"]];
const ST_COLOR: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700", ISSUED: "bg-blue-100 text-blue-700",
  RESERVED: "bg-amber-100 text-amber-700", EXPIRED: "bg-slate-100 text-slate-500", DISCARDED: "bg-slate-100 text-slate-500",
};
const TONE: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  slate: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
};
const TABS = ["AVAILABLE", "ISSUED", "EXPIRED", "DISCARDED"];
const fld = "w-full pl-10 pr-3 py-3 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl text-sm shadow-sm outline-none focus:ring-2 focus:ring-red-500";

function daysLeft(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }
function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }

async function call(url: string, method: string, body?: any) {
  const r = await fetch(url, {
    method, credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || d.message || "Failed");
  return d;
}

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

export default function BloodBankDashboard() {
  const [bank, setBank] = useState<any>(null);
  const [stock, setStock] = useState<any>(null);
  const [bags, setBags] = useState<any[]>([]);
  const [filter, setFilter] = useState("AVAILABLE");
  const [comp, setComp] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState("");
  const [target, setTarget] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const loadData = useCallback(async () => {
    try {
      const b = await call("/api/blood-bank/me", "GET");
      setBank(b.bank);
      if (b.bank?.user?.status === "APPROVED") {
        const [s, l] = await Promise.all([
          call("/api/blood-bank/stock", "GET"),
          call(`/api/blood-bank/bags?status=${filter}`, "GET"),
        ]);
        setStock(s);
        setBags(l.bags || []);
      }
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function submit(url: string, method: string, body: any) {
    setBusy(true); setMsg("");
    try {
      await call(url, method, body);
      setSheet(""); setForm({}); setTarget(null);
      await loadData();
    } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }

  function open(kind: string, bag?: any) { setMsg(""); setForm({}); setTarget(bag || null); setSheet(kind); }

  function goBags(s: string) {
    setFilter(s);
    setTimeout(() => document.getElementById("bags")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  async function logout() {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    window.location.href = "/login";
  }

  const sheetTitle = sheet === "add" ? "Add blood bag" : sheet === "issue" ? `Issue bag ${target?.bagNumber || ""}` : `Discard bag ${target?.bagNumber || ""}`;
  const saveLabel = sheet === "add" ? "Save bag" : sheet === "issue" ? "Confirm issue" : "Discard bag";
  function onSave() {
    if (sheet === "add")
      return submit("/api/blood-bank/bags", "POST", {
        bagNumber: form.bagNumber, bloodGroup: form.bloodGroup, component: form.component || "WHOLE_BLOOD",
        volumeMl: Number(form.volumeMl) || 450, donorName: form.donorName, donorPhone: form.donorPhone,
        collectedAt: form.collectedAt || undefined, expiresAt: form.expiresAt || undefined, testsClear: !!form.testsClear,
      });
    if (sheet === "issue" && target)
      return submit(`/api/blood-bank/bags/${target.id}`, "PATCH", {
        action: "issue", recipientName: form.recipientName, recipientPhone: form.recipientPhone,
        hospital: form.hospital, serviceCharge: Number(form.serviceCharge) || 0, note: form.note,
      });
    if (sheet === "discard" && target)
      return submit(`/api/blood-bank/bags/${target.id}`, "PATCH", { action: "discard", reason: form.reason });
  }

  const approved = bank?.user?.status === "APPROVED";
  const stockRows: any[] = stock?.stock || [];
  const inComp = (r: any) => comp === "ALL" || r.component === comp;
  const groupTotal = (g: string) => stockRows.filter((x) => x.bloodGroup === g && inComp(x)).reduce((a, x) => a + x.count, 0);
  const allTotal = (g: string) => stockRows.filter((x) => x.bloodGroup === g).reduce((a, x) => a + x.count, 0);
  const totalAvail = stockRows.filter(inComp).reduce((a, x) => a + x.count, 0);
  const inStock = GROUPS.filter((g) => allTotal(g.v) > 0).length;
  const low = GROUPS.filter((g) => allTotal(g.v) > 0 && allTotal(g.v) <= 3).length;
  const out = GROUPS.length - inStock;
  const initial = ((bank?.user?.name || bank?.name || "B") as string).trim().charAt(0).toUpperCase();

  const stats = [
    { l: "IN STOCK", v: `${inStock}/8`, icon: Droplet, tone: "emerald" },
    { l: "LOW STOCK", v: String(low), icon: AlertTriangle, tone: "amber" },
    { l: "OUT OF STOCK", v: String(out), icon: X, tone: "red" },
    { l: "EXPIRED BAGS", v: String(stock?.expired ?? 0), icon: Clock, tone: "slate" },
  ];
  const actions: { t: string; d: string; icon: any; tone: string; onClick?: () => void; href?: string }[] = [
    { t: "Add blood bag", d: "Record a new bag", icon: Plus, tone: "red", onClick: () => open("add") },
    { t: "Issue blood", d: "Give a tested bag", icon: Droplet, tone: "emerald", onClick: () => goBags("AVAILABLE") },
    { t: "Service prices", d: "Set your charges", icon: ClipboardList, tone: "amber", href: "/blood-bank/prices" },
    { t: "Reports", d: "Sales, stock and waste", icon: Activity, tone: "emerald", href: "/blood-bank/reports" },
    { t: "Expired bags", d: "Review and discard", icon: Trash2, tone: "slate", onClick: () => goBags("EXPIRED") },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-28" style={{ colorScheme: "light" }}>
      <style>{DASH_CSS}</style>

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Tshastho" className="h-8 w-auto" />
            <span className="text-[10px] font-extrabold tracking-wider px-2 py-1 rounded-md bg-red-50 text-red-700">BLOOD BANK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-700 text-white text-xs font-bold flex items-center justify-center">{initial}</div>
            <button onClick={logout} aria-label="Log out" className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 flex items-center justify-center"><LogOut size={14} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-4 space-y-5 dash-stagger">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : err ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{err}</p>
        ) : (
          <>
            <section className="relative overflow-hidden bg-[#0B1120] rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-red-900/20 text-white">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-red-500/40 to-rose-500/40 rounded-full blur-[80px] -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-orange-500/30 to-amber-500/30 rounded-full blur-[60px] -ml-10 -mb-10" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">{greeting()}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 truncate">{bank.name}</h1>
                  <p className="text-slate-400 text-xs flex items-center gap-1">
                    <MapPin size={12} />{[bank.area, bank.district].map((x: string) => (x || "").trim()).filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="w-16 h-16 shrink-0 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center">
                  <Droplet size={32} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>
              </div>
              <div className="relative flex flex-wrap gap-2 mt-4">
                <span className="text-[11px] font-bold bg-white/10 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1"><ShieldCheck size={12} />License {bank.dghsLicense}</span>
                <span className="text-[11px] font-bold bg-white/10 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1"><Clock size={12} />{bank.is24h ? "Open 24 hours" : [bank.openTime, bank.closeTime].filter(Boolean).join(" - ") || "Hours not set"}</span>
              </div>
            </section>

            {!approved && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm font-semibold">
                Your account is waiting for approval. We are reviewing your license.
              </div>
            )}

            {approved && stock && (
              <>
                <section className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-50 rounded-xl"><Droplet size={18} className="text-red-600" /></div>
                      <h2 className="text-lg font-extrabold text-slate-900">Stock Overview</h2>
                    </div>
                    <div className="flex bg-slate-100/80 p-1.5 rounded-xl overflow-x-auto">
                      {COMP_TABS.map(([v, l]) => (
                        <button key={v} onClick={() => setComp(v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-300 ${comp === v ? "bg-white text-red-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500"}`}>{l}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-red-200">
                      <p className="text-[10px] font-bold tracking-wider text-red-100">AVAILABLE BAGS</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-4xl font-black">{totalAvail}</span>
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md">Live</span>
                      </div>
                      <p className="text-[11px] text-red-100 mt-1">Screening tests clear</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] font-bold tracking-wider text-slate-400">EXPIRING IN 3 DAYS</p>
                      <p className="text-2xl font-extrabold text-slate-900 mt-1">{stock.expiringSoon}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] font-bold tracking-wider text-slate-400">AWAITING TESTS</p>
                      <p className="text-2xl font-extrabold text-slate-900 mt-1">{stock.pendingTests}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {GROUPS.map((g) => {
                      const n = groupTotal(g.v);
                      const c = n === 0 ? "bg-red-50 text-red-700 border-red-100" : n <= 3 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100";
                      return (
                        <div key={g.v} className={`rounded-2xl border p-3 text-center ${c}`}>
                          <p className="text-xl font-black leading-none">{n}</p>
                          <p className="text-xs font-bold mt-1">{g.l}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stats.map((s) => (
                    <div key={s.l} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${TONE[s.tone].bg} ${TONE[s.tone].border}`}>
                        <s.icon size={18} className={TONE[s.tone].text} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 tracking-wider">{s.l}</p>
                        <p className="text-xl font-extrabold text-slate-900">{s.v}</p>
                      </div>
                    </div>
                  ))}
                </section>

                <section>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-3">Quick Actions</h2>
                  <div className="dash-cards grid grid-cols-2 md:grid-cols-4 gap-3">
                    {actions.map((a) => {
                      const cls = "relative overflow-hidden bg-white border border-slate-200/70 rounded-2xl p-4 text-left shadow-sm hover:shadow-lg transition-all block w-full";
                      const inner = (
                        <>
                          <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-70 ${TONE[a.tone].bg}`} />
                          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center border mb-6 ${TONE[a.tone].bg} ${TONE[a.tone].border}`}>
                            <a.icon size={18} className={TONE[a.tone].text} />
                          </div>
                          <p className="relative font-bold text-slate-900 text-sm">{a.t}</p>
                          <p className="relative text-xs text-slate-500 mt-0.5">{a.d}</p>
                        </>
                      );
                      return a.href ? (
                        <Link key={a.t} href={a.href} className={cls}>{inner}</Link>
                      ) : (
                        <button key={a.t} onClick={a.onClick} className={cls}>{inner}</button>
                      );
                    })}
                  </div>
                </section>

                <section id="bags" className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 sm:p-6 scroll-mt-20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-100 rounded-xl"><ClipboardList size={18} className="text-slate-600" /></div>
                      <h2 className="text-lg font-extrabold text-slate-900">Blood Bags</h2>
                    </div>
                    <div className="flex bg-slate-100/80 p-1.5 rounded-xl overflow-x-auto">
                      {TABS.map((t) => (
                        <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all duration-300 ${filter === t ? "bg-white text-red-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500"}`}>{t.toLowerCase()}</button>
                      ))}
                    </div>
                  </div>

                  {bags.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                      <Droplet className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-sm font-semibold text-slate-600">No {filter.toLowerCase()} bags</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bags.map((b: any) => {
                        const left = daysLeft(b.expiresAt);
                        return (
                          <div key={b.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-extrabold shrink-0">{groupLabel(b.bloodGroup)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 truncate">{b.bagNumber}</p>
                                <p className="text-xs text-slate-500">{COMP[b.component]} · {b.volumeMl} ml</p>
                                <p className={`text-xs font-semibold ${left <= 3 ? "text-red-600" : "text-slate-500"}`}>{left <= 0 ? "Expired" : `${left} day${left > 1 ? "s" : ""} left`}</p>
                              </div>
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${ST_COLOR[b.status] || ""}`}>{b.status}</span>
                            </div>
                            {b.status === "AVAILABLE" && (
                              <div className="mt-3 space-y-2">
                                {!b.testsClear && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 font-semibold">Screening tests pending</p>}
                                <div className="grid grid-cols-2 gap-2">
                                  {b.testsClear ? (
                                    <button onClick={() => open("issue", b)} className="py-2.5 rounded-xl font-bold text-sm bg-red-600 text-white">Issue</button>
                                  ) : (
                                    <button onClick={() => open("tests", b)} className="py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white">Record tests</button>
                                  )}
                                  <button onClick={() => open("discard", b)} className="py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-700">Discard</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>

      {sheet === "tests" && target && (
        <TestsSheet bag={target} onClose={() => setSheet("")} onDone={() => { setSheet(""); setTarget(null); loadData(); }} />
      )}
      {sheet === "issue" && target && (
        <IssueSheet bag={target} onClose={() => setSheet("")} onDone={() => { setSheet(""); setTarget(null); loadData(); }} />
      )}
      {sheet && sheet !== "tests" && sheet !== "issue" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSheet("")}>
          <div className="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">{sheetTitle}</h2>
              <button onClick={() => setSheet("")} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><X size={16} /></button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-4">
              {sheet === "add" && (
                <>
                  <Field label="Bag number *" icon={Hash}>
                    <input className={fld} placeholder="e.g. RJ-0001" value={form.bagNumber || ""} onChange={(e) => set("bagNumber", e.target.value)} />
                  </Field>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood group *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {GROUPS.map((g) => (
                        <button key={g.v} type="button" onClick={() => set("bloodGroup", g.v)} className={`py-2.5 rounded-xl font-extrabold text-sm ${form.bloodGroup === g.v ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-slate-200 text-slate-700"}`}>{g.l}</button>
                      ))}
                    </div>
                  </div>
                  <Field label="Component" icon={Droplet}>
                    <select className={fld} value={form.component || "WHOLE_BLOOD"} onChange={(e) => set("component", e.target.value)}>
                      {Object.entries(COMP).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Volume (ml)" icon={Activity}>
                      <input type="number" className={fld} placeholder="450" value={form.volumeMl || ""} onChange={(e) => set("volumeMl", e.target.value)} />
                    </Field>
                    <Field label="Collection date" icon={Calendar}>
                      <input type="date" max={new Date().toISOString().slice(0, 10)} className={fld} value={form.collectedAt || ""} onChange={(e) => set("collectedAt", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Expiry date (optional)" icon={Calendar}>
                    <input type="date" className={fld} value={form.expiresAt || ""} onChange={(e) => set("expiresAt", e.target.value)} />
                  </Field>
                  <Field label="Donor name" icon={User}>
                    <input className={fld} placeholder="Donor name" value={form.donorName || ""} onChange={(e) => set("donorName", e.target.value)} />
                  </Field>
                  <Field label="Donor phone" icon={Phone}>
                    <input type="tel" inputMode="tel" className={fld} placeholder="01XXXXXXXXX" value={form.donorPhone || ""} onChange={(e) => set("donorPhone", e.target.value)} />
                  </Field>
                  <p className="text-xs text-slate-400">If left empty, the collection date is today and the expiry date is set automatically from the component type.</p>
                </>
              )}

              {sheet === "issue" && target && (
                <>
                  <Field label="Recipient name *" icon={User}>
                    <input className={fld} placeholder="Patient or recipient" value={form.recipientName || ""} onChange={(e) => set("recipientName", e.target.value)} />
                  </Field>
                  <Field label="Recipient phone" icon={Phone}>
                    <input type="tel" inputMode="tel" className={fld} placeholder="01XXXXXXXXX" value={form.recipientPhone || ""} onChange={(e) => set("recipientPhone", e.target.value)} />
                  </Field>
                  <Field label="Hospital" icon={Building2}>
                    <input className={fld} placeholder="Hospital name" value={form.hospital || ""} onChange={(e) => set("hospital", e.target.value)} />
                  </Field>
                  <Field label="Service charge (processing and testing only)" icon={Activity}>
                    <input type="number" className={fld} placeholder="0" value={form.serviceCharge || ""} onChange={(e) => set("serviceCharge", e.target.value)} />
                  </Field>
                  <Field label="Note" icon={ClipboardList}>
                    <input className={fld} placeholder="Optional note" value={form.note || ""} onChange={(e) => set("note", e.target.value)} />
                  </Field>
                </>
              )}

              {sheet === "discard" && target && (
                <Field label="Reason *" icon={ClipboardList}>
                  <input className={fld} placeholder="e.g. leakage, test positive" value={form.reason || ""} onChange={(e) => set("reason", e.target.value)} />
                </Field>
              )}
            </div>

            <div className="px-5 pt-3 border-t border-slate-100" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
              {msg && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mb-3">{msg}</p>}
              <button disabled={busy} onClick={onSave} className={`w-full disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-md ${sheet === "discard" ? "bg-slate-900" : "bg-red-600 shadow-red-200"}`}>
                {busy ? "Saving..." : saveLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

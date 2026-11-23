"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ui } from "@/lib/diagnostic/ui";
import { Search, X, Plus, Droplets, ShieldCheck, Pencil, Trash2 } from "lucide-react";

const TABS: [string, string][] = [
  ["PENDING", "Sample"],
  ["SAMPLE_COLLECTED", "Result entry"],
  ["RESULT_ENTERED", "Verify"],
  ["VERIFIED", "Done"],
];

type Row = { text?: boolean; tx?: string; name: string; unit: string; value: string; low: string; high: string; group?: string; ranges?: any[] | null; ref?: string | null; opts?: string[] | null; normal?: string[] | null };

const yearsOf = (p: any) => {
  const a = Number(p?.age);
  if (!Number.isFinite(a)) return null;
  return p.ageUnit === "M" ? a / 12 : p.ageUnit === "D" ? a / 365 : a;
};
const pickRange = (t: any, p: any) => {
  const y = yearsOf(p);
  const sex = p?.gender === "MALE" ? "M" : p?.gender === "FEMALE" ? "F" : null;
  if (Array.isArray(t.r)) {
    const m = t.r.find((x: any) => (!x.s || x.s === sex) && (x.a1 == null || y === null || y >= x.a1) && (x.a2 == null || y === null || y < x.a2));
    if (m) return { low: m.low ?? "", high: m.high ?? "" };
  }
  return { low: t.low ?? "", high: t.high ?? "" };
};

const num = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
import { isCritical } from "@/lib/diagnostic/critical";

const rowFlag = (r: any) => {
  if (Array.isArray(r.normal) && r.normal.length) {
    const v = String(r.value ?? "").trim();
    if (!v) return null;
    return r.normal.some((n: string) => n.toLowerCase() === v.toLowerCase()) ? "N" : "A";
  }
  return flagOf(r.value, r.low, r.high);
};
const flagOf = (value: any, low: any, high: any) => {
  const v = num(value), l = num(low), h = num(high);
  if (v === null || (l === null && h === null)) return null;
  if (l !== null && v < l) return "L";
  if (h !== null && v > h) return "H";
  return "N";
};
const flagCls = (f: string | null) =>
  f === "H" ? "bg-red-50 text-red-600" : f === "L" ? "bg-amber-50 text-amber-700" : f === "N" ? "bg-emerald-50 text-emerald-700" : "";
const ageText = (p: any) => (p?.age ? `${p.age}${p.ageUnit}` : "-");

const suggest = (rows: Row[]) => {
  const f = (re: RegExp) => {
    const r = rows.find((x) => re.test(x.name));
    return r && r.value.trim() ? rowFlag(r) : null;
  };
  const out: string[] = [];
  const hb = f(/haemoglobin|hemoglobin|\bhb\b/i), mcv = f(/\bmcv\b/i), wbc = f(/total wbc|wbc count/i), plt = f(/platelet count/i);
  if (hb === "L" && mcv === "L") out.push("Microcytic hypochromic anaemia picture. Suggest serum ferritin / iron studies and clinical correlation.");
  else if (hb === "L") out.push("Anaemia. Clinical correlation and further evaluation advised.");
  if (wbc === "H") out.push("Leukocytosis. Clinical correlation advised (infection / inflammation).");
  if (wbc === "L") out.push("Leukopenia. Clinical correlation and repeat advised.");
  if (plt === "L") out.push("Thrombocytopenia. Clinical correlation and repeat count advised.");
  if (plt === "H") out.push("Thrombocytosis. Clinical correlation advised.");
  return out;
};

export default function LabPage() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const isOwner = user?.role === "DIAGNOSTIC_OWNER";
  const [tab, setTab] = useState("PENDING");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(true);
  const [toast, setToast] = useState("");

  const [open, setOpen] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [interp, setInterp] = useState("");
  const [saveTpl, setSaveTpl] = useState(false);
  const [reason, setReason] = useState("");
  const [informedTo, setInformedTo] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [signers, setSigners] = useState<any[]>([]);
  const [techId, setTechId] = useState("");
  const [vItem, setVItem] = useState<any>(null);
  const [pathId, setPathId] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/diagnostic/lab/worklist?status=${tab}&q=${encodeURIComponent(q.trim())}`, { credentials: "include" });
      const d = await r.json();
      if (d.success) { setItems(d.items); setCounts(d.counts); }
    } catch {}
    setBusy(false);
  }, [tab, q]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [user, load, q]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/diagnostic/signers", { credentials: "include" }).then((r) => r.json()).then((d) => d.success && setSigners(d.signers)).catch(() => {});
  }, [user]);

  const defSigner = (role: string) => (signers.find((s: any) => s.role === role && s.isDefault) || signers.find((s: any) => s.role === role))?.id || "";
  const openVerify = (it: any) => { setInformedTo(""); setPathId(it.signers?.pathologist?.id || defSigner("PATHOLOGIST")); setVItem(it); };
  const confirmVerify = async () => {
    const { ok, d } = await call(vItem.id, { action: "verify", pathologistId: pathId || null, informedTo: informedTo.trim() || undefined });
    setToast(ok ? "Verified" : d.message || "Failed");
    setTimeout(() => setToast(""), 2500);
    if (ok) setVItem(null);
    load();
  };

  const call = async (id: string, body: any) => {
    const r = await fetch(`/api/diagnostic/lab/items/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body),
    });
    return { ok: r.ok, d: await r.json().catch(() => ({})) };
  };

  const quick = async (id: string, action: string) => {
    const { ok, d } = await call(id, { action });
    setToast(ok ? "Done" : d.message || "Failed");
    setTimeout(() => setToast(""), 2500);
    load();
  };

  const openResult = (it: any) => {
    let init: Row[] = [];
    if (Array.isArray(it.results) && it.results.length) {
      init = it.results.map((r: any) => { const tp = (Array.isArray(it.test?.resultTemplate) ? it.test.resultTemplate : []).find((x: any) => x && x.name === r.name); return { name: r.name, unit: r.unit || "", value: r.value ?? "", low: r.low ?? "", high: r.high ?? "", group: r.group || "", ref: r.ref ?? tp?.ref ?? null, opts: tp?.opts ?? null, normal: r.normal ?? tp?.normal ?? null, text: !!(r.text || tp?.text), tx: tp?.tx || "" }; });
    } else if (Array.isArray(it.test?.resultTemplate) && it.test.resultTemplate.length) {
      init = it.test.resultTemplate.filter((t: any) => t && t.name).map((t: any) => { const rg = pickRange(t, it.order.patient); return { name: t.name, unit: t.unit || "", value: "", low: rg.low, high: rg.high, group: t.group || "", ranges: t.r || null, ref: t.ref ?? null, opts: t.opts ?? null, normal: t.normal ?? null, text: !!t.text, tx: t.tx || "" }; });
    }
    if (!init.length) init = [{ name: it.testName, unit: "", value: "", low: "", high: "" }];
    setTechId(it.signers?.technologist?.id || defSigner("TECHNOLOGIST")); setRows(init); setInterp(it.interpretation || ""); setSaveTpl(false); setReason(""); setMsg(""); setOpen(it);
  };

  const setRow = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const saveResult = async (e: React.FormEvent) => {
    const isQual = (r: Row) => !!r.text || !!(r.opts && r.opts.length) || (Array.isArray(r.normal) && r.normal.length > 0);
    const bad = rows.filter((r) => {
      const v = r.value.trim();
      if (!v || isQual(r)) return false;
      if (r.low === "" || r.high === "" || !Number.isFinite(Number(r.low)) || !Number.isFinite(Number(r.high))) return false;
      return !/^[<>]?[ ]*-?(0|[1-9][0-9,]*)([.][0-9]+)?$/.test(v);
    });
    if (bad.length) { e.preventDefault(); window.alert("Number dite hobe (jemon 12.5 ba <5): " + bad.map((r) => r.name).join(", ")); return; }
    const oddRows = rows.filter((r) => {
      if (isQual(r) || !r.value.trim() || r.low === "" || r.high === "") return false;
      const v = Number(r.value.trim().replace(/,/g, "").replace(/^[<>][ ]*/, ""));
      const lo = Number(r.low), hi = Number(r.high);
      if (!Number.isFinite(v) || !Number.isFinite(lo) || !Number.isFinite(hi)) return false;
      return (hi > 0 && v > hi * 3) || (lo > 0 && v < lo / 3);
    });
    if (oddRows.length && !window.confirm("Ei value gulo onek beshi/kom mone hochhe: " + oddRows.map((r) => r.name + " = " + r.value).join(", ") + ". Tobuo save korben?")) { e.preventDefault(); return; }
    const blanks = rows.filter((r) => !r.value.trim()).length;
    if (blanks > 0 && rows.length > 1 && !window.confirm(blanks + " ta parameter khali ache. Tobuo save korben?")) { e.preventDefault(); return; }
    e.preventDefault();
    setSaving(true); setMsg("");
    const { ok, d } = await call(open.id, {
      action: "result",
      rows: rows.filter((r) => r.name.trim()).map((r) => ({
        name: r.name.trim(), unit: r.unit.trim() || null, value: r.value.trim(), group: r.group || null, ranges: r.ranges || null, ref: r.ref || null, text: r.text || undefined, tx: r.tx || undefined, normal: r.normal || null, opts: r.opts || null,
        low: r.low === "" ? null : r.low, high: r.high === "" ? null : r.high,
      })),
      interpretation: interp || null,
      saveTemplate: saveTpl,
      technologistId: techId || null,
      reason: reason || undefined,
    });
    setSaving(false);
    if (ok) { setOpen(null); load(); } else setMsg(d.message || "Failed");
  };

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;
  const final = open && (open.status === "VERIFIED" || open.status === "APPROVED");

  return (
    <div className="space-y-5">
      <div>
        <h1 className={ui.h1}>Lab <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Workflow</span></h1>
        <p className={ui.sub}>Sample nin, result likhun, verify korun. Proti dhap history-te save hoy.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25" : "border border-slate-200 bg-white text-slate-600"}`}>
            {l} <span className={`ml-1 rounded-full px-1.5 text-[11px] ${tab === k ? "bg-white/25" : "bg-slate-100"}`}>{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
        <input className={ui.field + " pl-10"} placeholder="Memo no, patient naam ba phone..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {toast && <p className="rounded-xl bg-slate-900 p-2.5 text-center text-xs font-bold text-white">{toast}</p>}
      {busy && <p className="text-sm text-slate-500">Loading...</p>}
      {!busy && items.length === 0 && <div className={ui.card + " text-center text-sm text-slate-500"}>Ei tab-e kichu nai.</div>}

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className={ui.card + " !p-4"}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black">{it.testName} <span className="text-xs font-semibold text-slate-400">{it.testCode}</span></p>
                <p className="text-xs text-slate-600">
                  {it.order.patient.name} • {ageText(it.order.patient)} • {it.order.patient.gender || "-"} • <a href={`/diagnostic/orders/${it.order.id}`} className="font-bold text-blue-600 underline">{it.order.orderNo}</a>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {it.test?.department?.name && <span className={ui.pill + " bg-blue-50 text-blue-700"}>{it.test.department.name}</span>}
                  {it.test?.sampleType && <span className={ui.pill + " bg-slate-100 text-slate-600"}>{it.test.sampleType}</span>}
                  {it.test?.fastingRequired && <span className={ui.pill + " bg-amber-50 text-amber-700"}>FASTING</span>}
                  {it.promisedAt && <span className={ui.pill + " bg-slate-100 text-slate-500"}>Due {new Date(it.promisedAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                {it.status === "PENDING" && (
                  <button onClick={() => quick(it.id, "collect")} className={ui.btn + " flex items-center gap-1.5 !py-2"}><Droplets size={14} /> Sample nilam</button>
                )}
                {it.status === "SAMPLE_COLLECTED" && (
                  <button onClick={() => openResult(it)} className={ui.btn + " flex items-center gap-1.5 !py-2"}><Pencil size={14} /> Result</button>
                )}
                {it.status === "RESULT_ENTERED" && (
                  <>
                    <button onClick={() => openResult(it)} className={ui.btnGhost + " flex items-center gap-1.5 !py-2"}><Pencil size={14} /> Edit</button>
                    {isOwner && <button onClick={() => openVerify(it)} className={ui.btn + " flex items-center gap-1.5 !py-2"}><ShieldCheck size={14} /> Verify</button>}
                  </>
                )}
                {(it.status === "VERIFIED" || it.status === "APPROVED") && (
                  <a href={`/diagnostic/orders/${it.order.id}/report?item=${it.id}`} className={ui.btn + " !py-2 text-center"}>Report</a>
                )}
                {(it.status === "VERIFIED" || it.status === "APPROVED") && (
                  <button onClick={() => openResult(it)} className={ui.btnGhost + " flex items-center gap-1.5 !py-2"}><Pencil size={14} /> Edit</button>
                )}
              </div>
            </div>

            {Array.isArray(it.results) && it.results.length > 0 && (
              <div className="mt-3 divide-y divide-slate-100 rounded-xl bg-slate-50 px-3">
                {it.results.map((r: any, i: number) => (
                  <p key={i} className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-semibold text-slate-700">{r.name}</span>
                    <span>
                      <b>{r.value}</b> {r.unit || ""}
                      {r.flag && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-black ${flagCls(r.flag)}`}>{r.flag}</span>}
                    </span>
                  </p>
                ))}
              </div>
            )}
            {(it.sampleCollectedBy || it.resultEnteredBy || it.verifiedBy) && (
              <p className="mt-2 text-[11px] text-slate-400">
                {it.sampleCollectedBy && <>Sample: {it.sampleCollectedBy} </>}
                {it.resultEnteredBy && <>• Result: {it.resultEnteredBy} </>}
                {it.verifiedBy && <>• Verified: {it.verifiedBy}</>}
              </p>
            )}
          </div>
        ))}
      </div>

      {vItem && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center" onClick={() => setVItem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-t-3xl bg-white p-5 text-slate-900 sm:rounded-3xl [color-scheme:light]">
            <h2 className="text-lg font-black">Verify: {vItem.testName}</h2>
            {(vItem.results || []).some((r: any) => isCritical(r)) && (
              <div className="my-2 rounded-2xl border-2 border-red-300 bg-red-50 p-3">
                <p className="text-xs font-black text-red-700">⚠ CRITICAL VALUE: {(vItem.results || []).filter((r: any) => isCritical(r)).map((r: any) => r.name + " " + r.value).join(", ")}</p>
                <label className="mb-1 mt-2 block text-xs font-black text-red-800">Ke ke jaanano hoyeche (doctor/patient-er nam) *</label>
                <input required minLength={2} className={ui.field} value={informedTo} onChange={(e) => setInformedTo(e.target.value)} placeholder="e.g. Dr. Rahman (phone, 10:35 AM)" />
              </div>
            )}
            <p className="text-xs text-slate-500">{vItem.order.patient.name} • {vItem.order.orderNo}</p>
            <div><label className={ui.label}>Verified by (Pathologist)</label>
              <select className={ui.field} value={pathId} onChange={(e) => setPathId(e.target.value)}>
                <option value="">-- select --</option>
                {signers.filter((s: any) => s.role === "PATHOLOGIST").map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.degree ? " (" + s.degree + ")" : ""}</option>)}
              </select></div>
            {signers.filter((s: any) => s.role === "PATHOLOGIST").length === 0 && (
              <p className="rounded-xl bg-amber-50 p-2 text-xs font-semibold text-amber-700">Age Signatories page-e Pathologist add korun.</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setVItem(null)} className={ui.btnGhost + " flex-1"}>Cancel</button>
              <button onClick={confirmVerify} className={ui.btn + " flex-1"}>Verify</button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center" onClick={() => setOpen(null)}>
          <form onSubmit={saveResult} onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 text-slate-900 sm:rounded-3xl [color-scheme:light]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black">{open.testName}</h2>
                <p className="text-xs text-slate-500">{open.order.patient.name} • {ageText(open.order.patient)} • {open.order.patient.gender || "-"} • {open.order.orderNo}</p>
              </div>
              <button type="button" onClick={() => setOpen(null)}><X size={20} /></button>
            </div>
            {msg && <p className="rounded-xl bg-red-50 p-2 text-sm font-semibold text-red-600">{msg}</p>}

            <div className="space-y-2">
              {rows.map((r, i) => {
                const fl = rowFlag(r);
                return (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                    {r.group && (i === 0 || rows[i - 1].group !== r.group) && <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-blue-600">{r.group}</p>}
                    <div className="flex items-center gap-2">
                      <input className={ui.field} placeholder="Parameter" value={r.name} onChange={(e) => setRow(i, "name", e.target.value)} />
                      {rows.length > 1 && <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 size={16} className="text-red-500" /></button>}
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      <div className="col-span-2">
                        {r.opts && r.opts.length ? (
                  <div className="flex items-center gap-2">
                    <select className={ui.field} value={r.value} onChange={(e) => setRow(i, "value", e.target.value)}>
                      <option value="">—</option>
                      {r.opts.map((o: string) => (<option key={o} value={o}>{o}</option>))}
                    </select>
                    {rowFlag(r) === "A" && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-black text-red-600">ABN</span>}{isCritical(r) && <span className="animate-pulse rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">CRITICAL</span>}
                  </div>
                ) : (
                  r.text ? (<textarea rows={5} className={ui.area} placeholder="Findings..." value={r.value} onChange={(e) => setRow(i, "value", e.target.value)} />) : (<input className={ui.field} placeholder="Value" value={r.value} onChange={(e) => setRow(i, "value", e.target.value)} />)
                )}
                      </div>
                      <input className={ui.field} placeholder="Unit" value={r.unit} onChange={(e) => setRow(i, "unit", e.target.value)} />
                      <div className={`flex items-center justify-center rounded-xl text-sm font-black ${flagCls(fl)}`}>{fl || "-"}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input className={ui.field} placeholder="Normal low" value={r.low} onChange={(e) => setRow(i, "low", e.target.value)} />
                      <input className={ui.field} placeholder="Normal high" value={r.high} onChange={(e) => setRow(i, "high", e.target.value)} />
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={() => setRows([...rows, { name: "", unit: "", value: "", low: "", high: "" }])}
                className="flex items-center gap-1.5 text-sm font-bold text-blue-600"><Plus size={15} /> Parameter jog korun</button>
            </div>

            <div><label className={ui.label}>Prepared by (Technologist)</label>
              <select className={ui.field} value={techId} onChange={(e) => setTechId(e.target.value)}>
                <option value="">-- select --</option>
                {signers.filter((s: any) => s.role === "TECHNOLOGIST").map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.designation ? " — " + s.designation : ""}</option>)}
              </select></div>
            {rows.some((r) => r.text) && (<button type="button" onClick={() => setRows((rs) => rs.map((r) => (r.text && !r.value.trim() ? { ...r, value: r.tx || "" } : r)))} className={ui.btnGhost + " w-full"}>✓ Fill all normal (khali section-e)</button>)}
            <div><label className={ui.label}>{rows.some((r) => r.text) ? "Impression" : "Interpretation / Comment"}</label>
              <textarea rows={2} className={ui.area} value={interp} onChange={(e) => setInterp(e.target.value)} /></div>
            {suggest(rows).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500">Suggested comment (pathologist edit korte parben):</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggest(rows).map((t) => (
                    <button type="button" key={t} onClick={() => setInterp((v) => (v ? v + " " : "") + t)}
                      className="rounded-full bg-blue-50 px-3 py-1 text-left text-[11px] font-bold text-blue-700">+ {t}</button>
                  ))}
                </div>
              </div>
            )}

            {isOwner && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={saveTpl} onChange={(e) => setSaveTpl(e.target.checked)} />
                Ei parameter + range ei test-er template hishabe save korun (porer bar auto-fill hobe)
              </label>
            )}

            {final && (
              <div className="rounded-2xl bg-amber-50 p-3">
                <label className="mb-1.5 block text-xs font-black text-amber-800">Verify howar por edit, karon (bddhotamulok) *</label>
                <input required minLength={3} className={ui.field} value={reason} onChange={(e) => setReason(e.target.value)} />
                <p className="mt-1.5 text-[11px] text-amber-700">Save korle abar verify korte hobe.</p>
              </div>
            )}
            <button disabled={saving} className={ui.btn + " w-full"}>{saving ? "Saving..." : "Save result"}</button>
          </form>
        </div>
      )}
    </div>
  );
}

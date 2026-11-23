"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ui } from "@/lib/diagnostic/ui";

const dt = (s: any) =>
  s ? new Date(s).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
const sd = (s: any) =>
  s ? new Date(s).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "2-digit" }) : "";

const range = (low: any, high: any) => {
  const l = low === null || low === undefined || low === "" ? null : low;
  const h = high === null || high === undefined || high === "" ? null : high;
  if (l !== null && h !== null) return Number(l) === 0 && Number(h) > 0 ? `≤ ${h}` : `${l} - ${h}`;
  if (l !== null) return `≥ ${l}`;
  if (h !== null) return `≤ ${h}`;
  return "";
};
const numv = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
const KNOWN = ["MBBS", "BCS", "MD", "MS", "FCPS", "MCPS", "DCP", "FRCP", "MRCP", "FRCS", "BDS", "DMU"];
const fmtDegree = (s?: string | null) => {
  if (!s) return s;
  if (s.includes("(")) return s.replace(/[,\s]+$/, "");
  return s.split(/[,\s]+/).filter(Boolean).map((t) => (KNOWN.includes(t.toUpperCase()) ? t.toUpperCase() : t)).join(", ");
};
const tat = (it: any) => {
  if (!it.sampleCollectedAt || !it.verifiedAt) return null;
  const h = (new Date(it.verifiedAt).getTime() - new Date(it.sampleCollectedAt).getTime()) / 36e5;
  return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : `${h.toFixed(1)} h`;
};

function RangeBar({ r }: { r: any }) {
  const v = numv(r.value), lo = numv(r.low), hi = numv(r.high);
  if (v === null || lo === null || hi === null || hi <= lo) return null;
  const span = hi - lo;
  const min = Math.min(v, lo - span * 0.6);
  const max = Math.max(v, hi + span * 0.6);
  const pct = (x: number) => `${((x - min) / (max - min)) * 100}%`;
  const abn = r.flag === "H" || r.flag === "L" || r.flag === "A";
  return (
    <div className="relative mx-auto h-2 w-24 rounded-full bg-slate-200">
      <div className="absolute top-0 h-2 rounded-full bg-emerald-300" style={{ left: pct(lo), width: `${(span / (max - min)) * 100}%` }} />
      <div className={`absolute -top-[3px] h-3.5 w-1.5 rounded-sm ${abn ? "bg-red-600" : "bg-emerald-700"}`} style={{ left: pct(v), transform: "translateX(-50%)" }} />
    </div>
  );
}

function Signer({ title, s, fallback, big }: { title: string; s: any; fallback?: string | null; big?: boolean }) {
  if (!s && !fallback) return <div className="w-52" />;
  return (
    <div className={big ? "w-56 text-center" : "w-48 text-center"}>
      <div className="flex h-14 items-end justify-center">
        {s?.signatureUrl && <img src={s.signatureUrl} alt="signature" className="max-h-14 max-w-full object-contain" />}
      </div>
      <div className="border-t border-slate-700 pt-1">
        <p className={big ? "text-sm font-black" : "text-xs font-black"}>{s?.name || fallback}</p>
        {s?.degree && <p className="text-[10px] text-slate-700">{fmtDegree(s.degree)}</p>}
        {s?.designation && <p className="text-[10px] text-slate-700">{s.designation}</p>}
        {s?.regNo && <p className="text-[10px] text-slate-500">Reg. No: {s.regNo}</p>}
        <p className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-blue-700">{title}</p>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const { id } = useParams<{ id: string }>();
  const [o, setO] = useState<any>(null);
  const [center, setCenter] = useState<any>(null);
  const [previous, setPrevious] = useState<Record<string, any>>({});
  const [methods, setMethods] = useState<Record<string, string>>({});
  const [verifyTokens, setVerifyTokens] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [only, setOnly] = useState<string | null>(null);

  useEffect(() => { setOnly(new URLSearchParams(window.location.search).get("item")); }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/diagnostic/orders/${id}?memo=1`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setO(d.order); setCenter(d.center); setPrevious(d.previous || {}); setMethods(d.methods || {}); setVerifyTokens(d.verifyTokens || {}); } else setErr(d.message || "Failed"); })
      .catch(() => setErr("Server error"));
  }, [user, id]);

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;
  if (err) return <p className="p-6 text-red-600">{err}</p>;
  if (!o) return <p className="p-6 text-slate-500">Loading...</p>;

  const items = o.items.filter((i: any) => (i.status === "VERIFIED" || i.status === "APPROVED") && (!only || i.id === only));
  const p = o.patient;
  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/diagnostic/orders/${id}/report` : "";
  const printedAt = dt(new Date().toISOString());

  return (
    <div>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          .diag { background: none !important; min-height: 0 !important; }
          .diag main { padding: 0 !important; max-width: none !important; }
          html, body { height: auto !important; }
          .sheet { min-height: 0 !important; box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
          .sheet tr { page-break-inside: avoid; }
          .sheet { zoom: var(--pz, 1); width: calc(190mm / var(--pz, 1)) !important; max-width: none !important; }
          .sheet .pad { padding: 14px 18px !important; }
          .sheet .rrow td { padding-top: 2px !important; padding-bottom: 2px !important; }
          .sheet td.gh { padding-top: 5px !important; padding-bottom: 1px !important; }
          .sheet .sigrow { margin-top: 14px !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="print:hidden mb-4 flex flex-wrap gap-2">
        <button onClick={() => window.print()} className={ui.btn}>Print report</button>
        <Link href={`/diagnostic/orders/${id}`} className={ui.btnGhost}>← Order</Link>
        <Link href="/diagnostic/lab" className={ui.btnGhost}>Lab</Link>
        {items.map((it: any) => verifyTokens[it.id] ? (
          <a key={it.id} href={"/verify/" + verifyTokens[it.id]} target="_blank" rel="noreferrer" className={ui.btnGhost}>Verify page</a>
        ) : null)}
      </div>

      {items.length === 0 && (
        <div className={ui.card + " text-center text-sm text-slate-500"}>Kono verified result nai. Age Lab theke result enter kore verify korun.</div>
      )}

      {items.map((it: any, idx: number) => {
        const results = (Array.isArray(it.results) ? it.results : []).filter((r: any) => String(r.value ?? "").trim() !== "");
        const sig = it.signers || {};
        const abnCount = results.filter((r: any) => r.flag === "H" || r.flag === "L" || r.flag === "A").length;
        const prev = previous[it.id] || null;
        const prevOf = (name: string) => (prev && Array.isArray(prev.results) ? prev.results.find((x: any) => x.name === name) : null);
        const hasPrev = results.some((r: any) => prevOf(r.name));
        const sampleId = `${o.orderNo}-${it.testCode}`;
        const ver = Math.max(1, it.reportVersion || 0);
        const dochash = it.reportHash ? String(it.reportHash).slice(0, 8).toUpperCase().replace(/(.{4})/, "$1-") : "";
        const nGroups = new Set(results.map((r: any) => r.group || "")).size;
        const estMm = 165 + results.length * 5.4 + nGroups * 5 + (it.interpretation ? 16 : 0) + (sig.critical ? 8 : 0) + results.reduce((a: number, r: any) => a + (r.text ? Math.ceil(String(r.value).length / 95) * 4.2 : 0), 0) + (methods[it.testId] ? 5 : 0) + (center?.footerAddress ? 8 : 0);
        const pz = Math.max(0.6, Math.min(1, 240 / estMm));
        let prevGroup: string | null = null;
        return (
          <div
            key={it.id}
            className="sheet relative mx-auto mb-6 w-full max-w-[210mm] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
            style={{ pageBreakAfter: idx < items.length - 1 ? "always" : "auto", ["--pz" as any]: pz } as any}
          >
            <div className="h-1.5 bg-gradient-to-r from-blue-700 via-blue-500 to-teal-500" />
            <div className="p-8 pad">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pb-3">
                <div className="flex justify-start">
                  {center?.logo ? (
                    <img src={center.logo} alt="logo" className="h-20 w-20 object-contain" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-teal-500 text-2xl font-black text-white">
                      {(center?.name || "D").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-black tracking-tight text-blue-900">{center?.name}</h1>
                  {center?.tagline && <p className="text-[11px] font-semibold italic text-teal-700">{center.tagline}</p>}
                  <p className="text-[11px] text-slate-600">{[center?.address, center?.city].filter(Boolean).join(", ")}</p>
                </div>
                <div className="text-right text-[10px] leading-[15px] text-slate-600">
                  {center?.phone && <p>Phone: {center.phone}</p>}
                  {center?.helpline && <p>Helpline: {center.helpline}</p>}
                  {center?.email && <p>{center.email}</p>}
                  {center?.website && <p>{center.website}</p>}
                  {center?.dghsRegNo && <p className="font-bold text-slate-800">DGHS Reg: {center.dghsRegNo}</p>}
                </div>
              </div>
              <div className="h-[3px] rounded bg-gradient-to-r from-blue-700 via-blue-500 to-teal-500" />
              <div className="mt-[2px] h-px bg-slate-300" />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-700">Laboratory Report</span>
                <span className="text-[10px] text-slate-500">
                  Report ID: {sampleId} • <b className={ver > 1 ? "text-amber-600" : "text-emerald-700"}>{ver > 1 ? "AMENDED (v" + ver + ")" : "FINAL"}</b>
                  {dochash ? " • Doc: " + dochash : ""}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-[1.2fr_1.2fr_auto] gap-5 rounded-xl bg-slate-50 p-4">
                <div className="space-y-0.5 text-[11px]">
                  <p className="text-base font-black leading-5">{p.name}</p>
                  <p><b>Age / Sex:</b> {p.age ? `${p.age}${p.ageUnit}` : "-"} / {p.gender || "-"}</p>
                  <p><b>Patient ID:</b> {p.patientNo}</p>
                  <p><b>Phone:</b> {p.phone || "-"}</p>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <p><b>Memo No:</b> {o.orderNo}</p>
                  <p><b>Ref. by:</b> {o.referrer ? `${o.referrer.name}${o.referrer.degree ? ` (${fmtDegree(o.referrer.degree)})` : ""}` : "Self"}</p>
                  <p><b>Sample:</b> {it.test?.sampleType || "-"}</p>
                  <p><b>Order date:</b> {dt(o.createdAt)}</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <Barcode value={sampleId} height={34} width={1.1} fontSize={9} margin={0} />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="rounded-lg border border-slate-200 p-1.5"><p className="font-black uppercase tracking-wide text-slate-400">Collected</p><p className="font-semibold">{dt(it.sampleCollectedAt)}</p></div>
                <div className="rounded-lg border border-slate-200 p-1.5"><p className="font-black uppercase tracking-wide text-slate-400">Reported {tat(it) ? `• TAT ${tat(it)}` : ""}</p><p className="font-semibold">{dt(it.verifiedAt)}</p></div>
                <div className="rounded-lg border border-slate-200 p-1.5"><p className="font-black uppercase tracking-wide text-slate-400">Printed</p><p className="font-semibold">{printedAt}</p></div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <h3 className="border-l-4 border-blue-600 pl-3 text-base font-black uppercase tracking-wide">{it.testName}</h3>
                {abnCount > 0 ? (
                  <span className="rounded-full bg-red-50 px-3 py-0.5 text-[10px] font-black text-red-600">{abnCount} abnormal finding{abnCount > 1 ? "s" : ""}</span>
                ) : results.length > 0 ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-[10px] font-black text-emerald-700">All values within reference range</span>
                ) : null}
              </div>

              {methods[it.testId] && <p className="mt-1 text-[10.5px] italic text-slate-500">Method: {methods[it.testId]}</p>}
              <table className="mt-2 w-full text-[12.5px]">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-left text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="py-2">Test</th>
                    <th className="py-2">Result</th>
                    <th className="py-2">Flag</th>
                    <th className="py-2">Unit</th>
                    <th className="py-2">Reference</th>
                    <th className="py-2 text-center">Range</th>
                    {hasPrev && <th className="py-2">Previous</th>}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r: any, i: number) => {
                    const head = r.group && r.group !== prevGroup;
                    prevGroup = r.group || prevGroup;
                    const abn = r.flag === "H" || r.flag === "L" || r.flag === "A";
                    const pv = prevOf(r.name);
                if (r.text) return (
                  <Fragment key={i}>
                    <tr className="rrow">
                      <td colSpan={hasPrev ? 7 : 6} className="pb-2 pt-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">{r.name}</p>
                        <p className="whitespace-pre-wrap text-[12px] leading-snug text-slate-800">{r.value}</p>
                      </td>
                    </tr>
                  </Fragment>
                );
                    return (
                      <Fragment key={i}>
                        {head && (
                          <tr>
                            <td colSpan={hasPrev ? 7 : 6} className="gh pb-1 pt-3 text-[10px] font-black uppercase tracking-wider text-blue-700">{r.group}</td>
                          </tr>
                        )}
                        <tr className={`rrow border-b border-slate-100 ${abn ? "bg-red-50/70" : ""}`}>
                          <td className="py-1.5 pr-2">{r.name}</td>
                          <td className={`py-1.5 ${abn ? "text-sm font-black text-red-600" : "font-semibold"}`}>{r.value}</td>
                          <td className="py-1.5">
                            {abn ? (
                              <span className="inline-block rounded border border-red-600 px-1.5 text-[10px] font-black text-red-600">{r.flag === "H" ? "H ↑" : r.flag === "L" ? "L ↓" : "ABN"}</span>
                            ) : r.flag === "N" ? (
                              <span className="text-[10px] text-slate-400">Normal</span>
                            ) : null}
                          </td>
                          <td className="py-1.5 text-slate-600">{r.unit || ""}</td>
                          <td className="py-1.5 text-slate-600">{range(r.low, r.high) || r.ref || ""}</td>
                          <td className="py-1.5"><RangeBar r={r} /></td>
                          {hasPrev && (
                            <td className="py-1.5 text-[11px] text-slate-500">
                              {pv ? <>{pv.value} <span className="text-[9px]">({sd(prev.date)})</span></> : "—"}
                            </td>
                          )}
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>

              {sig.critical?.informedTo && (
                <div className="mt-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
                  ⚠ Critical value ({(sig.critical.params || []).join(", ")}) informed to {sig.critical.informedTo} at {new Date(sig.critical.informedAt).toLocaleString("en-GB")}
                </div>
              )}
              {it.interpretation && (
                <div className="mt-4 rounded-xl border-l-4 border-blue-500 bg-blue-50/60 p-3 text-[11.5px] leading-5">
                  <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">Interpretation / Comment</p>
                  <p className="mt-0.5">{it.interpretation}</p>
                </div>
              )}

              <ul className="mt-4 space-y-0.5 text-[9.5px] text-slate-500">
                <li>H = High, L = Low. Reference ranges are specific to the age and sex of the patient.</li>
                <li>Results relate only to the sample tested. Clinical correlation recommended.</li>
              </ul>

              <div className="sigrow mt-10 flex items-end justify-between">
                <Signer title="Prepared by" s={sig.technologist} fallback={sig.technologist ? null : it.resultEnteredBy} />
                <div className="text-center">
                  <QRCodeSVG value={(verifyTokens[it.id] && typeof window !== "undefined" ? window.location.origin + "/verify/" + verifyTokens[it.id] : verifyUrl) || o.orderNo} size={60} />
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-blue-700">Scan to verify</p>
                  <p className="text-[9px] text-slate-500">{sampleId}</p>
                </div>
                <Signer title="Verified by" s={sig.pathologist} fallback={sig.pathologist ? null : it.verifiedBy} big />
              </div>

              <div className="mt-6 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                <div className="h-px flex-1 bg-slate-200" /> End of report <div className="h-px flex-1 bg-slate-200" />
              </div>
              {center?.footerAddress && (
                <div className="mt-3 rounded-lg bg-gradient-to-r from-blue-700 to-teal-600 px-3 py-1.5 text-center text-[11px] font-semibold text-white">{center.footerAddress}</div>
              )}
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-500">
                <span>Powered by</span>
                <img src="/logo.png" alt="Tshastho" className="h-6 object-contain" />
                <span>• Connected Healthcare. Trusted Care.</span>
              </div>
              <p className="mt-1 text-center text-[9px] text-slate-400">
                {center?.helpline || center?.phone ? `Queries: ${center?.helpline || center?.phone} • ` : ""}Digitally verified on {dt(it.verifiedAt)}. Computer generated report.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

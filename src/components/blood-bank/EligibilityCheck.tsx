"use client";
import { useState } from "react";
import Link from "next/link";
import { DONATION_GAP_DAYS, DONOR_LIMITS } from "@/lib/blood-rules";
import { ShieldCheck, X, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

// Confirm these with your medical advisor before launch.
const MIN_DAYS = DONATION_GAP_DAYS;
const { minAge: MIN_AGE, maxAge: MAX_AGE, minKg: MIN_KG } = DONOR_LIMITS;
const TEMP: [string, string][] = [
  ["fever", "Fever, cold or infection right now"],
  ["meds", "Taking antibiotics"],
  ["vaccine", "Vaccinated in the last 4 weeks"],
  ["tattoo", "Tattoo or piercing in the last 6 months"],
  ["surgery", "Major surgery in the last 6 months"],
  ["travel", "Visited a malaria or dengue area in the last 3 months"],
];
const FEMALE_ONLY: [string, string][] = [["pregnant", "Pregnant, or gave birth / breastfeeding in the last 6 months"]];
const PERM: [string, string][] = [
  ["hiv", "Ever tested positive for HIV, hepatitis B or C"],
  ["drugs", "Ever injected recreational drugs"],
  ["chronic", "Serious heart, kidney, cancer or bleeding disease"],
];

export default function EligibilityCheck() {
  const [open, setOpen] = useState(false);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [kg, setKg] = useState("");
  const [last, setLast] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const toggle = (k: string) => setFlags((f) => ({ ...f, [k]: !f[k] }));
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  function result() {
    const a = Number(age), w = Number(kg);
    if (!a || !w) return { tone: "warn", title: "Enter your age and weight", body: "We need both to check." };
    if (a < MIN_AGE || a > MAX_AGE) return { tone: "no", title: "Not eligible by age", body: `Donors must be ${MIN_AGE}–${MAX_AGE} years old.` };
    if (w < MIN_KG) return { tone: "no", title: "Not eligible by weight", body: `You need to weigh at least ${MIN_KG} kg.` };
    if (PERM.some(([k]) => flags[k])) return { tone: "no", title: "You may not be able to donate", body: "Please talk to a doctor. The blood bank makes the final decision." };
    const temp = [...TEMP, ...(sex === "female" ? FEMALE_ONLY : [])];
    if (temp.some(([k]) => flags[k])) return { tone: "warn", title: "Not today", body: "A temporary condition applies. Try again once it has passed, or ask the blood bank how long to wait." };
    if (last) {
      const next = new Date(new Date(last).getTime() + MIN_DAYS[sex] * 86400000);
      if (next.getTime() > Date.now()) return { tone: "warn", title: `You can donate again from ${fmt(next)}`, body: "Your body needs time to recover between donations." };
    }
    return { tone: "ok", title: "You may be able to donate", body: "The blood bank will check haemoglobin, blood pressure, pulse and temperature before you give blood." };
  }
  const r = done ? result() : null;
  const tones: Record<string, string> = { ok: "bg-emerald-50 border-emerald-200 text-emerald-800", warn: "bg-amber-50 border-amber-200 text-amber-800", no: "bg-red-50 border-red-200 text-red-800" };
  const Icon = r?.tone === "ok" ? CheckCircle2 : r?.tone === "warn" ? AlertTriangle : XCircle;

  return (
    <>
      <button onClick={() => { setOpen(true); setDone(false); }} className="mt-4 w-full flex items-center gap-3 bg-white border border-slate-100 rounded-2xl shadow-sm p-4 text-left hover:border-red-200 transition">
        <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ShieldCheck size={20} /></span>
        <span className="flex-1">
          <span className="block font-bold text-sm text-slate-900">Can I donate blood?</span>
          <span className="block text-xs text-slate-500 mt-0.5">30-second eligibility check</span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-t-3xl max-h-[88vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-lg text-slate-900">Donor eligibility check</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(["male", "female"] as const).map((s) => (
                <button key={s} onClick={() => setSex(s)} className={`py-2.5 rounded-full text-sm font-bold border ${sex === s ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-700 border-slate-200"}`}>{s === "male" ? "Male" : "Female"}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="numeric" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-red-400" />
              <input inputMode="numeric" placeholder="Weight (kg)" value={kg} onChange={(e) => setKg(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <label className="block text-xs font-bold text-slate-500 mt-3 mb-1">Last donation (optional)</label>
            <input type="date" value={last} onChange={(e) => setLast(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-red-400" />
            <p className="text-xs font-bold text-slate-500 mt-4 mb-2">Tick anything that applies to you</p>
            <div className="space-y-2">
              {[...TEMP, ...(sex === "female" ? FEMALE_ONLY : []), ...PERM].map(([k, label]) => (
                <label key={k} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 rounded-xl p-3">
                  <input type="checkbox" checked={!!flags[k]} onChange={() => toggle(k)} className="mt-0.5 accent-red-600" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <button onClick={() => setDone(true)} className="mt-4 w-full bg-red-600 text-white font-bold py-3.5 rounded-full shadow-lg shadow-red-200 active:scale-95 transition">Check now</button>
            {r && (
              <div className={`mt-4 rounded-2xl border p-4 ${tones[r.tone]}`}>
                <p className="flex items-center gap-2 font-bold"><Icon size={18} />{r.title}</p>
                <p className="text-sm mt-1">{r.body}</p>
                {r.tone === "ok" && <Link href="/blood-bank/donate" className="inline-block mt-3 bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-full">Become a donor</Link>}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-4">This is a guide, not medical advice. Final eligibility is decided by the blood bank.</p>
          </div>
        </div>
      )}
    </>
  );
}

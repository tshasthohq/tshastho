"use client";
import BackHeader from "@/components/BackHeader";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartHandshake, Loader2 } from "lucide-react";
import { GROUPS, DISTRICTS, divisionOf } from "@/lib/bd-locations";
import { useAuth } from "@/hooks/useAuth";
import EligibilityCheck from "@/components/blood-bank/EligibilityCheck";
import { DONATION_GAP_DAYS, DONOR_LIMITS } from "@/lib/blood-rules";

const inp = "w-full px-3 py-3 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400";

export default function DonatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ bloodGroup: "", gender: "", district: "", upazila: "", area: "", lastDonationDate: "", showPhone: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    setErr("");
    if (!f.bloodGroup || !f.gender || !f.district) { setErr("Blood group, gender and district are required"); return; }
    if (!ok) { setErr("Please confirm you meet the donor requirements"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/blood/donors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, eligibleDeclared: ok, division: divisionOf(f.district), lastDonationDate: f.lastDonationDate || null }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "Failed"); return; }
      router.push("/blood-bank");
    } catch { setErr("Network error"); } finally { setBusy(false); }
  }

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-sm w-full">
        <HeartHandshake className="mx-auto text-red-600 mb-3" size={40} />
        <h1 className="text-xl font-extrabold">Become a donor</h1>
        <p className="text-sm text-slate-500 mt-1 mb-5">Please log in to register as a blood donor.</p>
        <Link href="/login" className="block bg-red-600 text-white font-bold py-3 rounded-xl">Log in</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      <BackHeader title="Become a Donor" className="-mx-4 -mt-4 mb-4" />
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Become a Donor</h1>
        <p className="text-sm text-slate-500 mb-5">Your phone stays private until you accept a request.</p>

        <div className="-mt-4 mb-4"><EligibilityCheck /></div>

        <label className="text-xs font-bold text-slate-500 uppercase">Blood group</label>
        <div className="grid grid-cols-4 gap-2 mt-1 mb-4">
          {GROUPS.map((g) => (
            <button key={g.v} type="button" onClick={() => set("bloodGroup", g.v)}
              className={`py-2.5 rounded-full font-bold ${f.bloodGroup === g.v ? "bg-red-600 text-white" : "bg-slate-50 border border-slate-200 text-slate-700"}`}>{g.l}</button>
          ))}
        </div>

        <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
        <div className="grid grid-cols-2 gap-2 mt-1 mb-4">
          {[["MALE", "Male"], ["FEMALE", "Female"]].map(([v, l]) => (
            <button key={v} type="button" onClick={() => set("gender", v)}
              className={`py-2.5 rounded-full font-bold ${f.gender === v ? "bg-red-600 text-white" : "bg-slate-50 border border-slate-200 text-slate-700"}`}>{l}</button>
          ))}
        </div>

        <div className="space-y-3">
          <select className={inp} value={f.district} onChange={(e) => set("district", e.target.value)}>
            <option value="">Select district *</option>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <input className={inp} placeholder="Upazila / Thana" value={f.upazila} onChange={(e) => set("upazila", e.target.value)} />
          <input className={inp} placeholder="Area (optional)" value={f.area} onChange={(e) => set("area", e.target.value)} />
          <div>
            <label className="text-xs font-bold text-slate-500">Last donation date (leave empty if never)</label>
            <input type="date" max={new Date().toISOString().slice(0, 10)} className={inp} value={f.lastDonationDate} onChange={(e) => set("lastDonationDate", e.target.value)} />
            {(() => {
              if (!f.lastDonationDate || !f.gender) return null;
              const days = f.gender === "FEMALE" ? DONATION_GAP_DAYS.female : DONATION_GAP_DAYS.male;
              const next = new Date(new Date(f.lastDonationDate).getTime() + days * 86400000);
              return next.getTime() > Date.now() ? (<p className="text-xs text-amber-600 mt-1">You can donate again from {next.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.</p>) : null;
            })()}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={f.showPhone} onChange={(e) => set("showPhone", e.target.checked)} className="w-4 h-4 accent-red-600" />
            Allow requesters to see my phone after I accept
          </label>
        </div>

        <label className="flex items-start gap-2 mt-4 text-xs text-slate-600">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 accent-red-600" />
          <span>{`I confirm I am ${DONOR_LIMITS.minAge}–${DONOR_LIMITS.maxAge} years old, weigh at least ${DONOR_LIMITS.minKg} kg and am in good health. I understand the blood bank will check my haemoglobin and blood pressure before every donation.`}</span>
        </label>
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        <button onClick={submit} disabled={busy} className="mt-5 w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-200 disabled:opacity-60 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Register as Donor
        </button>
      </div>
    </div>
  );
}

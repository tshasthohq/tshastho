"use client";
import BackHeader from "@/components/BackHeader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Siren, Loader2 } from "lucide-react";
import { GROUPS, DISTRICTS, divisionOf } from "@/lib/bd-locations";
import { useAuth } from "@/hooks/useAuth";

const inp = "w-full px-3 py-3 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400";

export default function RequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ bloodGroup: "", units: 1, urgency: "TODAY", hospital: "", district: "", upazila: "", patientName: "", contactPhone: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const g = sp.get("group");
    const d = sp.get("district");
    if (g && GROUPS.some((x) => x.v === g)) set("bloodGroup", g);
    if (d && DISTRICTS.includes(d)) set("district", d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setErr("");
    if (!f.bloodGroup || !f.hospital || !f.district || !f.contactPhone) { setErr("Blood group, hospital, district and phone are required"); return; }
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(f.contactPhone.replace(/[\s-]/g, ""))) { setErr("Enter a valid Bangladeshi phone number (01XXXXXXXXX)"); return; }
    if (!ok) { setErr("Please confirm the request is genuine"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/blood/requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, confirmGenuine: ok, division: divisionOf(f.district) }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "Failed"); return; }
      router.push("/blood-bank");
    } catch { setErr("Network error"); } finally { setBusy(false); }
  }

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-sm w-full">
        <Siren className="mx-auto text-red-600 mb-3" size={40} />
        <h1 className="text-xl font-extrabold">Request blood</h1>
        <p className="text-sm text-slate-500 mt-1 mb-5">Please log in to post a blood request.</p>
        <Link href="/login" className="block bg-red-600 text-white font-bold py-3 rounded-xl">Log in</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      <BackHeader title="Request Blood" className="-mx-4 -mt-4 mb-4" />
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Request Blood</h1>
        <p className="text-sm text-slate-500 mb-5">Your phone is shown only to donors who accept.</p>

        <label className="text-xs font-bold text-slate-500 uppercase">Blood group needed</label>
        <div className="grid grid-cols-4 gap-2 mt-1 mb-4">
          {GROUPS.map((g) => (
            <button key={g.v} type="button" onClick={() => set("bloodGroup", g.v)}
              className={`py-2.5 rounded-full font-bold ${f.bloodGroup === g.v ? "bg-red-600 text-white" : "bg-slate-50 border border-slate-200 text-slate-700"}`}>{g.l}</button>
          ))}
        </div>

        <label className="text-xs font-bold text-slate-500 uppercase">Urgency</label>
        <div className="grid grid-cols-3 gap-2 mt-1 mb-4">
          {[["CRITICAL", "Critical"], ["TODAY", "Today"], ["SCHEDULED", "Scheduled"]].map(([v, l]) => (
            <button key={v} type="button" onClick={() => set("urgency", v)}
              className={`py-2.5 rounded-full text-sm font-bold ${f.urgency === v ? "bg-slate-900 text-white" : "bg-slate-50 border border-slate-200 text-slate-700"}`}>{l}</button>
          ))}
        </div>

        <div className="space-y-3">
          <input className={inp} placeholder="Hospital name *" value={f.hospital} onChange={(e) => set("hospital", e.target.value)} />
          <select className={inp} value={f.district} onChange={(e) => set("district", e.target.value)}>
            <option value="">Select district *</option>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <input className={inp} placeholder="Upazila / Thana" value={f.upazila} onChange={(e) => set("upazila", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" min={1} max={10} className={inp} value={f.units} onChange={(e) => set("units", Number(e.target.value))} placeholder="Bags" />
            <input className={inp} placeholder="Patient name" value={f.patientName} onChange={(e) => set("patientName", e.target.value)} />
          </div>
          <input type="tel" inputMode="tel" className={inp} placeholder="Contact phone (01XXXXXXXXX) *" value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          <textarea className={inp} rows={3} maxLength={500} placeholder="Note (ward, bed, reason...)" value={f.note} onChange={(e) => set("note", e.target.value)} />
        </div>

        <label className="flex items-start gap-2 mt-4 text-xs text-slate-600">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 accent-red-600" />
          <span>I confirm this request is genuine and the phone number belongs to me or the patient's family. False requests may lead to account suspension.</span>
        </label>
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        <button onClick={submit} disabled={busy} className="mt-5 w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-200 disabled:opacity-60 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Post Request
        </button>
      </div>
    </div>
  );
}

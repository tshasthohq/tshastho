"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Droplet, User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, FileText, MapPin, Building2, Home, CheckCircle2, Loader2, Upload } from "lucide-react";
import { DISTRICTS, divisionOf } from "@/lib/bd-locations";

const input = "w-full pl-10 pr-3 py-3 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl text-sm shadow-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500";
const STEPS = ["Owner", "Blood bank", "Location"];

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

export default function RegisterBloodBankPage() {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    name: "", email: "", phone: "", password: "",
    bankName: "", dghsLicense: "", tradeLicense: "", is24h: false,
    district: "", area: "", address: "",
  });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function uploadLicense(file?: File) {
    if (!file) return;
    setErr("");
    if (file.size > 5 * 1024 * 1024) { setErr("File is too large (max 5 MB)"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload?private=1", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) { setErr(d.error || "Upload failed. Please try again."); return; }
      setLicenseUrl(d.url);
    } catch { setErr("Upload failed. Please check your connection."); } finally { setUploading(false); }
  }

  function next() {
    setErr("");
    if (step === 1 && (!f.name.trim() || !f.email.trim() || !f.phone.trim() || f.password.length < 8)) {
      setErr("Please enter your name, email, phone and a password of at least 8 characters"); return;
    }
    if (step === 2 && (!f.bankName.trim() || f.dghsLicense.trim().length < 3 || !licenseUrl)) {
      setErr("Please enter the blood bank name, DGHS license number and upload the license"); return;
    }
    setStep(step + 1);
  }

  async function submit() {
    setErr("");
    if (!f.district || f.address.trim().length < 5) { setErr("Please select a district and enter the full address"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/register/blood-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          division: divisionOf(f.district),
          licenseUrl,
          tradeLicense: f.tradeLicense || undefined,
          area: f.area || undefined,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.message || d.error?.message || d.error || "Registration failed"); return; }
      setDone(true);
    } catch { setErr("Network error"); } finally { setBusy(false); }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-rose-50" style={{ colorScheme: "light" }}>
      <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-slate-100 max-w-sm w-full">
        <CheckCircle2 className="mx-auto text-emerald-600 mb-3" size={44} />
        <h1 className="text-xl font-extrabold text-slate-900">Registration submitted</h1>
        <p className="text-sm text-slate-500 mt-2">We will review your license and approve your account. You can log in after approval.</p>
        <Link href="/login" className="block mt-5 bg-red-600 text-white font-bold py-3 rounded-xl">Go to login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-rose-50" style={{ colorScheme: "light" }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-lg shadow-red-200">
            <Droplet size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3">Blood Bank Registration</h1>
          <p className="text-sm text-slate-500">Save more lives with Tshastho</p>
        </div>

        <div className="flex items-center mb-6">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const active = step === n;
            const past = step > n;
            return (
              <div key={s} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${past ? "bg-red-600 text-white" : active ? "bg-red-600 text-white ring-4 ring-red-100" : "bg-white border border-slate-200 text-slate-400"}`}>
                  {past ? <CheckCircle2 size={16} /> : n}
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${past ? "bg-red-600" : "bg-slate-200"}`} />}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
          {step === 1 ? "Owner information" : step === 2 ? "Blood bank details" : "Location"}
        </p>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <Field label="Owner Name *" icon={User}>
                <input className={input} placeholder="Full name" value={f.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Email *" icon={Mail}>
                <input type="email" className={input} placeholder="bloodbank@email.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Phone *" icon={Phone}>
                <input type="tel" inputMode="tel" className={input} placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Password *" icon={Lock}>
                <input type={show ? "text" : "password"} className={`${input} pr-10`} placeholder="Min 8 characters" value={f.password} onChange={(e) => set("password", e.target.value)} />
                <button type="button" onClick={() => setShow(!show)} aria-label="Show password" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Blood Bank Name *" icon={Building2}>
                <input className={input} placeholder="e.g. City Blood Bank" value={f.bankName} onChange={(e) => set("bankName", e.target.value)} />
              </Field>
              <Field label="DGHS License Number *" icon={ShieldCheck}>
                <input className={input} placeholder="License number" value={f.dghsLicense} onChange={(e) => set("dghsLicense", e.target.value)} />
              </Field>
              <Field label="Trade License (optional)" icon={FileText}>
                <input className={input} placeholder="Trade license number" value={f.tradeLicense} onChange={(e) => set("tradeLicense", e.target.value)} />
              </Field>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">DGHS License Photo / PDF *</label>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-4 text-sm font-semibold text-slate-600 cursor-pointer">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : licenseUrl ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Upload size={16} />}
                  {uploading ? "Uploading..." : licenseUrl ? "License uploaded (tap to change)" : "Tap to upload"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => uploadLicense(e.target.files?.[0])} />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={f.is24h} onChange={(e) => set("is24h", e.target.checked)} className="w-4 h-4 accent-red-600" />
                Open 24 hours
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="District *" icon={MapPin}>
                <select className={input} value={f.district} onChange={(e) => set("district", e.target.value)}>
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Area / Thana" icon={MapPin}>
                <input className={input} placeholder="Area or thana" value={f.area} onChange={(e) => set("area", e.target.value)} />
              </Field>
              <Field label="Full Address *" icon={Home}>
                <input className={input} placeholder="House, road, area" value={f.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </>
          )}
        </div>

        {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mt-4">{err}</p>}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button type="button" onClick={() => { setErr(""); setStep(step - 1); }} className="px-5 py-3.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700">Back</button>
          )}
          {step < 3 ? (
            <button type="button" onClick={next} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-red-200">Next Step</button>
          ) : (
            <button type="button" onClick={submit} disabled={busy} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-md shadow-red-200 flex items-center justify-center gap-2">
              {busy && <Loader2 size={16} className="animate-spin" />} Submit for approval
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center mt-5 flex items-center justify-center gap-1"><ShieldCheck size={12} className="text-emerald-500" />Your data is encrypted and safe.</p>
        <p className="text-sm text-slate-500 text-center mt-2">Already have an account? <Link href="/login" className="font-bold text-red-600">Login</Link></p>
      </div>
    </div>
  );
}

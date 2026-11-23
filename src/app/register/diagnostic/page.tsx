"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Eye, EyeOff, User, Mail, Phone, Lock, Building2, MapPin,
  FlaskConical, UploadCloud, X, CheckCircle2, ShieldCheck, FileText,
} from "lucide-react";

type FileKey = "trade" | "dghs";

export default function DiagnosticRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    name: "", email: "", phone: "", password: "",
    centerName: "", address: "", area: "", city: "Rajshahi",
    tradeLicense: "", dghsLicense: "",
  });
  const [preview, setPreview] = useState<Record<FileKey, string>>({ trade: "", dghs: "" });
  const [url, setUrl] = useState<Record<FileKey, string>>({ trade: "", dghs: "" });
  const [uploading, setUploading] = useState<FileKey | "">("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [e.target.name]: e.target.value });

  const upload = async (e: React.ChangeEvent<HTMLInputElement>, key: FileKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview((p) => ({ ...p, [key]: URL.createObjectURL(file) }));
    setUploading(key);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setUrl((u) => ({ ...u, [key]: data.url }));
    } catch (err) {
      console.error("Upload failed", err);
    }
    setUploading("");
  };

  const clearFile = (key: FileKey) => {
    setPreview((p) => ({ ...p, [key]: "" }));
    setUrl((u) => ({ ...u, [key]: "" }));
  };

  const next = () => {
    if (step === 1 && (!f.name || !f.email || !f.phone || f.password.length < 8))
      return setMessage("Please fill all required fields (password min 8 characters).");
    if (step === 2 && (!f.centerName || !f.address || !f.city))
      return setMessage("Please fill all required fields in Step 2.");
    setMessage("");
    setStep((s) => s + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) return setMessage("You must agree to the Terms & Conditions.");
    if (!url.trade || !url.dghs) return setMessage("Please upload both license documents.");
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/register/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, tradeLicenseUrl: url.trade, dghsLicenseUrl: url.dghs }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Application submitted! Admin will verify your documents. Redirecting to login...");
        setTimeout(() => router.push("/login"), 5000);
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch {
      setMessage("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "h-12 pl-11 bg-slate-50/50 border-slate-200 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-orange-500 rounded-xl";
  const labelCls = "block text-xs font-bold text-slate-800 mb-1.5";
  const iconCls = "absolute left-4 top-3.5 text-slate-400";

  const UploadBox = ({ k, title }: { k: FileKey; title: string }) => (
    <div>
      <label className={labelCls}>{title} *</label>
      {preview[k] ? (
        <div className="relative h-28 rounded-xl border border-orange-200 bg-orange-50/50 overflow-hidden flex items-center justify-center">
          <img src={preview[k]} alt={title} className="h-full object-contain" />
          {uploading === k && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-bold text-orange-600">
              Uploading...
            </div>
          )}
          <button type="button" onClick={() => clearFile(k)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-orange-400 transition-all">
          <UploadCloud size={24} className="text-slate-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-500">Upload Image</span>
          <input type="file" accept="image/*" onChange={(e) => upload(e, k)} className="hidden" />
        </label>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-teal-50 flex items-center justify-center p-4 py-12 font-sans">
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[32px] p-6 md:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <FlaskConical size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Diagnostic Center Registration</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Run your lab smarter with Tshastho</p>
        </div>

        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -z-10 rounded-full" />
          <div
            className="absolute left-0 top-1/2 h-1 bg-orange-500 -z-10 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                step >= n ? "bg-orange-600 border-orange-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {step > n ? <CheckCircle2 size={16} /> : n}
            </div>
          ))}
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-bold text-center border ${
              message.includes("✅")
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                Owner Information
              </h3>
              <div>
                <label className={labelCls}>Owner Name *</label>
                <div className="relative">
                  <User size={18} className={iconCls} />
                  <Input name="name" value={f.name} onChange={onChange} placeholder="Full name" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Email *</label>
                  <div className="relative">
                    <Mail size={18} className={iconCls} />
                    <Input name="email" type="email" value={f.email} onChange={onChange} placeholder="lab@email.com" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Phone *</label>
                  <div className="relative">
                    <Phone size={18} className={iconCls} />
                    <Input name="phone" value={f.phone} onChange={onChange} placeholder="017XXXXXXXX" className={inputCls} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Password *</label>
                <div className="relative">
                  <Lock size={18} className={iconCls} />
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={f.password}
                    onChange={onChange}
                    placeholder="Min 8 characters"
                    className={inputCls + " pr-12"}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-orange-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="button" onClick={next} className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold mt-4">
                Next Step
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                Center Location
              </h3>
              <div>
                <label className={labelCls}>Diagnostic Center Name *</label>
                <div className="relative">
                  <Building2 size={18} className={iconCls} />
                  <Input name="centerName" value={f.centerName} onChange={onChange} placeholder="e.g., Care Diagnostic & Imaging" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Address *</label>
                <div className="relative">
                  <MapPin size={18} className={iconCls} />
                  <Input name="address" value={f.address} onChange={onChange} placeholder="Full address" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Area</label>
                  <Input name="area" value={f.area} onChange={onChange} placeholder="Area" className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className={labelCls}>City *</label>
                  <Input name="city" value={f.city} onChange={onChange} className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3 h-12 rounded-xl">Back</Button>
                <Button type="button" onClick={next} className="w-2/3 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">Next Step</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                License Verification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Trade License No.</label>
                  <div className="relative">
                    <FileText size={18} className={iconCls} />
                    <Input name="tradeLicense" value={f.tradeLicense} onChange={onChange} placeholder="TL-XXXXX" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>DGHS License No.</label>
                  <div className="relative">
                    <FileText size={18} className={iconCls} />
                    <Input name="dghsLicense" value={f.dghsLicense} onChange={onChange} placeholder="DGHS-XXXXX" className={inputCls} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <UploadBox k="trade" title="Trade License Image" />
                <UploadBox k="dghs" title="DGHS License Image" />
              </div>
              <label className="flex items-start gap-3 cursor-pointer mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-orange-600" />
                <span className="text-xs text-slate-600">
                  I agree to the{" "}
                  <Link href="/terms" className="text-orange-600 font-bold">Terms of Service</Link> and{" "}
                  <Link href="/privacy" className="text-orange-600 font-bold">Privacy Policy</Link>.
                </span>
              </label>
              <div className="flex gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3 h-12 rounded-xl">Back</Button>
                <Button type="submit" disabled={loading || !!uploading} className="w-2/3 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
                  {loading ? "Submitting..." : uploading ? "Uploading..." : "Submit Application"}
                </Button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-8 text-center space-y-2">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={12} className="text-emerald-500" /> Your data is encrypted and safe.
          </p>
          <p className="text-sm text-slate-500">
            Already have an account? <Link href="/login" className="font-bold text-orange-600">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

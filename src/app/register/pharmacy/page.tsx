"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, User, Mail, Phone, Lock, Store, MapPin, ShieldCheck, Truck, UploadCloud, X, CheckCircle2 } from "lucide-react";

export default function PharmacyRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", shopName: "", drugLicense: "", tradeLicense: "", address: "", area: "", city: "Rajshahi", deliveryRadius: "5",
  });
  
  const [drugLicPreview, setDrugLicPreview] = useState("");
  const [tradeLicPreview, setTradeLicPreview] = useState("");
  const [drugLicBase64, setDrugLicBase64] = useState("");
  const [tradeLicBase64, setTradeLicBase64] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'drug' | 'trade') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // লোকাল প্রিভিউ দেখানোর জন্য
    const previewUrl = URL.createObjectURL(file);
    if (type === 'drug') setDrugLicPreview(previewUrl);
    else setTradeLicPreview(previewUrl);

    // Supabase-এ আপলোড করার জন্য API-তে পাঠানো
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        if (type === 'drug') setDrugLicBase64(data.url);
        else setTradeLicBase64(data.url);
      }
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        return setMessage("Please fill all required fields in Step 1.");
      }
    } else if (step === 2) {
      if (!formData.shopName || !formData.address || !formData.city) {
        return setMessage("Please fill all required fields in Step 2.");
      }
    }
    setMessage("");
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return setMessage("You must agree to the Terms & Conditions.");
    if (!drugLicBase64 || !tradeLicBase64) return setMessage("Please upload both License documents.");
    
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/register/pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, drugLicenseUrl: drugLicBase64, tradeLicenseUrl: tradeLicBase64 }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Application submitted! Admin will verify your documents. Redirecting to login...");
        setTimeout(() => router.push("/login"), 5000);
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (error) {
      setMessage("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 py-12 font-sans">
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[32px] p-6 md:p-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Store size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Registration</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Join Tshastho to grow your business</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -z-10 rounded-full"></div>
          <div className="absolute left-0 top-1/2 h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
          
          {[1, 2, 3].map((num) => (
            <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${step >= num ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-400"}`}>
              {step > num ? <CheckCircle2 size={16} /> : num}
            </div>
          ))}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold text-center border animate-in fade-in ${message.includes("✅") ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: Owner Information */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-2">Owner Information</h3>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Owner Name *</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder="Full name" required className="h-12 pl-11 bg-slate-50/50 border-slate-200 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-3.5 text-slate-400" />
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="pharmacy@email.com" required className="h-12 pl-11 bg-slate-50/50 border-slate-200 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Phone *</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-3.5 text-slate-400" />
                    <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="017XXXXXXXX" required className="h-12 pl-11 bg-slate-50/50 border-slate-200 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500 rounded-xl" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <Input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Min 6 characters" required className="h-12 pl-11 pr-11 bg-slate-50/50 border-slate-200 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500 rounded-xl" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="button" onClick={handleNext} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold mt-4">Next Step</Button>
            </div>
          )}

          {/* STEP 2: Pharmacy Location */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-2">Pharmacy Location</h3>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Shop Name *</label>
                <div className="relative">
                  <Store size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <Input name="shopName" value={formData.shopName} onChange={handleChange} placeholder="e.g., Green Pharmacy" required className="h-12 pl-11 bg-slate-50/50 border-slate-200 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Shop Address *</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <Input name="address" value={formData.address} onChange={handleChange} placeholder="Full shop address" required className="h-12 pl-11 bg-slate-50/50 border-slate-200 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Area</label>
                  <Input name="area" value={formData.area} onChange={handleChange} placeholder="Area" className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">City *</label>
                  <Input name="city" value={formData.city} onChange={handleChange} required className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Radius (km)</label>
                  <div className="relative">
                    <Truck size={18} className="absolute left-4 top-3.5 text-slate-400" />
                    <Input name="deliveryRadius" type="number" value={formData.deliveryRadius} onChange={handleChange} className="h-12 pl-11 bg-slate-50/50 border-slate-200 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3 h-12 rounded-xl">Back</Button>
                <Button type="button" onClick={handleNext} className="w-2/3 h-12 bg-indigo-600 text-white rounded-xl font-bold">Next Step</Button>
              </div>
            </div>
          )}
          {/* STEP 3: Licenses & Terms */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-2">License Verification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Drug License No. *</label>
                  <Input name="drugLicense" value={formData.drugLicense} onChange={handleChange} placeholder="DL-XXXXX" required className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Trade License No. *</label>
                  <Input name="tradeLicense" value={formData.tradeLicense} onChange={handleChange} placeholder="TL-XXXXX" required className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" />
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Drug License Image *</label>
                  {drugLicPreview ? (
                    <div className="relative h-28 rounded-xl border border-indigo-200 bg-indigo-50/50 overflow-hidden flex items-center justify-center">
                      <img src={drugLicPreview} className="h-full object-contain" />
                      <button type="button" onClick={() => {setDrugLicPreview(""); setDrugLicBase64("");}} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={14}/></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all">
                      <UploadCloud size={24} className="text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-500">Upload Image</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'drug')} className="hidden" />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Trade License Image *</label>
                  {tradeLicPreview ? (
                    <div className="relative h-28 rounded-xl border border-indigo-200 bg-indigo-50/50 overflow-hidden flex items-center justify-center">
                      <img src={tradeLicPreview} className="h-full object-contain" />
                      <button type="button" onClick={() => {setTradeLicPreview(""); setTradeLicBase64("");}} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={14}/></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all">
                      <UploadCloud size={24} className="text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-500">Upload Image</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'trade')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-xs text-slate-600 leading-relaxed font-medium">
                  I agree to the <a href="#" className="text-indigo-600 font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 font-bold hover:underline">Privacy Policy</a> of Tshastho.
                </span>
              </label>

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3 h-12 rounded-xl">Back</Button>
                <Button type="submit" disabled={loading || !agreeTerms || !drugLicBase64 || !tradeLicBase64} className="w-2/3 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50">
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          )}
        </form>

        <div className="flex flex-col items-center justify-center gap-4 mt-8">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" /> Your data is encrypted and safe.
          </div>
          <p className="text-center text-sm text-slate-500 font-medium">
            Already have an account? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

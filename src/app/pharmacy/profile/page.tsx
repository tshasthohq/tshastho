"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Store, Upload, Save, User, MapPin, Phone, Settings, Clock } from "lucide-react";
import Link from "next/link";

export default function PharmacyProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "settings">("general");
  
  const [formData, setFormData] = useState({
    shopName: "", address: "", area: "", city: "", phone: "", drugLicense: "", tradeLicense: "", logo: "",
    userName: "", userEmail: "", userAvatar: "",
    deliveryFee: "0", deliveryRadius: "5", openTime: "09:00", closeTime: "22:00", isOpen: true, lowStockAlert: true, expiryAlert: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/pharmacy/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.pharmacy) {
          setFormData({
            shopName: data.pharmacy.shopName || "", address: data.pharmacy.address || "", area: data.pharmacy.area || "", city: data.pharmacy.city || "", phone: data.pharmacy.phone || "", drugLicense: data.pharmacy.drugLicense || "", tradeLicense: data.pharmacy.tradeLicense || "", logo: data.pharmacy.logo || "",
            userName: data.pharmacy.user?.name || "", userEmail: data.pharmacy.user?.email || "", userAvatar: data.pharmacy.user?.avatarUrl || "",
            deliveryFee: String(data.pharmacy.deliveryFee || 0), deliveryRadius: String(data.pharmacy.deliveryRadius || 5), openTime: data.pharmacy.openTime || "09:00", closeTime: data.pharmacy.closeTime || "22:00", isOpen: data.pharmacy.isOpen ?? true, lowStockAlert: data.pharmacy.lowStockAlert ?? true, expiryAlert: data.pharmacy.expiryAlert ?? true
          });
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.url) setFormData(prev => ({ ...prev, logo: data.url }));
      else alert("Logo upload failed");
    } catch { alert("Error uploading logo"); }
    setUploading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.url) setFormData(prev => ({ ...prev, userAvatar: data.url }));
      else alert("Avatar upload failed");
    } catch { alert("Error uploading avatar"); }
    setUploadingAvatar(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage(data.message || "Failed to update profile");
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/pharmacy" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="font-bold text-slate-800 text-lg">Pharmacy Profile</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* Tab Navigation */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
          <button onClick={() => setActiveTab("general")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === "general" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"}`}>General Info</button>
          <button onClick={() => setActiveTab("settings")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === "settings" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"}`}>Business Settings</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ================= GENERAL TAB ================= */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="relative z-10 flex flex-col items-center mt-6">
                  <div className="relative w-24 h-24 bg-white rounded-full p-1 shadow-lg mb-4">
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                      {formData.logo ? <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" /> : <Store size={40} className="text-slate-300" />}
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md hover:bg-indigo-700 transition-colors">
                      <Upload size={14} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{formData.shopName || "Your Pharmacy"}</h2>
                  <p className="text-sm text-slate-500">{uploading ? "Uploading logo..." : "Click the icon to change logo"}</p>
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">Personal Information</h3>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative w-20 h-20 shrink-0">
                    <div className="w-full h-full rounded-full border-2 border-indigo-100 overflow-hidden bg-slate-100">
                      {formData.userAvatar ? <img src={formData.userAvatar} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl">{formData.userName?.charAt(0)?.toUpperCase() || "U"}</div>}
                    </div>
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md z-10 hover:bg-indigo-700 transition-colors">
                      <Upload size={14} />
                    </button>
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div><label className="text-xs font-bold text-slate-600 mb-1 block">Owner Name</label><input value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-600 mb-1 block">Email Address</label><input disabled value={formData.userEmail} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium outline-none cursor-not-allowed" /></div>
                  </div>
                </div>
              </div>

              {/* Shop Details */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">Shop Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">Shop Name</label><input required value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">Phone Number</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" /></div>
                  <div className="md:col-span-2"><label className="text-xs font-bold text-slate-600 mb-1 block">Address</label><input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">Area</label><input required value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">City</label><input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">Drug License</label><input value={formData.drugLicense} onChange={e => setFormData({...formData, drugLicense: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">Trade License</label><input value={formData.tradeLicense} onChange={e => setFormData({...formData, tradeLicense: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" /></div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SETTINGS TAB ================= */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b pb-4">
                <Settings size={20} className="text-indigo-600"/> Business Settings
              </h3>
              
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Store Status</h4>
                  <p className="text-xs text-slate-500 mt-1">Toggle to open/close your pharmacy</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, isOpen: !formData.isOpen})}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${formData.isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Alert Settings */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Low Stock Alerts</h4>
                  <p className="text-xs text-slate-500 mt-1">Show warning when stock is low</p>
                </div>
                <button type="button" onClick={() => setFormData({...formData, lowStockAlert: !formData.lowStockAlert})}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${formData.lowStockAlert ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.lowStockAlert ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Expiry Alerts</h4>
                  <p className="text-xs text-slate-500 mt-1">Show warning for expiring medicines</p>
                </div>
                <button type="button" onClick={() => setFormData({...formData, expiryAlert: !formData.expiryAlert})}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${formData.expiryAlert ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.expiryAlert ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Clock size={14}/> Opening Time</label>
                  <input type="time" value={formData.openTime} onChange={e => setFormData({...formData, openTime: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Clock size={14}/> Closing Time</label>
                  <input type="time" value={formData.closeTime} onChange={e => setFormData({...formData, closeTime: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><MapPin size={14}/> Delivery Fee (৳)</label>
                  <input type="number" value={formData.deliveryFee} onChange={e => setFormData({...formData, deliveryFee: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><MapPin size={14}/> Delivery Radius (km)</label>
                  <input type="number" value={formData.deliveryRadius} onChange={e => setFormData({...formData, deliveryRadius: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Messages & Save Button */}
          {message && <div className={`p-3 rounded-xl text-sm font-bold ${message.includes("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</div>}
          
          <button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

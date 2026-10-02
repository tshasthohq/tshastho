"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Percent, Truck, Gift, DollarSign, Settings as SettingsIcon, Image as ImageIcon, Upload, Loader2, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"fees" | "branding">("fees");
  const [uploading, setUploading] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    platform_fee_percent: "5",
    delivery_charge: "30",
    delivery_charge_free: "false",
    free_delivery_threshold: "500",
    tshastho_logo: "",
    tshastho_tagline: "Connected Healthcare. Trusted Care.",
    tshastho_banner_home: "",
    tshastho_banner_orders: "",
    tshastho_support_phone: "01737326555",
    tshastho_support_email: "",
  });

  const logoRef = useRef<HTMLInputElement>(null);
  const bannerHomeRef = useRef<HTMLInputElement>(null);
  const bannerOrdersRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings({
            platform_fee_percent: data.settings.platform_fee_percent || "5",
            delivery_charge: data.settings.delivery_charge || "30",
            delivery_charge_free: data.settings.delivery_charge_free || "false",
            free_delivery_threshold: data.settings.free_delivery_threshold || "500",
            tshastho_logo: data.settings.tshastho_logo || "",
            tshastho_tagline: data.settings.tshastho_tagline || "Connected Healthcare. Trusted Care.",
            tshastho_banner_home: data.settings.tshastho_banner_home || "",
            tshastho_banner_orders: data.settings.tshastho_banner_orders || "",
            tshastho_support_phone: data.settings.tshastho_support_phone || "01737326555",
            tshastho_support_email: data.settings.tshastho_support_email || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const uploadImage = async (file: File, key: string) => {
    if (file.size > 5 * 1024 * 1024) {
      setMessage("File too large (max 5MB)");
      return;
    }
    setUploading(key);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setSettings({ ...settings, [key]: data.url });
        setMessage("✅ Uploaded! Don't forget to Save.");
      } else {
        setMessage("❌ Upload failed");
      }
    } catch {
      setMessage("❌ Upload error");
    }
    setUploading(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    if (res.ok) setMessage("✅ Settings saved successfully!");
    else setMessage("❌ Failed to save");
    setSaving(false);
    setTimeout(() => setMessage(""), 2500);
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon size={18} /> Platform Settings
        </h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setTab("fees")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${tab === "fees" ? "bg-blue-600 text-white" : "text-slate-600"}`}
          >
            Fees & Delivery
          </button>
          <button
            onClick={() => setTab("branding")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${tab === "branding" ? "bg-purple-600 text-white" : "text-slate-600"}`}
          >
            Branding
          </button>
        </div>

        {/* FEES TAB */}
        {tab === "fees" && (
          <>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Percent size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Platform Fee</h3>
                  <p className="text-xs text-slate-500">Commission from each order</p>
                </div>
              </div>
              <div className="relative">
                <Input type="number" step="0.5" min="0" max="50" value={settings.platform_fee_percent} onChange={(e) => setSettings({ ...settings, platform_fee_percent: e.target.value })} className="pr-12" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Truck size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Delivery Charge</h3>
                  <p className="text-xs text-slate-500">Standard delivery fee</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</span>
                <Input type="number" step="5" min="0" value={settings.delivery_charge} onChange={(e) => setSettings({ ...settings, delivery_charge: e.target.value })} className="pl-8" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Gift size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Free Delivery</h3>
                    <p className="text-xs text-slate-500">Off delivery charge entirely</p>
                  </div>
                </div>
                <button onClick={() => setSettings({ ...settings, delivery_charge_free: settings.delivery_charge_free === "true" ? "false" : "true" })} className={`relative w-12 h-6 rounded-full transition ${settings.delivery_charge_free === "true" ? "bg-green-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${settings.delivery_charge_free === "true" ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            </div>

            {settings.delivery_charge_free !== "true" && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <DollarSign size={20} className="text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Free Delivery Threshold</h3>
                    <p className="text-xs text-slate-500">Orders above this get free delivery</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</span>
                  <Input type="number" step="50" min="0" value={settings.free_delivery_threshold} onChange={(e) => setSettings({ ...settings, free_delivery_threshold: e.target.value })} className="pl-8" />
                </div>
              </div>
            )}
          </>
        )}

        {/* BRANDING TAB */}
        {tab === "branding" && (
          <>
            {/* Tshastho Logo Upload */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ImageIcon size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tshastho Logo</h3>
                  <p className="text-xs text-slate-500">PNG with transparent background, 500x500px recommended</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {settings.tshastho_logo ? (
                  <img src={settings.tshastho_logo} alt="logo" className="w-20 h-20 rounded-xl object-contain border-2 border-slate-200 bg-white p-1" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <ImageIcon size={28} />
                  </div>
                )}
                <button onClick={() => logoRef.current?.click()} disabled={uploading === "tshastho_logo"} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {uploading === "tshastho_logo" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {settings.tshastho_logo ? "Change Logo" : "Upload Logo"}
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "tshastho_logo")} />
              </div>
            </div>

            {/* Home Banner */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <ImageIcon size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Home Banner</h3>
                  <p className="text-xs text-slate-500">Shown on patient home page, 1200x400px</p>
                </div>
              </div>
              {settings.tshastho_banner_home && (
                <img src={settings.tshastho_banner_home} alt="banner" className="w-full h-24 rounded-xl object-cover mb-3 border border-slate-200" />
              )}
              <button onClick={() => bannerHomeRef.current?.click()} disabled={uploading === "tshastho_banner_home"} className="w-full bg-orange-600 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading === "tshastho_banner_home" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {settings.tshastho_banner_home ? "Change Banner" : "Upload Banner"}
              </button>
              <input ref={bannerHomeRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "tshastho_banner_home")} />
            </div>

            {/* Orders Banner */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <ImageIcon size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Orders Banner</h3>
                  <p className="text-xs text-slate-500">Shown on orders page, 1200x300px</p>
                </div>
              </div>
              {settings.tshastho_banner_orders && (
                <img src={settings.tshastho_banner_orders} alt="banner" className="w-full h-20 rounded-xl object-cover mb-3 border border-slate-200" />
              )}
              <button onClick={() => bannerOrdersRef.current?.click()} disabled={uploading === "tshastho_banner_orders"} className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading === "tshastho_banner_orders" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {settings.tshastho_banner_orders ? "Change Banner" : "Upload Banner"}
              </button>
              <input ref={bannerOrdersRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "tshastho_banner_orders")} />
            </div>

            {/* Tagline */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Tagline</h3>
              <Input value={settings.tshastho_tagline} onChange={(e) => setSettings({ ...settings, tshastho_tagline: e.target.value })} placeholder="Connected Healthcare. Trusted Care." />
            </div>

            {/* Support Info */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Phone size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Support Contact</h3>
                  <p className="text-xs text-slate-500">Shown in memos and app</p>
                </div>
              </div>
              <Input value={settings.tshastho_support_phone} onChange={(e) => setSettings({ ...settings, tshastho_support_phone: e.target.value })} placeholder="01737326555" className="mb-2" />
              <Input value={settings.tshastho_support_email} onChange={(e) => setSettings({ ...settings, tshastho_support_email: e.target.value })} placeholder="support@tshastho.com" />
            </div>
          </>
        )}

        {message && (
          <p className={`text-center text-sm font-medium mb-4 ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save size={16} className="mr-2" />
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}

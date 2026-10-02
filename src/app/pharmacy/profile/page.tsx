"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, LogOut, Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function PharmacyProfilePage() {
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [formData, setFormData] = useState({ shopName: "", address: "", area: "", city: "", deliveryRadius: "5", logo: "" });
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = user?.email;
    if (!email) { router.push("/login"); return; }

    fetch("/api/pharmacy/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.pharmacy) {
        setPharmacy(data.pharmacy);
        setFormData({
          shopName: data.pharmacy.shopName || "",
          address: data.pharmacy.address || "",
          area: data.pharmacy.area || "",
          city: data.pharmacy.city || "",
          deliveryRadius: String(data.pharmacy.deliveryRadius || 5),
          logo: data.pharmacy.logo || "",
        });
      }
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 3 * 1024 * 1024) {
      setMessage("Logo too large (max 3MB)");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData({ ...formData, logo: data.url });
        setMessage("Logo uploaded! Save to apply.");
      } else {
        setMessage("Upload failed");
      }
    } catch {
      setMessage("Upload error");
    }
    setUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/pharmacy/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pharmacyId: pharmacy.id, ...formData }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Profile updated successfully! ✅" : (data.message || "Update failed"));
    setSaving(false);
  };

  const handleLogout = () => {

    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!pharmacy) return <div className="p-6">Pharmacy not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <button onClick={handleLogout} className="text-red-500">
          <LogOut size={20} />
        </button>
      </header>

      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-3xl font-bold">
              {pharmacy.shopName?.charAt(0) || "P"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{pharmacy.shopName}</h2>
              <p className="text-purple-600 text-sm">Pharmacy Owner</p>
            </div>
          </div>


          {/* Logo Section */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Shop Logo</label>
            <div className="flex items-center gap-4">
              {formData.logo ? (
                <img src={formData.logo} alt="logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-200 bg-white" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold border-2 border-purple-200">
                  {formData.shopName?.charAt(0)?.toUpperCase() || "P"}
                </div>
              )}
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? "Uploading..." : formData.logo ? "Change Logo" : "Upload Logo"}
                </button>
                <p className="text-[10px] text-slate-500 mt-1">PNG or JPG, max 3MB, square recommended</p>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
              <Input value={formData.shopName} onChange={(e) => setFormData({ ...formData, shopName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                <Input value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Radius (km)</label>
              <Input type="number" value={formData.deliveryRadius} onChange={(e) => setFormData({ ...formData, deliveryRadius: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500">Drug License</p>
                <p className="font-medium text-slate-800">{pharmacy.drugLicense}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500">Trade License</p>
                <p className="font-medium text-slate-800">{pharmacy.tradeLicense}</p>
              </div>
            </div>

            {message && (
              <p className={`text-center text-sm font-medium ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save size={18} className="mr-2" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

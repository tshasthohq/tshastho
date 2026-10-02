"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Pill } from "lucide-react";

export default function PharmacyRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "",
    shopName: "", drugLicense: "", tradeLicense: "", address: "", area: "", city: "Rajshahi", deliveryRadius: "5",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/register/pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Application submitted! Super Admin will verify your Drug License and Trade License. You will be able to login once approved.");
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
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Pill size={32} className="text-purple-600" />
          </div>
          <Link href="/" className="text-2xl font-bold text-blue-600">Tshastho</Link>
          <h2 className="text-xl font-bold text-slate-800 mt-3">Pharmacy Registration</h2>
          <p className="text-slate-500 text-sm mt-1">Drug License & Trade License verification required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name *</label>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Full name" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="pharmacy@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
              <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="017XXXXXXXX" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
            <div className="relative">
              <Input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Min 6 characters" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm font-bold text-slate-800 mb-3">Pharmacy Information</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name *</label>
                <Input name="shopName" value={formData.shopName} onChange={handleChange} placeholder="e.g., Green Pharmacy" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Drug License No. *</label>
                  <Input name="drugLicense" value={formData.drugLicense} onChange={handleChange} placeholder="DL-XXXXX" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trade License No. *</label>
                  <Input name="tradeLicense" value={formData.tradeLicense} onChange={handleChange} placeholder="TL-XXXXX" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shop Address *</label>
                <Input name="address" value={formData.address} onChange={handleChange} placeholder="Full shop address" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                  <Input name="area" value={formData.area} onChange={handleChange} placeholder="e.g., Shaheb Bazar" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <Input name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Radius (km)</label>
                  <Input name="deliveryRadius" type="number" value={formData.deliveryRadius} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          {message && (
            <p className={`text-center text-sm font-medium ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>
              {message}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link href="/login" className="text-blue-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

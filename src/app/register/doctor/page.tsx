"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Stethoscope } from "lucide-react";

export default function DoctorRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "",
    licenseNumber: "", specialty: "", experience: "", consultationFee: "", bookingPhone: "", chamberAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/register/doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Application submitted! Super Admin will verify and approve your account. You will be able to login once approved.");
        setTimeout(() => router.push("/login"), 4000);
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (error) {
      setMessage("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const specialties = [
    "Medicine Specialist", "Cardiologist", "Neurologist", "Orthopedic Surgeon",
    "Pediatrician", "Gynecologist", "Dermatologist", "Oncologist", "Psychiatrist",
    "Endocrinologist", "Chest & Asthma Specialist", "General Physician", "Other",
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Stethoscope size={32} className="text-blue-600" />
          </div>
          <Link href="/" className="text-2xl font-bold text-blue-600">Tshastho</Link>
          <h2 className="text-xl font-bold text-slate-800 mt-3">Doctor Registration</h2>
          <p className="text-slate-500 text-sm mt-1">Super Admin verification required before login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Dr. Full Name" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="doctor@email.com" required />
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
            <p className="text-sm font-bold text-slate-800 mb-3">Professional Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">BMDC License Number *</label>
                <Input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="BMDC-XXXXX" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialty *</label>
                <select name="specialty" value={formData.specialty} onChange={handleChange} required className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  <option value="">Select Specialty</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years) *</label>
                <Input name="experience" type="number" value={formData.experience} onChange={handleChange} placeholder="10" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee (৳) *</label>
                <Input name="consultationFee" type="number" value={formData.consultationFee} onChange={handleChange} placeholder="1000" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Booking Phone</label>
                <Input name="bookingPhone" value={formData.bookingPhone} onChange={handleChange} placeholder="Chamber phone" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chamber Address</label>
                <Input name="chamberAddress" value={formData.chamberAddress} onChange={handleChange} placeholder="Chamber address" />
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

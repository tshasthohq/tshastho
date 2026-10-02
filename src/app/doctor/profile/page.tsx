"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DoctorProfilePage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [bookingPhone, setBookingPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) { router.push("/login"); return; }

    fetch("/api/doctor/my-appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.doctor) {
        setDoctor(data.doctor);
        setBookingPhone(data.doctor.bookingPhone || "");
      }
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!doctor?.id) {
      setMessage("Doctor ID missing. Please refresh.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/doctor/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          doctorId: doctor.id, 
          bookingPhone: bookingPhone 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Profile updated successfully! ✅");
      } else {
        setMessage(data.message || "Update failed. Please try again.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!doctor) return <div className="p-6">Doctor not found.</div>;

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
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
              {doctor.user?.name?.charAt(0) || "D"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{doctor.user?.name}</h2>
              <p className="text-blue-600 text-sm">{doctor.specialty}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Booking Phone Number</label>
              <Input 
                value={bookingPhone} 
                onChange={(e) => setBookingPhone(e.target.value)} 
                placeholder="017XXXXXXXX" 
              />
              <p className="text-xs text-slate-500 mt-1">Patients will call this number to book appointments</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500">Experience</p>
                <p className="font-medium text-slate-800">{doctor.experience} years</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500">Fee</p>
                <p className="font-medium text-slate-800">৳{doctor.consultationFee}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg col-span-2">
                <p className="text-xs text-slate-500">License Number</p>
                <p className="font-medium text-slate-800">{doctor.licenseNumber}</p>
              </div>
            </div>

            {message && (
              <p className={`text-center text-sm font-medium ${message.includes("success") ? "text-green-600" : "text-red-500"}`}>
                {message}
              </p>
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

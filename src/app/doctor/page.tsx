"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, Check, X, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function DoctorDashboard() {
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [greeting, setGreeting] = useState("Hello");
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const email = user?.email;
    if (!email) { setLoading(false); return; }

    fetch("/api/doctor/my-appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.doctor) setDoctor(data.doctor);
      if (data.appointments) setAppointments(data.appointments);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  useEffect(() => {
    const hour = new Date().getHours();
    let greetText = "Good Morning";
    if (hour >= 12 && hour < 17) greetText = "Good Afternoon";
    else if (hour >= 17 && hour < 21) greetText = "Good Evening";
    else if (hour >= 21 || hour < 5) greetText = "Good Night";
    setGreeting(greetText);
    loadData();
  }, []);

  const updateStatus = async (appointmentId: string, status: string) => {
    await fetch("/api/doctor/appointments/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, status }),
    });
    loadData();
  };

  const handleLogout = () => {

    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!doctor) return <div className="p-6">Doctor profile not found. Please login again.</div>;

  const pending = appointments.filter(a => a.status === "PENDING");
  const confirmed = appointments.filter(a => a.status === "CONFIRMED");
  const completed = appointments.filter(a => a.status === "COMPLETED");
  const initial = doctor.user?.name?.charAt(0)?.toUpperCase() || "D";

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-600">Tshastho</span>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">Doctor</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/doctor/notifications" className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center relative">
            <Bell size={20} className="text-slate-500" />
            {pending.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {pending.length}
              </span>
            )}
          </Link>
          <Link href="/doctor/profile" className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm hover:bg-blue-200 transition">
            {initial}
          </Link>
          <button onClick={handleLogout} className="text-red-500 p-2 rounded-full hover:bg-red-50">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {initial}
            </div>
            <div>
              <h1 className="text-xl font-bold">{greeting}, {doctor.user?.name}!</h1>
              <p className="text-blue-100 text-sm">{doctor.specialty}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-xs text-blue-100">Pending</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{confirmed.length}</p>
              <p className="text-xs text-blue-100">Confirmed</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-xs text-blue-100">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Your Booking Number</p>
            <p className="text-lg font-bold text-green-700">{doctor.bookingPhone || "Not set"}</p>
          </div>
          <Link href="/doctor/profile" className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg font-medium">
            Edit Profile
          </Link>
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-4">Appointment Requests</h2>

        {appointments.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500">
            No appointments yet.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{apt.patient?.name || "Patient"}</h3>
                      <p className="text-sm text-slate-500">{apt.patient?.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><Calendar size={16} /> {apt.date}</div>
                    <div className="flex items-center gap-2"><Clock size={16} /> {apt.time}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      apt.status === "PENDING" ? "bg-yellow-100 text-yellow-600" :
                      apt.status === "CONFIRMED" ? "bg-blue-100 text-blue-600" :
                      apt.status === "COMPLETED" ? "bg-green-100 text-green-600" :
                      "bg-red-100 text-red-600"
                    }`}>{apt.status}</span>
                  </div>
                </div>

                {apt.status === "PENDING" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => updateStatus(apt.id, "CONFIRMED")} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium">
                      <Check size={16} /> Accept
                    </button>
                    <button onClick={() => updateStatus(apt.id, "REJECTED")} className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-medium">
                      <X size={16} /> Reject
                    </button>
                  </div>
                )}

                {apt.status === "CONFIRMED" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => updateStatus(apt.id, "COMPLETED")} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">
                      Mark as Completed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

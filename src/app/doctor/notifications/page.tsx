"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Calendar, User, Info } from "lucide-react";

export default function DoctorNotificationsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (data.appointments) setAppointments(data.appointments);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  const notifications = appointments.map(apt => ({
    type: apt.status === "PENDING" ? "new" : apt.status === "CONFIRMED" ? "confirmed" : "info",
    title: apt.status === "PENDING" 
      ? `New appointment request from ${apt.patient?.name}` 
      : `Appointment ${apt.status.toLowerCase()} - ${apt.patient?.name}`,
    desc: `${apt.date} at ${apt.time}`,
    icon: apt.status === "PENDING" ? Calendar : User,
  }));

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Bell size={24} /> Notifications
        </h1>

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500">
            <Bell size={48} className="mx-auto text-slate-300 mb-4" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, index) => {
              const Icon = notif.icon;
              return (
                <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.type === "new" ? "bg-yellow-100 text-yellow-600" :
                    notif.type === "confirmed" ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm">{notif.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{notif.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

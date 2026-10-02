"use client";
import { useEffect, useState } from "react";
import { Calendar, Clock, User } from "lucide-react";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      fetch("/api/appointments/my-appointments", {
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
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="p-6 text-slate-500">Loading appointments...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Appointments</h1>
      
      {appointments.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <p className="text-slate-500 mb-4">No appointments found.</p>
          <a href="/doctors" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">
            Book an Appointment
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{apt.doctor.user.name}</h3>
                  <p className="text-sm text-slate-500">{apt.doctor.specialty}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} /> {apt.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} /> {apt.time}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === "PENDING" ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, User, CheckCircle, XCircle, Search, Filter } from "lucide-react";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING"); // Default filter
  const [search, setSearch] = useState("");

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/doctor/my-appointments');
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (appointmentId: string, status: string) => {
    try {
      await fetch('/api/doctor/appointments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, status }),
      });
      fetchAppointments(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: "PENDING", label: "Requested" },
    { id: "CONFIRMED", label: "Confirmed" },
    { id: "COMPLETED", label: "Completed" },
    { id: "REJECTED", label: "Cancelled" },
    { id: "ALL", label: "All" },
  ];

  const filteredAppointments = appointments.filter(apt => {
    // Filter by tab
    const matchesTab = filter === "ALL" || apt.status === filter;
    // Filter by search
    const matchesSearch = 
      apt.patient?.name?.toLowerCase().includes(search.toLowerCase()) || 
      apt.patient?.phone?.includes(search);
    return matchesTab && matchesSearch;
  });

  if (loading) return <div className="p-10 text-center text-slate-500">Loading appointments...</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-slate-500 text-sm">Manage your patient bookings here.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search patient name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              filter === tab.id 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
            {tab.id === "PENDING" && appointments.filter(a => a.status === "PENDING").length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] bg-red-500 text-white rounded-full">
                {appointments.filter(a => a.status === "PENDING").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Appointment List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
            <Calendar size={32} />
          </div>
          <h3 className="text-slate-800 font-bold text-xl mb-2">No appointments found</h3>
          <p className="text-slate-500 text-sm max-w-sm">
            {search ? "No appointments match your search." : `You don't have any ${filter.toLowerCase()} appointments right now.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((apt) => (
            <div key={apt.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="p-4 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {apt.patient?.name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{apt.patient?.name || "Patient"}</h3>
                    <p className="text-xs text-slate-500">{apt.patient?.phone}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  apt.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                  apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {apt.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1">
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Calendar size={14} className="text-slate-500" /> 
                    <span className="font-medium">{new Date(apt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Clock size={14} className="text-slate-500" /> 
                    <span className="font-medium">{apt.time}</span>
                  </div>
                </div>
                
                {apt.symptoms && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Symptoms:</p>
                    <p className="text-sm text-slate-700 bg-amber-50 p-2 rounded-lg border border-amber-100 line-clamp-2">{apt.symptoms}</p>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              {apt.status === "PENDING" && (
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => updateStatus(apt.id, "CONFIRMED")} 
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    <CheckCircle size={16} /> Accept
                  </button>
                  <button 
                    onClick={() => updateStatus(apt.id, "REJECTED")} 
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
              
              {apt.status === "CONFIRMED" && (
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => updateStatus(apt.id, "COMPLETED")} 
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    <CheckCircle size={16} /> Mark as Completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

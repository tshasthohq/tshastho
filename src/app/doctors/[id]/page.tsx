"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Star, Award, Briefcase, MapPin, Phone, Clock,
  Calendar, CheckCircle, User, GraduationCap, Languages
} from "lucide-react";

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");

  // Generate next 7 days
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      day: d.toLocaleDateString("en", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: i === 0,
    };
  });

  const loadDoctor = async () => {
    setLoading(true);
    const res = await fetch(`/api/doctors?q=&limit=100`, { credentials: "include" });
    const data = await res.json();
    // find by id
    const found = (data.doctors || []).find((d: any) => d.id === doctorId);
    if (found) setDoctor(found);
    setLoading(false);
  };

  const loadSlots = async (date: string) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    const res = await fetch(`/api/doctors/${doctorId}/slots?date=${date}`);
    const data = await res.json();
    setSlots(data.slots || []);
    setSlotsLoading(false);
  };

  useEffect(() => {
    if (doctorId) {
      loadDoctor();
      const today = new Date().toISOString().slice(0, 10);
      setSelectedDate(today);
      loadSlots(today);
    }
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate]);
// PART2

  const handleBook = async () => {
    if (!user) {
      router.push(`/login?redirect=/doctors/${doctorId}`);
      return;
    }
    if (!selectedSlot) {
      setMessage("Please select a time slot");
      return;
    }
    setBooking(true);
    setMessage("");

    const res = await fetch("/api/appointments/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        doctorId,
        date: selectedDate,
        time: selectedSlot.startTime,
        slotType: selectedSlot.slotType,
        fee: selectedSlot.consultationFee || doctor?.consultationFee,
      }),
    });

    const data = await res.json();
    setBooking(false);
    if (res.ok) {
      setMessage("✅ Appointment requested! Check your dashboard.");
      setTimeout(() => router.push("/dashboard/appointments"), 1500);
    } else {
      setMessage(data.message || "Booking failed");
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!doctor) return <div className="p-6 text-center text-slate-500">Doctor not found</div>;

  const avgRating = Number(doctor.averageRating || 0).toFixed(1);
// PART3

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-slate-800">Doctor Details</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Doctor Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
              <User className="text-blue-600" size={36} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">
                Dr. {doctor.user?.name || "Unknown"}
              </h2>
              <p className="text-sm text-blue-600 font-medium">{doctor.specialty}</p>
              {doctor.hospitalAffiliation && (
                <p className="text-xs text-slate-500 mt-0.5">{doctor.hospitalAffiliation}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  <span className="font-medium text-slate-700">{avgRating}</span>
                  <span>({doctor.totalReviews || 0})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase size={12} /> {doctor.experience} yr
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <div className="text-[10px] text-blue-700 mb-1">Consultation Fee</div>
              <div className="text-lg font-bold text-blue-700">
                ৳ {Number(doctor.consultationFee || 0).toFixed(0)}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <div className="text-[10px] text-slate-500 mb-1">License</div>
              <div className="text-sm font-mono text-slate-800 truncate">{doctor.licenseNumber}</div>
            </div>
          </div>

          {doctor.bio && (
            <div className="border-t border-slate-100 pt-3">
              <h3 className="text-xs font-bold text-slate-600 mb-1">About</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{doctor.bio}</p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3 mt-3 space-y-2 text-sm">
            {doctor.chamberAddress && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>{doctor.chamberAddress}</span>
              </div>
            )}
            {doctor.bookingPhone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} /> {doctor.bookingPhone}
              </div>
            )}
            {doctor.languages && (
              <div className="flex items-center gap-2 text-slate-600">
                <Languages size={14} /> {doctor.languages}
              </div>
            )}
          </div>

          {/* Specialties */}
          {doctor.specialties?.length > 0 && (
            <div className="border-t border-slate-100 pt-3 mt-3">
              <h3 className="text-xs font-bold text-slate-600 mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {doctor.specialties.map((s: any, i: number) => (
                  <span key={i} className={`px-2 py-1 rounded-full text-xs ${
                    s.isPrimary ? "bg-blue-100 text-blue-700 font-medium" : "bg-slate-100 text-slate-700"
                  }`}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {doctor.qualifications?.length > 0 && (
            <div className="border-t border-slate-100 pt-3 mt-3">
              <h3 className="text-xs font-bold text-slate-600 mb-2">Qualifications</h3>
              <div className="space-y-1.5">
                {doctor.qualifications.map((q: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <GraduationCap size={14} className="mt-0.5 text-blue-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{q.degree}</span>
                      {q.institution && <span className="text-slate-500"> — {q.institution}</span>}
                      {q.year && <span className="text-xs text-slate-400"> ({q.year})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-800">Select Date</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {next7Days.map((d) => (
              <button key={d.date} onClick={() => setSelectedDate(d.date)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border min-w-[60px] ${
                  selectedDate === d.date
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white border-slate-200 text-slate-700"
                }`}>
                <span className="text-[10px] uppercase">{d.day}</span>
                <span className="text-lg font-bold">{d.dayNum}</span>
                {d.isToday && <span className="text-[9px]">Today</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Slots */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-800">Available Slots</h3>
          </div>

          {slotsLoading ? (
            <div className="text-center text-slate-500 py-6 text-sm">Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="text-center text-slate-500 py-6 text-sm">
              No slots available on this date.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((s, i) => {
                const selected = selectedSlot?.startTime === s.startTime;
                return (
                  <button key={i} onClick={() => s.isAvailable && setSelectedSlot(s)}
                    disabled={!s.isAvailable}
                    className={`py-2 px-1 rounded-xl border text-xs font-medium flex flex-col items-center ${
                      selected ? "bg-blue-600 text-white border-blue-600" :
                      s.isAvailable ? "bg-white border-slate-200 text-slate-700 hover:border-blue-400" :
                      "bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed"
                    }`}>
                    <span>{s.startTime}</span>
                    <span className="text-[9px] opacity-75">{s.slotType}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-sm ${
            message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Sticky Book Button */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">
                {new Date(selectedDate).toLocaleDateString()} • {selectedSlot.startTime}
              </p>
              <p className="text-lg font-bold text-slate-800">
                ৳ {Number(selectedSlot.consultationFee || doctor.consultationFee || 0).toFixed(0)}
              </p>
            </div>
            <button onClick={handleBook} disabled={booking}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center gap-2">
              <CheckCircle size={16} /> {booking ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import PublicHeader from "@/components/PublicHeader";
import PageTitleBar from "@/components/PageTitleBar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Star, Award, Briefcase, MapPin, Phone, Clock, MessageSquare, Calendar, CheckCircle, User, GraduationCap, Languages, Building2, X, Activity, Video, ShieldCheck } from "lucide-react";

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t: tr } = useLanguage();
  const { user } = useAuth();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [booking, setBooking] = useState(false);
  const [bookingType, setBookingType] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "CASH">("WALLET");
  const [slotFilter, setSlotFilter] = useState<"ALL" | "ONLINE" | "IN_PERSON">("ALL");
  const [consultMode, setConsultMode] = useState<"ONLINE" | "IN_PERSON">("IN_PERSON");
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [messaging, setMessaging] = useState(false);

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

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}/reviews`);
      const data = await res.json();
      if (data.success) setReviews(data.reviews);
    } catch (err) { console.error(err); }
  };

  const loadDoctor = async () => {
    setLoading(true);
    const res = await fetch(`/api/doctors/${doctorId}`);
    const data = await res.json().catch(() => ({}));
    if (data.doctor) setDoctor(data.doctor);
    setLoading(false);
  };

  const loadSlots = async (date: string) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/slots?date=${date}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load slots");
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error(err);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      loadDoctor();
      const today = new Date().toISOString().slice(0, 10);
      setSelectedDate(today);
      loadSlots(today);
      fetchReviews();
    }
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate]);
// PART2

  
  
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      const data = await res.json();
      if (res.ok) {
        setShowReviewModal(false);
        setReviewComment("");
        fetchReviews();
        loadDoctor();
      } else {
        alert(data.error || tr("dp.reviewFail", "Failed to submit review"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMessage = async () => {
    if (!user) {
      router.push(`/login?redirect=/doctors/${doctorId}`);
      return;
    }
    setMessaging(true);
    setMessage("");
    try {
      const res = await fetch('/api/chat/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // <--- CRUCIAL FIX
        body: JSON.stringify({ doctorId })
      });
      const data = await res.json();
      if (data.success && data.thread) {
        router.push(`/chat/${data.thread.id}`);
      } else {
        setMessage(tr("dp.chatFail", "Failed to start chat. Please try again."));
      }
    } catch (err) {
      setMessage(tr("dp.netErr", "Network error occurred."));
    } finally {
      setMessaging(false);
    }
  };

  const handleBook = async () => {
    if (!user) {
      router.push(`/login?redirect=/doctors/${doctorId}`);
      return;
    }
    if (!selectedSlot) {
      setMessage(tr("dp.selectSlot", "Please select a time slot"));
      return;
    }
    setBooking(true);
    setMessage("");

    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          doctorId,
          date: selectedDate,
          time: selectedSlot.startTime,
          scheduleId: selectedSlot.scheduleId,
          slotType: selectedSlot.slotType === 'BOTH' ? bookingType : selectedSlot.slotType,
          fee: Number(
            (selectedSlot.slotType === 'BOTH' && bookingType === 'ONLINE') ? (doctor?.onlineFee || selectedSlot.consultationFee || 0)
            : (selectedSlot.slotType === 'BOTH' && bookingType === 'OFFLINE') ? (doctor?.offlineFee || selectedSlot.consultationFee || 0)
            : (selectedSlot.consultationFee || doctor?.consultationFee || 0)
          ),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ " + (data.appointment?.serialNo ? "Serial #" + data.appointment.serialNo + " (~" + data.appointment.time + ")" : tr("dp.booked", "Appointment requested! Check your dashboard.")));
        setTimeout(() => router.push("/dashboard/appointments"), 1500);
      } else {
        setMessage(data.message || data.error || tr("dp.bookFail", "Booking failed"));
      }
    } catch (err) {
      console.error(err);
      setMessage(tr("dp.netErr2", "Network error. Please try again."));
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">{tr("dp.loading", "Loading...")}</div>;
  if (!doctor) return <div className="p-6 text-center text-slate-500">{tr("dp.notfound", "Doctor not found")}</div>;

  const avgRating = Number(doctor.averageRating || 0).toFixed(1);
// PART3

  return (
    <div className="min-h-screen pb-32" style={{ background: "linear-gradient(180deg,#dbeafe 0%,#eff6ff 38%,#f8fafc 100%)" }}>

      {/* Floating Message Button */}
      {(
        <div className="fixed right-6 z-40" style={{ bottom: selectedSlot ? 260 : 24 }}>
          <button 
            onClick={handleMessage} 
            disabled={messaging}
            className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full shadow-xl shadow-blue-600/30 ring-4 ring-white/60 flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50"
          >
            <MessageSquare size={24} />
          </button>
        </div>
      )}
  
      {/* Header */}
      <PublicHeader />
      <PageTitleBar title={tr("dp.details", "Doctor Details")} />
      <ScrollToHash />

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Doctor Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20" style={{ background: "linear-gradient(90deg,#1d4ed8 0%,#2563eb 45%,#06b6d4 100%)" }} />
          <div className="relative z-10 flex items-start gap-4 mb-4">
            <div className="w-24 h-24 mt-6 bg-white rounded-3xl flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-white shadow-xl shadow-blue-900/20">
              {doctor.user?.avatarUrl ? (
                <img src={doctor.user.avatarUrl} alt={doctor.user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="text-blue-600" size={36} />
              )}
            </div>
            <div className="flex-1 pt-[88px]">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Dr. {doctor.displayName || doctor.user?.name || tr("dp.unknown", "Unknown")}
              </h2>
              <p className="inline-block text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full font-semibold mt-1">{doctor.specialty}</p>
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
                  <Briefcase size={12} /> {doctor.experience} {tr("dp.yr", "yr")}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 p-3 rounded-2xl flex flex-col justify-center">
              <div className="text-[10px] text-blue-700 mb-1 uppercase tracking-wider font-semibold">
                {tr("dp.fees", "Consultation Fee")}
              </div>
              <div className="flex flex-col gap-1">
                {(doctor.onlineFee || doctor.offlineFee) ? (
                  <>
                    {doctor.onlineFee && <div className="text-sm font-bold text-blue-700">{tr("dp.onl", "Online")}: ৳ {Number(doctor.onlineFee).toFixed(0)}</div>}
                    {doctor.offlineFee && <div className="text-sm font-bold text-blue-700">{tr("dp.offl", "Offline")}: ৳ {Number(doctor.offlineFee).toFixed(0)}</div>}
                  </>
                ) : (
                  <div className="text-xl font-extrabold text-blue-700">৳ {Number(doctor.consultationFee || 0).toFixed(0)}</div>
                )}
              </div>
            </div>
            <div className="bg-white/70 border border-slate-100 p-3 rounded-2xl">
              <div className="text-[10px] text-slate-500 mb-1">{tr("dp.license", "License")}</div>
              <div className="text-sm font-mono text-slate-800 truncate">{doctor.licenseNumber}</div>
            </div>
          </div>

          {doctor.bio && (
            <div className="border-t border-slate-100 pt-3">
              <h3 className="text-xs font-bold text-slate-600 mb-1">{tr("dp.about", "About")}</h3>
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
              <h3 className="text-xs font-bold text-slate-600 mb-2">{tr("dp.specialties", "Specialties")}</h3>
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
              <h3 className="text-xs font-bold text-slate-600 mb-2">{tr("dp.qualifications", "Qualifications")}</h3>
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

        
      {/* Premium Features Section */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5 shadow-sm mt-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {doctor.emergencyAvailable && (
            <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-100">
              <Activity size={14} /> {tr("dp.emergency", "Emergency Available")}
            </span>
          )}
          {doctor.videoIntroUrl && (
            <a href={doctor.videoIntroUrl} target="_blank" rel="noopener noreferrer" className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-purple-100 hover:bg-purple-100 transition">
              <Video size={14} /> {tr("dp.video", "Watch Intro Video")}
            </a>
          )}
        </div>
        
        {doctor.services && (
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{tr("dp.services", "Services")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {doctor.services.split(',').map((s: string, i: number) => (
                <span key={i} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200">{s.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {doctor.insurances && (
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{tr("dp.insurances", "Accepted Insurances")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {doctor.insurances.split(',').map((ins: string, i: number) => (
                <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md text-xs flex items-center gap-1 font-medium">
                  <ShieldCheck size={12} /> {ins.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Practice Locations (Chambers) */}
      {doctor.chambers && doctor.chambers.length > 0 && (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5 shadow-sm mt-4">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <Building2 className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-800">{tr("dp.locations", "Practice Locations")}</h3>
          </div>
          <div className="grid gap-3">
            {doctor.chambers.map((chamber: any) => (
              <div key={chamber.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {chamber.name}
                    {chamber.isPrimary && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">{tr("dp.primary", "Primary")}</span>}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">{chamber.address}, {chamber.area} {chamber.city}</p>
                  {chamber.operatingHours && (
                    <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1"><Clock size={12}/> {chamber.operatingHours}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience Section */}
      {doctor.experiences && doctor.experiences.length > 0 && (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5 shadow-sm mt-4">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <Briefcase className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-800">{tr("dp.experience", "Experience")}</h3>
          </div>
          <div className="space-y-4">
            {doctor.experiences.map((exp: any) => (
              <div key={exp.id} className="flex gap-3">
                <div className="w-1 bg-blue-200 rounded-full mt-1 mb-1"></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{exp.designation}</h4>
                  <p className="text-xs text-slate-600">{exp.hospitalName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{exp.startYear} - {exp.isCurrent ? "Present" : exp.endYear}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Awards Section */}
      {doctor.awards && doctor.awards.length > 0 && (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5 shadow-sm mt-4">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <Award className="text-amber-500" size={18} />
            <h3 className="font-bold text-slate-800">{tr("dp.awards", "Awards & Recognitions")}</h3>
          </div>
          <div className="space-y-3">
            {doctor.awards.map((award: any) => (
              <div key={award.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Award size={14} className="text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{award.title}</h4>
                  <p className="text-xs text-slate-600">{award.issuer} • {award.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memberships Section */}
      {doctor.memberships && doctor.memberships.length > 0 && (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5 shadow-sm mt-4">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <Building2 className="text-indigo-500" size={18} />
            <h3 className="font-bold text-slate-800">{tr("dp.memberships", "Memberships")}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {doctor.memberships.map((mem: any) => (
              <div key={mem.id} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-100 flex items-center gap-2">
                {mem.organization}
                {mem.role && <span className="text-xs text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-md">{mem.role}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Picker */}
        {doctor.isClaimed === false && (
          <div className="bg-white/95 rounded-3xl border border-white/70 p-5 text-center space-y-3">
            <p className="font-bold text-slate-800">This profile is not claimed yet</p>
            <p className="text-sm text-slate-600">Online booking is available once the doctor joins Tshastho.</p>
            <a href={`/register/doctor?bmdc=${encodeURIComponent(doctor.licenseNumber || "")}`} className="inline-block bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-sm font-bold">
              Are you this doctor? Claim this profile
            </a>
          </div>
        )}
        <div id="slots" hidden={doctor.isClaimed === false} className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-800">{tr("dp.selectDate", "Select Date")}</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {next7Days.map((d) => (
              <button key={d.date} onClick={() => setSelectedDate(d.date)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border min-w-[60px] ${
                  selectedDate === d.date
                    ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white border-blue-600 shadow-md shadow-blue-600/25"
                    : "bg-white border-slate-200 text-slate-700"
                }`}>
                <span className="text-[11px] uppercase font-medium">{tr("dp.day." + String(d.day).toUpperCase().slice(0, 3), String(d.day))}</span>
                <span className="text-lg font-bold">{d.dayNum}</span>
                {d.isToday && <span className="text-[9px]">{tr("dp.today", "Today")}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Slots */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-800">{tr("dp.slots", "Available Slots")}</h3>
            
            <div className="flex bg-slate-100 p-1 rounded-lg ml-auto">
              {(["ALL", "ONLINE", "IN_PERSON"] as const).map(f => (
                <button key={f} onClick={() => setSlotFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${slotFilter === f ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  {f === "ALL" ? tr("dp.all", "All") : f === "ONLINE" ? tr("dp.onl", "Online") : tr("dp.offl", "Offline")}
                </button>
              ))}
            </div>
  
          </div>

          {slotsLoading ? (
            <div className="text-center text-slate-500 py-6 text-sm">{tr("dp.loadingSlots", "Loading slots...")}</div>
          ) : slots.length === 0 ? (
            <div className="text-center text-slate-500 py-6 text-sm">
              {tr("dp.noSlots", "No slots available on this date.")}
            </div>
          ) : (
            (() => {
            const matchF = (s: any) => slotFilter === "ALL" || s.slotType === 'BOTH' || (slotFilter === "ONLINE" ? s.slotType === 'ONLINE' : s.slotType === 'IN_PERSON');
            const defs = [
              { k: "morning", icon: "🌅", label: tr("dp.morning", "Morning"), test: (h: number) => h < 12 },
              { k: "afternoon", icon: "☀️", label: tr("dp.afternoon", "Afternoon"), test: (h: number) => h >= 12 && h < 16 },
              { k: "evening", icon: "🌇", label: tr("dp.evening", "Evening"), test: (h: number) => h >= 16 && h < 20 },
              { k: "night", icon: "🌙", label: tr("dp.night", "Night"), test: (h: number) => h >= 20 },
            ];
            const groups = defs
              .map((g) => ({ ...g, list: slots.filter((s: any) => matchF(s) && g.test(parseInt(String(s.startTime).slice(0, 2), 10) || 0)) }))
              .filter((g) => g.list.length > 0);
            if (groups.length === 0) return <div className="text-center text-slate-500 py-6 text-sm">{tr("dp.noSlots", "No slots available on this date.")}</div>;
            return (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  🎥 {tr("dp.onl", "Online")} · 🏥 {tr("dp.chamberLbl", "In-Person")} · ⇄ {tr("dp.both", "Online/Offline")}
                </p>
                {groups.map((g, gi) => {
                  const free = g.list.filter((s: any) => s.isAvailable).length;
                  const hasSel = !!selectedSlot && g.list.some((s: any) => s.startTime === selectedSlot.startTime);
                  return (
                    <details key={String(selectedDate) + g.k} open={gi === 0 || hasSel} className="rounded-2xl border border-slate-100 bg-slate-50/80">
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span className="font-semibold text-slate-800 text-sm">{g.icon} {g.label}</span>
                        <span className="text-xs text-slate-500">{free} / {g.list.length} {tr("dp.slotsCount", "slots")}</span>
                      </summary>
                      <div className="grid grid-cols-4 gap-2 px-3 pb-3">
                        {g.list.map((s: any, i: number) => {
                          const selected = selectedSlot?.startTime === s.startTime;
                          return (
                            <button key={i} onClick={() => s.isAvailable && setSelectedSlot(s)}
                              disabled={!s.isAvailable}
                              title={s.chamberName || undefined}
                              className={`py-2.5 px-1 rounded-xl border text-sm font-semibold flex flex-col items-center leading-tight transition ${
                                selected ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25" :
                                s.isAvailable ? "bg-white border-slate-200 text-slate-700 hover:border-blue-400" :
                                "bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed"
                              }`}>
                              <span>{s.bookingMode === 'SERIAL' ? 'Serial #' + s.nextSerial : s.startTime}</span>
                            {s.bookingMode === 'SERIAL' && <span className="text-[10px] font-normal opacity-80">~{s.estimatedTime}</span>}
                              <span className="text-[10px] mt-0.5">{s.slotType === 'ONLINE' ? '🎥' : s.slotType === 'BOTH' ? '⇄' : '🏥'}</span>
                              {s.slotType === 'IN_PERSON' && s.chamberName && (
                                <span className="text-[8px] w-full truncate text-center opacity-70">{s.chamberName}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            );
          })()
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

      
      {/* Reviews Section */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5 shadow-sm mx-4 md:mx-0 mt-4 mb-8">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-800">{tr("dp.reviews", "Patient Reviews")} ({doctor.totalReviews || 0})</h3>
          </div>
          <button 
            onClick={() => setShowReviewModal(true)}
            className="text-sm bg-gradient-to-r from-blue-50 to-sky-50 text-blue-600 px-4 py-2 rounded-full font-semibold border border-blue-100 hover:bg-blue-100 transition"
          >
            {tr("dp.writeReview", "Write a Review")}
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-4">{tr("dp.noReviews", "No reviews yet. Be the first to review!")}</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-600 font-bold text-xs">
                      {review.patient?.avatarUrl ? (
                        <img src={review.patient.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        review.patient?.name?.charAt(0) || 'P'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{review.patient?.name || tr("dp.anon", "Anonymous Patient")}</p>
                      <p className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} size={12} className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-slate-600 mt-2 bg-white/70 border border-slate-100 p-3 rounded-2xl">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Rate Dr. {doctor.user?.name}</h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{tr("dp.yourRating", "Your Rating")}</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button type="button" key={star} onClick={() => setReviewRating(star)} className="focus:outline-none">
                      <Star size={32} className={star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{tr("dp.commentOpt", "Comment (Optional)")}</label>
                <textarea rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  placeholder={tr("dp.shareExp", "Share your experience...")} />
              </div>
              <button type="submit" disabled={submittingReview} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Book Button */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/70 px-4 pt-3 pb-4 shadow-[0_-8px_30px_rgba(30,64,175,0.12)] z-40 rounded-t-3xl">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {new Date(selectedDate).toLocaleDateString()} • {selectedSlot.startTime}
              </p>
              <p className="text-lg font-bold text-slate-800">
                ৳ {Number((selectedSlot.slotType === 'BOTH' && bookingType === 'ONLINE') ? (doctor?.onlineFee || selectedSlot.consultationFee || 0) : (selectedSlot.slotType === 'BOTH' && bookingType === 'OFFLINE') ? (doctor?.offlineFee || selectedSlot.consultationFee || 0) : (selectedSlot.consultationFee || doctor?.consultationFee || 0)).toFixed(0)}
              </p>
            </div>

            {selectedSlot.slotType !== 'ONLINE' && consultMode !== 'ONLINE' && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPaymentMethod('WALLET')} className={`text-xs px-3 py-2 rounded-lg border-2 font-bold transition ${paymentMethod === 'WALLET' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}>{tr("dp.wallet", "Wallet")}</button>
                <button type="button" onClick={() => setPaymentMethod('CASH')} className={`text-xs px-3 py-2 rounded-lg border-2 font-bold transition ${paymentMethod === 'CASH' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>{tr("dp.cash", "Cash at Chamber")}</button>
              </div>
            )}

            {selectedSlot.slotType === 'BOTH' && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setBookingType('ONLINE')} className={`py-2 rounded-lg text-xs font-medium border ${bookingType === 'ONLINE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}>{tr("dp.online", "Online (Video)")}</button>
                <button type="button" onClick={() => setBookingType('OFFLINE')} className={`py-2 rounded-lg text-xs font-medium border ${bookingType === 'OFFLINE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}>{tr("dp.inPerson", "In-Person")}</button>
              </div>
            )}

            <button onClick={handleBook} disabled={booking}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-blue-600/30 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2">
              <CheckCircle size={18} /> {booking ? tr("dp.booking", "Booking...") : tr("dp.bookBtn", "Book Appointment")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScrollToHash() {
  useEffect(() => {
    const h = window.location.hash;
    if (!h) return;
    const el = document.querySelector(h);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, []);
  return null;
}

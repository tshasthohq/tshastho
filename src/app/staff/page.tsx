"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, MapPin, LogIn, LogOut, CheckCircle, AlertCircle, Loader2, User, Bell, Calendar, Timer, Phone, Camera, Home, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import SelfieCapture from "@/components/staff/SelfieCapture";
import { useAuth } from "@/hooks/useAuth";

export default function StaffPage() {
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();
  const [userName, setUserName] = useState("Staff");
  const [staffRole, setStaffRole] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [workingHours, setWorkingHours] = useState("0h 0m");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<"in" | "out">("in");
  const [capturedSelfie, setCapturedSelfie] = useState("");

  // Load today's attendance
  const loadAttendance = () => {
    const email = user?.email;
    if (!email) { router.push("/login"); return; }

    fetch("/api/pharmacy/attendance/today", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.active) setTodayAttendance({ ...data.active, isCheckedIn: true });
      else if (data.completed) setTodayAttendance({ ...data.completed, isCheckedIn: false });
      else setTodayAttendance(null);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  useEffect(() => {
    const storedName = user?.name;
    const storedRole = user?.staffRole;
    if (storedName) setUserName(storedName);
    if (storedRole) setStaffRole(storedRole);

    loadAttendance();

    // Live clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate live working hours
  useEffect(() => {
    if (!todayAttendance || !todayAttendance.isCheckedIn) {
      if (todayAttendance?.totalHours) {
        const h = parseFloat(todayAttendance.totalHours);
        const hrs = Math.floor(h);
        const mins = Math.round((h - hrs) * 60);
        setWorkingHours(hrs + "h " + mins + "m");
      } else {
        setWorkingHours("0h 0m");
      }
      return;
    }

    const interval = setInterval(() => {
      const checkIn = new Date(todayAttendance.checkInTime);
      const diff = (new Date().getTime() - checkIn.getTime()) / (1000 * 60);
      const hrs = Math.floor(diff / 60);
      const mins = Math.floor(diff % 60);
      setWorkingHours(hrs + "h " + mins + "m");
    }, 1000);

    return () => clearInterval(interval);
  }, [todayAttendance]);

  // Get GPS location
  const getLocation = () => {
    return new Promise<{ lat: string; lng: string } | null>((resolve) => {
      if (!navigator.geolocation) {
        setLocationError("GPS not supported");
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          };
          setLocation(loc);
          setLocationError("");
          resolve(loc);
        },
        (error) => {
          setLocationError("Location permission denied");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const uploadSelfie = async (dataUrl: string): Promise<string | null> => {
    try {
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      const fd = new FormData();
      fd.append("file", blob, "selfie-" + Date.now() + ".jpg");
      
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await upRes.json();
      return upRes.ok && data.url ? data.url : null;
    } catch (err) {
      console.error("Selfie upload error:", err);
      return null;
    }
  };

  const handleCheckIn = async (selfie: string) => {
    setActionLoading(true);
    setMessage("");
    setShowCamera(false);

    const loc = await getLocation();
    const email = user?.email;

    // Upload selfie
    const selfieUrl = await uploadSelfie(selfie);
    if (!selfieUrl) {
      setMessage("❌ Selfie upload failed. Try again.");
      setActionLoading(false);
      return;
    }

    const res = await fetch("/api/pharmacy/attendance/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        lat: loc?.lat || null,
        lng: loc?.lng || null,
        selfie: selfieUrl,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Checked in successfully!");
      loadAttendance();
    } else {
      setMessage(data.message || "Check-in failed");
    }
    setActionLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleCheckOut = async (selfie: string) => {
    setActionLoading(true);
    setMessage("");
    setShowCamera(false);

    const loc = await getLocation();
    const email = user?.email;

    const selfieUrl = await uploadSelfie(selfie);
    if (!selfieUrl) {
      setMessage("❌ Selfie upload failed. Try again.");
      setActionLoading(false);
      return;
    }

    const res = await fetch("/api/pharmacy/attendance/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        lat: loc?.lat || null,
        lng: loc?.lng || null,
        selfie: selfieUrl,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Checked out! Total: " + data.totalHours + " hours");
      loadAttendance();
    } else {
      setMessage(data.message || "Check-out failed");
    }
    setActionLoading(false);
    setTimeout(() => setMessage(""), 4000);
  };

  const formatTime = (d: any) => {
    if (!d) return "--:--";
    return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (d: any) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isCheckedIn = todayAttendance?.isCheckedIn === true;
  const isCompleted = todayAttendance && !todayAttendance.isCheckedIn;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 size={32} className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-10">
      <header className="h-16 bg-white/10 backdrop-blur border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">Tshastho</span>
          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">Staff</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pharmacy" className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <LayoutDashboard size={14} className="text-white" />
            <span className="text-xs font-medium text-white">Dashboard</span>
          </Link>
          <button onClick={() => { localStorage.clear(); document.cookie = "userRole=; path=/; max-age=0"; router.push("/login"); }} className="text-red-300 p-2">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6">
        {/* Welcome */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <User size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Hi, {userName}!</h1>
          {staffRole && (
            <p className="text-sm text-blue-300 mt-1">{staffRole}</p>
          )}
        </div>

        {/* Live Clock */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6 mb-6 text-center">
          <p className="text-6xl font-bold text-white tracking-tight">
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
          </p>
          <p className="text-sm text-slate-300 mt-2">
            {currentTime.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16} /> Today's Status
            </p>
            <span className={"text-xs px-3 py-1 rounded-full font-bold " + (
              isCheckedIn ? "bg-green-500 text-white" :
              isCompleted ? "bg-blue-500 text-white" :
              "bg-slate-500 text-white"
            )}>
              {isCheckedIn ? "● Working" : isCompleted ? "✓ Completed" : "○ Not Started"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Check In</p>
              <p className="text-lg font-bold text-white">{formatTime(todayAttendance?.checkInTime)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Check Out</p>
              <p className="text-lg font-bold text-white">{formatTime(todayAttendance?.checkOutTime)}</p>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 text-center mb-4">
            <p className="text-[10px] text-blue-100 uppercase font-bold flex items-center justify-center gap-1">
              <Timer size={12} /> {isCheckedIn ? "Working Hours (Live)" : "Total Hours"}
            </p>
            <p className="text-3xl font-bold text-white mt-1">{workingHours}</p>
          </div>

          {/* Location Status */}
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 mb-4">
            <MapPin size={14} className={location ? "text-green-400" : "text-slate-400"} />
            <p className="text-[11px] text-slate-300 flex-1">
              {location ? "GPS Ready: " + location.lat + ", " + location.lng : locationError || "GPS will activate on Check-In"}
            </p>
          </div>

          {/* Action Button */}
          {!todayAttendance && (
            <button
              onClick={() => { setCameraMode("in"); setShowCamera(true); }}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
              Check In with Selfie
            </button>
          )}

          {isCheckedIn && (
            <button
              onClick={() => { setCameraMode("out"); setShowCamera(true); }}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
              Check Out with Selfie
            </button>
          )}

          {isCompleted && (
            <div className="bg-green-500/20 border border-green-500/40 rounded-2xl p-4 text-center">
              <CheckCircle size={28} className="text-green-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-green-300">Work Completed Today! ✅</p>
              <p className="text-[10px] text-green-400/80 mt-1">Come back tomorrow</p>
            </div>
          )}

          {message && (
            <p className={"text-center text-sm font-medium mt-3 " + (message.includes("✅") ? "text-green-400" : "text-red-400")}>{message}</p>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-slate-300 space-y-1">
              <p>• Location is captured on Check-In and Check-Out</p>
              <p>• Late arrivals (after 9:00 AM) are marked in red</p>
              <p>• Your working hours are calculated automatically</p>
              <p>• Contact your pharmacy owner for any issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selfie Camera Modal */}
      {showCamera && (
        <SelfieCapture
          onCapture={(dataUrl) => {
            if (cameraMode === "in") handleCheckIn(dataUrl);
            else handleCheckOut(dataUrl);
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

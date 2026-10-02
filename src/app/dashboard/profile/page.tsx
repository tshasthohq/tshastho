"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Droplet, User as UserIcon, LogOut } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    router.push("/login");
  };

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="p-6 text-slate-500">Loading profile...</div>;

  // যদি ইউজার না পাওয়া যায়, তবুও লগআউট বাটন দেখাবে
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-medium mb-4">User not found. Please login again.</p>
        <button onClick={handleLogout} className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2">
          <LogOut size={20} /> Go to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={32} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user.name || "User"}</h2>
            <p className="text-slate-500 text-sm">Patient ID: TSH-{user.id.slice(0, 5).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Mail className="text-blue-600" size={20} />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-800">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Phone className="text-blue-600" size={20} />
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm font-medium text-slate-800">{user.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Droplet className="text-red-500" size={20} />
            <div>
              <p className="text-xs text-slate-500">Blood Group</p>
              <p className="text-sm font-medium text-slate-800">{user.patientProfile?.bloodGroup || "Not set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <MapPin className="text-blue-600" size={20} />
            <div>
              <p className="text-xs text-slate-500">Address</p>
              <p className="text-sm font-medium text-slate-800">{user.patientProfile?.address || "Not set"}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

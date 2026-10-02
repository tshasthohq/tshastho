"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Droplet, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      setLoading(false);
      return;
    }
    fetch("/api/user/profile", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setProfile(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, authLoading]);

  if (loading || authLoading)
    return <div className="p-6 text-slate-500">Loading profile...</div>;

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-medium mb-4">
          User not found. Please login again.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-red-500 text-red-600 px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2"
        >
          <LogOut size={20} /> Go to Login
        </button>
      </div>
    );
  }

  const displayUser = profile || user;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
            {displayUser?.name ? displayUser.name.charAt(0).toUpperCase() : <span>U</span>}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {displayUser?.name || "User"}
            </h2>
            <p className="text-slate-500 text-sm">
              Patient ID: TSH-{displayUser?.id?.slice(0, 5).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Mail className="text-blue-600" size={20} />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-800">
                {displayUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Phone className="text-blue-600" size={20} />
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm font-medium text-slate-800">
                {displayUser?.phone || "Not set"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Droplet className="text-red-500" size={20} />
            <div>
              <p className="text-xs text-slate-500">Blood Group</p>
              <p className="text-sm font-medium text-slate-800">
                {displayUser?.patientProfile?.bloodGroup || "Not set"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <MapPin className="text-blue-600" size={20} />
            <div>
              <p className="text-xs text-slate-500">Address</p>
              <p className="text-sm font-medium text-slate-800">
                {displayUser?.patientProfile?.address || displayUser?.address || "Not set"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

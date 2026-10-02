"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, User, Stethoscope, Pill, LogOut, Settings, BarChart3, TrendingUp, Users } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "DOCTOR" | "PHARMACY_OWNER">("ALL");

  const loadData = () => {
    fetch("/api/admin/pending-users", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (userId: string, action: "APPROVED" | "REJECTED") => {
    let reason = "";
    if (action === "REJECTED") {
      reason = prompt("Enter rejection reason:") || "Documents not valid";
    }
    await fetch("/api/admin/verify-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, reason }),
    });
    loadData();
  };

  const handleLogout = () => {
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const filtered = users.filter(u => u.status === filter && (roleFilter === "ALL" || u.role === roleFilter));
  const counts = {
    PENDING: users.filter(u => u.status === "PENDING").length,
    APPROVED: users.filter(u => u.status === "APPROVED").length,
    REJECTED: users.filter(u => u.status === "REJECTED").length,
  };

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-600">Tshastho</span>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Super Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/analytics" className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <BarChart3 size={20} className="text-blue-600" />
          </Link>
          <Link href="/admin/settings" className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <Settings size={20} className="text-slate-600" />
          </Link>
          <button onClick={handleLogout} className="text-red-500 p-2">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Verification Center</h1>
        <p className="text-slate-500 text-sm mb-6">Verify Doctor & Pharmacy registrations</p>

        {/* Analytics Shortcut */}
        <Link href="/admin/analytics" className="block bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl p-5 mb-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="font-bold">Platform Analytics</p>
                <p className="text-xs text-green-100">View revenue, users, and stats</p>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </Link>

        {/* Customers Shortcut */}
        <Link href="/admin/customers" className="block bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl p-5 mb-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="font-bold">All Customers</p>
                <p className="text-xs text-orange-100">View customers across all pharmacies</p>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </Link>

        {/* Settings Shortcut */}
        <Link href="/admin/settings" className="block bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl p-5 mb-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Settings size={24} />
              </div>
              <div>
                <p className="font-bold">Platform Settings</p>
                <p className="text-xs text-blue-100">Configure fees, delivery charges, and more</p>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </Link>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{counts.PENDING}</p>
            <p className="text-xs text-yellow-700">Pending</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.APPROVED}</p>
            <p className="text-xs text-green-700">Approved</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{counts.REJECTED}</p>
            <p className="text-xs text-red-700">Rejected</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(["ALL", "DOCTOR", "PHARMACY_OWNER"] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${roleFilter === r ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {r === "ALL" ? "All Roles" : r.replace("_", " ")}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500">
            No {filter.toLowerCase()} users found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((u) => (
              <div key={u.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${u.role === "DOCTOR" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                    {u.role === "DOCTOR" ? <Stethoscope size={24} /> : <Pill size={24} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{u.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "DOCTOR" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{u.email} • {u.phone}</p>

                    {u.doctorProfile && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">License</p>
                          <p className="font-medium text-slate-800">{u.doctorProfile.licenseNumber}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">Specialty</p>
                          <p className="font-medium text-slate-800">{u.doctorProfile.specialty}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">Experience</p>
                          <p className="font-medium text-slate-800">{u.doctorProfile.experience} yrs</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">Fee</p>
                          <p className="font-medium text-slate-800">৳{u.doctorProfile.consultationFee}</p>
                        </div>
                      </div>
                    )}

                    {u.pharmacyProfile && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">Shop Name</p>
                          <p className="font-medium text-slate-800">{u.pharmacyProfile.shopName}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">Drug License</p>
                          <p className="font-medium text-slate-800">{u.pharmacyProfile.drugLicense}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">Trade License</p>
                          <p className="font-medium text-slate-800">{u.pharmacyProfile.tradeLicense}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-500">City</p>
                          <p className="font-medium text-slate-800">{u.pharmacyProfile.city}</p>
                        </div>
                      </div>
                    )}

                    {u.rejectReason && (
                      <p className="mt-2 text-xs text-red-500">Reason: {u.rejectReason}</p>
                    )}
                  </div>
                </div>

                {u.status === "PENDING" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => handleAction(u.id, "APPROVED")} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => handleAction(u.id, "REJECTED")} className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-medium">
                      <XCircle size={16} /> Reject
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, User, Stethoscope, Pill, LogOut, Settings, BarChart3, TrendingUp, Users, CreditCard, Clock, Activity, ShieldCheck, PhoneCall, Wallet, Droplet, Building2 } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const openDoc = async (v: string | null) => {
    if (!v) { setSelectedImage(null); return; }
    if (!v.startsWith("private:")) { setSelectedImage(v); return; }
    const u = `/api/admin/doc-file?path=${encodeURIComponent(v)}`;
    if (v.toLowerCase().endsWith(".pdf")) window.open(u, "_blank");
    else setSelectedImage(u);
  };
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "DOCTOR" | "PHARMACY_OWNER" | "DIAGNOSTIC_OWNER" | "BLOOD_BANK_OWNER">("ALL");

  const loadData = () => {
    fetch('/api/admin/pending-users', { method: 'POST' })
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
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    router.push("/login");
  };

  const filtered = users.filter(u => u.status === filter && (roleFilter === "ALL" || u.role === roleFilter));
  const counts = {
    PENDING: users.filter(u => u.status === "PENDING").length,
    APPROVED: users.filter(u => u.status === "APPROVED").length,
    REJECTED: users.filter(u => u.status === "REJECTED").length,
  };

  const shortcuts = [
    { href: "/admin/settings/payments", title: "Payment Methods", icon: CreditCard, color: "from-purple-500 to-pink-600", desc: "Manage bKash, Nagad" },
    { href: "/admin/settings/gateways", title: "Gateways", icon: ShieldCheck, color: "from-slate-700 to-slate-900", desc: "SSLCommerz API" },
    { href: "/admin/topups", title: "Top-Ups", icon: Clock, color: "from-amber-400 to-orange-500", desc: "Pending approvals" },
    { href: "/admin/payouts", title: "Payouts", icon: Wallet, color: "from-blue-500 to-indigo-600", desc: "Doctor withdrawals" },
    { href: "/admin/transactions", title: "Transactions", icon: Activity, color: "from-teal-400 to-cyan-600", desc: "Wallet activity" },
    { href: "/admin/analytics", title: "Analytics", icon: TrendingUp, color: "from-emerald-500 to-green-700", desc: "Revenue & stats" },
    { href: "/admin/blood-donors", title: "Blood Donors", icon: Droplet, color: "from-red-500 to-rose-700", desc: "Verify donors" },
    { href: "/admin/blood-requests", title: "Blood Requests", icon: Droplet, color: "from-rose-500 to-red-700", desc: "Moderate requests" },
    { href: "/admin/hospitals", title: "Hospitals", icon: Building2, color: "from-sky-500 to-blue-700", desc: "Approve hospitals" },
    { href: "/admin/customers", title: "Customers", icon: Users, color: "from-orange-500 to-red-600", desc: "View all users" },
    { href: "/admin/settings", title: "Settings", icon: Settings, color: "from-blue-500 to-indigo-600", desc: "Platform config" },
    { href: "/admin/settings/hotline", title: "Hotline", icon: PhoneCall, color: "from-emerald-500 to-teal-600", desc: "Support number" },
  ];

  if (loading) return <div className="p-6 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-blue-600">Tshastho</span>
            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Super Admin</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/admin/analytics" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition">
              <BarChart3 size={20} />
            </Link>
            <Link href="/admin/settings" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition">
              <Settings size={20} />
            </Link>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Premium Quick Links Grid */}
        <h2 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Admin Controls</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {shortcuts.map((sc) => (
            <Link key={sc.href} href={sc.href} className={`bg-gradient-to-br ${sc.color} p-4 rounded-2xl shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5`}>
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <sc.icon size={18} className="text-white" />
              </div>
              <h3 className="text-white font-bold text-sm mb-1">{sc.title}</h3>
              <p className="text-white/80 text-[10px] leading-tight">{sc.desc}</p>
            </Link>
          ))}
        </div>

        {/* Verification Center */}
        <h2 className="text-xl font-bold text-slate-800 mb-1">Verification Center</h2>
        <p className="text-slate-500 text-sm mb-4">Verify Doctor & Pharmacy registrations.</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 md:p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{counts.PENDING}</p>
            <p className="text-xs font-medium text-yellow-700">Pending</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.APPROVED}</p>
            <p className="text-xs font-medium text-green-700">Approved</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{counts.REJECTED}</p>
            <p className="text-xs font-medium text-red-700">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex gap-2">
            {["PENDING", "APPROVED", "REJECTED"].map(f => (
              <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${filter === f ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>
          <div className="flex gap-2">
            {["ALL", "DOCTOR", "PHARMACY_OWNER", "DIAGNOSTIC_OWNER", "BLOOD_BANK_OWNER"].map(r => (
              <button key={r} onClick={() => setRoleFilter(r as any)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${roleFilter === r ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                {r === "ALL" ? "All Roles" : r.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        {filtered.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center text-slate-500">
            No {filter.toLowerCase()} users found.
          </div>
        ) : (
          <div className="space-y-3">
{selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={() => openDoc(null)}>
          <div className="relative max-w-2xl w-full bg-white rounded-2xl p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => openDoc(null)} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold z-10">X</button>
            <img src={selectedImage} alt="Document" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
            {filtered.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${u.role === "DOCTOR" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                    {u.role === "DOCTOR" ? <Stethoscope size={20} /> : <Pill size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-sm">{u.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.role === "DOCTOR" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{u.email} • {u.phone}</p>
                  </div>
                </div>

                {u.doctorProfile && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                    <div><span className="text-slate-500">License:</span> <span className="font-medium">{u.doctorProfile.licenseNumber}</span></div>
                    <div><span className="text-slate-500">Specialty:</span> <span className="font-medium">{u.doctorProfile.specialty}</span></div>
                    <div><span className="text-slate-500">Exp:</span> <span className="font-medium">{u.doctorProfile.experience} yrs</span></div>
                    <div><span className="text-slate-500">Fee:</span> <span className="font-medium">৳{u.doctorProfile.consultationFee}</span></div>
                  
    </div>
                )}

{u.diagnostic && (
  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 mb-3">
    <div><span className="text-slate-500">Center:</span> <span className="font-medium">{u.diagnostic.centerName}</span></div>
    <div><span className="text-slate-500">Trade Lic:</span> <span className="font-medium">{u.diagnostic.tradeLicense}</span></div>
    <div><span className="text-slate-500">DGHS Lic:</span> <span className="font-medium">{u.diagnostic.dghsLicense}</span></div>
    <div><span className="text-slate-500">City:</span> <span className="font-medium">{u.diagnostic.city}</span></div>
    <div className="flex gap-3 pt-1">
      {u.diagnostic.tradeLicenseUrl && <button onClick={() => openDoc(u.diagnostic.tradeLicenseUrl)} className="text-blue-600 text-[10px] font-bold hover:underline">View Trade License</button>}
      {u.diagnostic.dghsLicenseUrl && <button onClick={() => openDoc(u.diagnostic.dghsLicenseUrl)} className="text-blue-600 text-[10px] font-bold hover:underline">View DGHS License</button>}
    </div>
  </div>
)}
                {u.pharmacyProfile && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                    <div><span className="text-slate-500">Shop:</span> <span className="font-medium">{u.pharmacyProfile.shopName}</span></div>
                    <div><span className="text-slate-500">Drug Lic:</span> <span className="font-medium">{u.pharmacyProfile.drugLicense}</span></div>
                    <div><span className="text-slate-500">Trade Lic:</span> <span className="font-medium">{u.pharmacyProfile.tradeLicense}</span></div>
                    <div><span className="text-slate-500">City:</span> <span className="font-medium">{u.pharmacyProfile.city}</span></div>
<div className="col-span-2 mt-2 pt-2 border-t border-slate-200 flex gap-3">
  {u.pharmacyProfile.drugLicenseUrl && <button onClick={() => openDoc(u.pharmacyProfile.drugLicenseUrl)} className="text-blue-600 text-[10px] font-bold hover:underline">View Drug License</button>}
  {u.pharmacyProfile.tradeLicenseUrl && <button onClick={() => openDoc(u.pharmacyProfile.tradeLicenseUrl)} className="text-blue-600 text-[10px] font-bold hover:underline">View Trade License</button>}
</div>
                  </div>
                )}

                {u.bloodBank && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-red-50 p-3 rounded-xl">
                    <div><span className="text-slate-500">Blood Bank:</span> <span className="font-medium">{u.bloodBank.name}</span></div>
                    <div><span className="text-slate-500">DGHS Lic:</span> <span className="font-medium">{u.bloodBank.dghsLicense}</span></div>
                    <div><span className="text-slate-500">Trade Lic:</span> <span className="font-medium">{u.bloodBank.tradeLicense || "-"}</span></div>
                    <div><span className="text-slate-500">District:</span> <span className="font-medium">{u.bloodBank.district}</span></div>
                    <div className="col-span-2"><span className="text-slate-500">Address:</span> <span className="font-medium">{u.bloodBank.address}</span></div>
                    {u.bloodBank.licenseUrl && (
                      <div className="col-span-2 pt-1">
                        <button onClick={() => openDoc(u.bloodBank.licenseUrl)} className="text-blue-600 text-[10px] font-bold hover:underline">View License</button>
                      </div>
                    )}
                  </div>
                )}

                {u.rejectReason && <p className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded-lg">Reason: {u.rejectReason}</p>}

                {u.status === "PENDING" && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button onClick={() => handleAction(u.id, "APPROVED")} className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => handleAction(u.id, "REJECTED")} className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 transition">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

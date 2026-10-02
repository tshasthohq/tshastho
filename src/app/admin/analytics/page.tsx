"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ShoppingBag, DollarSign, Activity, TrendingUp, Stethoscope, Pill, Clock, CheckCircle, Package, Calendar, Wallet } from "lucide-react";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading analytics...</div>;
  if (!data) return <div className="p-6 text-center text-slate-500">No data</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">Platform Analytics</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Revenue Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-100">Total Platform Earnings</p>
              <p className="text-3xl font-bold">৳{data.revenue.platformEarnings.toFixed(2)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-blue-100">Today</p>
              <p className="text-lg font-bold">৳{data.revenue.todayPlatformEarnings.toFixed(0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-blue-100">This Month</p>
              <p className="text-lg font-bold">৳{data.revenue.monthPlatformEarnings.toFixed(0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-blue-100">All Time</p>
              <p className="text-lg font-bold">৳{data.revenue.platformEarnings.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Users size={18} /> Users Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <Users size={20} className="text-blue-600 mb-2" />
            <p className="text-xs text-slate-500">Total Users</p>
            <p className="text-xl font-bold text-slate-800">{data.users.total}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <Users size={20} className="text-blue-700 mb-2" />
            <p className="text-xs text-blue-700">Patients</p>
            <p className="text-xl font-bold text-blue-700">{data.users.patients}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
            <Stethoscope size={20} className="text-green-700 mb-2" />
            <p className="text-xs text-green-700">Doctors</p>
            <p className="text-xl font-bold text-green-700">{data.users.doctors}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
            <Pill size={20} className="text-purple-700 mb-2" />
            <p className="text-xs text-purple-700">Pharmacies</p>
            <p className="text-xl font-bold text-purple-700">{data.users.pharmacies}</p>
          </div>
        </div>

        {/* Pending Alert */}
        {data.users.pending > 0 && (
          <Link href="/admin" className="block bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 mb-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-yellow-600" />
                <div>
                  <p className="font-bold text-slate-800">{data.users.pending} Pending Verifications</p>
                  <p className="text-xs text-slate-500">Tap to review</p>
                </div>
              </div>
              <span className="text-yellow-600 text-xl">→</span>
            </div>
          </Link>
        )}

        {/* Orders Section */}
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <ShoppingBag size={18} /> Orders Overview
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
            <ShoppingBag size={20} className="text-orange-600 mb-2 mx-auto" />
            <p className="text-xs text-slate-500">Total Orders</p>
            <p className="text-xl font-bold text-slate-800">{data.orders.total}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200 text-center">
            <Clock size={20} className="text-yellow-600 mb-2 mx-auto" />
            <p className="text-xs text-yellow-700">Pending</p>
            <p className="text-xl font-bold text-yellow-700">{data.orders.pending}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-200 text-center">
            <CheckCircle size={20} className="text-green-600 mb-2 mx-auto" />
            <p className="text-xs text-green-700">Delivered</p>
            <p className="text-xl font-bold text-green-700">{data.orders.delivered}</p>
          </div>
        </div>

        {/* Revenue Details */}
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp size={18} /> Revenue Details
        </h2>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Total Sales Volume</span>
              <span className="font-bold text-slate-800">৳{data.revenue.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Pharmacy Profit</span>
              <span className="font-bold text-green-700">৳{data.revenue.pharmacyProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-blue-700">Platform Earnings (5%)</span>
              <span className="font-bold text-blue-700">৳{data.revenue.platformEarnings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Today's Sales</span>
              <span className="font-bold text-slate-800">৳{data.revenue.todayRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">This Month's Sales</span>
              <span className="font-bold text-slate-800">৳{data.revenue.monthRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Other Stats */}
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Activity size={18} /> Other Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <Package size={20} className="text-purple-600 mb-2" />
            <p className="text-xs text-slate-500">Medicines Listed</p>
            <p className="text-xl font-bold text-slate-800">{data.medicines.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <Package size={20} className="text-cyan-600 mb-2" />
            <p className="text-xs text-slate-500">Master Catalog</p>
            <p className="text-xl font-bold text-slate-800">{data.medicines.masterCatalog}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <Calendar size={20} className="text-blue-600 mb-2" />
            <p className="text-xs text-slate-500">Appointments</p>
            <p className="text-xl font-bold text-slate-800">{data.appointments.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <Wallet size={20} className="text-red-600 mb-2" />
            <p className="text-xs text-slate-500">Total Due</p>
            <p className="text-xl font-bold text-red-600">৳{data.dues.total.toFixed(0)}</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl p-5">
          <h3 className="font-bold mb-3">📊 Platform Summary</h3>
          <ul className="text-sm space-y-1">
            <li>• {data.users.total} users connected</li>
            <li>• {data.orders.total} orders processed</li>
            <li>• ৳{data.revenue.total.toFixed(0)} total sales</li>
            <li>• ৳{data.revenue.platformEarnings.toFixed(0)} platform revenue earned</li>
            <li>• {data.dues.count} customers have pending dues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

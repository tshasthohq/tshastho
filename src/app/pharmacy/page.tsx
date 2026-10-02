"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {Pill, Package, ShoppingCart, DollarSign, LogOut, Settings, Bell, TrendingUp, Clock, AlertCircle, Calendar, AlertTriangle, Users, UserCog, ClipboardList} from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardCharts from "@/components/pharmacy/DashboardCharts";

export default function PharmacyDashboard() {
  const router = useRouter();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    today: { revenue: 0, cost: 0, platformFee: 0, netProfit: 0, orderCount: 0 },
    yesterday: { revenue: 0, cost: 0, platformFee: 0, netProfit: 0, orderCount: 0 },
    week: { revenue: 0, cost: 0, platformFee: 0, netProfit: 0, orderCount: 0 },
    month: { revenue: 0, cost: 0, platformFee: 0, netProfit: 0, orderCount: 0 },
    total: { revenue: 0, cost: 0, platformFee: 0, netProfit: 0, orderCount: 0 },
    totalDue: 0,
    pendingOrders: 0,
    medicineCount: 0,
    stockValue: 0,
    stockCost: 0,
    expired: 0,
    expiringSoon: 0,
    customerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Hello");
  const { has, hasAny, role: userRole } = usePermissions();
  const [profitView, setProfitView] = useState<"today" | "yesterday" | "week" | "month" | "total">("today");

  const loadData = () => {
    const email = localStorage.getItem("userEmail");
    if (!email) { setLoading(false); return; }

    fetch("/api/pharmacy/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.pharmacy) setPharmacy(data.pharmacy);
      setLoading(false);
    })
    .catch(() => setLoading(false));

    fetch("/api/pharmacy/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.today) setStats(data);
    })
    .catch(() => {});
  };

  useEffect(() => {
    const hour = new Date().getHours();
    let greetText = "Good Morning";
    if (hour >= 12 && hour < 17) greetText = "Good Afternoon";
    else if (hour >= 17 && hour < 21) greetText = "Good Evening";
    else if (hour >= 21 || hour < 5) greetText = "Good Night";
    setGreeting(greetText);
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!pharmacy) return <div className="p-6">Pharmacy profile not found.</div>;

  const initial = pharmacy.user?.name?.charAt(0)?.toUpperCase() || "P";
  const currentProfit = stats[profitView] || stats.today;

  const profitTabs = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "total", label: "All Time" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-600">Tshastho</span>
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">Pharmacy</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pharmacy/notifications" className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center relative">
            <Bell size={20} className="text-slate-500" />
            {stats.pendingOrders > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {stats.pendingOrders > 9 ? "9+" : stats.pendingOrders}
              </span>
            )}
          </Link>
          <Link href="/pharmacy/profile" className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm hover:bg-purple-200 transition">
            {initial}
          </Link>
          <button onClick={handleLogout} className="text-red-500 p-2">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Pill size={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{greeting}, {pharmacy.shopName}!</h1>
              <p className="text-purple-100 text-sm">{pharmacy.area}, {pharmacy.city}</p>
            </div>
          </div>
        </div>

        {/* Pending Order Alert */}
        {stats.pendingOrders > 0 && (
          <Link href="/pharmacy/orders" className="block bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 mb-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Bell size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">You have {stats.pendingOrders} new order{stats.pendingOrders > 1 ? "s" : ""}!</p>
                  <p className="text-xs text-slate-500">Tap to view and process</p>
                </div>
              </div>
              <span className="text-yellow-600 font-bold text-lg">→</span>
            </div>
          </Link>
        )}

        {/* Due Alert */}
        {stats.totalDue > 0 && (
          <Link href="/pharmacy/dues" className="block bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Outstanding Due: ৳{stats.totalDue.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Tap to manage customer dues</p>
                </div>
              </div>
              <span className="text-red-600 font-bold text-lg">→</span>
            </div>
          </Link>
        )}

        {/* Expired Alert */}
        {stats.expired > 0 && (
          <Link href="/pharmacy/inventory" className="block bg-red-100 border-2 border-red-400 rounded-2xl p-4 mb-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-700" />
                </div>
                <div>
                  <p className="font-bold text-red-800">🚨 {stats.expired} Medicine{stats.expired > 1 ? "s" : ""} EXPIRED!</p>
                  <p className="text-xs text-red-600">Remove from stock immediately</p>
                </div>
              </div>
              <span className="text-red-700 font-bold text-lg">→</span>
            </div>
          </Link>
        )}

        {/* Expiring Soon Alert */}
        {stats.expiringSoon > 0 && stats.expired === 0 && (
          <Link href="/pharmacy/inventory" className="block bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 mb-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-orange-800">⚠️ {stats.expiringSoon} Medicine{stats.expiringSoon > 1 ? "s" : ""} expiring soon</p>
                  <p className="text-xs text-orange-600">Within next 30 days</p>
                </div>
              </div>
              <span className="text-orange-600 font-bold text-lg">→</span>
            </div>
          </Link>
        )}

        {/* Profit Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" /> Your Profit
            </h2>
          </div>

          {/* Time Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
            {profitTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setProfitView(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${profitView === tab.key ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Profit Display */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-4">
            <p className="text-xs text-green-700 mb-1">Net Profit ({profitTabs.find(t => t.key === profitView)?.label})</p>
            <p className="text-3xl font-bold text-green-700 mb-4">৳{(currentProfit.netProfit || 0).toFixed(2)}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/70 p-3 rounded-xl">
                <p className="text-slate-500">Revenue</p>
                <p className="font-bold text-slate-800 text-sm">৳{(currentProfit.revenue || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/70 p-3 rounded-xl">
                <p className="text-slate-500">Orders</p>
                <p className="font-bold text-slate-800 text-sm">{currentProfit.orderCount || 0}</p>
              </div>
              <div className="bg-white/70 p-3 rounded-xl">
                <p className="text-slate-500">Purchase Cost</p>
                <p className="font-bold text-red-500 text-sm">− ৳{(currentProfit.cost || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/70 p-3 rounded-xl">
                <p className="text-slate-500">Platform Fee</p>
                <p className="font-bold text-red-500 text-sm">− ৳{(currentProfit.platformFee || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center mb-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <Package size={16} className="text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Medicines</p>
              <p className="font-bold text-slate-800 text-sm">{stats.medicineCount}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <ShoppingCart size={16} className="text-orange-600 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Orders</p>
              <p className="font-bold text-slate-800 text-sm">{stats.total.orderCount}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <Users size={16} className="text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Customers</p>
              <p className="font-bold text-slate-800 text-sm">{stats.customerCount || 0}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <Clock size={16} className="text-yellow-600 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Pending</p>
              <p className="font-bold text-slate-800 text-sm">{stats.pendingOrders}</p>
            </div>
          </div>

          {/* Stock Value & Cost */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Package size={16} className="text-blue-600" /> Current Stock
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Stock Value (Selling)</p>
                <p className="font-bold text-blue-700 text-base">৳{(stats.stockValue || 0).toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">If sold at current price</p>
              </div>
              <div className="bg-white p-3 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Stock Cost (Purchase)</p>
                <p className="font-bold text-orange-700 text-base">৳{(stats.stockCost || 0).toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Investment in stock</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Potential Profit in Stock</span>
                <span className="font-bold text-green-700">
                  ৳{((stats.stockValue || 0) - (stats.stockCost || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hasAny(["view_medicines", "add_medicines"]) && (
            <Link href="/pharmacy/medicines" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <Pill className="text-purple-600 mb-3" size={24} />
              <h3 className="font-semibold text-slate-800 text-sm">Medicines</h3>
              <p className="text-xs text-slate-500 mt-1">Manage stock</p>
            </Link>
          )}
          {has("view_orders") && (
            <Link href="/pharmacy/orders" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition relative">
              <ShoppingCart className="text-blue-600 mb-3" size={24} />
              <h3 className="font-semibold text-slate-800 text-sm">Orders</h3>
              <p className="text-xs text-slate-500 mt-1">View orders</p>
              {stats.pendingOrders > 0 && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {stats.pendingOrders}
                </span>
              )}
            </Link>
          )}
          {has("view_customers") && (
            <Link href="/pharmacy/customers" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <Users className="text-orange-600 mb-3" size={24} />
              <h3 className="font-semibold text-slate-800 text-sm">Customers</h3>
              <p className="text-xs text-slate-500 mt-1">View customers</p>
            </Link>
          )}
          {has("manage_staff") && (
            <Link href="/pharmacy/staff" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <UserCog className="text-purple-600 mb-3" size={24} />
              <h3 className="font-semibold text-slate-800 text-sm">Staff</h3>
              <p className="text-xs text-slate-500 mt-1">Manage team</p>
            </Link>
          )}
          <DashboardCharts />

          {hasAny(["manage_staff", "view_attendance"]) && (
            <Link href="/pharmacy/attendance" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <ClipboardList className="text-teal-600 mb-3" size={24} />
              <h3 className="font-semibold text-slate-800 text-sm">Attendance</h3>
              <p className="text-xs text-slate-500 mt-1">Daily check-in</p>
            </Link>
          )}
          {has("view_dues") && (
            <Link href="/pharmacy/dues" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <DollarSign className="text-red-600 mb-3" size={24} />
              <h3 className="font-semibold text-slate-800 text-sm">Dues</h3>
              <p className="text-xs text-slate-500 mt-1">{stats.totalDue > 0 ? "৳" + stats.totalDue.toFixed(0) : "No due"}</p>
            </Link>
          )}
          {has("view_inventory") && (
            <Link href="/pharmacy/inventory" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <Package className="text-green-600 mb-3" size={24} />
              <h3 className="font-semibold text-slate-800 text-sm">Inventory</h3>
              <p className="text-xs text-slate-500 mt-1">Stock status</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

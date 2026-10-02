"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Search, Phone, Mail, ShoppingBag, TrendingUp, Star, Crown, UserPlus, Clock, Store, Building } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    vipCount: 0,
    regularCount: 0,
    newCount: 0,
    totalRevenue: 0,
    totalDue: 0,
    totalPlatformEarned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/admin/customers")
      .then(res => res.json())
      .then(data => {
        if (data.customers) setCustomers(data.customers);
        if (data.summary) setSummary(data.summary);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => {
    if (tagFilter !== "ALL" && c.tag !== tagFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getTagStyle = (tag: string) => {
    if (tag === "VIP") return { bg: "bg-yellow-100", text: "text-yellow-700", icon: Crown, label: "VIP" };
    if (tag === "REGULAR") return { bg: "bg-blue-100", text: "text-blue-700", icon: Star, label: "Regular" };
    return { bg: "bg-slate-100", text: "text-slate-600", icon: UserPlus, label: "New" };
  };

  const getStatusStyle = (status: string) => {
    if (status === "ACTIVE") return "text-green-600";
    if (status === "DORMANT") return "text-yellow-600";
    return "text-red-500";
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });

  const tagTabs = [
    { key: "ALL", label: "All", count: summary.totalCustomers },
    { key: "VIP", label: "VIP", count: summary.vipCount },
    { key: "REGULAR", label: "Regular", count: summary.regularCount },
    { key: "NEW", label: "New", count: summary.newCount },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">All Customers</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <Users size={18} className="text-blue-600 mb-2" />
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-bold text-slate-800">{summary.totalCustomers}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
            <Crown size={18} className="text-yellow-600 mb-2" />
            <p className="text-xs text-yellow-700">VIP</p>
            <p className="text-xl font-bold text-yellow-700">{summary.vipCount}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <Star size={18} className="text-blue-600 mb-2" />
            <p className="text-xs text-blue-700">Regular</p>
            <p className="text-xl font-bold text-blue-700">{summary.regularCount}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
            <UserPlus size={18} className="text-slate-600 mb-2" />
            <p className="text-xs text-slate-600">New</p>
            <p className="text-xl font-bold text-slate-700">{summary.newCount}</p>
          </div>
        </div>

        {/* Revenue Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-4">
            <TrendingUp size={18} className="mb-2 opacity-80" />
            <p className="text-[10px] text-green-100">Sales Volume</p>
            <p className="text-lg font-bold">৳{summary.totalRevenue.toFixed(0)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-4">
            <Building size={18} className="mb-2 opacity-80" />
            <p className="text-[10px] text-blue-100">Platform Earnings</p>
            <p className="text-lg font-bold">৳{summary.totalPlatformEarned.toFixed(0)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-2xl p-4">
            <ShoppingBag size={18} className="mb-2 opacity-80" />
            <p className="text-[10px] text-red-100">Total Due</p>
            <p className="text-lg font-bold">৳{summary.totalDue.toFixed(0)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="pl-10"
          />
        </div>

        {/* Tag Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {tagTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTagFilter(t.key)}
              className={"px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-2 " + (tagFilter === t.key ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200")}
            >
              {t.label}
              <span className={"text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold " + (tagFilter === t.key ? "bg-white text-slate-800" : "bg-slate-100 text-slate-600")}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Customers List */}
        {loading ? (
          <p className="text-center text-slate-500 py-8">Loading customers...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
            <Users size={64} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">No customers found</h2>
            <p className="text-sm text-slate-500">Try a different filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const tagStyle = getTagStyle(c.tag);
              const TagIcon = tagStyle.icon;
              return (
                <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-start gap-3 mb-3 pb-3 border-b border-slate-100">
                    <div className={"w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg " + tagStyle.bg + " " + tagStyle.text}>
                      {c.name?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{c.name}</h3>
                        <span className={"text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 " + tagStyle.bg + " " + tagStyle.text}>
                          <TagIcon size={10} /> {tagStyle.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {c.phone && (
                          <a href={"tel:" + c.phone} className="flex items-center gap-1">
                            <Phone size={10} /> {c.phone}
                          </a>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail size={10} /> {c.email}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={"text-[10px] font-medium flex items-center gap-1 " + getStatusStyle(c.status)}>
                          <Clock size={10} /> {c.daysSinceLast === 0 ? "Today" : c.daysSinceLast + "d ago"}
                        </span>
                        <span className="text-[10px] text-slate-400">• Last: {formatDate(c.lastOrderAt)}</span>
                        <span className="text-[10px] text-purple-600 flex items-center gap-1">
                          <Store size={10} /> {c.pharmacyCount} {c.pharmacyCount === 1 ? "pharmacy" : "pharmacies"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <p className="text-slate-500 text-[10px]">Orders</p>
                      <p className="font-bold text-slate-800">{c.totalOrders}</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg text-center">
                      <p className="text-green-700 text-[10px]">Spent</p>
                      <p className="font-bold text-green-700">৳{c.totalSpent.toFixed(0)}</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg text-center">
                      <p className="text-blue-700 text-[10px]">Platform</p>
                      <p className="font-bold text-blue-700">৳{c.totalPlatformEarned.toFixed(0)}</p>
                    </div>
                    <div className={c.totalDue > 0 ? "bg-red-50 p-2 rounded-lg text-center" : "bg-slate-50 p-2 rounded-lg text-center"}>
                      <p className={c.totalDue > 0 ? "text-red-700 text-[10px]" : "text-slate-500 text-[10px]"}>Due</p>
                      <p className={"font-bold " + (c.totalDue > 0 ? "text-red-600" : "text-slate-500")}>৳{c.totalDue.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

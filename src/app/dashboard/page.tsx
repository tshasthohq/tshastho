"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Stethoscope, Pill, TestTube, Ambulance, Droplets, Home, Globe, 
  ClipboardCheck, Activity, Shield, Video, Syringe, Search, 
  DollarSign, Wallet, Calendar, ChevronRight, FileText, Bell, User
} from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { unread } = useNotifications({ sound: false });
  const [greeting, setGreeting] = useState("Hello");
  const { branding } = useBranding();
  const { t: tr } = useLanguage();

  const [wallet, setWallet] = useState<any>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [recentPrescription, setRecentPrescription] = useState<any>(null);
  const [recentOrder, setRecentOrder] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders/my-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: user.email }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.orders && d.orders.length > 0) {
          const sorted = [...d.orders].sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt));
          setRecentOrder(sorted[0]);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      try {
        // সব ডাটা একসাথে (Parallel) ফেচ করা
        const [walletRes, apptRes, rxRes] = await Promise.all([
          fetch("/api/wallet/me", { cache: "no-store", credentials: "include" }), // no-store বাদ দেওয়া হলো
          fetch("/api/appointments/list?status=CONFIRMED", { credentials: 'include' }),
          fetch("/api/prescriptions?limit=1", { credentials: 'include' })
        ]);

        const [walletData, apptData, rxData] = await Promise.all([
          walletRes.json().catch(() => ({})),
          apptRes.json().catch(() => ({})),
          rxRes.json().catch(() => ({}))
        ]);

        if (walletData.success) setWallet(walletData.wallet);
        
        if (apptData.success && apptData.appointments) {
          const today = new Date().toISOString().split('T')[0];
          const upcoming = apptData.appointments.filter((a: any) => a.date >= today);
          if (upcoming.length > 0) setNextAppointment(upcoming[0]);
        }

        if (rxData.prescriptions && rxData.prescriptions.length > 0) {
          setRecentPrescription(rxData.prescriptions[0]);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      }
    };

    fetchAllData();
  }, [user]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Morning");
    else if (hour < 18) setGreeting("Afternoon");
    else setGreeting("Evening");
  }, []);

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl px-5 pt-8 pb-6 border-b border-slate-100 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Tshastho" className="h-8 object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <div className="hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">T</div>
          </div>
          
          <div className="flex gap-3">
            <LanguageSwitcher />
              <Link href="/dashboard/notifications" aria-label="Notifications" className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors relative">
                <Bell size={18} />
                {unread > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
              </Link>
            <Link href="/dashboard/profile" className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
               {user?.name?.charAt(0) || <User size={16} />}
            </Link>
          </div>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{tr("dh.g." + greeting, greeting)}{user?.name ? ", " + user.name.split(" ")[0] : ""}! 👋</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{tr("dh.help", "How can we help you today?")}</p>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder={tr("dh.search", "Search doctors, medicines, hospitals...")} 
            className="w-full bg-slate-100/80 border border-slate-200/60 text-slate-800 text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:font-normal placeholder:text-slate-400 shadow-inner"
          />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 mt-5 space-y-6">
        
        {/* Wallet & Dues */}
        <div className="flex gap-3">
          <Link href="/wallet" className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[20px] p-4 shadow-[0_8px_20px_rgb(99,102,241,0.25)] text-white relative overflow-hidden group">
             <div className="flex justify-between items-start mb-2">
                <Wallet size={18} className="text-indigo-200" />
                <span className="text-[9px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded">{tr("dh.active", "Active")}</span>
             </div>
             <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider mb-1">{tr("dh.wallet", "My Wallet")}</p>
             <p className="text-[26px] font-black tracking-tight mt-1">৳{Number(wallet?.balance || 0).toLocaleString("en-US")}</p>
          </Link>

          <Link href="/dashboard/dues" className="flex-1 bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 relative overflow-hidden group hover:border-rose-200 transition-colors">
             <div className="flex justify-between items-start mb-2">
                <DollarSign size={18} className="text-rose-500" />
                <ChevronRight size={14} className="text-slate-300" />
             </div>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{tr("dh.dues", "My Dues")}</p>
             <p className="text-lg font-black text-slate-800">{tr("dh.viewDetails", "View Details")}</p>
          </Link>
        </div>

        {/* Primary Actions (Hero Cards) with Watermarks */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/doctors" className="bg-blue-50 border border-blue-100 p-4 rounded-[24px] flex flex-col justify-between h-32 group hover:shadow-md transition-all relative overflow-hidden">
             <Stethoscope size={80} className="absolute -right-4 -bottom-4 text-blue-500/10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
             <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform z-10">
               <Stethoscope size={20} />
             </div>
             <div className="flex justify-between items-end w-full z-10">
               <div>
                 <h3 className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">{tr("dh.bookDoctor", "Book Doctor")}</h3>
                 <p className="text-[11px] text-slate-500 font-medium">{tr("dh.consult", "Consult specialists")}</p>
               </div>
               <ChevronRight size={16} className="text-blue-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
             </div>
          </Link>

          <Link href="/medicines" className="bg-emerald-50 border border-emerald-100 p-4 rounded-[24px] flex flex-col justify-between h-32 group hover:shadow-md transition-all relative overflow-hidden">
             <Pill size={80} className="absolute -right-4 -bottom-4 text-emerald-500/10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
             <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform z-10">
               <Pill size={20} />
             </div>
             <div className="flex justify-between items-end w-full z-10">
               <div>
                 <h3 className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">{tr("dh.buyMed", "Buy Medicines")}</h3>
                 <p className="text-[11px] text-slate-500 font-medium">{tr("dh.orderNearby", "Order from nearby")}</p>
               </div>
               <ChevronRight size={16} className="text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
             </div>
          </Link>
        </div>

        {/* Appointments & Prescription */}
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x">
           {nextAppointment ? (
              <div className="min-w-[240px] snap-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">{tr("dh.nextAppt", "Next Appointment")}</p>
                    <h3 className="font-extrabold text-slate-800 text-xs mt-0.5 truncate">{nextAppointment.doctorName || tr("dh.doctor", "Doctor")}</h3>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{nextAppointment.date} • {nextAppointment.time}</p>
                 </div>
              </div>
           ) : (
              <Link href="/doctors" className="min-w-[240px] snap-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 hover:border-indigo-200 transition-colors">
                 <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tr("dh.noUpcoming", "No Upcoming")}</p>
                    <h3 className="font-extrabold text-slate-800 text-xs mt-0.5">{tr("dh.bookAppt", "Book Appointment")}</h3>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{tr("dh.consultTop", "Consult top doctors")}</p>
                 </div>
              </Link>
           )}

           {recentPrescription ? (
              <Link href="/dashboard/prescriptions" className="min-w-[240px] snap-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 hover:border-emerald-200 transition-colors">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">{tr("dh.rx", "Prescription")}</p>
                    <h3 className="font-extrabold text-slate-800 text-xs mt-0.5">{tr("dh.recentRx", "Recent Rx")}</h3>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{recentPrescription.date || tr("dh.recent", "Recent")}</p>
                 </div>
              </Link>
           ) : (
              <Link href="/dashboard/prescriptions" className="min-w-[240px] snap-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 hover:border-slate-300 transition-colors">
                 <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tr("dh.records", "Records")}</p>
                    <h3 className="font-extrabold text-slate-800 text-xs mt-0.5">{tr("dh.myRx", "My Prescriptions")}</h3>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{tr("dh.viewHistory", "View history")}</p>
                 </div>
              </Link>
           )}
        </div>

        {/* Quick Services Grid (All 14) with Glassy Icons */}
        <div>
           <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-black text-slate-900 tracking-tight">{tr("dh.services", "Quick Services")}</h2>
           </div>
           <div className="grid grid-cols-4 gap-y-7 gap-x-3">
              {[
                { icon: Stethoscope, label: "Doctors", color: "text-blue-600 bg-blue-50 border-blue-100", href: "/doctors" },
                { icon: Home, label: "Hospitals", color: "text-emerald-600 bg-emerald-50 border-emerald-100", href: "/hospitals" },
                { icon: Pill, label: "Pharmacies", color: "text-indigo-600 bg-indigo-50 border-indigo-100", href: "/medicines" },
                { icon: TestTube, label: "Diagnostics", color: "text-orange-600 bg-orange-50 border-orange-100", href: "/diagnostics" },
                { icon: Ambulance, label: "Ambulance", color: "text-red-600 bg-red-50 border-red-100", href: "/ambulance" },
                { icon: Droplets, label: "Blood Bank", color: "text-rose-600 bg-rose-50 border-rose-100", href: "/blood-bank" },
                { icon: Shield, label: "Home Care", color: "text-teal-600 bg-teal-50 border-teal-100", href: "/home-care" },
                { icon: Globe, label: "Int'l", color: "text-violet-600 bg-violet-50 border-violet-100", href: "/international" },
                { icon: ClipboardCheck, label: "Packages", color: "text-cyan-600 bg-cyan-50 border-cyan-100", href: "/packages" },
                { icon: Activity, label: "Equipment", color: "text-amber-600 bg-amber-50 border-amber-100", href: "/equipment" },
                { icon: Shield, label: "Insurance", color: "text-lime-600 bg-lime-50 border-lime-100", href: "/insurance" },
                { icon: Video, label: "Telemed", color: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100", href: "/telemedicine" },
                { icon: FileText, label: "Prescriptions", color: "text-green-600 bg-green-50 border-green-100", href: "/dashboard/prescriptions" },
                { icon: Syringe, label: "Vaccination", color: "text-pink-600 bg-pink-50 border-pink-100", href: "/vaccination" },
                { icon: FileText, label: "Health Records", color: "text-sky-600 bg-sky-50 border-sky-100", href: "/dashboard/medical-history" },
                { icon: User, label: "Profile", color: "text-slate-600 bg-slate-50 border-slate-200", href: "/dashboard/profile" }
              ].map((srv, i) => (
                 <Link key={i} href={srv.href} className="flex flex-col items-center gap-2 group">
                    <div className={`w-[58px] h-[58px] rounded-[22px] ${srv.color} border flex items-center justify-center shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)] group-hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.1)] group-hover:-translate-y-1.5 group-active:scale-95 transition-all duration-300 relative overflow-hidden`}>
                       <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent"></div>
                       <srv.icon size={24} strokeWidth={2.2} className="relative z-10" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-600 text-center leading-tight mt-1 group-hover:text-slate-900 transition-colors">{tr("dh.svc." + srv.label.toLowerCase().replace(/[^a-z]+/g, ""), srv.label)}</span>
                 </Link>
              ))}
           </div>
        </div>

        {/* Premium Banners */}
        <div className="space-y-4 pt-2">
           <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-[24px] p-5 shadow-lg shadow-blue-500/20 relative overflow-hidden group">
              <Stethoscope size={120} className="absolute -right-6 -bottom-6 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                 <h3 className="text-white font-black text-base mb-1 tracking-tight">{tr("dh.pkgTitle", "Health Checkup Packages")}</h3>
                 <p className="text-blue-100 text-xs font-medium mb-3">{tr("dh.pkgText", "Get your full body checkup today.")}</p>
                 <button className="bg-white text-blue-600 text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 transition-colors">
                    {tr("dh.explore", "Explore Now")}
                 </button>
              </div>
           </div>

           <div className="bg-slate-900 rounded-[24px] p-5 shadow-lg relative overflow-hidden group">
              <Globe size={130} className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10 flex justify-between items-center">
                 <div>
                    <h3 className="text-white font-black text-sm mb-1 flex items-center gap-2"><Globe size={14} className="text-emerald-400"/> {tr("dh.global", "Global Healthcare")}</h3>
                    <p className="text-slate-400 text-[11px] font-medium mb-3 max-w-[200px]">{tr("dh.globalText", "Consult with top doctors from USA & UK.")}</p>
                    <button className="bg-white text-slate-900 text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-slate-100 transition-colors">
                       {tr("dh.exploreIntl", "Explore Int'l")}
                    </button>
                 </div>
              </div>
           </div>
        </div>

        
        {/* Doctor Access & Privacy */}
        <div className="bg-slate-900 rounded-[20px] p-4 shadow-lg relative overflow-hidden flex items-center justify-between group cursor-pointer mt-2 mb-2">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                 <Shield size={20} />
              </div>
              <div>
                 <h3 className="text-white font-black text-sm mb-0.5">{tr("dh.privacy", "Doctor Access & Privacy")}</h3>
                 <p className="text-slate-400 text-[11px] font-medium">{tr("dh.privacyText", "Manage who can view your records")}</p>
              </div>
           </div>
           <ChevronRight size={18} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>

{/* Recent Orders Section */}
        <div className="pt-2 pb-6">
           <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-black text-slate-900 tracking-tight">{tr("dh.recentOrders", "Recent Orders")}</h2>
              <Link href="/dashboard/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">{tr("dh.viewAll", "View All")}</Link>
           </div>
           {recentOrder ? (
          <Link href={"/dashboard/orders/" + recentOrder.id} className="bg-white p-4 rounded-[20px] shadow-[0_4px_20px_-5px_rgba(30,64,175,0.1)] border border-slate-100 flex items-center justify-between gap-3 hover:border-blue-200 transition-all group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-[14px] flex items-center justify-center shrink-0">
                <ClipboardCheck size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-slate-800 text-[15px] truncate">{recentOrder.orderNumber}</h3>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5 truncate">
                  {recentOrder.items?.[0]?.medicineName || tr("or.medicine", "Medicine")}
                  {recentOrder.items?.length > 1 ? " + " + (recentOrder.items.length - 1) + " " + tr("or.more", "more") : ""}
                </p>
              </div>
            </div>
            <div className="text-end shrink-0">
              <p className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                {tr("od.st." + String(recentOrder.status).toUpperCase(), String(recentOrder.status))}
              </p>
              <p className="text-[15px] font-black text-slate-900 mt-1">৳{Number(recentOrder.finalAmount ?? recentOrder.totalAmount).toFixed(2)}</p>
            </div>
          </Link>
        ) : (
          <Link href="/medicines" className="bg-white p-4 rounded-[20px] shadow-[0_4px_20px_-5px_rgba(30,64,175,0.1)] border border-slate-100 flex items-center justify-between gap-3 hover:border-blue-200 transition-all group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 bg-slate-50 text-slate-400 rounded-[14px] flex items-center justify-center shrink-0">
                <ClipboardCheck size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-slate-800 text-[15px]">{tr("dh.noOrders", "No orders yet")}</h3>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">{tr("dh.noOrdersSub", "Order medicines from nearby pharmacies")}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 rtl:rotate-180 shrink-0" />
          </Link>
        )}
        </div>

      </div>
    </div>
  );
}

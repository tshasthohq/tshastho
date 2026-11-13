"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Plus, UserCog, Shield, Phone, Mail, Clock, Power, Trash2, X, Loader2, Crown, Bike, Calculator, Package, DollarSign, Moon, Stethoscope, ClipboardList, Sparkles, ChevronDown, ChevronUp, Receipt, Eye, EyeOff, Store, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ALL_PERMISSIONS, getDefaultPermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import PermissionGuard from "@/components/staff/PermissionGuard";
import { useAuth } from "@/hooks/useAuth";

function StaffPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", staffRole: "CASHIER", customRole: "",
    basicSalary: "", dailyRate: "", commissionPercent: "", salaryType: "MONTHLY", branchId: "",
    workingDaysPerMonth: "30", hoursPerDay: "8",
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedPermissionGuard, setSelectedPermissionGuard] = useState<string[]>([]);
  const [showPermissionGuard, setShowPermissionGuard] = useState(false);

  useEffect(() => {
    if (showForm && selectedPermissionGuard.length === 0) {
      setSelectedPermissionGuard(getDefaultPermissions(formData.staffRole || "CASHIER"));
    }
  }, [showForm]);

  useEffect(() => {
    fetch('/api/pharmacy/branches', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then(data => { if (data?.branches) setBranches(data.branches); })
      .catch(console.error);
  }, []);

  const loadStaff = () => {
    const email = user?.email;
    if (!email) { setLoading(false); return; }
    fetch("/api/pharmacy/staff/list", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(async res => {
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then(data => { if (data?.staff) setStaff(data.staff); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    loadStaff();
  }, [user]);

  const handleRoleChange = (role: string) => {
    setFormData({ ...formData, staffRole: role, customRole: "" });
    const defaults = getDefaultPermissions(role);
    setSelectedPermissionGuard(defaults);
    setShowPermissionGuard(false);
  };

  const handleCustomRoleChange = (customRole: string) => {
    setFormData({ ...formData, staffRole: "CUSTOM", customRole });
    if (customRole.trim() && selectedPermissionGuard.length === 0) {
      setSelectedPermissionGuard(getDefaultPermissions("CUSTOM"));
    }
  };

  const togglePermission = (key: string) => {
    if (selectedPermissionGuard.includes(key)) {
      setSelectedPermissionGuard(selectedPermissionGuard.filter(p => p !== key));
    } else {
      setSelectedPermissionGuard([...selectedPermissionGuard, key]);
    }
  };

  const toggleCategory = (categoryPerms: string[]) => {
    const allSelected = categoryPerms.every(p => selectedPermissionGuard.includes(p));
    if (allSelected) {
      setSelectedPermissionGuard(selectedPermissionGuard.filter(p => !categoryPerms.includes(p)));
    } else {
      const newPerms = new Set([...selectedPermissionGuard, ...categoryPerms]);
      setSelectedPermissionGuard(Array.from(newPerms));
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const ownerEmail = user?.email;
    const res = await fetch("/api/pharmacy/staff/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerEmail, ...formData,
        staffRole: formData.staffRole === "CUSTOM" ? formData.customRole : formData.staffRole,
        permissions: selectedPermissionGuard,
        basicSalary: formData.basicSalary, dailyRate: formData.dailyRate,
        commissionPercent: formData.commissionPercent, salaryType: formData.salaryType,
        workingDaysPerMonth: formData.workingDaysPerMonth, hoursPerDay: formData.hoursPerDay
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Staff added!");
      setShowForm(false);
      setFormData({ name: "", email: "", phone: "", password: "", staffRole: "CASHIER", customRole: "", basicSalary: "", dailyRate: "", commissionPercent: "", salaryType: "MONTHLY", branchId: "", workingDaysPerMonth: "30", hoursPerDay: "8" });
      setSelectedPermissionGuard([]);
      setShowPermissionGuard(false);
      loadStaff();
      setTimeout(() => setMessage(""), 2500);
    } else {
      setMessage(data.message || "Failed");
    }
    setSaving(false);
  };

  const toggleActive = async (staffId: string, currentActive: boolean) => {
    await fetch("/api/pharmacy/staff/toggle", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, isActive: !currentActive, requesterEmail: user?.email }),
    });
    loadStaff();
  };

  const handleDelete = async (staffId: string, name: string) => {
    if (!confirm("Delete staff " + name + "? This cannot be undone.")) return;
    await fetch("/api/pharmacy/staff/delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, requesterEmail: user?.email }),
    });
    loadStaff();
  };

  const handleChangeBranch = async (staffId: string, newBranchId: string) => {
    try {
      await fetch("/api/pharmacy/staff/update-branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, branchId: newBranchId })
      });
      loadStaff();
    } catch (e) {
      alert("Failed to update branch");
    }
  };

  const getRoleStyle = (role: string) => {
    if (!role) return { bg: "bg-slate-100", text: "text-slate-700", icon: UserCog, label: "Staff" };
    if (role === "MANAGER") return { bg: "bg-purple-100", text: "text-purple-700", icon: Crown, label: "Manager" };
    if (role === "PHARMACIST") return { bg: "bg-teal-100", text: "text-teal-700", icon: Stethoscope, label: "Pharmacist" };
    if (role === "DELIVERY") return { bg: "bg-green-100", text: "text-green-700", icon: Bike, label: "Delivery Man" };
    if (role === "STOCK_KEEPER") return { bg: "bg-orange-100", text: "text-orange-700", icon: Package, label: "Stock Keeper" };
    if (role === "ACCOUNTANT") return { bg: "bg-indigo-100", text: "text-indigo-700", icon: DollarSign, label: "Accountant" };
    if (role === "NIGHT_SHIFT") return { bg: "bg-slate-800", text: "text-white", icon: Moon, label: "Night Shift" };
    if (role === "SUPERVISOR") return { bg: "bg-pink-100", text: "text-pink-700", icon: Shield, label: "Supervisor" };
    if (role === "SECURITY") return { bg: "bg-gray-800", text: "text-white", icon: Shield, label: "Security" };
    if (role === "CLEANER") return { bg: "bg-cyan-100", text: "text-cyan-700", icon: UserCog, label: "Cleaner" };
    return { bg: "bg-violet-100", text: "text-violet-700", icon: UserCog, label: role };
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const roleOptions = [
    { key: "CASHIER", label: "Cashier", icon: Calculator },
    { key: "MANAGER", label: "Manager", icon: Crown },
    { key: "PHARMACIST", label: "Pharmacist", icon: Stethoscope },
    { key: "DELIVERY", label: "Delivery", icon: Bike },
    { key: "STOCK_KEEPER", label: "Stock Keeper", icon: Package },
    { key: "ACCOUNTANT", label: "Accountant", icon: DollarSign },
    { key: "NIGHT_SHIFT", label: "Night Shift", icon: Moon },
    { key: "SUPERVISOR", label: "Supervisor", icon: Shield },
    { key: "SECURITY", label: "Security", icon: Shield },
    { key: "CLEANER", label: "Cleaner", icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-colors">
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">Staff Management</h1>
        </div>
        <button onClick={() => { setSelectedPermissionGuard(getDefaultPermissions("CASHIER")); setShowPermissionGuard(false); setShowForm(true); }} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95">
          <Plus size={16} /> Add Staff
        </button>
      </header>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
            <Users size={18} className="text-indigo-500 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Staff</p>
            <p className="text-2xl font-black text-slate-800">{staff.length}</p>
          </div>
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm text-center">
            <Power size={18} className="text-emerald-600 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Active</p>
            <p className="text-2xl font-black text-emerald-700">{staff.filter(s => s.isActive).length}</p>
          </div>
          <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 shadow-sm text-center">
            <Power size={18} className="text-red-500 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Inactive</p>
            <p className="text-2xl font-black text-red-600">{staff.filter(s => !s.isActive).length}</p>
          </div>
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="bg-white p-12 rounded-[24px] text-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCog size={32} className="text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">No staff yet</h2>
            <p className="text-sm text-slate-500 mb-6">Add your first staff member to manage your pharmacy.</p>
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-bold shadow-lg shadow-indigo-600/20">
              <Plus size={18} className="mr-2" /> Add First Staff
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map((s) => {
              const roleStyle = getRoleStyle(s.staffRole || "CASHIER");
              const RoleIcon = roleStyle.icon;
              return (
                <div key={s.id} className={`bg-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${s.isActive ? "border-slate-100" : "border-red-200 opacity-70"} flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${roleStyle.bg} ${roleStyle.text}`}>
                      <RoleIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-base truncate">{s.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${roleStyle.bg} ${roleStyle.text}`}>{roleStyle.label}</span>
                        {!s.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Disabled</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                    <span className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {s.phone}</span>
                    <span className="flex items-center gap-2 truncate"><Mail size={14} className="text-slate-400"/> {s.email}</span>
                    <span className="flex items-center gap-2"><Clock size={14} className="text-slate-400"/> Joined {formatDate(s.createdAt)}</span>
     
                  </div>

                  {/* Salary Info */}
                  {(parseFloat(s.basicSalary) > 0 || parseFloat(s.dailyRate) > 0 || parseFloat(s.commissionPercent) > 0) && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {parseFloat(s.basicSalary) > 0 && (
                        <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Basic</p>
                          <p className="text-sm font-black text-slate-800">৳{parseFloat(s.basicSalary).toFixed(0)}</p>
                        </div>
                      )}
                      {parseFloat(s.dailyRate) > 0 && (
                        <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Daily</p>
                          <p className="text-sm font-black text-slate-800">৳{parseFloat(s.dailyRate).toFixed(0)}</p>
                        </div>
                      )}
                      {parseFloat(s.commissionPercent) > 0 && (
                        <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Comm.</p>
                          <p className="text-sm font-black text-slate-800">{parseFloat(s.commissionPercent)}%</p>
                        </div>
                      )}
                    </div>
                  )}

                  
                  {/* 🔥 Premium Branch Selector */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Assigned Branch</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Store size={14} className="text-indigo-500" />
                      </div>
                      <select 
                        value={s.branchAssignments?.[0]?.branchId || ""}
                        onChange={(e) => handleChangeBranch(s.id, e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="" disabled>Select Branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={14} className="text-indigo-400" />
                      </div>
                    </div>
                  </div>


                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100">
                    <button onClick={() => toggleActive(s.id, s.isActive)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 ${s.isActive ? "border-red-100 text-red-600 bg-white hover:bg-red-50" : "border-emerald-100 text-emerald-600 bg-white hover:bg-emerald-50"}`}>
                      <Power size={14} className="inline mr-1" /> {s.isActive ? "Disable" : "Enable"}
                    </button>
                    <Link href={`/pharmacy/staff/${s.id}`} className="flex-1 py-2 rounded-xl text-xs font-bold text-center border-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all">
                      <Receipt size={14} className="inline mr-1" /> Payslip
                    </Link>
                    <button onClick={() => handleDelete(s.id, s.name)} className="py-2 px-3 rounded-xl border-2 border-red-100 text-red-600 bg-white hover:bg-red-50 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Add Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10 rounded-t-[32px] sm:rounded-t-3xl">
              <h2 className="font-extrabold text-slate-900 text-lg">Add New Staff</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddStaff} className="p-5 overflow-y-auto space-y-6 custom-scrollbar">
              
              {/* Personal Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Rahim Ahmed" required className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email *</label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="staff@email.com" required className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone *</label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="017XXXXXXXX" required className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password *</label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                      placeholder="Min 6 characters" 
                      required 
                      minLength={6} 
                      className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-indigo-500 pr-10" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assign Branch *</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    required
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="" disabled>Select a branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} {b.isMainBranch ? '(Main)' : ''}</option>
                    ))}
                  </select>
                </div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Staff Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((r) => {
                    const isSelected = formData.staffRole === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => handleRoleChange(r.key)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <r.icon size={18} className={isSelected ? "text-indigo-600" : "text-slate-400"} />
                        <span className="text-[10px] font-bold text-center leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                  
                  {/* Custom Role Button */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, staffRole: "CUSTOM", customRole: "" })}
                    className={`p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all col-span-2 ${
                      formData.staffRole === "CUSTOM" ? "border-violet-600 bg-violet-50 text-violet-700" : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Sparkles size={18} />
                    <span className="text-[10px] font-bold">Custom Role</span>
                  </button>
                </div>

                {formData.staffRole === "CUSTOM" && (
                  <div className="mt-3 bg-violet-50 p-3 rounded-xl border border-violet-200">
                    <label className="block text-xs font-bold text-violet-800 mb-1.5 flex items-center gap-1"><Sparkles size={12}/> Type Custom Role</label>
                    <Input value={formData.customRole} onChange={(e) => handleCustomRoleChange(e.target.value)} placeholder="e.g., Assistant, Typist..." maxLength={30} required className="h-10 bg-white border-violet-200 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-violet-500" />
                  </div>
                )}
              </div>

              {/* Permission Guard */}
              <div className="border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowPermissionGuard(!showPermissionGuard)} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Access PermissionGuard</p>
                      <p className="text-[10px] text-slate-500">{selectedPermissionGuard.length} selected</p>
                    </div>
                  </div>
                  {showPermissionGuard ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {showPermissionGuard && (
                  <div className="mt-2 bg-slate-50 rounded-xl p-3 space-y-4 max-h-60 overflow-y-auto border border-slate-200">
                    {["General", "Orders", "Inventory", "Customers", "Finance", "Reports", "Staff", "Settings"].map(category => {
                      const categoryPerms = ALL_PERMISSIONS.filter(p => p.category === category).map(p => p.key);
                      if (categoryPerms.length === 0) return null;
                      const allSelected = categoryPerms.every(p => selectedPermissionGuard.includes(p));
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{category}</span>
                            <button type="button" onClick={() => toggleCategory(categoryPerms)} className={`text-[10px] font-bold px-2 py-0.5 rounded ${allSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}>{allSelected ? "Clear" : "Select All"}</button>
                          </div>
                          <div className="space-y-1.5">
                            {ALL_PERMISSIONS.filter(p => p.category === category).map(perm => (
                              <label key={perm.key} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${selectedPermissionGuard.includes(perm.key) ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200"}`}>
                                <input type="checkbox" checked={selectedPermissionGuard.includes(perm.key)} onChange={() => togglePermission(perm.key)} className="w-4 h-4 accent-indigo-600 rounded" />
                                <span className="text-xs font-medium text-slate-700">{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Salary Setup */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-800">Salary Setup</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Salary Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["MONTHLY", "DAILY", "HOURLY", "CUSTOM"].map(t => (
                      <button key={t} type="button" onClick={() => setFormData({ ...formData, salaryType: t })} className={`py-2 rounded-lg text-[10px] font-bold border-2 transition-all ${formData.salaryType === t ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Working Days/Month</label>
                    <Input type="number" value={formData.workingDaysPerMonth} onChange={(e) => setFormData({ ...formData, workingDaysPerMonth: e.target.value })} placeholder="26" className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus-visible:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Hours/Day</label>
                    <Input type="number" value={formData.hoursPerDay} onChange={(e) => setFormData({ ...formData, hoursPerDay: e.target.value })} placeholder="8" className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus-visible:ring-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Monthly Basic Salary (৳)</label>
                  <Input type="number" value={formData.basicSalary} onChange={(e) => { const val = e.target.value; const daily = val ? (parseFloat(val) / 30).toFixed(0) : ""; setFormData({ ...formData, basicSalary: val, dailyRate: daily }); }} placeholder="e.g., 15000" className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus-visible:ring-indigo-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Daily Rate (৳)</label>
                    <Input type="number" value={formData.dailyRate} onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })} placeholder="e.g., 500" className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus-visible:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Commission (%)</label>
                    <Input type="number" step="0.5" value={formData.commissionPercent} onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })} placeholder="e.g., 2" className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus-visible:ring-indigo-500" />
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {message}
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-70">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} className="mr-2" />}
                {saving ? "Adding..." : "Add Staff"}
              </Button>
              
              <p className="text-center text-[10px] text-slate-400 pb-4">Staff will log in with their email and password</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffPage() {
  return (
    <PermissionGuard permission="manage_staff">
      <StaffPageInner />
    </PermissionGuard>
  );
}

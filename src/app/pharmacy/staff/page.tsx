"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {ArrowLeft, Users, Plus, UserCog, Shield, Phone, Mail, Clock, Power, Trash2, X, Loader2, Crown, Bike, Calculator, Package, DollarSign, Moon, Stethoscope, ClipboardList, Sparkles, ChevronDown, ChevronUp, Receipt } from "lucide-react";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    staffRole: "CASHIER",
    customRole: "",
    basicSalary: "",
    dailyRate: "",
    commissionPercent: "",
    salaryType: "MONTHLY",
    workingDaysPerMonth: "30",
    hoursPerDay: "8",
  });
  const [selectedPermissionGuard, setSelectedPermissionGuard] = useState<string[]>([]);
  const [showPermissionGuard, setShowPermissionGuard] = useState(false);

  // Auto-load permissions when form opens
  useEffect(() => {
    if (showForm && selectedPermissionGuard.length === 0) {
      setSelectedPermissionGuard(getDefaultPermissions(formData.staffRole || "CASHIER"));
    }
  }, [showForm]);

  const loadStaff = () => {
    const email = user?.email;
    if (!email) { setLoading(false); return; }

    fetch("/api/pharmacy/staff/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.staff) setStaff(data.staff);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  useEffect(() => { loadStaff(); }, []);

  const handleRoleChange = (role: string) => {
    setFormData({ ...formData, staffRole: role, customRole: "" });
    // Auto-load default permissions for this role
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
      body: JSON.stringify({ ownerEmail, ...formData, staffRole: formData.staffRole === "CUSTOM" ? formData.customRole : formData.staffRole, permissions: selectedPermissionGuard, basicSalary: formData.basicSalary, dailyRate: formData.dailyRate, commissionPercent: formData.commissionPercent, salaryType: formData.salaryType, workingDaysPerMonth: formData.workingDaysPerMonth, hoursPerDay: formData.hoursPerDay }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Staff added!");
      setShowForm(false);
      setFormData({ name: "", email: "", phone: "", password: "", staffRole: "CASHIER", customRole: "", basicSalary: "", dailyRate: "", commissionPercent: "", salaryType: "MONTHLY", workingDaysPerMonth: "30", hoursPerDay: "8" });
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, isActive: !currentActive, requesterEmail: user?.email }),
    });
    loadStaff();
  };

  const handleDelete = async (staffId: string, name: string) => {
    if (!confirm("Delete staff " + name + "? This cannot be undone.")) return;
    await fetch("/api/pharmacy/staff/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, requesterEmail: user?.email }),
    });
    loadStaff();
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
    // Custom role
    return { bg: "bg-violet-100", text: "text-violet-700", icon: UserCog, label: role };
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="font-bold text-slate-800">Staff</h1>
        <button onClick={() => { setSelectedPermissionGuard(getDefaultPermissions("CASHIER")); setShowPermissionGuard(false); setShowForm(true); }} className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <Plus size={20} className="text-purple-600" />
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
            <Users size={18} className="text-blue-600 mb-2 mx-auto" />
            <p className="text-xs text-slate-500">Total Staff</p>
            <p className="text-xl font-bold text-slate-800">{staff.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-200 text-center">
            <Power size={18} className="text-green-600 mb-2 mx-auto" />
            <p className="text-xs text-green-700">Active</p>
            <p className="text-xl font-bold text-green-700">{staff.filter(s => s.isActive).length}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-center">
            <Power size={18} className="text-red-600 mb-2 mx-auto" />
            <p className="text-xs text-red-700">Inactive</p>
            <p className="text-xl font-bold text-red-700">{staff.filter(s => !s.isActive).length}</p>
          </div>
        </div>

        {message && !showForm && (
          <p className={"text-center text-sm font-medium mb-4 " + (message.includes("✅") ? "text-green-600" : "text-red-500")}>{message}</p>
        )}

        {/* Staff List */}
        {loading ? (
          <p className="text-center text-slate-500 py-8">Loading...</p>
        ) : staff.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
            <UserCog size={64} className="mx-auto text-purple-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">No staff yet</h2>
            <p className="text-sm text-slate-500 mb-6">Add your first staff member to manage your pharmacy</p>
            <Button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2">
              <Plus size={16} /> Add First Staff
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map((s) => {
              const roleStyle = getRoleStyle(s.staffRole || "CASHIER");
              const RoleIcon = roleStyle.icon;
              return (
                <div key={s.id} className={"bg-white p-4 rounded-2xl shadow-sm border " + (s.isActive ? "border-slate-100" : "border-red-200 opacity-70")}>
                  <div className="flex items-start gap-3">
                    <div className={"w-12 h-12 rounded-xl flex items-center justify-center " + roleStyle.bg}>
                      <RoleIcon size={22} className={roleStyle.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{s.name}</h3>
                        <span className={"text-[10px] px-2 py-0.5 rounded-full font-bold " + roleStyle.bg + " " + roleStyle.text}>
                          {roleStyle.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 flex items-center gap-0.5">
                          <Shield size={9} /> {Array.isArray(s.permissions) ? s.permissions.length : 0}
                        </span>
                        {s.salaryType && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">
                            {s.salaryType}
                          </span>
                        )}
                        {!s.isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600">
                            DISABLED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone size={10} /> {s.phone}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Mail size={10} /> {s.email}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={10} /> Added {formatDate(s.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Salary Info */}
                  {(parseFloat(s.basicSalary) > 0 || parseFloat(s.dailyRate) > 0 || parseFloat(s.commissionPercent) > 0) && (
                    <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                      {parseFloat(s.basicSalary) > 0 && (
                        <div className="bg-green-50 p-2 rounded-lg text-center">
                          <p className="text-[10px] text-green-700">Basic</p>
                          <p className="font-bold text-green-700 text-xs">৳{parseFloat(s.basicSalary).toFixed(0)}</p>
                        </div>
                      )}
                      {parseFloat(s.dailyRate) > 0 && (
                        <div className="bg-blue-50 p-2 rounded-lg text-center">
                          <p className="text-[10px] text-blue-700">Daily</p>
                          <p className="font-bold text-blue-700 text-xs">৳{parseFloat(s.dailyRate).toFixed(0)}</p>
                        </div>
                      )}
                      {parseFloat(s.commissionPercent) > 0 && (
                        <div className="bg-purple-50 p-2 rounded-lg text-center">
                          <p className="text-[10px] text-purple-700">Commission</p>
                          <p className="font-bold text-purple-700 text-xs">{parseFloat(s.commissionPercent)}%</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => toggleActive(s.id, s.isActive)}
                      className={"flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium " + (s.isActive ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-600 border border-green-200")}
                    >
                      <Power size={12} /> {s.isActive ? "Disable" : "Enable"}
                    </button>
                    <Link
                      href={"/pharmacy/staff/" + s.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-medium border border-blue-200"
                    >
                      <Receipt size={12} /> Payslip
                    </Link>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-medium border border-red-200"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-slate-800">Add New Staff</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Rahim Ahmed" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="staff@email.com" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone *</label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="017XXXXXXXX" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min 6 characters" required minLength={6} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Staff Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "CASHIER", label: "Cashier", icon: Calculator, bg: "bg-blue-100 text-blue-700", border: "border-blue-500" },
                    { key: "MANAGER", label: "Manager", icon: Crown, bg: "bg-purple-100 text-purple-700", border: "border-purple-500" },
                    { key: "PHARMACIST", label: "Pharmacist", icon: Stethoscope, bg: "bg-teal-100 text-teal-700", border: "border-teal-500" },
                    { key: "DELIVERY", label: "Delivery", icon: Bike, bg: "bg-green-100 text-green-700", border: "border-green-500" },
                    { key: "STOCK_KEEPER", label: "Stock Keeper", icon: Package, bg: "bg-orange-100 text-orange-700", border: "border-orange-500" },
                    { key: "ACCOUNTANT", label: "Accountant", icon: DollarSign, bg: "bg-indigo-100 text-indigo-700", border: "border-indigo-500" },
                    { key: "NIGHT_SHIFT", label: "Night Shift", icon: Moon, bg: "bg-slate-800 text-white", border: "border-slate-900" },
                    { key: "SUPERVISOR", label: "Supervisor", icon: Shield, bg: "bg-pink-100 text-pink-700", border: "border-pink-500" },
                    { key: "SECURITY", label: "Security", icon: Shield, bg: "bg-gray-800 text-white", border: "border-gray-900" },
                    { key: "CLEANER", label: "Cleaner", icon: UserCog, bg: "bg-cyan-100 text-cyan-700", border: "border-cyan-500" },
                  ].map(r => {
                    const Icon = r.icon;
                    const isSelected = formData.staffRole === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => handleRoleChange(r.key)}
                        className={"p-2.5 rounded-xl border-2 transition " + (isSelected ? r.border + " " + r.bg : "border-slate-200 bg-white")}
                      >
                        <Icon size={18} className="mx-auto mb-1" />
                        <p className="text-[10px] font-medium leading-tight">{r.label}</p>
                      </button>
                    );
                  })}
                  
                  {/* Custom Role Button */}
                  <button
                    type="button"
                    onClick={() => { setFormData({ ...formData, staffRole: "CUSTOM", customRole: "" }); setSelectedPermissionGuard([]); }}
                    className={"p-2.5 rounded-xl border-2 border-dashed transition col-span-2 " + (formData.staffRole === "CUSTOM" ? "border-violet-500 bg-violet-100 text-violet-700" : "border-slate-300 bg-white text-slate-500")}
                  >
                    <Sparkles size={18} className="mx-auto mb-1" />
                    <p className="text-[10px] font-medium leading-tight">Custom Role</p>
                  </button>
                </div>

                {/* Custom Role Input */}
                {formData.staffRole === "CUSTOM" && (
                  <div className="mt-3 bg-violet-50 border-2 border-violet-300 rounded-xl p-3">
                    <label className="block text-xs font-bold text-violet-800 mb-1.5 flex items-center gap-1">
                      <Sparkles size={12} /> Type Custom Role Name
                    </label>
                    <Input
                      value={formData.customRole}
                      onChange={(e) => handleCustomRoleChange(e.target.value)}
                      placeholder="e.g., Assistant, Supervisor, Typist..."
                      maxLength={30}
                      className="bg-white"
                      required={formData.staffRole === "CUSTOM"}
                    />
                    <p className="text-[10px] text-violet-600 mt-1">Max 30 characters, short and clear</p>
                  </div>
                )}
              </div>

              {/* PermissionGuard Section */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPermissionGuard(!showPermissionGuard)}
                  className="w-full flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-xl p-3"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-blue-600" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-blue-800">Access PermissionGuard</p>
                      <p className="text-[10px] text-blue-600">{selectedPermissionGuard.length} of {ALL_PERMISSIONS.length} selected</p>
                    </div>
                  </div>
                  {showPermissionGuard ? <ChevronUp size={18} className="text-blue-600" /> : <ChevronDown size={18} className="text-blue-600" />}
                </button>

                {showPermissionGuard && (
                  <div className="mt-3 bg-slate-50 rounded-xl p-3 max-h-80 overflow-y-auto">
                    {/* Group by category */}
                    {["General", "Orders", "Inventory", "Customers", "Finance", "Reports", "Staff", "Settings"].map(category => {
                      const categoryPerms = ALL_PERMISSIONS.filter(p => p.category === category);
                      if (categoryPerms.length === 0) return null;
                      const categoryKeys = categoryPerms.map(p => p.key);
                      const allSelected = categoryKeys.every(k => selectedPermissionGuard.includes(k));
                      const someSelected = categoryKeys.some(k => selectedPermissionGuard.includes(k));

                      return (
                        <div key={category} className="mb-3 last:mb-0">
                          <button
                            type="button"
                            onClick={() => toggleCategory(categoryKeys)}
                            className="w-full flex items-center justify-between mb-2"
                          >
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">{category}</span>
                            <span className={"text-[10px] px-2 py-0.5 rounded-full font-bold " + (allSelected ? "bg-blue-600 text-white" : someSelected ? "bg-blue-200 text-blue-700" : "bg-slate-200 text-slate-500")}>
                              {allSelected ? "✓ All" : someSelected ? "Partial" : "None"}
                            </span>
                          </button>
                          <div className="space-y-1">
                            {categoryPerms.map(perm => {
                              const isChecked = selectedPermissionGuard.includes(perm.key);
                              return (
                                <label key={perm.key} className={"flex items-center gap-2 p-2 rounded-lg cursor-pointer " + (isChecked ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200")}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(perm.key)}
                                    className="w-4 h-4 accent-blue-600"
                                  />
                                  <span className="text-xs text-slate-700">{perm.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Salary Section */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" /> Salary Setup
                </p>

                {/* Salary Type */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-700 mb-2">Salary Type</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: "MONTHLY", label: "Monthly" },
                      { key: "DAILY", label: "Daily" },
                      { key: "HOURLY", label: "Hourly" },
                      { key: "CUSTOM", label: "Custom" },
                    ].map(t => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, salaryType: t.key })}
                        className={"py-2 rounded-lg text-[10px] font-bold border-2 transition " + (formData.salaryType === t.key ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 bg-white text-slate-500")}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Working Days + Hours */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Working Days/Month</label>
                    <Input
                      type="number"
                      value={formData.workingDaysPerMonth}
                      onChange={(e) => setFormData({ ...formData, workingDaysPerMonth: e.target.value })}
                      placeholder="26"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {["7", "15", "22", "26", "30"].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFormData({ ...formData, workingDaysPerMonth: d })}
                          className={"text-[10px] px-2 py-0.5 rounded-full border " + (formData.workingDaysPerMonth === d ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-300")}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Hours/Day</label>
                    <Input
                      type="number"
                      value={formData.hoursPerDay}
                      onChange={(e) => setFormData({ ...formData, hoursPerDay: e.target.value })}
                      placeholder="8"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {["1", "5", "8", "10"].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setFormData({ ...formData, hoursPerDay: h })}
                          className={"text-[10px] px-2 py-0.5 rounded-full border " + (formData.hoursPerDay === h ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300")}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Basic Salary (৳)</label>
                  <Input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Auto-calc daily rate (assuming 30 days)
                      const daily = val ? (parseFloat(val) / 30).toFixed(0) : "";
                      setFormData({ ...formData, basicSalary: val, dailyRate: daily });
                    }}
                    placeholder="e.g., 15000"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Optional - monthly fixed salary</p>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Daily Rate (৳)</label>
                  <Input
                    type="number"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    placeholder="e.g., 500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Auto-calculated from basic salary ÷ 30</p>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Order Commission (%)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.commissionPercent}
                    onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })}
                    placeholder="e.g., 2 (means 2%)"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">% of order amount - for sales/cashier staff</p>
                </div>
              </div>

              {message && (
                <p className={"text-center text-sm font-medium " + (message.includes("✅") ? "text-green-600" : "text-red-500")}>{message}</p>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                <Plus size={16} className="mr-2" />
                {saving ? "Adding..." : "Add Staff"}
              </Button>

              <p className="text-[10px] text-slate-500 text-center">
                Staff will log in with their email and password
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// WRAPPED WITH PERMISSION GUARD
export default function StaffPage() {
  return (
    <PermissionGuard permission={"manage_staff"}>
      <StaffPageInner />
    </PermissionGuard>
  );
}

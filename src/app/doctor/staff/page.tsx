"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Users, Plus, X, Edit, Trash2, User, Mail, Phone, Building2, Clock, KeyRound } from "lucide-react";

const ROLES = ["RECEPTIONIST", "ASSISTANT", "NURSE", "COMPOUNDER", "MANAGER", "OTHER"];

export default function DoctorStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "ASSISTANT",
    permissions: {
      canViewAppointments: true,
      canBookAppointments: true,
      canCreateLocalRx: false,
      canRecordEarnings: false,
      canViewPatients: true,
      canEditPatients: false,
    },
    chamberIds: [] as string[],
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [sRes, cRes] = await Promise.all([
      fetch("/api/doctor/staff", { credentials: "include" }).then(r => r.json()),
      fetch("/api/doctor/chambers", { credentials: "include" }).then(r => r.json()),
    ]);
    setStaff(sRes.staff || []);
    setChambers(cRes.chambers || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const resetForm = () => {
    setForm({
      name: "", email: "", phone: "", password: "", role: "ASSISTANT",
      permissions: { canViewAppointments: true, canBookAppointments: true, canCreateLocalRx: false, canRecordEarnings: false, canViewPatients: true, canEditPatients: false },
      chamberIds: [], notes: "",
    });
    setEditing(null);
    setMessage("");
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.user?.name || "",
      email: s.user?.email || "",
      phone: s.user?.phone || "",
      password: "",
      role: s.role || "ASSISTANT",
      permissions: s.permissions || form.permissions,
      chamberIds: (s.chamberAssignments || []).map((ca: any) => ca.chamberId),
      notes: s.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (editing) {
      const res = await fetch(`/api/doctor/staff/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: form.role,
          permissions: form.permissions,
          notes: form.notes,
          chamberIds: form.chamberIds,
        }),
      });
      const data = await res.json();
      setSaving(false);
      if (res.ok) { setShowForm(false); resetForm(); load(); }
      else setMessage(data.message || "Failed");
    } else {
      if (!form.password || form.password.length < 6) {
        setMessage("Password must be at least 6 characters");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/doctor/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setSaving(false);
      if (res.ok) {
        setShowForm(false);
        setCredentials(data.credentials);
        resetForm();
        load();
      } else {
        setMessage(data.message || "Failed");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    const res = await fetch(`/api/doctor/staff/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  const toggleChamber = (id: string) => {
    setForm(f => ({
      ...f,
      chamberIds: f.chamberIds.includes(id)
        ? f.chamberIds.filter(c => c !== id)
        : [...f.chamberIds, id],
    }));
  };

  const togglePermission = (key: keyof typeof form.permissions) => {
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  };
// PART2

  const roleColor = (r: string) => {
    switch (r) {
      case "RECEPTIONIST": return "bg-blue-100 text-blue-700";
      case "ASSISTANT": return "bg-green-100 text-green-700";
      case "NURSE": return "bg-purple-100 text-purple-700";
      case "COMPOUNDER": return "bg-amber-100 text-amber-700";
      case "MANAGER": return "bg-indigo-100 text-indigo-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "SUSPENDED": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Users className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">My Staff</h1>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Add assistants, receptionists, nurses. They can help manage appointments, patients, and prescriptions.
      </p>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : staff.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Users className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm mb-1">No staff added yet.</p>
          <p className="text-xs text-slate-400 mb-3">Add your first assistant to help with your practice.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => (
            <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-blue-600" size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{s.user?.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${roleColor(s.role)}`}>
                        {s.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                {s.user?.email && <div className="flex items-center gap-1.5"><Mail size={11} /> {s.user.email}</div>}
                {s.user?.phone && <div className="flex items-center gap-1.5"><Phone size={11} /> {s.user.phone}</div>}
              </div>

              {s.chamberAssignments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.chamberAssignments.map((ca: any) => (
                    <span key={ca.chamberId} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] flex items-center gap-1">
                      <Building2 size={9} /> {ca.chamber?.name}
                    </span>
                  ))}
                </div>
              )}

              {s.attendances?.length > 0 && (
                <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock size={10} />
                  Last: {new Date(s.attendances[0].checkInAt).toLocaleDateString()}
                  {s.attendances[0].checkOutAt && " ✓"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
// PART3

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold">{editing ? "Edit Staff" : "Add Staff"}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {!editing && (
                <>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name *"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email *"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone" type="tel"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  <div>
                    <input required type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Login password (min 6 chars) *"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <KeyRound size={10} /> Share this with the staff member for login
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => (
                    <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                      className={`py-2 rounded-xl text-[10px] font-medium border ${
                        form.role === r ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200"
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Permissions</label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl">
                  {[
                    { key: "canViewAppointments", label: "View appointments" },
                    { key: "canBookAppointments", label: "Book appointments" },
                    { key: "canViewPatients", label: "View patients" },
                    { key: "canEditPatients", label: "Add/Edit patients" },
                    { key: "canCreateLocalRx", label: "Create prescriptions" },
                    { key: "canRecordEarnings", label: "Record earnings" },
                  ].map((p) => (
                    <label key={p.key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{p.label}</span>
                      <input type="checkbox"
                        checked={(form.permissions as any)[p.key]}
                        onChange={() => togglePermission(p.key as any)}
                        className="w-4 h-4" />
                    </label>
                  ))}
                </div>
              </div>

              {chambers.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Assign to Chambers</label>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl">
                    {chambers.map((c) => (
                      <label key={c.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 flex items-center gap-1">
                          <Building2 size={12} /> {c.name}
                        </span>
                        <input type="checkbox"
                          checked={form.chamberIds.includes(c.id)}
                          onChange={() => toggleChamber(c.id)}
                          className="w-4 h-4" />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2} placeholder="Notes (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Update Staff" : "Add Staff"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <KeyRound className="text-green-600" size={24} />
              </div>
              <h2 className="font-bold text-lg">Staff Added!</h2>
              <p className="text-xs text-slate-500">Share these credentials with your staff member</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 mb-4">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Email</div>
                <div className="font-mono text-sm break-all">{credentials.email}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Password</div>
                <div className="font-mono text-sm">{credentials.password}</div>
              </div>
            </div>
            <p className="text-xs text-amber-600 mb-3">
              ⚠️ This password won't be shown again. Save it now.
            </p>
            <button onClick={() => setCredentials(null)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

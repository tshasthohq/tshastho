"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Plus, X, Trash2, User, Clock, CheckCircle, XCircle } from "lucide-react";

export default function ConsentsPage() {
  const { user } = useAuth();
  const [consents, setConsents] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    doctorId: "",
    scope: "FULL_HISTORY",
    expiresAt: "",
  });

  const load = async () => {
    setLoading(true);
    const [cRes, dRes] = await Promise.all([
      fetch("/api/patients/me/consents", { credentials: "include" }).then(r => r.json()),
      fetch("/api/doctors?limit=100", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]);
    setConsents(cRes.consents || []);
    setDoctors(dRes.doctors || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorId) { setMessage("Select a doctor"); return; }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/patients/me/consents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        doctorId: form.doctorId,
        scope: form.scope,
        expiresAt: form.expiresAt || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ doctorId: "", scope: "FULL_HISTORY", expiresAt: "" });
      load();
    } else {
      setMessage(data.message || "Failed");
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this doctor's access?")) return;
    const res = await fetch(`/api/patients/me/consents?id=${id}`, {
      method: "DELETE", credentials: "include",
    });
    if (res.ok) load();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "REVOKED": return "bg-red-100 text-red-700";
      case "EXPIRED": return "bg-slate-100 text-slate-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  const scopeLabel = (s: string) => {
    switch (s) {
      case "FULL_HISTORY": return "Full Medical History";
      case "SPECIFIC_REPORTS": return "Specific Reports";
      case "CURRENT_VISIT": return "Current Visit Only";
      case "PRESCRIPTIONS_ONLY": return "Prescriptions Only";
      default: return s;
    }
  };
// PART2

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Doctor Access</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Grant
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
        <h3 className="text-xs font-bold text-blue-800 mb-1">🔐 Privacy Protection</h3>
        <p className="text-xs text-blue-700">
          Only doctors you explicitly grant access can view your medical history. You can revoke access anytime.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading...</div>
      ) : consents.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl">
          <Shield className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-500 text-sm">No doctors have access to your history.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {consents.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-blue-600" size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">
                      Dr. {c.doctor?.user?.name}
                    </div>
                    <div className="text-xs text-blue-600">{c.doctor?.specialty}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(c.status)}`}>
                  {c.status}
                </span>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg mb-2 text-xs">
                <div className="text-slate-500">Scope</div>
                <div className="font-medium text-slate-800">{scopeLabel(c.scope)}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  {c.expiresAt
                    ? `Expires ${new Date(c.expiresAt).toLocaleDateString()}`
                    : "Never expires"}
                </div>
                {c.status === "ACTIVE" && (
                  <button onClick={() => handleRevoke(c.id)}
                    className="flex items-center gap-1 text-red-600 font-medium">
                    <Trash2 size={10} /> Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold">Grant Doctor Access</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Select Doctor *</label>
                <select required value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="">Select a doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user?.name} {d.specialty ? `— ${d.specialty}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Access Scope *</label>
                <select value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="FULL_HISTORY">Full Medical History</option>
                  <option value="PRESCRIPTIONS_ONLY">Prescriptions Only</option>
                  <option value="SPECIFIC_REPORTS">Specific Reports</option>
                  <option value="CURRENT_VISIT">Current Visit Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Expires On (optional)</label>
                <input type="date" value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <p className="text-[10px] text-slate-500 mt-1">
                  Leave empty for permanent access
                </p>
              </div>

              {message && <p className="text-sm text-red-600">{message}</p>}

              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
                {saving ? "Granting..." : "Grant Access"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

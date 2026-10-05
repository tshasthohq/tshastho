"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Save, MapPin, Clock, Camera } from "lucide-react";

export default function AttendanceRulesPage() {
  const { user } = useAuth();
  const [chambers, setChambers] = useState<any[]>([]);
  const [rules, setRules] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const [cRes, rRes] = await Promise.all([
      fetch("/api/doctor/chambers", { credentials: "include" }).then(r => r.json()),
      fetch("/api/doctor/attendance-rules", { credentials: "include" }).then(r => r.json()),
    ]);
    setChambers(cRes.chambers || []);
    const ruleMap: any = {};
    (rRes.rules || []).forEach((r: any) => { ruleMap[r.chamberId] = r; });
    setRules(ruleMap);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const updateRule = (chamberId: string, field: string, value: any) => {
    setRules({
      ...rules,
      [chamberId]: {
        ...(rules[chamberId] || {
          chamberId,
          radiusMeters: 200,
          workingHoursStart: "09:00",
          workingHoursEnd: "18:00",
          lateGraceMinutes: 10,
          requireSelfie: true,
          requireGps: true,
        }),
        [field]: value,
      },
    });
  };

  const saveRule = async (chamberId: string) => {
    setSaving(chamberId);
    setMessage("");
    const rule = rules[chamberId];
    const res = await fetch("/api/doctor/attendance-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...rule, chamberId }),
    });
    setSaving(null);
    if (res.ok) {
      setMessage("✅ Saved!");
      setTimeout(() => setMessage(""), 2000);
    } else {
      setMessage("Failed to save");
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">Attendance Rules</h1>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Configure check-in rules per chamber (GPS radius, working hours, late grace).
      </p>

      {message && <p className="mb-3 text-center text-sm text-green-600">{message}</p>}

      {chambers.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl text-slate-500 text-sm">
          No chambers found. <a href="/doctor/chambers" className="text-blue-600">Add chamber first</a>
        </div>
      ) : (
        <div className="space-y-4">
          {chambers.map((c: any) => {
            const rule = rules[c.id] || {
              chamberId: c.id,
              radiusMeters: 200,
              workingHoursStart: "09:00",
              workingHoursEnd: "18:00",
              lateGraceMinutes: 10,
              requireSelfie: true,
              requireGps: true,
            };
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <h3 className="font-bold text-slate-800 mb-3">{c.name}</h3>

                {!c.gpsLatitude && (
                  <div className="text-xs bg-amber-50 text-amber-700 p-2 rounded-lg mb-3">
                    ⚠️ GPS coordinates not set. <a href="/doctor/chambers" className="underline">Update chamber</a>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <MapPin size={11} /> Radius (meters)
                    </label>
                    <input type="number" min={50} max={5000} value={rule.radiusMeters}
                      onChange={(e) => updateRule(c.id, "radiusMeters", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Clock size={11} /> Start Time
                      </label>
                      <input type="time" value={rule.workingHoursStart}
                        onChange={(e) => updateRule(c.id, "workingHoursStart", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Clock size={11} /> End Time
                      </label>
                      <input type="time" value={rule.workingHoursEnd}
                        onChange={(e) => updateRule(c.id, "workingHoursEnd", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1">Late Grace (minutes)</label>
                    <input type="number" min={0} max={60} value={rule.lateGraceMinutes}
                      onChange={(e) => updateRule(c.id, "lateGraceMinutes", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>

                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={rule.requireSelfie}
                        onChange={(e) => updateRule(c.id, "requireSelfie", e.target.checked)} />
                      <Camera size={12} /> Require Selfie
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={rule.requireGps}
                        onChange={(e) => updateRule(c.id, "requireGps", e.target.checked)} />
                      <MapPin size={12} /> Require GPS
                    </label>
                  </div>

                  <button onClick={() => saveRule(c.id)} disabled={saving === c.id}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    <Save size={14} /> {saving === c.id ? "Saving..." : "Save Rules"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

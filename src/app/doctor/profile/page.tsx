"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, Award, FileText, Plus, X, Upload, Trash2, Save, Edit3, CheckCircle } from "lucide-react";

const DOC_TYPES = ["LICENSE", "DEGREE", "CERTIFICATE", "NID", "PHOTO", "OTHER"];

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"basic" | "specialties" | "qualifications" | "documents">("basic");
  const [profile, setProfile] = useState<any>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [basicForm, setBasicForm] = useState({
    specialty: "",
    licenseNumber: "",
    experience: 0,
    consultationFee: 0,
    bookingPhone: "",
    chamberAddress: "",
    bio: "",
    gender: "",
    languages: "",
    hospitalAffiliation: "",
    subSpecialties: "",
    onlineAvailable: true,
    inPersonAvailable: true,
  });

  const [newSpecialty, setNewSpecialty] = useState({ name: "", isPrimary: false });
  const [newQual, setNewQual] = useState({ degree: "", institution: "", year: 2000, country: "" });
  const [newDoc, setNewDoc] = useState({ type: "LICENSE", title: "", fileUrl: "" });

  const load = async () => {
    setLoading(true);
    const [p, s, q, d] = await Promise.all([
      fetch("/api/doctor/update-profile", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
      fetch("/api/doctor/specialties", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
      fetch("/api/doctor/qualifications", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
      fetch("/api/doctor/documents", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]);
    if (p.doctor) {
      setProfile(p.doctor);
      setBasicForm({
        specialty: p.doctor.specialty || "",
        licenseNumber: p.doctor.licenseNumber || "",
        experience: p.doctor.experience || 0,
        consultationFee: Number(p.doctor.consultationFee) || 0,
        bookingPhone: p.doctor.bookingPhone || "",
        chamberAddress: p.doctor.chamberAddress || "",
        bio: p.doctor.bio || "",
        gender: p.doctor.gender || "",
        languages: p.doctor.languages || "",
        hospitalAffiliation: p.doctor.hospitalAffiliation || "",
        subSpecialties: p.doctor.subSpecialties || "",
        onlineAvailable: p.doctor.onlineAvailable ?? true,
        inPersonAvailable: p.doctor.inPersonAvailable ?? true,
      });
    }
    setSpecialties(s.specialties || []);
    setQualifications(q.qualifications || []);
    setDocuments(d.documents || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const saveBasic = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/doctor/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(basicForm),
    });
    setSaving(false);
    if (res.ok) setMessage("✅ Saved!");
    else setMessage("Failed to save");
  };
// PART2

  const saveSpecialties = async (list: any[]) => {
    setSaving(true);
    const res = await fetch("/api/doctor/specialties", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ specialties: list }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setSpecialties(d.specialties || []);
      setMessage("✅ Specialties saved!");
    }
  };

  const addSpecialty = () => {
    if (!newSpecialty.name.trim()) return;
    const updated = [...specialties.map(s => ({ name: s.name, isPrimary: s.isPrimary })), newSpecialty];
    saveSpecialties(updated);
    setNewSpecialty({ name: "", isPrimary: false });
  };

  const removeSpecialty = (idx: number) => {
    const updated = specialties.filter((_, i) => i !== idx).map(s => ({ name: s.name, isPrimary: s.isPrimary }));
    saveSpecialties(updated);
  };

  const saveQualifications = async (list: any[]) => {
    setSaving(true);
    const res = await fetch("/api/doctor/qualifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ qualifications: list }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setQualifications(d.qualifications || []);
      setMessage("✅ Qualifications saved!");
    }
  };

  const addQualification = () => {
    if (!newQual.degree.trim()) return;
    const updated = [...qualifications.map(q => ({
      degree: q.degree, institution: q.institution, year: q.year, country: q.country
    })), newQual];
    saveQualifications(updated);
    setNewQual({ degree: "", institution: "", year: 2000, country: "" });
  };

  const removeQualification = (idx: number) => {
    const updated = qualifications.filter((_, i) => i !== idx).map(q => ({
      degree: q.degree, institution: q.institution, year: q.year, country: q.country
    }));
    saveQualifications(updated);
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
    const data = await res.json();
    setUploading(false);
    if (res.ok && data.url) setNewDoc({ ...newDoc, fileUrl: data.url });
    else setMessage("Upload failed");
  };

  const saveDocument = async () => {
    if (!newDoc.fileUrl) { setMessage("Please upload file"); return; }
    setSaving(true);
    const res = await fetch("/api/doctor/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newDoc),
    });
    setSaving(false);
    if (res.ok) {
      setNewDoc({ type: "LICENSE", title: "", fileUrl: "" });
      load();
      setMessage("✅ Document uploaded!");
    } else setMessage("Failed");
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const res = await fetch(`/api/doctor/documents?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
// PART3

  const verifColor = (s: string) => {
    switch (s) {
      case "VERIFIED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "UNDER_REVIEW": return "bg-blue-100 text-blue-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <User className="text-blue-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
        {profile && (
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${verifColor(profile.verificationStatus)}`}>
            {profile.verificationStatus || "PENDING"}
          </span>
        )}
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto bg-white rounded-xl p-1 border border-slate-100">
        {[
          { k: "basic", label: "Basic", icon: User },
          { k: "specialties", label: "Specialties", icon: Award },
          { k: "qualifications", label: "Qualifications", icon: Award },
          { k: "documents", label: "Documents", icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                tab === t.k ? "bg-blue-600 text-white" : "text-slate-600"
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {message && <p className="mb-3 text-sm text-center text-green-600">{message}</p>}

      {tab === "basic" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Primary Specialty *</label>
              <input value={basicForm.specialty} onChange={(e) => setBasicForm({ ...basicForm, specialty: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">License Number *</label>
              <input value={basicForm.licenseNumber} onChange={(e) => setBasicForm({ ...basicForm, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Experience (years)</label>
              <input type="number" value={basicForm.experience} onChange={(e) => setBasicForm({ ...basicForm, experience: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Consultation Fee (৳)</label>
              <input type="number" value={basicForm.consultationFee} onChange={(e) => setBasicForm({ ...basicForm, consultationFee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Booking Phone</label>
              <input value={basicForm.bookingPhone} onChange={(e) => setBasicForm({ ...basicForm, bookingPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Gender</label>
              <select value={basicForm.gender} onChange={(e) => setBasicForm({ ...basicForm, gender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                <option value="">Not set</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Chamber Address</label>
            <input value={basicForm.chamberAddress} onChange={(e) => setBasicForm({ ...basicForm, chamberAddress: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Hospital Affiliation</label>
            <input value={basicForm.hospitalAffiliation} onChange={(e) => setBasicForm({ ...basicForm, hospitalAffiliation: e.target.value })}
              placeholder="e.g. Dhaka Medical College Hospital" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Languages Spoken</label>
            <input value={basicForm.languages} onChange={(e) => setBasicForm({ ...basicForm, languages: e.target.value })}
              placeholder="Bengali, English, Hindi" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Sub-specialties</label>
            <input value={basicForm.subSpecialties} onChange={(e) => setBasicForm({ ...basicForm, subSpecialties: e.target.value })}
              placeholder="e.g. Interventional Cardiology" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Bio / About</label>
            <textarea value={basicForm.bio} onChange={(e) => setBasicForm({ ...basicForm, bio: e.target.value })}
              rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={basicForm.onlineAvailable}
                onChange={(e) => setBasicForm({ ...basicForm, onlineAvailable: e.target.checked })} />
              Online Available
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={basicForm.inPersonAvailable}
                onChange={(e) => setBasicForm({ ...basicForm, inPersonAvailable: e.target.checked })} />
              In-person Available
            </label>
          </div>
          <button onClick={saveBasic} disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {tab === "specialties" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="space-y-2">
            {specialties.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                <span className="flex-1 text-sm font-medium">{s.name}</span>
                {s.isPrimary && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Primary</span>}
                <button onClick={() => removeSpecialty(idx)} className="text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
            {specialties.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No specialties added.</p>}
          </div>
          <div className="border-t pt-3">
            <div className="flex gap-2 items-center">
              <input value={newSpecialty.name} onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })}
                placeholder="Add specialty" className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={newSpecialty.isPrimary}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, isPrimary: e.target.checked })} />
                Primary
              </label>
              <button onClick={addSpecialty} className="bg-blue-600 text-white p-2 rounded-xl"><Plus size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {tab === "qualifications" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="space-y-2">
            {qualifications.map((q, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                <div className="flex-1">
                  <div className="text-sm font-medium">{q.degree}</div>
                  <div className="text-xs text-slate-500">
                    {q.institution}{q.year ? ` • ${q.year}` : ""}{q.country ? ` • ${q.country}` : ""}
                  </div>
                </div>
                <button onClick={() => removeQualification(idx)} className="text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
            {qualifications.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No qualifications.</p>}
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={newQual.degree} onChange={(e) => setNewQual({ ...newQual, degree: e.target.value })}
                placeholder="Degree (MBBS)" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={newQual.institution} onChange={(e) => setNewQual({ ...newQual, institution: e.target.value })}
                placeholder="Institution" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={newQual.year} onChange={(e) => setNewQual({ ...newQual, year: Number(e.target.value) })}
                placeholder="Year" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={newQual.country} onChange={(e) => setNewQual({ ...newQual, country: e.target.value })}
                placeholder="Country" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <button onClick={addQualification} className="w-full bg-blue-600 text-white py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
              <Plus size={14} /> Add Qualification
            </button>
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
            <h3 className="font-bold text-slate-800">Upload New Document</h3>
            <div className="grid grid-cols-2 gap-2">
              <select value={newDoc.type} onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={newDoc.title} onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                placeholder="Title (optional)" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            {newDoc.fileUrl ? (
              <div className="flex items-center gap-2 bg-green-50 p-2 rounded-xl">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-xs text-green-700 flex-1">File uploaded</span>
                <button onClick={() => setNewDoc({ ...newDoc, fileUrl: "" })} className="text-red-500"><X size={14} /></button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer">
                <Upload size={20} className="text-slate-400 mr-2" />
                <span className="text-sm text-slate-500">{uploading ? "Uploading..." : "Choose file"}</span>
                <input type="file" accept="image/*,application/pdf" onChange={uploadFile} className="hidden" />
              </label>
            )}
            <button onClick={saveDocument} disabled={saving || !newDoc.fileUrl}
              className="w-full bg-blue-600 text-white py-2 rounded-xl font-medium text-sm disabled:opacity-50">
              {saving ? "Uploading..." : "Add Document"}
            </button>
          </div>

          <div className="space-y-2">
            {documents.map((d) => (
              <div key={d.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                <FileText className="text-slate-400" size={20} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{d.title || d.type}</div>
                  <div className="text-xs text-slate-500">{d.type}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${verifColor(d.status)}`}>
                  {d.status}
                </span>
                <button onClick={() => deleteDocument(d.id)} className="text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
            {documents.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No documents uploaded.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

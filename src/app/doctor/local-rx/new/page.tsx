"use client";
import { useT } from "@/i18n/doctor-extra";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { postLocalRx, cachedGet } from "@/lib/offline/doctor-rx";
import { ArrowLeft, Search, X, Plus, Trash2, Save, Printer, Mic, MicOff, Zap, FileText, Stethoscope, AlertTriangle, Building2, UserPlus } from "lucide-react";

type Item = { medicineName: string; strength: string; dosageForm: string; dosage: string; frequency: string; duration: string; quantity: string; beforeAfterMeal: string; instructions: string };
const emptyItem = (): Item => ({ medicineName: "", strength: "", dosageForm: "", dosage: "", frequency: "", duration: "", quantity: "", beforeAfterMeal: "", instructions: "" });

const FORMS = ["Tab", "Cap", "Syr", "Inj", "Drop", "Cream", "Inhaler", "Supp"];
const FORM_MAP: Record<string, string> = { tablet: "Tab", capsule: "Cap", syrup: "Syr", suspension: "Syr", injection: "Inj", drop: "Drop", drops: "Drop", cream: "Cream", ointment: "Cream", inhaler: "Inhaler", suppository: "Supp" };
const FREQ = ["1+0+1", "1+1+1", "0+0+1", "1+0+0", "0+0+0"];
const DURS = ["3 days", "5 days", "7 days", "10 days", "14 days", "1 month", "Continue"];
const MEALS = ["30m Before", "1h Before", "After meal", "Empty stomach", "Bedtime", "Not applicable"];
const DIAG = ["Fever", "URTI", "Gastritis", "Diarrhea", "Hypertension", "Diabetes", "Allergic Rhinitis"];
const TESTS = ["CBC", "Blood Sugar (F)", "Blood Sugar (R)", "Creatinine", "Lipid Profile", "ECG", "USG Whole Abdomen", "X-Ray Chest"];
const FEES = [200, 300, 500, 1000];
const FU: [string, number][] = [["1 Week", 7], ["2 Weeks", 14], ["1 Month", 30], ["3 Months", 90]];

const calcQty = (freq: string, dur: string) => {
  if (!freq || !dur) return "";
  const d = dur.toLowerCase();
  if (d === "continue" || d === "as needed") return "As directed";
  const fm = freq.match(/\d+/g);
  const daily = fm ? fm.reduce((s, n) => s + parseInt(n), 0) : 0;
  const n = d.match(/\d+/);
  let days = n ? parseInt(n[0]) : 0;
  if (d.includes("month")) days *= 30;
  else if (d.includes("week")) days *= 7;
  return daily > 0 && days > 0 ? String(daily * days) : "";
};

const mk = (medicineName: string, strength: string, dosageForm: string, dosage: string, frequency: string, duration: string, beforeAfterMeal: string, instructions = ""): Item =>
  ({ medicineName, strength, dosageForm, dosage, frequency, duration, quantity: calcQty(frequency, duration), beforeAfterMeal, instructions });

const PACKS: Record<string, Item[]> = {
  "Fever & Cold": [
    mk("Napa Extend", "665mg", "Tab", "1 tablet", "1+1+1", "3 days", "After meal", "Drink plenty of water"),
    mk("Fexo 120", "120mg", "Tab", "1 tablet", "1+0+0", "7 days", "30m Before"),
    mk("Histacin", "4mg", "Tab", "1 tablet", "0+0+1", "5 days", "Bedtime", "May cause drowsiness"),
  ],
  "Gastric/Acidity": [mk("Seclo 20", "20mg", "Cap", "1 capsule", "1+0+1", "14 days", "30m Before")],
  "Cough & Cold": [
    mk("Adryl Syrup", "100ml", "Syr", "2 tsp", "1+1+1", "5 days", "After meal"),
    mk("Fexo 120", "120mg", "Tab", "1 tablet", "1+0+0", "7 days", "30m Before"),
  ],
  "Diarrhea": [
    mk("Orsaline-N", "Sachet", "Tab", "1 sachet", "As needed", "3 days", "Not applicable", "Mix in 500ml water"),
    mk("Zinc 20", "20mg", "Tab", "1 tablet", "0+0+1", "14 days", "After meal"),
  ],
};

const card = "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm";
const lbl = "text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block";
const inp = "w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none bg-white";
const chip = (on: boolean) => "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors " + (on ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200");
const miniChip = "px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-600 active:bg-blue-100";
const sevClass = (s: string) => s === "CONTRAINDICATED" ? "bg-red-50 border-red-300 text-red-800" : s === "MAJOR" ? "bg-orange-50 border-orange-300 text-orange-800" : s === "MODERATE" ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-slate-50 border-slate-200 text-slate-700";

function NewLocalRxForm() {
  const T = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const prefillPatientId = searchParams.get("patientId") || "";

  const [patients, setPatients] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedChamberId, setSelectedChamberId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", phone: "", age: "", gender: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<any[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [form, setForm] = useState<any>({ chiefComplaint: "", examination: "", diagnosis: "", investigations: "", advice: "", followUpDate: "", followUpNotes: "", notes: "", fee: 0 });
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [medQuery, setMedQuery] = useState("");
  const [medResults, setMedResults] = useState<any[]>([]);
  const [activeMed, setActiveMed] = useState<number | null>(null);
  const [listening, setListening] = useState("");
  const [voiceLang, setVoiceLang] = useState("en-US");
  const recRef = useRef<any>(null);

  const loadPatients = async () => {
    const res = await cachedGet("/api/doctor/local-patients");
    const data = await res.json();
    setPatients(data.patients || []);
    return data.patients || [];
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([loadPatients(), cachedGet("/api/doctor/chambers").then((r) => r.json())]).then(([pList, cRes]) => {
      setChambers(cRes.chambers || []);
      const primary = (cRes.chambers || []).find((c: any) => c.isPrimary);
      if (primary) {
        setSelectedChamberId(primary.id);
        setForm((f: any) => ({ ...f, fee: Number(primary.defaultFee) || 0 }));
      }
      if (prefillPatientId) {
        const p = pList.find((x: any) => x.id === prefillPatientId);
        if (p) setSelectedPatient(p);
      }
    }).catch(() => {});
  }, [user, prefillPatientId]);

  useEffect(() => {
    const q = medQuery.trim();
    if (q.length < 2) { setMedResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/master-medicines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
        const data = await res.json();
        setMedResults(data.medicines || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [medQuery]);

  const handleCreatePatient = async () => {
    if (!newPatient.name.trim()) { setMessage(T("Patient-er naam likhun")); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/doctor/local-patients", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ ...newPatient, age: newPatient.age ? Number(newPatient.age) : undefined, gender: newPatient.gender || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedPatient(data.patient); setShowNew(false); setMessage("");
        setNewPatient({ name: "", phone: "", age: "", gender: "" });
        loadPatients().catch(() => {});
      } else setMessage(data.message || T("Failed"));
    } catch { setMessage(T("Notun patient add korte internet lagbe")); }
    setSaving(false);
  };

  const handleChamber = (id: string) => {
    setSelectedChamberId(id);
    const c = chambers.find((x: any) => x.id === id);
    if (c) setForm((f: any) => ({ ...f, fee: Number(c.defaultFee) || 0 }));
  };

  const append = (field: string, val: string) =>
    setForm((f: any) => ({ ...f, [field]: !f[field] ? val : f[field].includes(val) ? f[field] : f[field] + ", " + val }));

  const setFollowUp = (days: number) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    setForm((f: any) => ({ ...f, followUpDate: d.toISOString().split("T")[0] }));
  };

  const toggleDictation = (field: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setMessage(T("Ei browser-e voice support nei (Chrome use korun)")); return; }
    if (listening === field) { recRef.current?.stop(); setListening(""); return; }
    recRef.current?.stop();
    const r = new SR();
    r.lang = voiceLang; r.continuous = true; r.interimResults = false;
    r.onresult = (e: any) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
      setForm((f: any) => ({ ...f, [field]: ((f[field] || "") + " " + t).trim() }));
    };
    r.onend = () => setListening("");
    recRef.current = r; r.start(); setListening(field);
  };

  const updateItem = (idx: number, field: keyof Item, value: string) =>
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const n: Item = { ...it, [field]: value };
      if (field === "frequency" || field === "duration") n.quantity = calcQty(n.frequency, n.duration);
      return n;
    }));

  const pickMedicine = (idx: number, m: any) => {
    const f = FORM_MAP[String(m.category || "").toLowerCase()] || "";
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, medicineName: m.name, strength: m.strength || it.strength, dosageForm: it.dosageForm || f } : it));
    setActiveMed(null); setMedResults([]);
  };

  const applyPack = (name: string) => {
    const pack = PACKS[name].map((x) => ({ ...x }));
    setItems((prev) => {
      const base = prev.filter((i) => i.medicineName.trim());
      return [...base, ...pack];
    });
  };

  const checkInteractions = async (): Promise<any[]> => {
    const names = items.map((i) => i.medicineName.trim()).filter(Boolean);
    if (names.length < 2) return [];
    try {
      const res = await fetch("/api/pharmacy/interactions/check", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ medicineNames: names }) });
      const data = await res.json();
      return data.warnings || [];
    } catch { return []; }
  };

  const submit = async (andPrint: boolean, force = false) => {
    if (!selectedPatient) { setMessage(T("Age patient select korun")); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const valid = items.filter((i) => i.medicineName.trim());
    if (!valid.length) { setMessage(T("Kom-pokkhe ekta medicine din")); return; }
    if (!force) {
      const w = await checkInteractions();
      if (w.length) { setWarnings(w); setPendingPrint(andPrint); setShowWarning(true); return; }
    }
    setSaving(true); setMessage("");
    try {
      const res = await postLocalRx({ localPatientId: selectedPatient.id, chamberId: selectedChamberId || undefined, ...form, items: valid });
      const data = await res.json();
      if (res.ok) {
        if (data.queued) { alert(T("Offline: Rx ei device-e save hoyeche. Internet ashle auto sync hobe.")); router.push("/doctor/local-rx"); }
        else router.push("/doctor/local-rx/" + data.prescription.id + (andPrint ? "?print=true" : ""));
      } else setMessage(data.message || T("Failed"));
    } catch { setMessage(T("Save hoyni, abar chesta korun")); }
    setSaving(false);
  };

  const filtered = patients.filter((p) => !patientSearch || p.name?.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone?.includes(patientSearch)).slice(0, 8);

  const voiceBox = (field: string, label: string, ph: string) => (
    <div>
      <label className={lbl}>{label}</label>
      <div className="relative">
        <textarea rows={2} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={ph} className={inp + " pr-12"} />
        <button type="button" onClick={() => toggleDictation(field)} className={"absolute right-3 bottom-3 p-2 rounded-full " + (listening === field ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-500")}>
          {listening === field ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-slate-800 flex-1">{T("New Local Rx")}</h1>
          <button type="button" onClick={() => setVoiceLang(voiceLang === "en-US" ? "bn-BD" : "en-US")} className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
            Voice: {voiceLang === "en-US" ? "EN" : "বাংলা"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {message && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{message}</div>}

        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Stethoscope size={18} className="text-blue-600" /> {T("Patient")}</h2>
            {!selectedPatient && <button type="button" onClick={() => setShowNew(!showNew)} className="text-xs font-bold text-blue-600 flex items-center gap-1"><UserPlus size={14} /> {T("New patient")}</button>}
          </div>
          {selectedPatient ? (
            <div className="flex items-center gap-3 bg-blue-600 text-white rounded-xl px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">{(selectedPatient.name || "?")[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{selectedPatient.name}</div>
                <div className="text-xs opacity-90">{[selectedPatient.phone, selectedPatient.age ? selectedPatient.age + "y" : ""].filter(Boolean).join(" | ")}</div>
              </div>
              <button type="button" onClick={() => setSelectedPatient(null)} className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg">{T("Change")}</button>
            </div>
          ) : showNew ? (
            <div className="space-y-3">
              <input className={inp} placeholder={T("Name *")} value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inp} placeholder={T("Phone")} inputMode="tel" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
                <input className={inp} placeholder={T("Age")} inputMode="numeric" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
              </div>
              <div className="flex gap-2">
                {["MALE", "FEMALE", "OTHER"].map((g) => (
                  <button key={g} type="button" onClick={() => setNewPatient({ ...newPatient, gender: newPatient.gender === g ? "" : g })} className={chip(newPatient.gender === g)}>{g[0] + g.slice(1).toLowerCase()}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 text-sm">{T("Cancel")}</button>
                <button type="button" disabled={saving} onClick={handleCreatePatient} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">{T("Add patient")}</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="relative mb-2">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={inp + " pl-10"} placeholder={T("Search patient by name or phone...")} value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                {filtered.map((p) => (
                  <button key={p.id} type="button" onClick={() => setSelectedPatient(p)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 active:bg-blue-50 text-left">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">{(p.name || "?")[0]}</div>
                    <div><div className="text-sm font-semibold text-slate-800">{p.name}</div><div className="text-xs text-slate-500">{p.phone}</div></div>
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-slate-400 text-center py-3">{T("Kono patient pawa gelo na. New patient add korun.")}</p>}
              </div>
            </div>
          )}
        </div>

        {chambers.length > 0 && (
          <div className={card}>
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Building2 size={18} className="text-blue-600" /> {T("Chamber")}</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedChamberId("")} className={chip(selectedChamberId === "")}>{T("No chamber")}</button>
              {chambers.map((c: any) => (<button key={c.id} type="button" onClick={() => handleChamber(c.id)} className={chip(selectedChamberId === c.id)}>{c.name}</button>))}
            </div>
          </div>
        )}

        <div className={card + " space-y-4"}>
          <h2 className="font-bold text-slate-800">{T("Clinical Notes")}</h2>
          {voiceBox("chiefComplaint", T("Chief Complaint"), T("e.g. Fever for 3 days, headache..."))}
          {voiceBox("examination", T("Examination Findings"), T("e.g. BP: 120/80, Pulse: 72, Temp: 98.6F"))}
          <div>
            <label className={lbl}>{T("Diagnosis")}</label>
            <input className={inp} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder={T("Type or tap below...")} />
            <div className="flex flex-wrap gap-1.5 mt-2">{DIAG.map((d) => (<button key={d} type="button" onClick={() => append("diagnosis", d)} className={miniChip}>+ {d}</button>))}</div>
          </div>
          <div>
            <label className={lbl}>{T("Investigations")}</label>
            <input className={inp} value={form.investigations} onChange={(e) => setForm({ ...form, investigations: e.target.value })} placeholder={T("Type or tap below...")} />
            <div className="flex flex-wrap gap-1.5 mt-2">{TESTS.map((t) => (<button key={t} type="button" onClick={() => append("investigations", t)} className={miniChip}>+ {t}</button>))}</div>
          </div>
        </div>

        <div className={card}>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1 mb-2"><Zap size={12} /> {T("One-click Rx packs")}</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PACKS).map((k) => (<button key={k} type="button" onClick={() => applyPack(k)} className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs font-bold text-blue-700 shadow-sm">{k}</button>))}
            </div>
          </div>
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><FileText size={18} className="text-blue-600" /> {T("Medicines (Rx)")}</h2>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-white border border-slate-200 rounded-md px-2.5 py-1">Rx #{idx + 1}</span>
                  {items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500 p-1"><Trash2 size={16} /></button>}
                </div>
                <div>
                  <label className={lbl}>{T("Medicine Name *")}</label>
                  <input className={inp} autoComplete="off" placeholder={T("e.g. Napa Extend, Seclo 20")} value={item.medicineName}
                    onChange={(e) => { updateItem(idx, "medicineName", e.target.value); setMedQuery(e.target.value); setActiveMed(idx); }}
                    onBlur={() => setTimeout(() => setActiveMed(null), 250)} />
                  {activeMed === idx && medResults.length > 0 && item.medicineName.trim().length >= 2 && (
                    <div className="mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {medResults.slice(0, 12).map((m: any) => (
                        <button key={m.id} type="button" onClick={() => pickMedicine(idx, m)} className="w-full text-left px-4 py-2.5 border-b border-slate-100 last:border-0 active:bg-blue-100">
                          <div className="text-sm font-semibold text-slate-900">{m.name}{m.strength ? " " + m.strength : ""}</div>
                          <div className="text-xs text-slate-500">{[m.genericName, m.category, m.manufacturer].filter(Boolean).join(" · ")}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>{T("Strength")}</label><input className={inp} placeholder="500mg" value={item.strength} onChange={(e) => updateItem(idx, "strength", e.target.value)} /></div>
                  <div><label className={lbl}>{T("Dosage")}</label><input className={inp} placeholder="1 tablet" value={item.dosage} onChange={(e) => updateItem(idx, "dosage", e.target.value)} /></div>
                </div>
                <div>
                  <label className={lbl}>{T("Form")}</label>
                  <div className="flex flex-wrap gap-1.5">{FORMS.map((f) => (<button key={f} type="button" onClick={() => updateItem(idx, "dosageForm", item.dosageForm === f ? "" : f)} className={chip(item.dosageForm === f)}>{f}</button>))}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>{T("Frequency")}</label>
                    <input className={inp} placeholder="1+0+1" value={item.frequency} onChange={(e) => updateItem(idx, "frequency", e.target.value)} />
                    <div className="flex flex-wrap gap-1 mt-1.5">{FREQ.map((f) => (<button key={f} type="button" onClick={() => updateItem(idx, "frequency", f)} className={miniChip}>{f}</button>))}</div>
                  </div>
                  <div>
                    <label className={lbl}>{T("Duration")}</label>
                    <input className={inp} placeholder={T("7 days")} value={item.duration} onChange={(e) => updateItem(idx, "duration", e.target.value)} />
                    <div className="flex flex-wrap gap-1 mt-1.5">{DURS.map((d) => (<button key={d} type="button" onClick={() => updateItem(idx, "duration", d)} className={miniChip}>{d}</button>))}</div>
                  </div>
                </div>
                <div>
                  <label className={lbl}>{T("Quantity (auto)")}</label>
                  <input className={inp + " bg-blue-50"} placeholder={T("Auto or As directed")} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>{T("Meal Timing")}</label>
                  <div className="flex flex-wrap gap-1.5">{MEALS.map((m) => (<button key={m} type="button" onClick={() => updateItem(idx, "beforeAfterMeal", item.beforeAfterMeal === m ? "" : m)} className={chip(item.beforeAfterMeal === m)}>{T(m)}</button>))}</div>
                </div>
                <div><label className={lbl}>{T("Special Instructions (Optional)")}</label><input className={inp} placeholder={T("e.g. Take with plenty of water")} value={item.instructions} onChange={(e) => updateItem(idx, "instructions", e.target.value)} /></div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItems([...items, emptyItem()])} className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 font-bold text-sm flex items-center justify-center gap-2"><Plus size={16} /> {T("Add medicine")}</button>
        </div>

        <div className={card + " space-y-4"}>
          <h2 className="font-bold text-slate-800">{T("Advice & Follow-up")}</h2>
          <div><label className={lbl}>{T("Advice")}</label><textarea rows={3} className={inp} placeholder={T("e.g. Drink plenty of water, avoid cold drinks...")} value={form.advice} onChange={(e) => setForm({ ...form, advice: e.target.value })} /></div>
          <div>
            <label className={lbl}>{T("Follow-up Date")}</label>
            <input type="date" className={inp} value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            <div className="flex flex-wrap gap-1.5 mt-2">{FU.map(([n, d]) => (<button key={n} type="button" onClick={() => setFollowUp(d)} className={miniChip}>{T(n)}</button>))}</div>
          </div>
          <div><label className={lbl}>{T("Follow-up Notes")}</label><input className={inp} placeholder={T("e.g. Bring previous reports")} value={form.followUpNotes} onChange={(e) => setForm({ ...form, followUpNotes: e.target.value })} /></div>
        </div>

        <div className={card}>
          <label className={lbl}>{T("Consultation Fee (৳)")}</label>
          <input type="number" min={0} inputMode="numeric" className={inp} value={form.fee} onChange={(e) => setForm({ ...form, fee: Number(e.target.value) || 0 })} />
          <div className="flex flex-wrap gap-1.5 mt-2">{FEES.map((f) => (<button key={f} type="button" onClick={() => setForm({ ...form, fee: f })} className={chip(form.fee === f)}>৳{f}</button>))}</div>
          <p className="text-xs text-slate-400 mt-2">{T("Fee dile walk-in earning auto-create hobe.")}</p>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">{T("Total Fee")}</div>
            <div className="text-lg font-bold text-slate-800">৳{Number(form.fee || 0).toFixed(0)}</div>
          </div>
          <button type="button" disabled={saving} onClick={() => submit(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Save size={16} /> {T("Save")}</button>
          <button type="button" disabled={saving} onClick={() => submit(true)} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Printer size={16} /> {saving ? T("Saving...") : T("Save & Print")}</button>
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-red-600 font-bold mb-3"><AlertTriangle size={20} /> {T("Drug interaction warning")}</div>
            {warnings.map((w, i) => (
              <div key={i} className={"rounded-xl p-3 mb-2 text-sm border " + sevClass(w.severity)}>
                <div className="font-bold">{w.drug1} + {w.drug2} <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-white/70">{w.severity}</span></div>
                <div>{w.description}</div>
                {w.recommendation && <div className="text-xs mt-1 opacity-80">{w.recommendation}</div>}
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowWarning(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-700 text-sm">{T("Medicine bodlai")}</button>
              <button type="button" onClick={() => { setShowWarning(false); submit(pendingPrint, true); }} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm">{T("Tobuo save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewLocalRxPage() {
  return (
    <Suspense fallback={null}>
      <NewLocalRxForm />
    </Suspense>
  );
}

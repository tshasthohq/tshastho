"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import {
  AlertTriangle, Bike, ChevronLeft, Clock, LayoutDashboard, MapPin,
  Package, Phone, Plus, Settings, Store, Truck, Wallet,
} from "lucide-react";

type Tab = "overview" | "jobs" | "riders" | "settings";
type IconType = ComponentType<{ size?: number; className?: string }>;
type ModalState = {
  title: string;
  hint?: string;
  required?: boolean;
  confirmLabel: string;
  danger?: boolean;
  onSubmit: (reason: string) => void;
} | null;

const TABS: { key: Tab; label: string; Icon: IconType }[] = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "jobs", label: "Jobs", Icon: Package },
  { key: "riders", label: "Riders", Icon: Bike },
  { key: "settings", label: "Settings", Icon: Settings },
];

const FILTERS = [
  { key: "ACTIVE", label: "Active" },
  { key: "PENDING", label: "Waiting" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "PICKED_UP", label: "Picked up" },
  { key: "ON_THE_WAY", label: "On the way" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "FAILED", label: "Failed" },
  { key: "ALL", label: "All" },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Waiting for rider",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked up",
  ON_THE_WAY: "On the way",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};
const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-300",
  ASSIGNED: "bg-blue-100 text-blue-900 border-blue-300",
  PICKED_UP: "bg-indigo-100 text-indigo-900 border-indigo-300",
  ON_THE_WAY: "bg-violet-100 text-violet-900 border-violet-300",
  DELIVERED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  FAILED: "bg-red-100 text-red-900 border-red-300",
  CANCELLED: "bg-slate-200 text-slate-800 border-slate-300",
};
const TONE: Record<string, { box: string; icon: string; num: string }> = {
  amber: { box: "bg-amber-50 border-amber-200", icon: "bg-amber-100 text-amber-700", num: "text-amber-900" },
  blue: { box: "bg-blue-50 border-blue-200", icon: "bg-blue-100 text-blue-700", num: "text-blue-900" },
  indigo: { box: "bg-indigo-50 border-indigo-200", icon: "bg-indigo-100 text-indigo-700", num: "text-indigo-900" },
  red: { box: "bg-red-50 border-red-200", icon: "bg-red-100 text-red-700", num: "text-red-900" },
  green: { box: "bg-emerald-50 border-emerald-200", icon: "bg-emerald-100 text-emerald-700", num: "text-emerald-900" },
  slate: { box: "bg-white border-slate-200", icon: "bg-slate-100 text-slate-700", num: "text-slate-900" },
};
const NEXT_ACTION: Record<string, { to: string; label: string } | undefined> = {
  ASSIGNED: { to: "PICKED_UP", label: "Mark picked up" },
  PICKED_UP: { to: "ON_THE_WAY", label: "Mark on the way" },
  ON_THE_WAY: { to: "DELIVERED", label: "Mark delivered" },
};

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
const labelCls = "mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600";
const btnBase = "min-h-[44px] rounded-xl px-4 text-sm font-bold transition active:scale-95 disabled:opacity-50";

const money = (v: any) => `৳${(Number(v) || 0).toFixed(2)}`;
const ago = (d: any) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
};

async function api(url: string, method = "GET", body?: any) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function Stat({ label, value, tone, Icon }: { label: string; value: string | number; tone: string; Icon: IconType }) {
  const t = TONE[tone] || TONE.slate;
  return (
    <div className={`rounded-2xl border p-4 ${t.box}`}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${t.icon}`}>
        <Icon size={18} />
      </div>
      <p className={`text-3xl font-black leading-none ${t.num}`}>{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p>
    </div>
  );
}

function Empty({ Icon, title, text }: { Icon: IconType; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon size={22} />
      </div>
      <p className="text-base font-black text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </div>
  );
}

function ReasonModal({ m, onClose }: { m: NonNullable<ModalState>; onClose: () => void }) {
  const [text, setText] = useState("");
  const invalid = !!m.required && text.trim().length < 3;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-3 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-slate-900">{m.title}</h3>
        {m.hint && <p className="mt-1 text-sm text-slate-600">{m.hint}</p>}
        <textarea
          autoFocus
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={m.required ? "Write the reason (at least 3 letters)" : "Reason (optional)"}
          className={`${inputCls} mt-3 resize-none`}
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onClose} className={`${btnBase} bg-slate-100 text-slate-800`}>Back</button>
          <button
            disabled={invalid}
            onClick={() => { m.onSubmit(text.trim()); onClose(); }}
            className={`${btnBase} text-white ${m.danger ? "bg-red-600" : "bg-indigo-600"}`}
          >
            {m.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDeliveryPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [filter, setFilter] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [riderForm, setRiderForm] = useState({ name: "", phone: "", vehicle: "BIKE", area: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [payout, setPayout] = useState("");

  const notify = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const [o, j, r] = await Promise.all([
        api("/api/admin/delivery/overview"),
        api(`/api/admin/delivery/jobs?status=${filter}`),
        api("/api/admin/delivery/riders"),
      ]);
      setOverview(o);
      setJobs(j.jobs || []);
      setRiders(r.riders || []);
      setPayout((p) => (p === "" ? String(o.settings.riderPayout) : p));
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 15000);
    return () => clearInterval(id);
  }, [load]);

  const act = async (key: string, fn: () => Promise<any>, okText?: string) => {
    setBusy(key);
    try {
      await fn();
      await load();
      if (okText) notify("ok", okText);
    } catch (e: any) {
      notify("err", e.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const jobAction = (id: string, body: any, okText?: string) =>
    act(id, () => api(`/api/admin/delivery/jobs/${id}`, "PATCH", body), okText);

  const enabled = !!overview?.settings?.enabled;
  const s = overview?.stats;
  const activeCount = s ? s.pending + s.assigned + s.onRoad : 0;

  const toggleDelivery = () => {
    if (enabled) {
      setModal({
        title: "Turn off Tshastho delivery?",
        hint: "Pharmacies will no longer be able to choose Tshastho delivery. Jobs already on the road keep running.",
        required: true,
        confirmLabel: "Turn OFF",
        danger: true,
        onSubmit: (reason) =>
          act("switch", () => api("/api/admin/delivery/settings", "POST", { enabled: false, reason }), "Tshastho delivery is now OFF"),
      });
    } else {
      act("switch", () => api("/api/admin/delivery/settings", "POST", { enabled: true }), "Tshastho delivery is now ON");
    }
  };

  const sampleFee = 60;
  const payoutNum = Number(payout) || 0;
  const keep = sampleFee - payoutNum;
  const activeRiders = riders.filter((r) => r.isActive);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900" style={{ colorScheme: "light" }}>
      <div className="mx-auto max-w-4xl px-4">
        {/* Hero */}
        <div className="mt-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-5 text-white shadow-xl">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-300 hover:text-white">
            <ChevronLeft size={16} /> Admin
          </Link>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Delivery</h1>
              <p className="mt-1 text-sm text-slate-300">Tshastho delivery control center</p>
            </div>
            <button
              onClick={toggleDelivery}
              disabled={!overview || busy === "switch"}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-95 disabled:opacity-60 ${
                enabled ? "border-emerald-400/50 bg-emerald-500/15" : "border-white/20 bg-white/10"
              }`}
            >
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-slate-500"}`}>
                <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">Tshastho delivery</span>
                <span className="block text-base font-black">{enabled ? "Running" : "Turned off"}</span>
              </span>
            </button>
          </div>
          {s && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-white/10 px-3 py-1.5">{s.pending} waiting</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{s.onRoad} on the road</span>
              <span className={`rounded-full px-3 py-1.5 ${s.late ? "bg-red-500 text-white" : "bg-white/10"}`}>{s.late} late</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{s.ridersOnline}/{s.ridersTotal} riders online</span>
            </div>
          )}
        </div>

        {overview && !enabled && (
          <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <b>Tshastho delivery is OFF for the whole platform.</b>
            {overview.settings.reason && <> Reason: {overview.settings.reason}.</>} Jobs already on the road keep running.
          </div>
        )}
        {error && <div className="mt-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        {/* Tabs */}
        <div className="sticky top-0 z-30 -mx-4 mt-3 bg-slate-50/90 px-4 py-2 backdrop-blur">
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-200/70 p-1">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-bold transition ${
                  tab === key ? "bg-white text-indigo-700 shadow" : "text-slate-600"
                }`}
              >
                <Icon size={16} />
                {label}
                {key === "jobs" && activeCount > 0 && (
                  <span className="absolute right-1.5 top-1 rounded-full bg-indigo-600 px-1.5 text-[10px] font-black leading-4 text-white">{activeCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-4">
          {loading && (
            <div className="grid animate-pulse grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-200" />)}
            </div>
          )}

          {/* Overview */}
          {!loading && tab === "overview" && s && (
            <>
              <section>
                <h2 className="mb-2 text-sm font-black text-slate-700">Right now</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat label="Waiting for rider" value={s.pending} tone="amber" Icon={Clock} />
                  <Stat label="Assigned" value={s.assigned} tone="blue" Icon={Bike} />
                  <Stat label="On the road" value={s.onRoad} tone="indigo" Icon={Truck} />
                  <Stat label="Late" value={s.late} tone={s.late ? "red" : "slate"} Icon={AlertTriangle} />
                </div>
              </section>
              <section>
                <h2 className="mb-2 text-sm font-black text-slate-700">Today</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat label="Delivered" value={s.deliveredToday} tone="green" Icon={Package} />
                  <Stat label="Failed" value={s.failedToday} tone={s.failedToday ? "red" : "slate"} Icon={AlertTriangle} />
                  <Stat label="Avg time (min)" value={s.avgMinutes} tone="slate" Icon={Clock} />
                  <Stat label="Tshastho earned" value={money(s.earnToday)} tone="green" Icon={Wallet} />
                </div>
              </section>
              <section>
                <h2 className="mb-2 text-sm font-black text-slate-700">Riders and cash</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Riders online" value={`${s.ridersOnline}/${s.ridersTotal}`} tone="slate" Icon={Bike} />
                  <Stat label="COD held by riders" value={money(s.codHeld)} tone="amber" Icon={Wallet} />
                </div>
              </section>
            </>
          )}

          {/* Jobs */}
          {!loading && tab === "jobs" && (
            <>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${
                      filter === f.key ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {jobs.length === 0 && (
                <Empty Icon={Truck} title="No jobs here" text="When a pharmacy chooses Tshastho delivery, its jobs appear in this list." />
              )}

              {jobs.map((j) => {
                const next = NEXT_ACTION[j.status];
                const canAssign = j.status === "PENDING" || j.status === "ASSIGNED";
                const drop = String(j.order?.deliveryAddress || "").replace(/[,\s]+$/, "") || "—";
                return (
                  <div key={j.id} className={`space-y-3 rounded-3xl border bg-white p-4 shadow-sm ${j.isLate ? "border-red-300" : "border-slate-200"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-slate-900">{j.jobNumber}</p>
                        <p className="text-sm text-slate-600">Order {j.order?.orderNumber || "—"} · {ago(j.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[j.status] || ""}`}>
                          {STATUS_LABEL[j.status] || j.status}
                        </span>
                        {j.isLate && <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-black text-white">LATE</span>}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="flex gap-3">
                        <Store size={18} className="mt-0.5 shrink-0 text-indigo-600" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pickup</p>
                          <p className="font-bold text-slate-900">{j.order?.pharmacy?.shopName || "—"}</p>
                          <p className="text-slate-700">{j.order?.pharmacy?.address || ""}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <MapPin size={18} className="mt-0.5 shrink-0 text-rose-600" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Drop</p>
                          <p className="font-bold text-slate-900">{drop}</p>
                          {j.order?.deliveryPhone && (
                            <a href={`tel:${j.order.deliveryPhone}`} className="mt-0.5 inline-flex items-center gap-1 font-bold text-indigo-700">
                              <Phone size={14} /> {j.order.deliveryPhone}
                            </a>
                          )}
                        </div>
                      </div>
                      {j.rider && (
                        <div className="flex gap-3">
                          <Bike size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rider</p>
                            <p className="font-bold text-slate-900">{j.rider.name}</p>
                            <a href={`tel:${j.rider.phone}`} className="font-semibold text-indigo-700">{j.rider.phone}</a>
                          </div>
                        </div>
                      )}
                      {j.failureReason && <p className="font-semibold text-red-700">Failed: {j.failureReason}</p>}
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        ["Fee", money(j.customerFee)],
                        ["Rider", money(j.riderPayout)],
                        ["Earn", money(j.platformEarn)],
                        ["COD", money(j.codAmount)],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-slate-100 py-2">
                          <p className="text-[11px] font-bold uppercase text-slate-600">{k}</p>
                          <p className="text-sm font-black text-slate-900">{v}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canAssign &&
                        (activeRiders.length === 0 ? (
                          <button onClick={() => setTab("riders")} className={`${btnBase} bg-indigo-50 text-indigo-700`}>
                            Add a rider first
                          </button>
                        ) : (
                          <select
                            key={j.id + (j.riderId || "")}
                            defaultValue={j.riderId || ""}
                            disabled={busy === j.id}
                            onChange={(e) => e.target.value && jobAction(j.id, { action: "assign", riderId: e.target.value }, "Rider assigned")}
                            className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
                          >
                            <option value="">Assign rider…</option>
                            {activeRiders.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} · {r.isOnline ? "online" : "offline"} · {r.activeJobs} active
                              </option>
                            ))}
                          </select>
                        ))}
                      {next && (
                        <button
                          disabled={busy === j.id}
                          onClick={() => jobAction(j.id, { action: "status", status: next.to }, next.label.replace("Mark ", "Job "))}
                          className={`${btnBase} bg-indigo-600 text-white`}
                        >
                          {next.label}
                        </button>
                      )}
                      {j.status === "ASSIGNED" && (
                        <button disabled={busy === j.id} onClick={() => jobAction(j.id, { action: "unassign" }, "Rider removed")} className={`${btnBase} bg-slate-100 text-slate-800`}>
                          Unassign
                        </button>
                      )}
                      {["ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(j.status) && (
                        <button
                          disabled={busy === j.id}
                          onClick={() =>
                            setModal({
                              title: "Mark delivery as failed",
                              hint: "Write why the delivery could not be completed.",
                              required: true,
                              confirmLabel: "Mark failed",
                              danger: true,
                              onSubmit: (reason) => jobAction(j.id, { action: "status", status: "FAILED", reason }, "Marked as failed"),
                            })
                          }
                          className={`${btnBase} bg-red-50 text-red-700`}
                        >
                          Failed
                        </button>
                      )}
                      {canAssign && (
                        <button
                          disabled={busy === j.id}
                          onClick={() =>
                            setModal({
                              title: "Cancel this delivery job?",
                              hint: "The order stays as it is. Only the delivery job is cancelled.",
                              confirmLabel: "Cancel job",
                              danger: true,
                              onSubmit: (reason) => jobAction(j.id, { action: "status", status: "CANCELLED", reason: reason || undefined }, "Job cancelled"),
                            })
                          }
                          className={`${btnBase} bg-slate-100 text-slate-700`}
                        >
                          Cancel job
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Riders */}
          {!loading && tab === "riders" && (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <button onClick={() => setShowAdd((v) => !v)} className="flex w-full items-center justify-between text-left">
                  <span className="text-base font-black text-slate-900">Add a new rider</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><Plus size={18} /></span>
                </button>
                {(showAdd || riders.length === 0) && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Name</label>
                      <input className={inputCls} placeholder="Rider's full name" value={riderForm.name} onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input className={inputCls} inputMode="tel" placeholder="01XXXXXXXXX" value={riderForm.phone} onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Vehicle</label>
                      <select className={inputCls} value={riderForm.vehicle} onChange={(e) => setRiderForm({ ...riderForm, vehicle: e.target.value })}>
                        <option value="BIKE">Bike</option>
                        <option value="BICYCLE">Bicycle</option>
                        <option value="CAR">Car</option>
                        <option value="ON_FOOT">On foot</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Area</label>
                      <input className={inputCls} placeholder="e.g. Mirpur" value={riderForm.area} onChange={(e) => setRiderForm({ ...riderForm, area: e.target.value })} />
                    </div>
                    <button
                      disabled={busy === "addRider"}
                      onClick={() =>
                        act(
                          "addRider",
                          async () => {
                            await api("/api/admin/delivery/riders", "POST", riderForm);
                            setRiderForm({ name: "", phone: "", vehicle: "BIKE", area: "" });
                            setShowAdd(false);
                          },
                          "Rider added"
                        )
                      }
                      className={`${btnBase} bg-indigo-600 text-white sm:col-span-2`}
                    >
                      Save rider
                    </button>
                  </div>
                )}
              </div>

              {riders.length === 0 && <Empty Icon={Bike} title="No riders yet" text="Add your first rider above, then set them Online to receive jobs." />}

              {riders.map((r) => (
                <div key={r.id} className={`flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm ${r.isActive ? "" : "opacity-60"}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-black text-indigo-700">
                    {(r.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-slate-900">{r.name}</p>
                    <a href={`tel:${r.phone}`} className="text-sm font-semibold text-indigo-700">{r.phone}</a>
                    <p className="text-sm text-slate-600">
                      {r.vehicle || "—"}{r.area ? ` · ${r.area}` : ""} · {r.activeJobs} active
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      onClick={() => act(r.id, () => api("/api/admin/delivery/riders", "PATCH", { id: r.id, isOnline: !r.isOnline }), r.isOnline ? "Rider is offline" : "Rider is online")}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold ${r.isOnline ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-slate-50 text-slate-700"}`}
                    >
                      {r.isOnline ? "● Online" : "○ Offline"}
                    </button>
                    <button
                      onClick={() => act(r.id, () => api("/api/admin/delivery/riders", "PATCH", { id: r.id, isActive: !r.isActive }), r.isActive ? "Rider deactivated" : "Rider activated")}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      {r.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Settings */}
          {!loading && tab === "settings" && overview && (
            <>
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-black text-slate-900">Rider payout per delivery</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    The customer pays the order&apos;s delivery fee. The rider gets this amount. Tshastho keeps the difference.
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Payout amount (৳)</label>
                  <div className="flex gap-2">
                    <input className={inputCls} type="number" inputMode="decimal" min="0" value={payout} onChange={(e) => setPayout(e.target.value)} />
                    <button
                      disabled={busy === "payout"}
                      onClick={() => act("payout", () => api("/api/admin/delivery/settings", "POST", { riderPayout: payout }), "Payout saved")}
                      className={`${btnBase} bg-indigo-600 px-6 text-white`}
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Example for a ৳{sampleFee} delivery fee</p>
                  <div className="flex justify-between py-1"><span className="text-slate-700">Customer pays</span><b>{money(sampleFee)}</b></div>
                  <div className="flex justify-between py-1"><span className="text-slate-700">Rider gets</span><b>− {money(payoutNum)}</b></div>
                  <div className={`flex justify-between border-t border-slate-200 pt-2 ${keep < 0 ? "text-red-700" : "text-emerald-700"}`}>
                    <span className="font-bold">Tshastho keeps</span><b>{money(keep)}</b>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Applies to new jobs only.</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-black text-slate-900">Master switch</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Status: <b>{enabled ? "ON" : "OFF"}</b>
                  {overview.settings.changedAt && <> · changed {new Date(overview.settings.changedAt).toLocaleString()}</>}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Turning it off hides Tshastho delivery from every pharmacy. Jobs already on the road keep running.
                </p>
                <button onClick={toggleDelivery} disabled={busy === "switch"} className={`${btnBase} mt-3 w-full text-white ${enabled ? "bg-red-600" : "bg-emerald-600"}`}>
                  {enabled ? "Turn OFF Tshastho delivery" : "Turn ON Tshastho delivery"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className={`rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-2xl ${toast.type === "ok" ? "bg-slate-900" : "bg-red-600"}`}>
            {toast.text}
          </div>
        </div>
      )}
      {modal && <ReasonModal m={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

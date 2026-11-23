"use client";
import { useState } from "react";
import { Activity, Hash } from "lucide-react";
import { GROUPS, groupLabel } from "@/lib/bd-locations";
import { Sheet, Field, fld, api } from "./Sheet";

const TESTS: [string, string][] = [
  ["HIV", "HIV 1 and 2"],
  ["HBSAG", "HBsAg (Hepatitis B)"],
  ["HCV", "Hepatitis C (HCV)"],
  ["SYPHILIS", "Syphilis"],
  ["MALARIA", "Malaria"],
];

export default function TestsSheet({ bag, onClose, onDone }: { bag: any; onClose: () => void; onDone: () => void }) {
  const initial: Record<string, string> = {};
  for (const [k] of TESTS) initial[k] = (bag.tests || []).find((x: any) => x.test === k)?.result || "PENDING";

  const [results, setResults] = useState<Record<string, string>>(initial);
  const [group, setGroup] = useState<string>(bag.confirmedGroup || "");
  const [method, setMethod] = useState("");
  const [kitLot, setKitLot] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const mismatch = !!group && group !== bag.bloodGroup;

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const d = await api(`/api/blood-bank/bags/${bag.id}/tests`, "POST", {
        results, confirmedGroup: group || undefined, method, kitLot,
      });
      if (d.reactive?.length) window.alert("A reactive result was recorded. This bag has been discarded and cannot be issued.");
      onDone();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      title={`Screening tests, bag ${bag.bagNumber}`}
      onClose={onClose}
      footer={
        <>
          {msg && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mb-3">{msg}</p>}
          <button disabled={busy} onClick={save} className="w-full bg-red-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-md shadow-red-200">
            {busy ? "Saving..." : "Save results"}
          </button>
        </>
      }
    >
      <div className="space-y-2">
        {TESTS.map(([k, label]) => (
          <div key={k} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
            <span className="text-sm font-semibold text-slate-800">{label}</span>
            <select
              value={results[k]}
              onChange={(e) => setResults((p) => ({ ...p, [k]: e.target.value }))}
              className={`text-xs font-bold rounded-lg px-2 py-1.5 border bg-white ${results[k] === "REACTIVE" ? "text-red-700 border-red-300" : results[k] === "NON_REACTIVE" ? "text-emerald-700 border-emerald-300" : "text-slate-600 border-slate-200"}`}
            >
              <option value="PENDING">Pending</option>
              <option value="NON_REACTIVE">Non-reactive</option>
              <option value="REACTIVE">Reactive</option>
              <option value="INVALID">Invalid, repeat</option>
            </select>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirmed blood group (ABO and Rh) *</label>
        <div className="grid grid-cols-4 gap-2">
          {GROUPS.map((g) => (
            <button key={g.v} type="button" onClick={() => setGroup(g.v)} className={`py-2.5 rounded-xl font-extrabold text-sm ${group === g.v ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-slate-200 text-slate-700"}`}>
              {g.l}
            </button>
          ))}
        </div>
        {mismatch && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
            This does not match the bag label ({groupLabel(bag.bloodGroup)}). The bag will not be cleared.
          </p>
        )}
      </div>

      <Field label="Test method or kit (optional)" icon={Activity}>
        <input className={fld} placeholder="e.g. ELISA" value={method} onChange={(e) => setMethod(e.target.value)} />
      </Field>
      <Field label="Kit lot number (optional)" icon={Hash}>
        <input className={fld} placeholder="Lot number" value={kitLot} onChange={(e) => setKitLot(e.target.value)} />
      </Field>

      <p className="text-xs text-slate-400">
        A bag is cleared only when all five tests are non-reactive and the confirmed group matches the label. A reactive result discards the bag automatically.
      </p>
    </Sheet>
  );
}

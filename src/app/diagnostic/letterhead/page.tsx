"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ui } from "@/lib/diagnostic/ui";

const FIELDS: { k: string; label: string; ph: string }[] = [
  { k: "tagline", label: "Tagline", ph: "Accurate • Reliable • Timely" },
  { k: "helpline", label: "Helpline / Hotline", ph: "01XXXXXXXXX" },
  { k: "email", label: "Email", ph: "info@yourcenter.com" },
  { k: "website", label: "Website", ph: "www.yourcenter.com" },
  { k: "dghsRegNo", label: "DGHS Registration No", ph: "e.g. 000123" },
  { k: "footerAddress", label: "Report footer (address + phone)", ph: "Emaz Plaza, Shershah Road, Laxmipur, Rajshahi | 01XXXXXXXXX" },
];

export default function LetterheadPage() {
  const { user, loading } = useRequireAuth(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  const [f, setF] = useState<Record<string, string>>({});
  const [tests, setTests] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [msg2, setMsg2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/diagnostic/letterhead", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setF(d.letterhead || {}); else setMsg(d.message || "Failed"); })
      .catch(() => setMsg("Server error"));
    fetch("/api/diagnostic/test-methods", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setTests(d.tests || []); })
      .catch(() => {});
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    const r = await fetch("/api/diagnostic/letterhead", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const d = await r.json().catch(() => ({}));
    setMsg(d.success ? "Saved. Report-er letterhead ar footer-e ekhon ei info dekhabe." : d.message || "Failed");
    setBusy(false);
  };

  const saveMethod = async (t: any) => {
    const r = await fetch("/api/diagnostic/test-methods", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, method: t.method || "" }),
    });
    const d = await r.json().catch(() => ({}));
    setMsg2(d.success ? t.code + " saved" : d.message || "Failed (owner chhara parbe na)");
  };

  if (loading || !user) return <p className="p-6 text-slate-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className={ui.h1}>Letterhead info</h1>
        <p className={ui.sub}>Report-er upor-er kone ar niche-r footer-e ei tothyo gulo print hoy.</p>
        <form onSubmit={save} className={ui.card + " mt-4 space-y-4"}>
          {FIELDS.map((x) => (
            <div key={x.k}>
              <label className={ui.label}>{x.label}</label>
              <input className={ui.field} placeholder={x.ph} value={f[x.k] || ""} onChange={(e) => setF({ ...f, [x.k]: e.target.value })} />
            </div>
          ))}
          {msg && <p className="text-sm font-semibold text-blue-700">{msg}</p>}
          <button disabled={busy} className={ui.btn}>{busy ? "Saving..." : "Save"}</button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-black text-slate-800">Test method / analyzer line</h2>
        <p className={ui.sub}>Prottek test-er report-e "Method: ..." hishebe dekhabe. Jemon: Automated Haematology Analyzer (Spinreact Spinecell 3) &amp; verified manually.</p>
        <div className={ui.card + " mt-3 space-y-4"}>
          {tests.length === 0 && <p className="text-sm text-slate-500">Result template ache emon kono test nai.</p>}
          {tests.map((t) => (
            <div key={t.id}>
              <label className={ui.label}>{t.name} ({t.code})</label>
              <div className="flex gap-2">
                <input className={ui.field} placeholder="Method / analyzer" value={t.method || ""}
                  onChange={(e) => setTests((l) => l.map((x) => (x.id === t.id ? { ...x, method: e.target.value } : x)))} />
                <button type="button" onClick={() => saveMethod(t)} className={ui.btn}>Save</button>
              </div>
            </div>
          ))}
          {msg2 && <p className="text-sm font-semibold text-blue-700">{msg2}</p>}
        </div>
      </div>
    </div>
  );
}

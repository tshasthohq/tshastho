'use client';
import { useCallback, useEffect, useState } from 'react';

type Doc = {
  id: string; licenseNumber: string; fullName: string | null; degrees: string | null;
  specialty: string; district: string | null; claimStatus: string; source: string | null;
  user: { name: string; email: string; phone: string | null } | null;
};

const TABS = ['PENDING', 'UNCLAIMED', 'CLAIMED', 'REJECTED'] as const;
const COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', UNCLAIMED: 'bg-slate-100 text-slate-600',
  CLAIMED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700',
};

export default function AdminDoctorsPage() {
  const [tab, setTab] = useState<string>('PENDING');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors?status=${tab}&q=${encodeURIComponent(q)}&page=${page}`);
      const d = await res.json();
      if (d.success) { setDocs(d.doctors); setPages(d.pages || 1); setSummary(d.summary || {}); }
      else setMsg(d.message || 'Failed to load');
    } catch { setMsg('Network error'); }
    setLoading(false);
  }, [tab, q, page]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const act = async (id: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !confirm('Reject this claim? The profile returns to the directory.')) return;
    const res = await fetch(`/api/admin/doctors/${id}/claim`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    });
    const d = await res.json();
    setMsg(d.message || (d.success ? 'Done' : 'Failed'));
    load();
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMsg('Importing...');
    const fd = new FormData();
    fd.append('file', f);
    const res = await fetch('/api/admin/doctors/import', { method: 'POST', body: fd });
    const d = await res.json();
    setMsg(d.success ? `Imported: ${d.created} new, ${d.updated} updated, ${d.skipped} skipped` : d.message || 'Import failed');
    e.target.value = '';
    load();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Doctor Directory & Claims</h1>
        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer">
          Import CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={upload} />
        </label>
      </div>

      {msg && <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">{msg}</div>}

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap font-medium ${tab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t} ({summary[t] ?? 0})
          </button>
        ))}
      </div>

      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
        placeholder="Search BMDC no, name, specialty, district..."
        className="w-full border rounded-lg px-3 py-2 text-sm" />

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {!loading && docs.length === 0 && <p className="text-sm text-slate-500">No doctors found.</p>}
        {docs.map((d) => (
          <div key={d.id} className="border rounded-xl p-4 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{d.fullName || d.user?.name || 'Unnamed'}</p>
                <p className="text-xs text-slate-500 font-mono">{d.licenseNumber}</p>
                <p className="text-sm text-slate-600 mt-1">{[d.degrees, d.specialty, d.district].filter(Boolean).join(' · ')}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${COLOR[d.claimStatus]}`}>{d.claimStatus}</span>
            </div>
            {d.claimStatus === 'PENDING' && d.user && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 text-sm">
                <p className="font-medium">Claimed by: {d.user.name}</p>
                <p className="text-slate-600">{d.user.email}{d.user.phone ? ` · ${d.user.phone}` : ''}</p>
                <p className="text-xs text-amber-700 mt-1">Verify this person against the BMDC register before approving.</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => act(d.id, 'APPROVE')} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold">Approve</button>
                  <button onClick={() => act(d.id, 'REJECT')} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold">Reject</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
          <span>{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

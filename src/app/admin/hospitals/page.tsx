'use client';

import { useCallback, useEffect, useState } from 'react';

type Row = {
  id: string;
  name: string;
  nameBn: string | null;
  type: string;
  licenseNo: string | null;
  licenseDocUrl: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  branches: { id: string; name: string; city: string | null; address: string; isMain: boolean }[];
  members: { user: { id: string; name: string; email: string; phone: string | null } }[];
};

const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export default function AdminHospitalsPage() {
  const [tab, setTab] = useState('PENDING');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/hospitals?status=${tab}`);
      const json = await res.json();
      if (!res.ok) setMsg(json?.error?.message || json?.error || 'Failed to load');
      else setRows(json.hospitals ?? []);
    } catch {
      setMsg('Network error');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND') {
    let reason: string | undefined;
    if (action !== 'APPROVE') {
      const r = window.prompt(action === 'REJECT' ? 'Reason for rejection?' : 'Reason for suspension?');
      if (!r) return;
      reason = r;
    } else if (!window.confirm('Approve this hospital and activate the owner account?')) {
      return;
    }
    const res = await fetch(`/api/admin/hospitals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(json?.error?.message || json?.error || 'Action failed');
    else load();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900">Hospitals</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {msg && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
      {loading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {!loading && rows.length === 0 && !msg && (
        <p className="mt-6 text-sm text-slate-500">No hospitals in {tab}.</p>
      )}

      <div className="mt-4 space-y-3">
        {rows.map((h) => {
          const owner = h.members[0]?.user;
          return (
            <div key={h.id} className="rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{h.name}</h2>
                  {h.nameBn && <p className="text-sm text-slate-500">{h.nameBn}</p>}
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{h.type}</span>
              </div>

              <dl className="mt-3 grid grid-cols-1 gap-1 text-sm text-slate-700 sm:grid-cols-2">
                <div>License: <b>{h.licenseNo ?? '-'}</b></div>
                <div>Branches: {h.branches.map((b) => b.city || b.name).join(', ') || '-'}</div>
                <div>Owner: {owner?.name ?? '-'}</div>
                <div>{owner?.email} {owner?.phone ? `· ${owner.phone}` : ''}</div>
                <div>Applied: {new Date(h.createdAt).toLocaleDateString()}</div>
                {h.rejectionReason && <div className="text-red-600">Reason: {h.rejectionReason}</div>}
              </dl>

              {h.licenseDocUrl && (
                <a href={h.licenseDocUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 underline">
                  View license document
                </a>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {(h.status === 'PENDING' || h.status === 'REJECTED' || h.status === 'SUSPENDED') && (
                  <button onClick={() => act(h.id, 'APPROVE')} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white">
                    Approve
                  </button>
                )}
                {h.status === 'PENDING' && (
                  <button onClick={() => act(h.id, 'REJECT')} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                    Reject
                  </button>
                )}
                {h.status === 'APPROVED' && (
                  <button onClick={() => act(h.id, 'SUSPEND')} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
                    Suspend
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

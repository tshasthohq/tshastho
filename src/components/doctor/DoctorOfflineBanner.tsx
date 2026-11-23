'use client';
import { useT } from "@/i18n/doctor-extra";
import { useCallback, useEffect, useState } from 'react';
import { rxAll } from '@/lib/offline/db';
import { syncPendingRx } from '@/lib/offline/doctor-rx';

export default function DoctorOfflineBanner() {
  const T = useT();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [msg, setMsg] = useState('');

  const refresh = useCallback(async () => {
    try { setPending((await rxAll()).length); } catch {}
  }, []);

  const sync = useCallback(async () => {
    const r = await syncPendingRx().catch(() => null);
    if (r && r.synced > 0) { setMsg(r.synced + ' ' + T('prescription synced')); setTimeout(() => setMsg(''), 4000); }
    refresh();
  }, [refresh]);

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    if (navigator.onLine) sync();
    const on = () => { setOnline(true); sync(); };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const t = setInterval(() => { refresh(); if (navigator.onLine) sync(); }, 20000);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); clearInterval(t); };
  }, [refresh, sync]);

  if (online && pending === 0 && !msg) return null;
  const color = !online ? 'bg-amber-500' : pending > 0 ? 'bg-blue-600' : 'bg-emerald-600';
  const text = !online
    ? T('Offline') + (pending ? ' · ' + pending + ' ' + T('Rx pending') : '')
    : pending > 0 ? T('Syncing') + ' ' + pending + ' Rx…' : msg;
  return (
    <div className={'fixed top-16 inset-x-3 z-50 rounded-xl px-4 py-2 text-center text-xs font-bold text-white shadow-lg ' + color}>
      {text}
    </div>
  );
}

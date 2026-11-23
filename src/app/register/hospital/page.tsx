'use client';

import { useState } from 'react';
import Link from 'next/link';

const TYPES = [
  ['GENERAL', 'General Hospital'],
  ['SPECIALIZED', 'Specialized Hospital'],
  ['TEACHING', 'Medical College / Teaching'],
  ['CLINIC', 'Clinic'],
  ['MATERNITY', 'Maternity'],
  ['EYE', 'Eye'],
  ['DENTAL', 'Dental'],
  ['CANCER', 'Cancer'],
  ['HEART', 'Heart / Cardiac'],
  ['CHILD', 'Child'],
  ['OTHER', 'Other'],
];

type FormState = Record<string, string | boolean>;

const initial: FormState = {
  ownerName: '', email: '', phone: '', password: '', confirm: '',
  hospitalName: '', hospitalNameBn: '', type: 'GENERAL',
  licenseNo: '', registrationNo: '', licenseDocUrl: '',
  branchName: 'Main Branch', address: '', area: '', city: '', district: '',
  branchPhone: '', emergencyPhone: '', bedCount: '',
  is24x7: false, hasEmergency: false,
};

const input =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_4px_20px_rgba(30,64,175,0.06)] text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export default function HospitalRegisterPage() {
  const [f, setF] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const s = (k: string) => String(f[k] ?? '');
  const set =
    (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const el = e.target as HTMLInputElement;
      const value = el.type === 'checkbox' ? el.checked : el.value;
      setF((p) => ({ ...p, [k]: value }));
    };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (s('password') !== s('confirm')) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: s('ownerName'),
          email: s('email'),
          phone: s('phone'),
          password: s('password'),
          hospitalName: s('hospitalName'),
          hospitalNameBn: s('hospitalNameBn'),
          type: s('type'),
          licenseNo: s('licenseNo'),
          registrationNo: s('registrationNo'),
          licenseDocUrl: s('licenseDocUrl'),
          branchName: s('branchName'),
          address: s('address'),
          area: s('area'),
          city: s('city'),
          district: s('district'),
          branchPhone: s('branchPhone'),
          emergencyPhone: s('emergencyPhone'),
          bedCount: s('bedCount') ? Number(s('bedCount')) : undefined,
          is24x7: Boolean(f.is24x7),
          hasEmergency: Boolean(f.hasEmergency),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || json?.error || json?.message || 'Registration failed');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Application submitted</h1>
          <p className="mt-2 text-sm text-slate-600">
            আপনার আবেদন জমা হয়েছে। আমাদের টিম license যাচাই করে approve করলে আপনি login করতে পারবেন।
          </p>
          <Link href="/login" className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Register your Hospital</h1>
      <p className="mt-1 text-sm text-slate-600">
        হাসপাতাল রেজিস্ট্রেশন। Approve হলে আপনার hospital Tshastho তে live হবে।
      </p>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <section className="space-y-3 rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-4">
          <h2 className="text-sm font-semibold text-slate-900">Owner account (মালিকের অ্যাকাউন্ট)</h2>
          <Field label="Full name (নাম) *"><input required className={input} value={s('ownerName')} onChange={set('ownerName')} /></Field>
          <Field label="Email *"><input required type="email" className={input} value={s('email')} onChange={set('email')} /></Field>
          <Field label="Phone (ফোন)"><input type="tel" className={input} value={s('phone')} onChange={set('phone')} /></Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Password (min 8) *"><input required type="password" minLength={8} className={input} value={s('password')} onChange={set('password')} /></Field>
            <Field label="Confirm password *"><input required type="password" minLength={8} className={input} value={s('confirm')} onChange={set('confirm')} /></Field>
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-4">
          <h2 className="text-sm font-semibold text-slate-900">Hospital (হাসপাতাল)</h2>
          <Field label="Hospital name *"><input required className={input} value={s('hospitalName')} onChange={set('hospitalName')} /></Field>
          <Field label="হাসপাতালের নাম (বাংলা)"><input className={input} value={s('hospitalNameBn')} onChange={set('hospitalNameBn')} /></Field>
          <Field label="Type">
            <select className={input} value={s('type')} onChange={set('type')}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="DGHS / License no. *"><input required className={input} value={s('licenseNo')} onChange={set('licenseNo')} /></Field>
            <Field label="Registration no."><input className={input} value={s('registrationNo')} onChange={set('registrationNo')} /></Field>
          </div>
          <Field label="License document link (optional)"><input className={input} value={s('licenseDocUrl')} onChange={set('licenseDocUrl')} /></Field>
        </section>

        <section className="space-y-3 rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-4">
          <h2 className="text-sm font-semibold text-slate-900">Main branch (প্রধান শাখা)</h2>
          <Field label="Branch name *"><input required className={input} value={s('branchName')} onChange={set('branchName')} /></Field>
          <Field label="Address (ঠিকানা) *"><input required className={input} value={s('address')} onChange={set('address')} /></Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Area"><input className={input} value={s('area')} onChange={set('area')} /></Field>
            <Field label="City *"><input required className={input} value={s('city')} onChange={set('city')} /></Field>
            <Field label="District"><input className={input} value={s('district')} onChange={set('district')} /></Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Branch phone"><input type="tel" className={input} value={s('branchPhone')} onChange={set('branchPhone')} /></Field>
            <Field label="Emergency phone"><input type="tel" className={input} value={s('emergencyPhone')} onChange={set('emergencyPhone')} /></Field>
            <Field label="Total beds"><input type="number" min={0} className={input} value={s('bedCount')} onChange={set('bedCount')} /></Field>
          </div>
          <div className="flex flex-wrap gap-5 pt-1 text-sm text-slate-700">
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(f.is24x7)} onChange={set('is24x7')} /> Open 24/7</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(f.hasEmergency)} onChange={set('hasEmergency')} /> Emergency service</label>
          </div>
        </section>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Submit for approval'}
        </button>
      </form>
    </main>
  );
}

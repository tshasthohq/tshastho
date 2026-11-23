import Link from 'next/link';
import { searchHospitals } from '@/lib/hospital-public';

export const metadata = {
  title: 'Find Hospitals | Tshastho',
  description: 'Search verified hospitals across Bangladesh.',
};

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function HospitalsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = first(sp.q).trim().slice(0, 80);
  const city = first(sp.city).trim().slice(0, 80);
  const emergency = first(sp.emergency) === '1';
  const is24x7 = first(sp.is24x7) === '1';
  const page = Math.max(1, parseInt(first(sp.page) || '1', 10) || 1);

  const { items, total, pages } = await searchHospitals({ q, city, emergency, is24x7, page });

  const pageHref = (n: number) => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (city) u.set('city', city);
    if (emergency) u.set('emergency', '1');
    if (is24x7) u.set('is24x7', '1');
    u.set('page', String(n));
    return `/hospitals?${u.toString()}`;
  };

  const field =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_4px_20px_rgba(30,64,175,0.06)] text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900">Find a Hospital</h1>
      <p className="mt-1 text-sm text-slate-600">হাসপাতাল খুঁজুন, branch দেখুন, সেবা নিন।</p>

      <form method="GET" className="mt-4 space-y-3 rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="q" defaultValue={q} placeholder="Hospital name or area" className={field} />
          <input name="city" defaultValue={city} placeholder="City (e.g. Dhaka)" className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="emergency" value="1" defaultChecked={emergency} /> Emergency
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is24x7" value="1" defaultChecked={is24x7} /> Open 24/7
          </label>
          <button type="submit" className="ml-auto rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white">
            Search
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm text-slate-500">{total} hospital found</p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          কোনো হাসপাতাল পাওয়া যায়নি। অন্য filter দিয়ে চেষ্টা করুন।
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((h) => (
            <Link
              key={h.id}
              href={`/hospitals/${h.slug}`}
              className="block rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-4 transition hover:shadow-[0_14px_40px_rgba(30,64,175,0.16)] hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                {h.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600">
                    {h.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-900">{h.name}</h2>
                  {h.nameBn && <p className="truncate text-xs text-slate-500">{h.nameBn}</p>}
                  {h.verifiedAt && <span className="mt-1 inline-block text-xs font-medium text-green-600">✓ Verified</span>}
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {h.branches.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-x-2">
                    <span>{[b.area, b.city].filter(Boolean).join(', ') || b.name}</span>
                    {b.is24x7 && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">24/7</span>}
                    {b.hasEmergency && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Emergency</span>}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2">← Prev</Link>}
          <span className="text-slate-500">{page} / {pages}</span>
          {page < pages && <Link href={pageHref(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2">Next →</Link>}
        </div>
      )}
    </main>
  );
}

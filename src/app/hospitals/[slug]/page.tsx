import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicHospital } from '@/lib/hospital-public';

export default async function HospitalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = await getPublicHospital(slug);
  if (!h) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/hospitals" className="text-sm text-blue-600">← All hospitals</Link>

      <div className="mt-3 rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-5">
        <div className="flex items-start gap-4">
          {h.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={h.logo} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-600">
              {h.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{h.name}</h1>
            {h.nameBn && <p className="text-sm text-slate-500">{h.nameBn}</p>}
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              {h.verifiedAt && <span className="font-medium text-green-600">✓ Verified by Tshastho</span>}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{h.type}</span>
            </div>
          </div>
        </div>

        {h.about && <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{h.about}</p>}

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {h.phone && <a href={`tel:${h.phone}`} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">Call</a>}
          {h.website && (
            <a href={h.website} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 px-4 py-2">
              Website
            </a>
          )}
        </div>
      </div>

      <h2 className="mt-6 text-lg font-semibold text-slate-900">Branches ({h.branches.length})</h2>
      <div className="mt-3 space-y-3">
        {h.branches.map((b) => (
          <section key={b.id} className="rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{b.name}</h3>
              {b.is24x7 && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">24/7</span>}
              {b.hasEmergency && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Emergency</span>}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {[b.address, b.area, b.city, b.district].filter(Boolean).join(', ')}
            </p>

            <dl className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-700 sm:grid-cols-2">
              {b.bedCount != null && <div>Beds: <b>{b.bedCount}</b></div>}
              {b.openTime && b.closeTime && !b.is24x7 && <div>Hours: {b.openTime} - {b.closeTime}</div>}
              {b.phone && <div>Phone: <a href={`tel:${b.phone}`} className="text-blue-600">{b.phone}</a></div>}
              {b.emergencyPhone && (
                <div>Emergency: <a href={`tel:${b.emergencyPhone}`} className="text-red-600">{b.emergencyPhone}</a></div>
              )}
            </dl>

            {b.departments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {b.departments.map((d) => (
                  <span key={d.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{d.name}</span>
                ))}
              </div>
            )}

            {b.latitude != null && b.longitude != null && (
              <a
                href={`https://www.google.com/maps?q=${b.latitude},${b.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-blue-600 underline"
              >
                Open in Maps
              </a>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

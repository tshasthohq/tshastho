import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hospital Dashboard' };

const card =
  'rounded-3xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,64,175,0.08)]';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-red-100 text-red-800',
};

const STATUS_NOTE: Record<string, string> = {
  PENDING: 'আপনার আবেদন যাচাই চলছে। Approve হলে hospital public তালিকায় দেখা যাবে।',
  REJECTED: 'আবেদন approve হয়নি। বিস্তারিত জানতে Tshastho support এ যোগাযোগ করুন।',
  SUSPENDED: 'এই hospital সাময়িকভাবে বন্ধ আছে। Support এ যোগাযোগ করুন।',
};

const FULL_ACCESS = ['OWNER', 'ADMIN'];

export default async function HospitalDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const memberships = await prisma.hospitalMember.findMany({
    where: { userId: user.id, status: 'ACTIVE', hospital: { deletedAt: null } },
    orderBy: { createdAt: 'asc' },
    select: {
      role: true,
      branchIds: true,
      hospital: {
        select: {
          id: true,
          slug: true,
          name: true,
          nameBn: true,
          status: true,
          rejectionReason: true,
          branches: {
            where: { deletedAt: null },
            orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              isActive: true,
              isMain: true,
              bedCount: true,
              is24x7: true,
              hasEmergency: true,
            },
          },
        },
      },
    },
  });

  const isPlatformAdmin = user.role === 'SUPER_ADMIN';

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900">Hospital Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">আপনার hospital ও branch এক জায়গায়।</p>

      {isPlatformAdmin && (
        <Link href="/admin/hospitals" className="mt-4 inline-block rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
          Approve / manage all hospitals
        </Link>
      )}

      {memberships.length === 0 && (
        <div className={`${card} mt-6 p-6 text-center`}>
          <p className="text-sm text-slate-600">আপনার account এ কোনো hospital যুক্ত নেই।</p>
          <Link href="/register/hospital" className="mt-4 inline-block rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
            Register a Hospital
          </Link>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {memberships.map((m) => {
          const h = m.hospital;
          const branches = FULL_ACCESS.includes(m.role)
            ? h.branches
            : h.branches.filter((b) => m.branchIds.includes(b.id));
          const beds = branches.reduce((n, b) => n + (b.bedCount ?? 0), 0);

          return (
            <section key={h.id} className={`${card} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-900">{h.name}</h2>
                  {h.nameBn && <p className="truncate text-sm text-slate-500">{h.nameBn}</p>}
                  <p className="mt-1 text-xs text-slate-500">Your role: {m.role}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[h.status] ?? STATUS_STYLE.DRAFT}`}>
                  {h.status}
                </span>
              </div>

              {STATUS_NOTE[h.status] && (
                <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {STATUS_NOTE[h.status]}
                  {h.rejectionReason ? ` কারণ: ${h.rejectionReason}` : ''}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-blue-50 p-3">
                  <div className="text-xl font-bold text-blue-700">{branches.length}</div>
                  <div className="text-xs text-slate-600">Branches</div>
                </div>
                <div className="rounded-2xl bg-blue-50 p-3">
                  <div className="text-xl font-bold text-blue-700">{beds}</div>
                  <div className="text-xs text-slate-600">Total beds</div>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {branches.map((b) => (
                  <li key={b.id} className="rounded-2xl border border-slate-100 bg-white p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{b.name}</span>
                      {b.isMain && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Main</span>}
                      {b.is24x7 && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">24/7</span>}
                      {b.hasEmergency && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Emergency</span>}
                      {!b.isActive && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Inactive</span>}
                    </div>
                    <p className="mt-1 text-slate-600">{[b.address, b.city].filter(Boolean).join(', ')}</p>
                  </li>
                ))}
              </ul>

              {h.status === 'APPROVED' && (
                <Link href={`/hospitals/${h.slug}`} className="mt-4 inline-block rounded-2xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700">
                  View public page
                </Link>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

import { NextResponse } from 'next/server';
import { PUBLIC_CACHE } from "@/lib/cache";
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const specialty = url.searchParams.get('specialty') || '';
  const city = url.searchParams.get('city') || '';
  const online = url.searchParams.get('online') === 'true';
  const minFee = url.searchParams.get('minFee');
  const maxFee = url.searchParams.get('maxFee');
  const sort = url.searchParams.get('sort') || 'rating';
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
  const lite = url.searchParams.get('lite') === '1';

  const mode = url.searchParams.get('mode') || 'all';
  const registeredCond = { user: { isActive: true, role: 'DOCTOR' } };
  const directoryCond = { claimStatus: { in: ['UNCLAIMED', 'PENDING'] as any } };
  const where: any = {
    AND: [
      mode === 'booking' ? registeredCond : mode === 'directory' ? directoryCond : { OR: [registeredCond, directoryCond] },
    ],
  };

  if (q) {
    where.AND.push({ OR: [
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { specialty: { contains: q, mode: 'insensitive' } },
      { specialties: { some: { name: { contains: q, mode: 'insensitive' } } } },
      { fullName: { contains: q, mode: 'insensitive' } },
      { licenseNumber: { contains: q, mode: 'insensitive' } },
    ] });
  }
  if (specialty) where.specialties = { some: { name: { contains: specialty, mode: 'insensitive' } } };
  if (city) where.chamberAddress = { contains: city, mode: 'insensitive' };
  if (online) where.onlineAvailable = true;
  if (minFee || maxFee) {
    where.consultationFee = {};
    if (minFee) where.consultationFee.gte = Number(minFee);
    if (maxFee) where.consultationFee.lte = Number(maxFee);
  }

  const orderBy: any =
    sort === 'fee_low' ? { consultationFee: 'asc' } :
    sort === 'fee_high' ? { consultationFee: 'desc' } :
    sort === 'experience' ? { experience: 'desc' } :
    { averageRating: 'desc' };

  const doctors = await prisma.doctor.findMany({
    where,
    orderBy,
    take: limit,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      specialties: true,
      ...(lite ? {} : {
        qualifications: { orderBy: { year: 'desc' }, take: 3 },
        chambers: { where: { isActive: true }, orderBy: { isPrimary: 'desc' } },
      }),
    },
  });

  const out = doctors.map((d: any) => {
    const isClaimed = d.claimStatus === 'CLAIMED' && !!d.userId;
    const base: any = { ...d, isClaimed, displayName: d.user?.name || d.fullName || 'Doctor' };
    if (!isClaimed) { delete base.bookingPhone; delete base.userId; }
    return base;
  });
  return NextResponse.json({ success: true, doctors: out, count: out.length }, { headers: PUBLIC_CACHE });
}

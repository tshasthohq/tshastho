import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const q = (url.searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const take = 30;

  const where: any = {};
  if (status && ['UNCLAIMED', 'PENDING', 'CLAIMED', 'REJECTED'].includes(status)) {
    where.claimStatus = status;
  }
  if (q) {
    where.OR = [
      { licenseNumber: { contains: q, mode: 'insensitive' } },
      { fullName: { contains: q, mode: 'insensitive' } },
      { specialty: { contains: q, mode: 'insensitive' } },
      { district: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [doctors, total, counts] = await Promise.all([
    prisma.doctor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
      select: {
        id: true, licenseNumber: true, fullName: true, degrees: true, specialty: true,
        district: true, chamberAddress: true, bookingPhone: true, claimStatus: true,
        verificationStatus: true, source: true, userId: true, createdAt: true,
        user: { select: { id: true, name: true, email: true, phone: true, status: true } },
      },
    }),
    prisma.doctor.count({ where }),
    prisma.doctor.groupBy({ by: ['claimStatus'], _count: { _all: true } }),
  ]);

  const summary: Record<string, number> = { UNCLAIMED: 0, PENDING: 0, CLAIMED: 0, REJECTED: 0 };
  counts.forEach((c) => (summary[c.claimStatus] = c._count._all));

  return NextResponse.json({ success: true, doctors, total, page, pages: Math.ceil(total / take), summary });
}

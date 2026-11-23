import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
type Status = (typeof STATUSES)[number];

export async function GET(req: Request) {
  const { error } = await requireRole(['SUPER_ADMIN']);
  if (error) return error;

  const status = new URL(req.url).searchParams.get('status') ?? 'PENDING';
  if (!STATUSES.includes(status as Status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const hospitals = await prisma.hospital.findMany({
    where: { status: status as Status, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      slug: true,
      name: true,
      nameBn: true,
      type: true,
      licenseNo: true,
      registrationNo: true,
      licenseDocUrl: true,
      phone: true,
      email: true,
      status: true,
      rejectionReason: true,
      createdAt: true,
      branches: { select: { id: true, name: true, city: true, address: true, isMain: true } },
      members: {
        where: { role: 'OWNER' },
        select: { user: { select: { id: true, name: true, email: true, phone: true } } },
      },
    },
  });

  return NextResponse.json({ hospitals });
}

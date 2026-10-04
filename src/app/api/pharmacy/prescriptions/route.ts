import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'PENDING';

  const prescriptions = await prisma.prescription.findMany({
    where: {
      status: status as any,
      OR: [
        { orders: { some: { pharmacyId: { not: undefined } } } },
        { status: 'PENDING' },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      items: true,
      patient: { select: { id: true, name: true, email: true, phone: true } },
      verifiedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, prescriptions });
}

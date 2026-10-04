import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET() {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  const shift = await prisma.posShift.findFirst({
    where: { staffId: user.id, status: 'OPEN' },
    orderBy: { openedAt: 'desc' },
  });

  return NextResponse.json({ success: true, shift });
}

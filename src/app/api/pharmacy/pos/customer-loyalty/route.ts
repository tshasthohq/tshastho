import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const phone = url.searchParams.get('phone');
  if (!phone) return errorResponse(ErrorCodes.VALIDATION_ERROR, 'phone required', 400);

  const user = await prisma.user.findFirst({
    where: { phone, role: 'CUSTOMER' as any },
    select: { id: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ success: true, loyalty: null });
  }

  const acc = await prisma.loyaltyAccount.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    success: true,
    loyalty: acc
      ? { userId: user.id, name: user.name, points: acc.points, tier: acc.tier }
      : { userId: user.id, name: user.name, points: 0, tier: 'BRONZE' },
  });
}

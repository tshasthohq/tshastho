// GET /api/pharmacy/prescriptions/retention/stats — retention stats
// Item 18

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { getRetentionStats } from '@/lib/pharmacy/retention-policy';

export async function GET() {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    let pharmacyId: string | undefined = user.parentPharmacyId ?? undefined;
    if (user.role === 'PHARMACY_OWNER') {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id ?? undefined;
    }
    const stats = await getRetentionStats(pharmacyId);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('[RETENTION_STATS]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

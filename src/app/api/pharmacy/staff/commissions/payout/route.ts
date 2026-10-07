// POST /api/pharmacy/staff/commissions/payout — mark PENDING → PAID
// Item 15

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { payoutStaffCommissions } from '@/lib/pharmacy/staff-commission';
import { z } from 'zod';

const schema = z.object({
  staffId: z.string().min(1),
  method: z.string().max(30).optional(),
  note: z.string().max(300).optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    let pharmacyId: string | null = user.parentPharmacyId ?? null;
    if (user.role === 'PHARMACY_OWNER') {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id ?? null;
    }
    if (!pharmacyId) {
      return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);
    }

    const result = await payoutStaffCommissions({
      pharmacyId,
      staffId: data.staffId,
      method: data.method,
      note: data.note,
      byUserId: user.id,
    });

    if (!result.ok) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, result.error ?? 'Failed', 400);
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[STAFF_COMMISSION_PAYOUT]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Payout failed', 500);
  }
}

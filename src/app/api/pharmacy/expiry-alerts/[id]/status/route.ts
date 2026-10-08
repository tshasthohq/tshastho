// POST /api/pharmacy/expiry-alerts/[id]/status — acknowledge/dismiss
// Item 28

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { updateAlertStatus } from '@/lib/pharmacy/expiry-scanner';
import { z } from 'zod';

const schema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'WRITTEN_OFF', 'DISMISSED']),
  notes: z.string().max(300).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  try {
    let pharmacyId: string | null = user.parentPharmacyId ?? null;
    if (user.role === 'PHARMACY_OWNER') {
      const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = p?.id ?? null;
    }
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const data = schema.parse(await req.json());
    const result = await updateAlertStatus({
      alertId: id,
      pharmacyId,
      status: data.status,
      userId: user.id,
      notes: data.notes,
    });

    if (!result.ok) return errorResponse(ErrorCodes.VALIDATION_ERROR, result.error ?? 'Failed', 400);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[EXPIRY_STATUS]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

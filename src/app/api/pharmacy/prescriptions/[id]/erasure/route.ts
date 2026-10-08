// POST /api/pharmacy/prescriptions/[id]/erasure — patient-initiated erasure
// Item 18

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { requestErasure } from '@/lib/pharmacy/retention-policy';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['PATIENT', 'CUSTOMER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const { id } = await params;

  try {
    const result = await requestErasure({ prescriptionId: id, patientId: user.id });
    if (!result.ok) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, result.error ?? 'Failed', 400);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERASURE]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

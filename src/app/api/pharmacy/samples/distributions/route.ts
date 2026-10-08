// GET /api/pharmacy/samples/distributions — history — Item 37

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { listDistributions } from '@/lib/pharmacy/samples';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    let pharmacyId: string | null = user.parentPharmacyId ?? null;
    if (user.role === 'PHARMACY_OWNER') {
      const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = p?.id ?? null;
    }
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const url = new URL(req.url);
    const fromRaw = url.searchParams.get('from');
    const toRaw = url.searchParams.get('to');
    const result = await listDistributions({
      pharmacyId,
      doctorId: url.searchParams.get('doctorId') ?? undefined,
      sampleBatchId: url.searchParams.get('sampleBatchId') ?? undefined,
      from: fromRaw ? new Date(fromRaw) : undefined,
      to: toRaw ? new Date(toRaw) : undefined,
      limit: parseInt(url.searchParams.get('limit') ?? '50', 10),
      offset: parseInt(url.searchParams.get('offset') ?? '0', 10),
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[SAMPLES_DIST_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

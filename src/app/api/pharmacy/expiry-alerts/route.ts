// GET /api/pharmacy/expiry-alerts — list
// POST /api/pharmacy/expiry-alerts — trigger manual scan
// Item 28

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { listExpiryAlerts, scanExpiringBatches } from '@/lib/pharmacy/expiry-scanner';

async function resolvePharmacyId(user: { id: string; role: string; parentPharmacyId?: string | null }) {
  let pharmacyId: string | null = user.parentPharmacyId ?? null;
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = p?.id ?? null;
  }
  return pharmacyId;
}

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const pharmacyId = await resolvePharmacyId(user);
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const url = new URL(req.url);
    const result = await listExpiryAlerts({
      pharmacyId,
      status: url.searchParams.get('status') ?? undefined,
      tier: url.searchParams.get('tier') ?? undefined,
      limit: parseInt(url.searchParams.get('limit') ?? '50', 10),
      offset: parseInt(url.searchParams.get('offset') ?? '0', 10),
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[EXPIRY_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const pharmacyId = await resolvePharmacyId(user);
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const result = await scanExpiringBatches({ pharmacyId });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[EXPIRY_SCAN]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Scan failed', 500);
  }
}

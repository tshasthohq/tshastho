// GET /api/pharmacy/staff/commissions — list staff commissions
// Item 15

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { listStaffCommissions } from '@/lib/pharmacy/staff-commission';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    let pharmacyId: string | null = user.parentPharmacyId ?? null;
    if (user.role === 'PHARMACY_OWNER') {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id ?? null;
    }
    if (!pharmacyId && user.role !== 'SUPER_ADMIN') {
      return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);
    }

    const url = new URL(req.url);
    const staffId = url.searchParams.get('staffId') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;
    const fromRaw = url.searchParams.get('from');
    const toRaw = url.searchParams.get('to');
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    // Staff can only see their own
    const effectiveStaffId =
      user.role === 'PHARMACY_STAFF' ? user.id : staffId;

    const result = await listStaffCommissions({
      pharmacyId: pharmacyId ?? '',
      staffId: effectiveStaffId,
      status,
      from: fromRaw ? new Date(fromRaw) : undefined,
      to: toRaw ? new Date(toRaw) : undefined,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[STAFF_COMMISSION_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to list', 500);
  }
}

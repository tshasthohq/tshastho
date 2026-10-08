// GET  /api/pharmacy/cash-drawer — list drawer logs
// POST /api/pharmacy/cash-drawer — log an open event
// Item 22

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { logCashDrawer, listCashDrawerLogs, getDrawerStats } from '@/lib/pharmacy/cash-drawer';
import { z } from 'zod';

const createSchema = z.object({
  reason: z.enum(['MANUAL', 'SALE', 'CHANGE', 'REFUND', 'OPEN_SHIFT']),
  amount: z.number().nonnegative().optional(),
  shiftId: z.string().optional(),
  posSaleId: z.string().optional(),
  notes: z.string().max(300).optional(),
  deviceName: z.string().max(120).optional(),
  success: z.boolean().optional(),
  errorMessage: z.string().max(400).optional(),
});

async function resolvePharmacy(user: { id: string; role: string; parentPharmacyId?: string | null }) {
  let pharmacyId: string | null = user.parentPharmacyId ?? null;
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = p?.id ?? null;
  }
  return pharmacyId;
}

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const pharmacyId = await resolvePharmacy(user);
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const body = await req.json();
    const data = createSchema.parse(body);

    const log = await logCashDrawer({ ...data, pharmacyId, userId: user.id });
    return NextResponse.json({ success: true, logId: log.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[CASH_DRAWER_LOG]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const pharmacyId = await resolvePharmacy(user);
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const url = new URL(req.url);
    const result = await listCashDrawerLogs({
      pharmacyId,
      userId: url.searchParams.get('userId') ?? undefined,
      reason: url.searchParams.get('reason') ?? undefined,
      from: url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined,
      to: url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined,
      limit: parseInt(url.searchParams.get('limit') ?? '50', 10),
      offset: parseInt(url.searchParams.get('offset') ?? '0', 10),
    });
    const stats = await getDrawerStats(pharmacyId);
    return NextResponse.json({ success: true, ...result, stats });
  } catch (error) {
    console.error('[CASH_DRAWER_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

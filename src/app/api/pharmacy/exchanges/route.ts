// GET  /api/pharmacy/exchanges — list
// POST /api/pharmacy/exchanges — create exchange
// Item 38

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { createExchange, listExchanges } from '@/lib/pharmacy/exchanges';
import { z } from 'zod';

async function resolvePharmacyId(user: { id: string; role: string; parentPharmacyId?: string | null }) {
  let pharmacyId: string | null = user.parentPharmacyId ?? null;
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = p?.id ?? null;
  }
  return pharmacyId;
}

const itemInSchema = z.object({
  medicineId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  batchId: z.string().optional(),
  reason: z.string().max(200).optional(),
  isRestocked: z.boolean().optional(),
});

const itemOutSchema = z.object({
  medicineId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  batchId: z.string().optional(),
});

const createSchema = z.object({
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().max(30).optional(),
  customerUserId: z.string().optional(),
  originalOrderId: z.string().optional(),
  itemsIn: z.array(itemInSchema).default([]),
  itemsOut: z.array(itemOutSchema).default([]),
  differenceMethod: z.enum(['CASH', 'WALLET', 'GATEWAY', 'REFUND']).default('CASH'),
  reason: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const pharmacyId = await resolvePharmacyId(user);
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const url = new URL(req.url);
    const fromRaw = url.searchParams.get('from');
    const toRaw = url.searchParams.get('to');
    const result = await listExchanges({
      pharmacyId,
      status: url.searchParams.get('status') ?? undefined,
      from: fromRaw ? new Date(fromRaw) : undefined,
      to: toRaw ? new Date(toRaw) : undefined,
      limit: parseInt(url.searchParams.get('limit') ?? '50', 10),
      offset: parseInt(url.searchParams.get('offset') ?? '0', 10),
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[EXCHANGE_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const pharmacyId = await resolvePharmacyId(user);
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const data = createSchema.parse(await req.json());
    const result = await createExchange({
      pharmacyId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerUserId: data.customerUserId,
      originalOrderId: data.originalOrderId,
      itemsIn: data.itemsIn,
      itemsOut: data.itemsOut,
      differenceMethod: data.differenceMethod,
      reason: data.reason,
      notes: data.notes,
      createdBy: user.id,
    });
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    const msg = error instanceof Error ? error.message : 'Failed';
    console.error('[EXCHANGE_CREATE]', error);
    return errorResponse(ErrorCodes.VALIDATION_ERROR, msg, 400);
  }
}

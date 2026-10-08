// GET  /api/pharmacy/samples — list sample batches
// POST /api/pharmacy/samples — receive new sample batch
// Item 37

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { receiveSampleBatch, listSampleBatches } from '@/lib/pharmacy/samples';
import { z } from 'zod';

async function resolvePharmacyId(user: { id: string; role: string; parentPharmacyId?: string | null }) {
  let pharmacyId: string | null = user.parentPharmacyId ?? null;
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = p?.id ?? null;
  }
  return pharmacyId;
}

const receiveSchema = z.object({
  medicineId: z.string().min(1),
  batchNumber: z.string().max(80).optional(),
  expiryDate: z.string().optional(),
  quantity: z.number().int().positive(),
  supplierId: z.string().optional(),
  repName: z.string().max(120).optional(),
  repPhone: z.string().max(30).optional(),
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
    const expiringRaw = url.searchParams.get('expiringInDays');
    const result = await listSampleBatches({
      pharmacyId,
      medicineId: url.searchParams.get('medicineId') ?? undefined,
      activeOnly: url.searchParams.get('activeOnly') !== 'false',
      expiringInDays: expiringRaw ? parseInt(expiringRaw, 10) : undefined,
      limit: parseInt(url.searchParams.get('limit') ?? '50', 10),
      offset: parseInt(url.searchParams.get('offset') ?? '0', 10),
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[SAMPLES_LIST]', error);
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

    const data = receiveSchema.parse(await req.json());
    const batch = await receiveSampleBatch({
      pharmacyId,
      medicineId: data.medicineId,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      quantity: data.quantity,
      supplierId: data.supplierId,
      repName: data.repName,
      repPhone: data.repPhone,
      notes: data.notes,
      receivedBy: user.id,
    });
    return NextResponse.json({ success: true, batch }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[SAMPLE_RECEIVE]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed', 500);
  }
}

// POST /api/pharmacy/samples/distribute — give to doctor — Item 37

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { distributeSample } from '@/lib/pharmacy/samples';
import { z } from 'zod';

const schema = z.object({
  sampleBatchId: z.string().min(1),
  doctorId: z.string().optional(),
  doctorName: z.string().min(1).max(120),
  doctorPhone: z.string().max(30).optional(),
  doctorClinic: z.string().max(200).optional(),
  quantity: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
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

    const data = schema.parse(await req.json());
    const dist = await distributeSample({
      pharmacyId,
      sampleBatchId: data.sampleBatchId,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      doctorPhone: data.doctorPhone,
      doctorClinic: data.doctorClinic,
      quantity: data.quantity,
      notes: data.notes,
      givenBy: user.id,
    });
    return NextResponse.json({ success: true, distribution: dist }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    const msg = error instanceof Error ? error.message : 'Failed';
    console.error('[SAMPLE_DISTRIBUTE]', error);
    return errorResponse(ErrorCodes.VALIDATION_ERROR, msg, 400);
  }
}

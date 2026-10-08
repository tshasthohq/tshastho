// GET  /api/pharmacy/recalls — list matches for pharmacy
// POST /api/pharmacy/recalls/import — super admin imports recalls (bulk)
// Item 17

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { upsertRecalls, scanAllPharmacies } from '@/lib/pharmacy/recall-scanner';
import { z } from 'zod';

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
    const status = url.searchParams.get('status') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    const where = {
      ...(pharmacyId ? { pharmacyId } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.recallMatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(100, Math.max(1, limit)),
        skip: Math.max(0, offset),
        include: {
          recall: true,
          batch: { select: { id: true, batchNumber: true, expiryDate: true, quantity: true } },
        },
      }),
      prisma.recallMatch.count({ where }),
    ]);

    return NextResponse.json({ success: true, items, total, limit, offset });
  } catch (error) {
    console.error('[RECALL_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to list recalls', 500);
  }
}

const importSchema = z.object({
  recalls: z.array(z.object({
    externalId: z.string().optional(),
    source: z.enum(['FDA', 'WHO', 'DGDA', 'MANUAL']),
    sourceUrl: z.string().url().optional(),
    drugName: z.string().min(1),
    genericName: z.string().optional(),
    batchNumbers: z.array(z.string()).default([]),
    manufacturer: z.string().optional(),
    reason: z.string().optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    recallDate: z.string().optional(),
    publishedAt: z.string().optional(),
  })).min(1),
});

export async function POST(req: Request) {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = importSchema.parse(body);

    const normalized = data.recalls.map((r) => ({
      ...r,
      recallDate: r.recallDate ? new Date(r.recallDate) : undefined,
      publishedAt: r.publishedAt ? new Date(r.publishedAt) : undefined,
    }));

    const result = await upsertRecalls(normalized);

    // Fire-and-forget matching per recall
    const inserted = await prisma.drugRecall.findMany({
      where: {
        externalId: {
          in: normalized.map((r) => r.externalId).filter((x): x is string => !!x),
        },
      },
      select: { id: true },
    });
    for (const r of inserted) {
      scanAllPharmacies(r.id).catch((e) => console.error('[SCAN_ALL]', e));
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[RECALL_IMPORT]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Import failed', 500);
  }
}

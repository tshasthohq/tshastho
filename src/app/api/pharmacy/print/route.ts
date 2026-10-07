// POST /api/pharmacy/print — Save print log (audit trail)
// Item 12 — Thermal Printer Integration

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';

const createSchema = z.object({
  orderId: z.string().optional().nullable(),
  connectionType: z.enum(['bluetooth', 'usb', 'network', 'browser']).default('browser'),
  paperWidth: z.union([z.literal(58), z.literal(80)]).default(58),
  deviceName: z.string().max(120).optional().nullable(),
  bytesSent: z.number().int().nonnegative().default(0),
  success: z.boolean().default(true),
  errorMessage: z.string().max(500).optional().nullable(),
  receiptData: z.unknown().optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // Resolve pharmacyId (following suppliers route pattern)
    let pharmacyId: string | null = user.parentPharmacyId ?? null;
    if (user.role === 'PHARMACY_OWNER') {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id ?? null;
    }

    // If orderId provided, verify it belongs to this pharmacy
    if (data.orderId) {
      const order = await prisma.order.findFirst({
        where: { id: data.orderId, ...(pharmacyId ? { pharmacyId } : {}) },
        select: { id: true },
      });
      if (!order) {
        return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Order not found', 404);
      }
    }

    const headers = req.headers;
    const ipAddress =
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip') ||
      null;
    const userAgent = headers.get('user-agent') || null;

    const log = await prisma.printLog.create({
      data: {
        orderId: data.orderId ?? null,
        pharmacyId,
        userId: user.id,
        connectionType: data.connectionType,
        paperWidth: data.paperWidth,
        deviceName: data.deviceName ?? null,
        bytesSent: data.bytesSent,
        success: data.success,
        errorMessage: data.errorMessage ?? null,
        receiptData: data.receiptData as object | undefined,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, logId: log.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[PRINT_LOG_CREATE]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to save print log', 500);
  }
}

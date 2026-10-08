// GET /api/pharmacy/print/log — Paginated print history
// Item 12 — Thermal Printer Integration
//
// Query params:
//   orderId?   — filter by order
//   limit?     — default 20 (max 100)
//   offset?    — default 0
//   success?   — 'true' | 'false'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    const successParam = url.searchParams.get('success');
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    // Resolve pharmacyId
    let pharmacyId: string | null = user.parentPharmacyId ?? null;
    if (user.role === 'PHARMACY_OWNER') {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id ?? null;
    }

    const where = {
      ...(orderId ? { orderId } : {}),
      ...(successParam === 'true' ? { success: true } : {}),
      ...(successParam === 'false' ? { success: false } : {}),
      // Non-super-admin: scope to own pharmacy
      ...(user.role !== 'SUPER_ADMIN' && pharmacyId ? { pharmacyId } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.printLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          orderId: true,
          connectionType: true,
          paperWidth: true,
          deviceName: true,
          bytesSent: true,
          success: true,
          errorMessage: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.printLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    console.error('[PRINT_LOG_LIST]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch print logs', 500);
  }
}

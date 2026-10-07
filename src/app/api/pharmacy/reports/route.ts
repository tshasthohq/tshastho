// GET /api/pharmacy/reports?type=...&from=&to=&format=json|csv
// Items 29-34

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { parseRange, runReport, toCSV, type ReportType } from '@/lib/pharmacy/reports';

const VALID: ReportType[] = ['doctor-wise', 'area-wise', 'peak-hours', 'pnl', 'customer-aging', 'supplier-aging'];

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
    if (!pharmacyId && user.role !== 'SUPER_ADMIN') {
      return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type') as ReportType | null;
    if (!type || !VALID.includes(type)) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid report type', 400);
    }
    const format = url.searchParams.get('format') ?? 'json';
    const range = parseRange(url.searchParams.get('from') ?? undefined, url.searchParams.get('to') ?? undefined);

    const data = await runReport(type, pharmacyId ?? '', range);

    if (format === 'csv') {
      // Flatten items array (if any) to CSV
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (data as any).items ?? [(data as any)];
      const csv = toCSV(items);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}-${range.from.toISOString().slice(0, 10)}-to-${range.to.toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ success: true, type, ...data });
  } catch (error) {
    console.error('[REPORTS]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Report failed', 500);
  }
}

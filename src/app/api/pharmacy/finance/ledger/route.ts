import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { getLedgerSummary, getCurrentBalance } from '@/lib/pharmacy/ledger';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  let pharmacyId = user.parentPharmacyId;
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = p?.id || null;
  }
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);

  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const [entries, summary, balance] = await Promise.all([
    prisma.pharmacyLedger.findMany({
      where: {
        pharmacyId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    getLedgerSummary(pharmacyId, fromDate, toDate),
    getCurrentBalance(pharmacyId),
  ]);

  return NextResponse.json({ success: true, entries, summary, balance, range: { from: fromDate, to: toDate } });
}

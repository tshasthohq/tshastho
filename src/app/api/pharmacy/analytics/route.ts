import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import {
  getTopSelling,
  getDeadStock,
  getCategoryPerformance,
  getDailyTrend,
  getCustomerSegmentation,
  getProfitMargins,
} from '@/lib/pharmacy/analytics';
import { errorResponse, ErrorCodes } from '@/lib/errors';

async function getPharmacyId(user: any) {
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    return p?.id || null;
  }
  return user.parentPharmacyId;
}

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const pharmacyId = await getPharmacyId(user);
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const url = new URL(req.url);
  const from = url.searchParams.get('from')
    ? new Date(url.searchParams.get('from')!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : new Date();

  const [topSelling, deadStock, categories, trend, segments, margins] = await Promise.all([
    getTopSelling({ pharmacyId, from, to, limit: 10 }),
    getDeadStock({ pharmacyId, days: 90, limit: 20 }),
    getCategoryPerformance({ pharmacyId, from, to }),
    getDailyTrend({ pharmacyId, days: 30 }),
    getCustomerSegmentation(pharmacyId),
    getProfitMargins({ pharmacyId, from, to, limit: 10 }),
  ]);

  return NextResponse.json({
    success: true,
    topSelling,
    deadStock,
    categories,
    trend,
    segments,
    margins,
  });
}

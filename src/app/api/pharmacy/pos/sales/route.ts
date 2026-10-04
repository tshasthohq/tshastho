import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  let pharmacyId = user.parentPharmacyId;
  if (user.role === 'PHARMACY_OWNER') {
    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = pharmacy?.id || null;
  }
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const url = new URL(req.url);
  const today = url.searchParams.get('today') === 'true';
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);

  const where: any = { pharmacyId };
  if (today) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    where.createdAt = { gte: start };
  }

  const sales = await prisma.posSale.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      items: true,
      staff: { select: { id: true, name: true } },
    },
  });

  // Summary
  const summary = await prisma.posSale.aggregate({
    where,
    _sum: { totalAmount: true, profit: true, dueAmount: true },
    _count: { _all: true },
  });

  return NextResponse.json({
    success: true,
    sales,
    summary: {
      count: summary._count._all,
      totalSales: summary._sum.totalAmount || 0,
      totalProfit: summary._sum.profit || 0,
      totalDue: summary._sum.dueAmount || 0,
    },
  });
}

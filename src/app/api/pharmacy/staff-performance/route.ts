import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
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
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

  const monthStart = new Date(month + '-01');
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  // Get all staff
  const staffList = await prisma.user.findMany({
    where: {
      parentPharmacyId: pharmacyId,
      role: 'PHARMACY_STAFF' as any,
      isActive: true,
    },
    select: { id: true, name: true, email: true, phone: true, staffRole: true, permissions: true },
  });

  const performances = [];

  for (const staff of staffList) {
    // POS sales by this staff
    const posSales = await prisma.posSale.aggregate({
      where: { pharmacyId, staffId: staff.id, createdAt: { gte: monthStart, lt: monthEnd } },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });

    // Customers added
    const customersAdded = await prisma.posCustomer.count({
      where: { pharmacyId, createdAt: { gte: monthStart, lt: monthEnd } },
    });

    const totalSales = Number(posSales._sum.totalAmount || 0);
    const posSaleCount = posSales._count._all;
    const avgOrderValue = posSaleCount > 0 ? totalSales / posSaleCount : 0;

    performances.push({
      staffId: staff.id,
      staff,
      month,
      totalSales,
      posSaleCount,
      avgOrderValue,
      totalCustomers: customersAdded,
    });
  }

  return NextResponse.json({ success: true, performances, month });
}

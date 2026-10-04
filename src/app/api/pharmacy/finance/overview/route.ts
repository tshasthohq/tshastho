import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { getCurrentBalance } from '@/lib/pharmacy/ledger';
import { errorResponse, ErrorCodes } from '@/lib/errors';

export async function GET() {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;

  let pharmacyId = user.parentPharmacyId;
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    pharmacyId = p?.id || null;
  }
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    todayOrders, todayPos,
    monthOrders, monthPos,
    todayExpenses, monthExpenses,
    monthPurchases,
    balance,
    pendingSettlements,
    recentClosings,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { pharmacyId, createdAt: { gte: today } },
      _sum: { finalAmount: true }, _count: { _all: true },
    }),
    prisma.posSale.aggregate({
      where: { pharmacyId, createdAt: { gte: today } },
      _sum: { totalAmount: true, profit: true }, _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { pharmacyId, createdAt: { gte: monthStart } },
      _sum: { finalAmount: true }, _count: { _all: true },
    }),
    prisma.posSale.aggregate({
      where: { pharmacyId, createdAt: { gte: monthStart } },
      _sum: { totalAmount: true, profit: true }, _count: { _all: true },
    }),
    prisma.pharmacyExpense.aggregate({
      where: { pharmacyId, expenseDate: { gte: today }, status: 'APPROVED' },
      _sum: { amount: true },
    }),
    prisma.pharmacyExpense.aggregate({
      where: { pharmacyId, expenseDate: { gte: monthStart }, status: 'APPROVED' },
      _sum: { amount: true },
    }),
    prisma.purchaseOrder.aggregate({
      where: { pharmacyId, receivedDate: { gte: monthStart } },
      _sum: { totalAmount: true },
    }),
    getCurrentBalance(pharmacyId),
    prisma.settlementRequest.aggregate({
      where: { pharmacyId, status: { in: ['REQUESTED', 'APPROVED', 'PROCESSING'] } },
      _sum: { netPayable: true }, _count: { _all: true },
    }),
    prisma.dailyClosing.findMany({
      where: { pharmacyId },
      orderBy: { closingDate: 'desc' },
      take: 5,
    }),
  ]);

  const todaySales = Number(todayOrders._sum.finalAmount || 0) + Number(todayPos._sum.totalAmount || 0);
  const monthSales = Number(monthOrders._sum.finalAmount || 0) + Number(monthPos._sum.totalAmount || 0);
  const monthProfit = Number(monthPos._sum.profit || 0);

  return NextResponse.json({
    success: true,
    today: {
      sales: todaySales,
      orderCount: todayOrders._count._all,
      posCount: todayPos._count._all,
      expenses: Number(todayExpenses._sum.amount || 0),
      net: todaySales - Number(todayExpenses._sum.amount || 0),
    },
    month: {
      sales: monthSales,
      orderCount: monthOrders._count._all,
      posCount: monthPos._count._all,
      posProfit: monthProfit,
      expenses: Number(monthExpenses._sum.amount || 0),
      purchases: Number(monthPurchases._sum.totalAmount || 0),
    },
    balance,
    pendingSettlements: {
      count: pendingSettlements._count._all,
      total: Number(pendingSettlements._sum.netPayable || 0),
    },
    recentClosings,
  });
}

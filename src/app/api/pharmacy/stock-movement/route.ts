import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { getDhakaDateRanges } from '@/lib/date-utils';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    const period = url.searchParams.get('period') || 'today';
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const ranges = getDhakaDateRanges(period, startDateStr, endDateStr);
    let start = ranges.todayStart;
    let end = undefined;
    
    if (period === 'yesterday') { start = ranges.yesterdayStart; end = ranges.yesterdayEnd; }
    else if (period === 'week') { start = ranges.weekStart; }
    else if (period === 'month') { start = ranges.monthStart; }
    else if (period === 'year') { start = ranges.yearStart; }
    else if (period === 'custom' && ranges.customStart && ranges.customEnd) { start = ranges.customStart; end = ranges.customEnd; }
    else if (period === 'total') { start = new Date(0); }

    const branchFilter = (branchId && branchId !== 'ALL') ? { branchId } : {};
    const dateFilter = { gte: start, ...(end ? { lt: end } : {}) };

    // 🔥 STOCK OUT (POS & Orders)
    const posSales = await prisma.posSale.findMany({
      where: { pharmacyId: pharmacy.id, ...branchFilter, createdAt: dateFilter },
      include: { items: true }
    });
    let posOut = 0;
    posSales.forEach(sale => { if (sale.items) sale.items.forEach(i => posOut += i.quantity); });

    const orders = await prisma.order.findMany({
      where: { pharmacyId: pharmacy.id, ...branchFilter, status: { not: 'CANCELLED' }, createdAt: dateFilter },
      include: { items: true }
    });
    let orderOut = 0;
    orders.forEach(order => { if (order.items) order.items.forEach(i => orderOut += i.quantity); });

    let transferOut = 0;
    if (branchId && branchId !== 'ALL') {
      const tOut = await prisma.branchTransfer.findMany({
        where: { fromBranchId: branchId, status: 'COMPLETED', updatedAt: dateFilter },
        include: { items: true }
      });
      tOut.forEach(t => { if (t.items) t.items.forEach(i => transferOut += i.quantity); });
    }

    const totalOut = posOut + orderOut + transferOut;

    // 🔥 STOCK IN
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { pharmacyId: pharmacy.id, ...branchFilter, status: 'RECEIVED', receivedDate: dateFilter },
      include: { items: true }
    });
    let poIn = 0;
    purchaseOrders.forEach(po => { if (po.items) po.items.forEach(i => poIn += i.quantity); });

    const returns = await prisma.returnOrder.findMany({
      where: { pharmacyId: pharmacy.id, ...branchFilter, status: 'PROCESSED', type: 'CUSTOMER_RETURN', processedAt: dateFilter },
      include: { items: true }
    });
    let returnIn = 0;
    returns.forEach(ret => { if (ret.items) ret.items.forEach(i => returnIn += i.quantity); });

    let transferIn = 0;
    if (branchId && branchId !== 'ALL') {
      const tIn = await prisma.branchTransfer.findMany({
        where: { toBranchId: branchId, status: 'COMPLETED', updatedAt: dateFilter },
        include: { items: true }
      });
      tIn.forEach(t => { if (t.items) t.items.forEach(i => transferIn += i.quantity); });
    }

    const totalIn = poIn + returnIn + transferIn;

    return NextResponse.json({ success: true, stockIn: totalIn, stockOut: totalOut });
  } catch (error) {
    console.error("Stock movement error:", error);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

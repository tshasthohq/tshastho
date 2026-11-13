import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getDhakaDateRanges } from "@/lib/date-utils";

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    const period = url.searchParams.get('period') || 'week';
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    const user = await prisma.user.findFirst({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const ranges = getDhakaDateRanges(period, startDateStr, endDateStr);
    const now = new Date();
    
    let queryStart = ranges.weekStart; 
    let queryEnd = new Date(ranges.todayStart.getTime() + 24 * 60 * 60 * 1000);
    let displayDays = 7;

    if (period === 'today') { queryStart = ranges.todayStart; displayDays = 1; }
    else if (period === 'yesterday') { queryStart = ranges.yesterdayStart; queryEnd = ranges.yesterdayEnd; displayDays = 1; }
    else if (period === 'week') { queryStart = ranges.weekStart; displayDays = 7; }
    else if (period === 'month') { queryStart = ranges.monthStart; displayDays = parseInt(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', day: '2-digit' }).format(now)); }
    else if (period === 'year') { queryStart = ranges.yearStart; displayDays = 365; }
    else if (period === 'total') { queryStart = new Date(0); displayDays = 1000; }
    else if (period === 'custom' && ranges.customStart && ranges.customEnd) {
      queryStart = ranges.customStart; queryEnd = ranges.customEnd;
      const diffTime = Math.abs(queryEnd.getTime() - queryStart.getTime());
      displayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const branchFilter = (branchId && branchId !== 'ALL') ? { branchId } : {};
    const dateFilter = { gte: queryStart, lte: queryEnd };

    // 🔥 OPTIMIZED QUERIES: Fetch only what's needed
    const [posAgg, orderAgg, topPos, topOrders] = await Promise.all([
      // 1. Daily Sales (POS) - Fetch only Date and Amount (No items)
      prisma.posSale.findMany({
        where: { pharmacyId: pharmacy.id, createdAt: dateFilter, ...branchFilter },
        select: { createdAt: true, totalAmount: true }
      }),
      // 2. Daily Sales (Orders) - Fetch only Date and Amount (No items)
      prisma.order.findMany({
        where: { pharmacyId: pharmacy.id, createdAt: dateFilter, status: { not: 'CANCELLED' }, ...branchFilter },
        select: { createdAt: true, finalAmount: true }
      }),
      // 3. Top Medicines (POS) - Fetch only items for the last 100 sales to save memory
      prisma.posSale.findMany({
        where: { pharmacyId: pharmacy.id, createdAt: dateFilter, ...branchFilter },
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: { items: { select: { medicineName: true, quantity: true } } }
      }),
      // 4. Top Medicines (Orders) - Fetch only items for the last 100 orders
      prisma.order.findMany({
        where: { pharmacyId: pharmacy.id, createdAt: dateFilter, status: { not: 'CANCELLED' }, ...branchFilter },
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: { items: { select: { medicineName: true, quantity: true } } }
      })
    ]);

    let todaySales = 0, weekSales = 0, monthSales = 0, totalOrders = posAgg.length + orderAgg.length;
    const dailySalesMap = new Map<string, number>();
    const topMedsMap = new Map<string, number>();
    const getDhakaDateStr = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

    // Process POS Data
    for (const sale of posAgg) {
      const saleDate = new Date(sale.createdAt);
      const amount = Number(sale.totalAmount || 0);
      const dateStr = getDhakaDateStr(saleDate);

      if (saleDate >= ranges.todayStart) todaySales += amount;
      if (saleDate >= ranges.weekStart) weekSales += amount;
      if (saleDate >= ranges.monthStart) monthSales += amount;

      dailySalesMap.set(dateStr, (dailySalesMap.get(dateStr) || 0) + amount);
    }

    // Process Order Data
    for (const order of orderAgg) {
      const orderDate = new Date(order.createdAt);
      const amount = Number(order.finalAmount || 0);
      const dateStr = getDhakaDateStr(orderDate);

      if (orderDate >= ranges.todayStart) todaySales += amount;
      if (orderDate >= ranges.weekStart) weekSales += amount;
      if (orderDate >= ranges.monthStart) monthSales += amount;

      dailySalesMap.set(dateStr, (dailySalesMap.get(dateStr) || 0) + amount);
    }

    // Process Top Medicines (From the limited recent data)
    topPos.forEach(s => s.items.forEach(i => topMedsMap.set(i.medicineName, (topMedsMap.get(i.medicineName) || 0) + i.quantity)));
    topOrders.forEach(o => o.items.forEach(i => topMedsMap.set(i.medicineName, (topMedsMap.get(i.medicineName) || 0) + i.quantity)));

    // Build Daily Sales Array
    const dailySales = [];
    // Limit points if it's "All Time" to prevent UI lag
    let step = displayDays > 90 ? Math.ceil(displayDays / 30) : 1; 
    for (let i = 0; i <= displayDays; i += step) {
      const d = new Date(queryStart.getTime() + i * 24 * 60 * 60 * 1000);
      if (d > queryEnd) break;
      const dStr = getDhakaDateStr(d);
      dailySales.push({ date: dStr, sales: dailySalesMap.get(dStr) || 0 });
    }

    const topMedicines = Array.from(topMedsMap.entries()).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);

    return NextResponse.json({ summary: { todaySales, weekSales, monthSales, totalOrders }, dailySales, topMedicines }, { status: 200 });
  } catch (error) {
    console.error("Charts API error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

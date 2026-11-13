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
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    const user = await prisma.user.findFirst({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const { todayStart, yesterdayStart, yesterdayEnd, weekStart, monthStart, yearStart, customStart, customEnd } = getDhakaDateRanges('custom', startDateStr, endDateStr);
    const branchFilter = (branchId && branchId !== 'ALL') ? { branchId } : {};

    const getPeriodStats = async (start: Date, end?: Date) => {
      const whereClause = {
        pharmacyId: pharmacy!.id,
        ...branchFilter,
        createdAt: { gte: start, ...(end ? { lt: end } : {}) }
      };

      // 🔥 POS Sales
      const posSales = await prisma.posSale.findMany({
        where: whereClause,
        select: { totalAmount: true, profit: true, dueAmount: true, customerId: true }
      });

      // 🔥 Online Orders
      const onlineOrders = await prisma.order.findMany({
        where: { ...whereClause, status: { not: 'CANCELLED' } },
        select: { finalAmount: true, netProfit: true, dueAmount: true, patientId: true }
      });

      // 🔥 Returns with items and cost to calculate accurate deduction
      const returns = await prisma.returnOrder.findMany({
        where: { ...whereClause, status: 'PROCESSED' },
        include: { items: { include: { medicine: { select: { purchasePrice: true } } } } }
      });

      let revenue = 0, profit = 0, dueAmount = 0;
      const uniqueCustomers = new Set<string>();

      for (const s of posSales) {
        revenue += Number(s.totalAmount || 0);
        profit += Number(s.profit || 0);
        dueAmount += Number(s.dueAmount || 0);
        if (s.customerId) uniqueCustomers.add(s.customerId);
      }

      for (const o of onlineOrders) {
        revenue += Number(o.finalAmount || 0);
        profit += Number(o.netProfit || 0);
        dueAmount += Number(o.dueAmount || 0);
        if (o.patientId) uniqueCustomers.add(o.patientId);
      }

      // 🔥 Accurate Return Deduction
      let returnRevenue = 0;
      let returnCost = 0;
      
      for (const r of returns) {
        if (r.refundMethod !== 'NO_REFUND') { 
          returnRevenue += Number(r.refundAmount || 0);
          for (const item of r.items) {
            returnCost += (Number(item.medicine.purchasePrice) * item.quantity);
          }
        }
      }

      revenue -= returnRevenue;
      // নতুন প্রফিট = পুরনো প্রফিট - (রিফান্ডের টাকা - ফেরত আসা মালের ক্রয়মূল্য)
      profit -= (returnRevenue - returnCost);

      return { 
        revenue, cost: revenue - profit, netProfit: profit, dueAmount, 
        orderCount: posSales.length + onlineOrders.length, 
        customerCount: uniqueCustomers.size, platformFee: 0 
      };
    };

    let custom = undefined;
    if (customStart && customEnd) custom = await getPeriodStats(customStart, customEnd);

    const [today, yesterday, week, month, year, total] = await Promise.all([
      getPeriodStats(todayStart), getPeriodStats(yesterdayStart, yesterdayEnd),
      getPeriodStats(weekStart), getPeriodStats(monthStart),
      getPeriodStats(yearStart), getPeriodStats(new Date(0))
    ]);

    const pendingOrders = await prisma.order.count({ where: { pharmacyId: pharmacy.id, status: "PENDING", ...branchFilter } });

    let medicines;
    if (branchId && branchId !== 'ALL') {
      const branchStocks = await prisma.branchStock.findMany({ where: { branchId }, include: { medicine: true } });
      medicines = branchStocks.map(bs => ({ sellingPrice: bs.medicine.sellingPrice, purchasePrice: bs.medicine.purchasePrice, stock: bs.quantity, expiryDate: bs.medicine.expiryDate }));
    } else {
      medicines = await prisma.medicine.findMany({ where: { pharmacyId: pharmacy.id }, select: { sellingPrice: true, purchasePrice: true, stock: true, expiryDate: true } });
    }

    let stockValue = 0, stockCost = 0;
    for (const m of medicines) {
      stockValue += Number(m.sellingPrice || 0) * m.stock;
      stockCost += Number(m.purchasePrice || 0) * m.stock;
    }

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let expired = 0, expiringSoon = 0;
    for (const m of medicines) {
      if (m.expiryDate) {
        const exp = new Date(m.expiryDate);
        if (exp < now) expired++;
        else if (exp <= thirtyDaysLater) expiringSoon++;
      }
    }

    return NextResponse.json({
      today, yesterday, week, month, year, total, custom,
      totalDue: total.dueAmount, pendingOrders, medicineCount: medicines.length,
      stockValue, stockCost, expired, expiringSoon, customerCount: total.customerCount,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

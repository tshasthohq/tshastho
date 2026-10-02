import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { email, startDate, endDate, status, search } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const where: any = { pharmacyId: pharmacy.id };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (status && status !== "ALL") where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by search (patient name, phone, order number)
    let filtered = orders;
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = orders.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.patient?.name || "").toLowerCase().includes(q) ||
        (o.patient?.phone || "").includes(q)
      );
    }

    // Calculate totals
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    for (const o of filtered) {
      totalRevenue += parseFloat(o.totalAmount.toString());
      totalCost += parseFloat(o.totalCost.toString());
      totalProfit += parseFloat(o.netProfit.toString());
    }

    return NextResponse.json({
      orders: filtered,
      summary: { totalRevenue, totalCost, totalProfit, count: filtered.length },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

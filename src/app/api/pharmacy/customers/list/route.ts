import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
        const user = await prisma.user.findFirst({ where: { email: auth.user.email }});
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    }
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    }
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    // Get all orders from this pharmacy with patient info
    const orders = await prisma.order.findMany({
      where: { pharmacyId: pharmacy.id },
      select: {
        id: true,
        patientId: true,
        totalAmount: true,
        finalAmount: true,
        netProfit: true,
        paidAmount: true,
        dueAmount: true,
        status: true,
        createdAt: true,
        patient: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by customer
    const customerMap: any = {};
    for (const order of orders) {
      const pid = order.patientId;
      if (!customerMap[pid]) {
        customerMap[pid] = {
          id: pid,
          name: order.patient?.name || "Customer",
          phone: order.patient?.phone || "",
          email: order.patient?.email || "",
          totalOrders: 0,
          deliveredOrders: 0,
          totalSpent: 0,
          totalPaid: 0,
          totalDue: 0,
          totalProfit: 0,
          firstOrderAt: order.createdAt,
          lastOrderAt: order.createdAt,
        };
      }
      const c = customerMap[pid];
      c.totalOrders++;
      if (order.status === "DELIVERED") {
        c.deliveredOrders++;
        c.totalSpent += parseFloat(order.finalAmount.toString());
        c.totalPaid += parseFloat(order.paidAmount.toString());
        c.totalDue += parseFloat(order.dueAmount.toString());
        c.totalProfit += parseFloat(order.netProfit.toString());
      }
      // Update last/first
      const orderDate = new Date(order.createdAt).getTime();
      if (orderDate > new Date(c.lastOrderAt).getTime()) c.lastOrderAt = order.createdAt;
      if (orderDate < new Date(c.firstOrderAt).getTime()) c.firstOrderAt = order.createdAt;
    }

    // Calculate tag based on totalSpent + deliveredOrders
    const customers = Object.values(customerMap).map((c: any) => {
      let tag = "NEW";
      if (c.deliveredOrders >= 10 || c.totalSpent >= 5000) tag = "VIP";
      else if (c.deliveredOrders >= 3 || c.totalSpent >= 1000) tag = "REGULAR";
      
      // Days since last order
      const daysSinceLast = Math.floor((Date.now() - new Date(c.lastOrderAt).getTime()) / (1000 * 60 * 60 * 24));
      let status = "ACTIVE";
      if (daysSinceLast > 60) status = "INACTIVE";
      else if (daysSinceLast > 30) status = "DORMANT";

      return { ...c, tag, status, daysSinceLast };
    });

    // Sort by totalSpent desc
    customers.sort((a: any, b: any) => b.totalSpent - a.totalSpent);

    // Summary
    const summary = {
      totalCustomers: customers.length,
      vipCount: customers.filter((c: any) => c.tag === "VIP").length,
      regularCount: customers.filter((c: any) => c.tag === "REGULAR").length,
      newCount: customers.filter((c: any) => c.tag === "NEW").length,
      totalRevenue: customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0),
      totalDue: customers.reduce((sum: number, c: any) => sum + c.totalDue, 0),
    };

    return NextResponse.json({ customers, summary }, { status: 200 });
  } catch (error) {
    console.error("Customers error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

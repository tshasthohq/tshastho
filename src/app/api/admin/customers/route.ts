import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // All orders across all pharmacies
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        patientId: true,
        pharmacyId: true,
        totalAmount: true,
        finalAmount: true,
        platformFee: true,
        netProfit: true,
        paidAmount: true,
        dueAmount: true,
        status: true,
        createdAt: true,
        patient: { select: { id: true, name: true, phone: true, email: true } },
        pharmacy: { select: { id: true, shopName: true, city: true } },
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
          totalPlatformEarned: 0,
          pharmacies: new Set(),
          firstOrderAt: order.createdAt,
          lastOrderAt: order.createdAt,
        };
      }
      const c = customerMap[pid];
      c.totalOrders++;
      c.pharmacies.add(order.pharmacy?.shopName);
      if (order.status === "DELIVERED") {
        c.deliveredOrders++;
        c.totalSpent += parseFloat(order.finalAmount.toString());
        c.totalPaid += parseFloat(order.paidAmount.toString());
        c.totalDue += parseFloat(order.dueAmount.toString());
        c.totalPlatformEarned += parseFloat(order.platformFee.toString());
      }
      const orderDate = new Date(order.createdAt).getTime();
      if (orderDate > new Date(c.lastOrderAt).getTime()) c.lastOrderAt = order.createdAt;
      if (orderDate < new Date(c.firstOrderAt).getTime()) c.firstOrderAt = order.createdAt;
    }

    const customers = Object.values(customerMap).map((c: any) => {
      let tag = "NEW";
      if (c.deliveredOrders >= 10 || c.totalSpent >= 5000) tag = "VIP";
      else if (c.deliveredOrders >= 3 || c.totalSpent >= 1000) tag = "REGULAR";

      const daysSinceLast = Math.floor((Date.now() - new Date(c.lastOrderAt).getTime()) / (1000 * 60 * 60 * 24));
      let status = "ACTIVE";
      if (daysSinceLast > 60) status = "INACTIVE";
      else if (daysSinceLast > 30) status = "DORMANT";

      return { 
        ...c, 
        tag, 
        status, 
        daysSinceLast,
        pharmacyCount: c.pharmacies.size,
        pharmaciesList: Array.from(c.pharmacies),
      };
    });

    customers.sort((a: any, b: any) => b.totalSpent - a.totalSpent);

    const summary = {
      totalCustomers: customers.length,
      vipCount: customers.filter((c: any) => c.tag === "VIP").length,
      regularCount: customers.filter((c: any) => c.tag === "REGULAR").length,
      newCount: customers.filter((c: any) => c.tag === "NEW").length,
      totalRevenue: customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0),
      totalDue: customers.reduce((sum: number, c: any) => sum + c.totalDue, 0),
      totalPlatformEarned: customers.reduce((sum: number, c: any) => sum + c.totalPlatformEarned, 0),
    };

    return NextResponse.json({ customers, summary }, { status: 200 });
  } catch (error) {
    console.error("Admin customers error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

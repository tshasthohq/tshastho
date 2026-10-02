import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacyId: string | null = null;
    if (user.parentPharmacyId) {
      pharmacyId = user.parentPharmacyId;
    } else {
      const ownPharmacy = await prisma.pharmacy.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (ownPharmacy) pharmacyId = ownPharmacy.id;
    }

    if (!pharmacyId) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const orders = await prisma.order.findMany({
      where: { pharmacyId },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        totalCost: true,
        netProfit: true,
        status: true,
        createdAt: true,
        patientId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const patientIds = Array.from(new Set(orders.map(o => o.patientId)));
    const patients = await prisma.user.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, name: true, phone: true },
    });

    const patientMap: any = {};
    for (const p of patients) patientMap[p.id] = p;

    const itemCounts = await prisma.orderItem.groupBy({
      by: ["orderId"],
      where: { orderId: { in: orders.map(o => o.id) } },
      _count: { id: true },
    });
    const countMap: any = {};
    for (const ic of itemCounts) countMap[ic.orderId] = ic._count.id;

    const result = orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      totalCost: o.totalCost,
      netProfit: o.netProfit,
      status: o.status,
      createdAt: o.createdAt,
      patient: patientMap[o.patientId] || { name: "Unknown", phone: "" },
      itemCount: countMap[o.id] || 0,
    }));

    return NextResponse.json({ orders: result }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

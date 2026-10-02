import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const pendingCount = await prisma.order.count({
      where: { pharmacyId: pharmacy.id, status: "PENDING" },
    });

    const totalCount = await prisma.order.count({
      where: { pharmacyId: pharmacy.id },
    });

    const medicineCount = await prisma.medicine.count({
      where: { pharmacyId: pharmacy.id },
    });

    const revenueData = await prisma.order.aggregate({
      where: { pharmacyId: pharmacy.id, status: "DELIVERED" },
      _sum: { finalAmount: true },
    });

    return NextResponse.json({
      pending: pendingCount,
      total: totalCount,
      medicines: medicineCount,
      revenue: revenueData._sum.finalAmount || 0,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

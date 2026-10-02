import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    }
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    }
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const dues = await prisma.due.findMany({
      where: { pharmacyId: pharmacy.id },
      orderBy: { createdAt: "desc" },
    });

    const totalUnpaid = dues
      .filter(d => d.status !== "PAID")
      .reduce((sum, d) => sum + parseFloat(d.amount.toString()) - parseFloat(d.paidAmount.toString()), 0);

    return NextResponse.json({ dues, totalUnpaid }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

export async function POST_PAYMENT(req: Request) {
  return NextResponse.json({ message: "Use /api/pharmacy/dues/pay" }, { status: 400 });
}

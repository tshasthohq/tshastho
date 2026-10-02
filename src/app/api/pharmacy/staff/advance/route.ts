import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, staffId, amount, reason, action } = await req.json();
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

    if (action === "list") {
      const advances = await prisma.staffAdvance.findMany({
        where: { pharmacyId: pharmacy.id },
        orderBy: { createdAt: "desc" },
        include: { staff: { select: { name: true, staffRole: true } } },
      });
      return NextResponse.json({ advances }, { status: 200 });
    }

    // Create new advance
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const advance = await prisma.staffAdvance.create({
      data: {
        staffId,
        pharmacyId: pharmacy.id,
        amount: amountNum,
        paidAmount: 0,
        remainingAmount: amountNum,
        reason: reason || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Advance added ✅", advance }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

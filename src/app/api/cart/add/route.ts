import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, medicineId, quantity, unitType } = await req.json();

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const existing = await prisma.cartItem.findFirst({
      where: { userId: user.id, medicineId, unitType: unitType || "piece" },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (quantity || 1) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: user.id,
          medicineId,
          quantity: quantity || 1,
          unitType: unitType || "piece",
        },
      });
    }

    return NextResponse.json({ message: "Added to cart ✅" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

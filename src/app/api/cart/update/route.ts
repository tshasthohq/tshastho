import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { cartItemId, quantity, unitType } = await req.json();

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
      return NextResponse.json({ message: "Removed" }, { status: 200 });
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity, unitType: unitType || "piece" },
    });

    return NextResponse.json({ message: "Updated" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

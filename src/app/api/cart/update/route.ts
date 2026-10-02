import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

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

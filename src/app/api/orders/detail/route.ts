import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { orderId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pharmacy: true,
        patient: { select: { name: true, phone: true, email: true } },
        items: true,
      },
    });

    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { orderId, email } = await req.json();

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pharmacy: true,
        items: true,
      },
    });

    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
    if (order.patientId !== user.id) return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

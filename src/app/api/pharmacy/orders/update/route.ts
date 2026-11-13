import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { orderId, status, reason } = await req.json();
    if (!orderId || !status) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        notes: reason ? `Rejected: ${reason}` : undefined
      }
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}

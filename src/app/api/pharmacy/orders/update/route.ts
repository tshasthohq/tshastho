import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { orderId, status, reason } = await req.json();

    // Check: if status ACCEPTED but prescription not verified
    if (status === "ACCEPTED") {
      const existing = await prisma.order.findUnique({ where: { id: orderId } });
      if (existing && existing.prescriptionUrl && existing.prescriptionStatus !== "VERIFIED") {
        return NextResponse.json(
          { message: "❌ Please verify the prescription first before accepting this order." },
          { status: 400 }
        );
      }
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });

    const titles: any = {
      ACCEPTED: "✅ Order Accepted!",
      REJECTED: "❌ Order Rejected",
      OUT_FOR_DELIVERY: "🚚 Order on the way!",
      DELIVERED: "🎉 Order Delivered!",
      CANCELLED: "⚠️ Order Cancelled",
    };

    const messages: any = {
      ACCEPTED: `Your order ${order.orderNumber} has been accepted and is being prepared.`,
      REJECTED: `Your order ${order.orderNumber} was rejected. ${reason ? "Reason: " + reason : ""}`,
      OUT_FOR_DELIVERY: `Your order ${order.orderNumber} is on the way!`,
      DELIVERED: `Your order ${order.orderNumber} has been delivered. Thank you!`,
      CANCELLED: `Your order ${order.orderNumber} has been cancelled.`,
    };

    await prisma.notification.create({
      data: {
        userId: order.patientId,
        title: titles[status] || "Order Update",
        message: messages[status] || `Your order status is now ${status}`,
        type: status.toLowerCase(),
        link: "/dashboard/orders",
      },
    });

    // Deduct stock when DELIVERED - with strip/box multiplier
    if (status === "DELIVERED") {
      for (const item of order.items) {
        const med = await prisma.medicine.findUnique({ where: { id: item.medicineId } });
        if (med) {
          let multiplier = 1;
          if (item.unitType === "strip") multiplier = med.stripSize || 10;
          if (item.unitType === "box") multiplier = med.boxSize || 100;

          const deduct = item.quantity * multiplier;
          await prisma.medicine.update({
            where: { id: item.medicineId },
            data: { stock: Math.max(0, med.stock - deduct) },
          });
        }
      }
    }

    // If delivered and was due, keep Due record active (user will pay separately)
    // If CANCELLED or REJECTED and was due, remove the due
    if ((status === "CANCELLED" || status === "REJECTED") && order.isDue) {
      await prisma.due.deleteMany({ where: { orderId: order.id } });
    }

    return NextResponse.json({ message: "Updated", order }, { status: 200 });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

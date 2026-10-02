import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { orderId, status, note } = await req.json();

    // status: "VERIFIED" or "REJECTED"
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        prescriptionStatus: status,
        prescriptionNote: note || null,
      },
    });

    // Notification
    const titles: any = {
      VERIFIED: "✅ Prescription Verified!",
      REJECTED: "❌ Prescription Rejected",
    };
    const messages: any = {
      VERIFIED: `Your prescription for order ${order.orderNumber} has been verified. Your order will now be processed.`,
      REJECTED: `Your prescription for order ${order.orderNumber} was rejected. ${note ? "Reason: " + note : "Please upload a valid prescription."}`,
    };

    await prisma.notification.create({
      data: {
        userId: order.patientId,
        title: titles[status] || "Prescription Update",
        message: messages[status] || "Your prescription status has been updated.",
        type: status === "VERIFIED" ? "confirmed" : "rejected",
        link: `/dashboard/orders/${order.id}`,
      },
    });

    return NextResponse.json({ message: "Updated ✅", order }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

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

    try {
        const st = String(status).toUpperCase();
        const map: Record<string, { title: string; msg: string; type: string }> = {
          CONFIRMED: { title: "Order Confirmed", msg: "Your order has been confirmed by the pharmacy.", type: "confirmed" },
          ACCEPTED: { title: "Order Accepted", msg: "Your order has been accepted by the pharmacy.", type: "accepted" },
          PROCESSING: { title: "Order Processing", msg: "Your order is being prepared.", type: "pending" },
          OUT_FOR_DELIVERY: { title: "Out for Delivery", msg: "Your order is on the way.", type: "out_for_delivery" },
          DELIVERED: { title: "Order Delivered", msg: "Your order has been delivered. Thank you!", type: "delivered" },
          COMPLETED: { title: "Order Completed", msg: "Your order is complete.", type: "completed" },
          REJECTED: { title: "Order Rejected", msg: `Your order was rejected.${reason ? " Reason: " + reason : ""}`, type: "rejected" },
          CANCELLED: { title: "Order Cancelled", msg: `Your order was cancelled.${reason ? " Reason: " + reason : ""}`, type: "rejected" },
        };
        const n = map[st];
        if (n && order.patientId) {
          await prisma.notification.create({ data: {
            userId: order.patientId,
            title: n.title,
            message: `${order.orderNumber}: ${n.msg}`,
            type: n.type,
            link: "/dashboard/orders",
          } });
        }
      } catch (e) { console.error("[ORDER_STATUS_NOTIFY]", e); }

      return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}

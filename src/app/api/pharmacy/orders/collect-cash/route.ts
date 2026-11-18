import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { orderId, amount } = await req.json();
    if (!orderId || !amount) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    const newPaidAmount = Number(order.paidAmount) + Number(amount);
    const newDueAmount = Math.max(0, Number(order.finalAmount) - newPaidAmount);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        isPaid: newDueAmount === 0
      }
    });

    // যদি Due টেবিলে এন্ট্রি থাকে, তবে সেটাও আপডেট করা (ঐচ্ছিক)
    await prisma.due.updateMany({
      where: { orderId },
      data: { paidAmount: newPaidAmount, amount: newDueAmount, status: newDueAmount === 0 ? "PAID" : "PARTIAL" }
    });

    // COLLECT_CASH_NOTIFY
      try {
        if (order.patientId) {
          const paid = Number(amount);
          await prisma.notification.create({ data: {
            userId: order.patientId,
            title: newDueAmount === 0 ? 'Payment Completed' : 'Payment Received',
            message: newDueAmount === 0
              ? `${order.orderNumber}: ৳${paid.toFixed(2)} received. Your due is fully paid. Thank you!`
              : `${order.orderNumber}: ৳${paid.toFixed(2)} received. Remaining due ৳${newDueAmount.toFixed(2)}.`,
            type: newDueAmount === 0 ? 'completed' : 'confirmed',
            link: '/dashboard/orders',
          } });
        }
      } catch (e) { console.error('[COLLECT_CASH_NOTIFY]', e); }

      return NextResponse.json({ success: true, message: "Cash collected successfully!" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to collect cash" }, { status: 500 });
  }
}

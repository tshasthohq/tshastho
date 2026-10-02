import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { dueId, amount } = await req.json();

    const due = await prisma.due.findUnique({ where: { id: dueId } });
    if (!due) return NextResponse.json({ message: "Due not found" }, { status: 404 });

    const newPaid = parseFloat(due.paidAmount.toString()) + parseFloat(amount);
    const totalAmount = parseFloat(due.amount.toString());

    const updated = await prisma.due.update({
      where: { id: dueId },
      data: {
        paidAmount: newPaid,
        status: newPaid >= totalAmount ? "PAID" : "PARTIAL",
      },
    });

    return NextResponse.json({ message: "Payment recorded ✅", due: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

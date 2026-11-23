import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";

const schema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "BKASH", "NAGAD", "CARD", "BANK", "OTHER"]).default("CASH"),
  reference: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Amount thik din" }, { status: 400 });
  const d = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const o = await tx.diagnosticOrder.findFirst({ where: { id, diagnosticId: c.diagnostic.id } });
      if (!o) throw new Error("NOT_FOUND");
      if (o.status === "CANCELLED") throw new Error("CANCELLED");
      const due = Number(o.due);
      if (d.amount > due) throw new Error("TOO_MUCH");
      const paid = Number(o.paid) + d.amount;
      const newDue = Number(o.total) - paid;
      await tx.diagnosticOrderPayment.create({
        data: { orderId: id, amount: d.amount, method: d.method, reference: d.reference || null, receivedById: c.user.id },
      });
      await tx.diagnosticOrder.update({
        where: { id },
        data: { paid, due: newDue, payStatus: newDue === 0 ? "PAID" : "PARTIAL" },
      });
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const map: Record<string, string> = {
      NOT_FOUND: "Order paoa jayni",
      CANCELLED: "Cancelled order-e payment hobe na",
      TOO_MUCH: "Amount due er beshi hote pare na",
    };
    if (map[e?.message]) return NextResponse.json({ message: map[e.message] }, { status: 400 });
    console.error("Pay error:", e);
    return NextResponse.json({ message: "Payment save hoyni" }, { status: 500 });
  }
}

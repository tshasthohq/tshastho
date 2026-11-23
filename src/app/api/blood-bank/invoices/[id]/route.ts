import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBankContext } from "@/lib/blood-bank";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { id } = await params;
  try {
    const inv = await prisma.bloodInvoice.findFirst({
      where: { id, bloodBankId: ctx.bankId },
      select: {
        invoiceNumber: true, createdAt: true, recipientName: true, recipientPhone: true, hospital: true,
        subtotal: true, discount: true, total: true, paid: true, status: true, paymentMethod: true, note: true,
        items: { select: { name: true, quantity: true, unitPrice: true, amount: true } },
        issue: { select: { bag: { select: { bagNumber: true, bloodGroup: true, component: true } } } },
        bloodBank: { select: { name: true, address: true, district: true, phone: true, dghsLicense: true } },
      },
    });
    if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const n = (v: any) => Number(v);
    return NextResponse.json({
      invoice: {
        ...inv,
        subtotal: n(inv.subtotal), discount: n(inv.discount), total: n(inv.total), paid: n(inv.paid),
        items: inv.items.map((i) => ({ ...i, unitPrice: n(i.unitPrice), amount: n(i.amount) })),
      },
    });
  } catch (e) {
    console.error("[BLOOD_INVOICE_GET]", e);
    return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
  }
}

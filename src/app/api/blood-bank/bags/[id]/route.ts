import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clean, parseGroup, BD_PHONE } from "@/lib/blood";
import { getBankContext, logAction, checkCompatibility, NEEDS_CROSSMATCH, CROSSMATCH_VALID_HOURS } from "@/lib/blood-bank";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId, userId } = ctx;
  const { id } = await params;

  try {
    const b = await req.json();
    const bag = await prisma.bloodBag.findFirst({
      where: { id, bloodBankId: bankId },
      select: { id: true, bagNumber: true, status: true, testsClear: true, expiresAt: true, bloodGroup: true, component: true },
    });
    if (!bag) return NextResponse.json({ error: "Bag not found" }, { status: 404 });

    if (b.action === "tests_clear") {
      return NextResponse.json({ error: "Record the screening test results instead" }, { status: 400 });
    }

    if (b.action === "discard") {
      const reason = clean(b.reason, 200);
      if (reason.length < 3) return NextResponse.json({ error: "Please enter a reason" }, { status: 400 });
      if (bag.status === "ISSUED" || bag.status === "DISCARDED")
        return NextResponse.json({ error: "This bag cannot be discarded" }, { status: 409 });
      await prisma.bloodBag.update({ where: { id }, data: { status: "DISCARDED", discardReason: reason } });
      await logAction(bankId, userId, "BAG_DISCARDED", `${bag.bagNumber}: ${reason}`);
      return NextResponse.json({ success: true });
    }

    if (b.action === "issue") {
      const recipientName = clean(b.recipientName);
      if (recipientName.length < 2) return NextResponse.json({ error: "Recipient name is required" }, { status: 400 });
      const recipientGroup = parseGroup(b.recipientGroup);
      if (!recipientGroup) return NextResponse.json({ error: "Select the recipient's blood group" }, { status: 400 });
      const recipientPhone = clean(b.recipientPhone, 20).replace(/[\s-]/g, "");
      if (recipientPhone && !BD_PHONE.test(recipientPhone))
        return NextResponse.json({ error: "Invalid recipient phone number" }, { status: 400 });

      if (bag.status !== "AVAILABLE") return NextResponse.json({ error: "This bag is not available" }, { status: 409 });
      if (!bag.testsClear) return NextResponse.json({ error: "Screening tests are not complete for this bag" }, { status: 409 });
      if (bag.expiresAt <= new Date()) return NextResponse.json({ error: "This bag has expired" }, { status: 409 });

      const compat = checkCompatibility(bag.component, bag.bloodGroup, recipientGroup);
      if (compat.level === "block")
        return NextResponse.json({ error: `Blood group mismatch: ${compat.reason}` }, { status: 409 });
      if (compat.level === "warn" && b.confirmWarning !== true)
        return NextResponse.json({ error: compat.reason, needsConfirm: true }, { status: 409 });

      if (NEEDS_CROSSMATCH.includes(bag.component)) {
        const since = new Date(Date.now() - CROSSMATCH_VALID_HOURS * 3600000);
        const matches = await prisma.bloodCrossmatch.findMany({
          where: { bagId: id, type: "MAJOR", result: "COMPATIBLE", doneAt: { gt: since } },
          select: { patientName: true, patientGroup: true },
        });
        const ok = matches.some(
          (c) => c.patientGroup === recipientGroup && c.patientName.trim().toLowerCase() === recipientName.trim().toLowerCase()
        );
        if (!ok)
          return NextResponse.json(
            { error: `A compatible major crossmatch for this patient is required (valid for ${CROSSMATCH_VALID_HOURS} hours)` },
            { status: 409 }
          );
      }

      const picks: any[] = Array.isArray(b.services) ? b.services.slice(0, 20) : [];
      const dbItems = picks.length
        ? await prisma.bloodServiceItem.findMany({
            where: { id: { in: picks.map((p) => String(p.id)) }, bloodBankId: bankId, isActive: true },
          })
        : [];
      const lines: { name: string; quantity: number; unitPrice: number; amount: number }[] = [];
      for (const p of picks) {
        const it = dbItems.find((i) => i.id === String(p.id));
        if (!it) continue;
        const quantity = Math.min(20, Math.max(1, Math.floor(Number(p.quantity)) || 1));
        const unitPrice = Number(it.price);
        lines.push({ name: it.name, quantity, unitPrice, amount: unitPrice * quantity });
      }
      const subtotal = lines.reduce((a, l) => a + l.amount, 0);
      const discount = Math.min(subtotal, Math.max(0, Number(b.discount) || 0));
      const total = subtotal - discount;
      const paid = Math.min(total, Math.max(0, Number(b.paid) || 0));
      const status: "PAID" | "PARTIAL" | "UNPAID" = total === 0 || paid >= total ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

      let invoiceId = "";
      await prisma.$transaction(async (tx) => {
        const r = await tx.bloodBag.updateMany({
          where: { id, bloodBankId: bankId, status: "AVAILABLE", testsClear: true, expiresAt: { gt: new Date() } },
          data: { status: "ISSUED" },
        });
        if (r.count !== 1) throw new Error("NOT_ISSUABLE");

        const issue = await tx.bloodIssue.create({
          data: {
            bloodBankId: bankId, bagId: id, recipientName,
            recipientPhone: recipientPhone || null,
            hospital: clean(b.hospital, 160) || null,
            serviceCharge: total, issuedById: userId,
            note: clean(b.note, 300) || null,
          },
        });

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const count = await tx.bloodInvoice.count({ where: { bloodBankId: bankId, createdAt: { gte: start } } });
        const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const inv = await tx.bloodInvoice.create({
          data: {
            bloodBankId: bankId, invoiceNumber: `BB-${day}-${String(count + 1).padStart(4, "0")}`,
            issueId: issue.id, recipientName, recipientPhone: recipientPhone || null,
            hospital: clean(b.hospital, 160) || null,
            subtotal, discount, total, paid, status,
            paymentMethod: clean(b.paymentMethod, 30) || null,
            note: clean(b.note, 300) || null, createdById: userId,
            items: { create: lines },
          },
          select: { id: true },
        });
        invoiceId = inv.id;
      });

      await logAction(bankId, userId, "BAG_ISSUED", `${bag.bagNumber} to ${recipientName}`);
      return NextResponse.json({ success: true, invoiceId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Please try again" }, { status: 409 });
    if (e?.message === "NOT_ISSUABLE") return NextResponse.json({ error: "This bag is no longer available" }, { status: 409 });
    console.error("[BLOOD_BAG_PATCH]", e);
    return NextResponse.json({ error: "Failed to update bag" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBankContext, expireOldBags, DAY } from "@/lib/blood-bank";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId } = ctx;

  try {
    await expireOldBags(bankId);
    const soon = new Date(Date.now() + 3 * DAY);
    const [rows, expiringSoon, pendingTests, expired] = await Promise.all([
      prisma.bloodBag.groupBy({
        by: ["bloodGroup", "component"],
        where: { bloodBankId: bankId, status: "AVAILABLE", testsClear: true },
        _count: { _all: true },
      }),
      prisma.bloodBag.count({ where: { bloodBankId: bankId, status: "AVAILABLE", expiresAt: { lte: soon } } }),
      prisma.bloodBag.count({ where: { bloodBankId: bankId, status: "AVAILABLE", testsClear: false } }),
      prisma.bloodBag.count({ where: { bloodBankId: bankId, status: "EXPIRED" } }),
    ]);

    const stock = rows.map((r) => ({ bloodGroup: r.bloodGroup, component: r.component, count: r._count._all }));
    return NextResponse.json({ stock, expiringSoon, pendingTests, expired });
  } catch (e) {
    console.error("[BLOOD_BANK_STOCK]", e);
    return NextResponse.json({ error: "Failed to load stock" }, { status: 500 });
  }
}

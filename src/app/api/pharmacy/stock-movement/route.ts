import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { getDhakaDateRanges } from "@/lib/date-utils";
import { getPharmacyId } from "@/lib/pharmacy-scope";

export const dynamic = "force-dynamic";

const sumQty = (rows: any[]) =>
  rows.reduce((a, r) => a + (r.items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0), 0), 0);

async function safe(label: string, fn: () => Promise<any[]>) {
  try {
    return await fn();
  } catch (e) {
    console.error(`[stock-movement] ${label} failed:`, (e as Error).message);
    return [];
  }
}

export async function GET(req: Request) {
  const auth = await requireRole(["PHARMACY_OWNER", "PHARMACY_STAFF", "SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const period = searchParams.get("period") || "today";
    const startDate = searchParams.get("startDate") || null;
    const endDate = searchParams.get("endDate") || null;

    const pharmacyId = await getPharmacyId(auth.user.id, auth.user.parentPharmacyId);
    if (!pharmacyId) return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });

    const r: any = getDhakaDateRanges(period, startDate, endDate);
    let gte: Date | undefined;
    let lt: Date | undefined;
    if (period === "today") gte = r.todayStart;
    else if (period === "yesterday") { gte = r.yesterdayStart; lt = r.yesterdayEnd; }
    else if (period === "week") gte = r.weekStart;
    else if (period === "month") gte = r.monthStart;
    else if (period === "year") gte = r.yearStart;
    else if (period === "custom" && r.customStart && r.customEnd) { gte = r.customStart; lt = r.customEnd; }

    const createdAt = gte || lt ? { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) } : undefined;
    const branch = branchId && branchId !== "ALL" ? branchId : null;

    const base: any = { pharmacyId, ...(createdAt ? { createdAt } : {}), ...(branch ? { branchId: branch } : {}) };
    const tBase: any = { pharmacyId, ...(createdAt ? { createdAt } : {}) };
    const itemsQty = { items: { select: { quantity: true } } };

    const [posRows, orderRows, poRows, returnRows, outRows, inRows] = await Promise.all([
      prisma.posSale.findMany({ where: base, select: itemsQty }),
      prisma.order.findMany({ where: { ...base, status: { not: "CANCELLED" } }, select: itemsQty }),
      safe("purchaseOrder items", () => (prisma as any).purchaseOrder.findMany({ where: base, select: itemsQty })),
      safe("returnOrder items", () => (prisma as any).returnOrder.findMany({ where: { ...base, status: "PROCESSED" }, select: itemsQty })),
      branch
        ? safe("transfer out", () => (prisma as any).branchTransfer.findMany({ where: { ...tBase, fromBranchId: branch }, select: itemsQty }))
        : Promise.resolve([]),
      branch
        ? safe("transfer in", () => (prisma as any).branchTransfer.findMany({ where: { ...tBase, toBranchId: branch }, select: itemsQty }))
        : Promise.resolve([]),
    ]);

    const breakdown = {
      sales: sumQty(posRows) + sumQty(orderRows),
      transferOut: sumQty(outRows),
      purchases: sumQty(poRows),
      returns: sumQty(returnRows),
      transferIn: sumQty(inRows),
    };

    return NextResponse.json({
      success: true,
      stockIn: breakdown.purchases + breakdown.returns + breakdown.transferIn,
      stockOut: breakdown.sales + breakdown.transferOut,
      breakdown,
    });
  } catch (error) {
    console.error("Stock Movement Error:", error);
    return NextResponse.json({ error: "Failed to load movements" }, { status: 500 });
  }
}

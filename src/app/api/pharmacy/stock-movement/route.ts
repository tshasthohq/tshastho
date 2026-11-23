import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { getDhakaDateRanges } from "@/lib/date-utils";
import { getPharmacyId } from "@/lib/pharmacy-scope";

export const dynamic = "force-dynamic";

const db: any = prisma;

const sumQty = (rows: any[]) =>
  rows.reduce((a, r) => a + (r.items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0), 0), 0);

const sumReceived = (rows: any[]) =>
  rows.reduce((a, po) => a + (po.items || []).reduce((s: number, i: any) => {
    const got = Number(i.receivedQty || 0);
    return s + (got > 0 ? got : po.status === "RECEIVED" ? Number(i.quantity || 0) : 0);
  }, 0), 0);

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
    const itemsQty = { items: { select: { quantity: true } } };
    const poWhere: any = {
      pharmacyId,
      ...(branch ? { branchId: branch } : {}),
      status: { in: ["RECEIVED", "PARTIAL"] },
      ...(createdAt ? { OR: [{ receivedDate: createdAt }, { receivedDate: null, createdAt }] } : {}),
    };
    const ledgerWhere: any = { pharmacyId, ...(createdAt ? { createdAt } : {}) };

    const [posRows, orderRows, ledgerIn, ledgerOut, poRows, loggedRefs] = await Promise.all([
      prisma.posSale.findMany({ where: base, select: itemsQty }),
      prisma.order.findMany({ where: { ...base, status: { not: "CANCELLED" } }, select: itemsQty }),
      safe("ledger in", () => db.stockMovement.groupBy({ by: ["type"], where: { ...ledgerWhere, quantity: { gt: 0 } }, _sum: { quantity: true } })),
      safe("ledger out", () => db.stockMovement.groupBy({ by: ["type"], where: { ...ledgerWhere, quantity: { lt: 0 } }, _sum: { quantity: true } })),
      safe("received POs", () => db.purchaseOrder.findMany({ where: poWhere, select: { id: true, status: true, items: { select: { quantity: true, receivedQty: true } } } })),
      safe("ledger PO refs", () => db.stockMovement.findMany({ where: { ...ledgerWhere, type: "PURCHASE", referenceId: { not: null } }, select: { referenceId: true } })),
    ]);

    // POs already recorded in the ledger must not be counted twice
    const poIds = poRows.map((p: any) => p.id);
    const logged = loggedRefs;
    const loggedSet = new Set(logged.map((l: any) => l.referenceId));
    const unloggedPurchases = sumReceived(poRows.filter((p: any) => !loggedSet.has(p.id)));

    const skip = (t: string) => !branch && (t === "TRANSFER_IN" || t === "TRANSFER_OUT");
    const inBy: Record<string, number> = {};
    const outBy: Record<string, number> = {};
    for (const row of ledgerIn) if (!skip(row.type)) inBy[row.type] = (inBy[row.type] || 0) + Number(row._sum?.quantity || 0);
    for (const row of ledgerOut) if (!skip(row.type)) outBy[row.type] = (outBy[row.type] || 0) + Math.abs(Number(row._sum?.quantity || 0));

    const sales = sumQty(posRows) + sumQty(orderRows);
    const stockIn = Object.values(inBy).reduce((a, b) => a + b, 0) + unloggedPurchases;
    const stockOut = sales + Object.entries(outBy).filter(([t]) => t !== "SALE").reduce((a, [, v]) => a + v, 0);

    return NextResponse.json({
      success: true,
      stockIn,
      stockOut,
      breakdown: { sales, unloggedPurchases, in: inBy, out: outBy },
    });
  } catch (error) {
    console.error("Stock Movement Error:", error);
    return NextResponse.json({ error: "Failed to load movements" }, { status: 500 });
  }
}

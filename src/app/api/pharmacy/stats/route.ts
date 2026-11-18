import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { getDhakaDateRanges } from "@/lib/date-utils";
import { getPharmacyId } from "@/lib/pharmacy-scope";

export const dynamic = "force-dynamic";

const cache = new Map<string, { at: number; data: any }>();
const TTL_MS = 15000;
const num = (v: any) => Math.round(Number(v ?? 0) * 100) / 100;

function run(build: (pv: (v: any) => string) => string) {
  const params: any[] = [];
  const pv = (v: any) => {
    let i = params.indexOf(v);
    if (i === -1) { params.push(v); i = params.length - 1; }
    return `$${i + 1}`;
  };
  const sql = build(pv);
  return prisma.$queryRawUnsafe<any[]>(sql, ...params);
}

export async function GET(req: Request) {
  const auth = await requireRole(["PHARMACY_OWNER", "PHARMACY_STAFF", "SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const startDate = searchParams.get("startDate") || null;
    const endDate = searchParams.get("endDate") || null;

    const pharmacyId = await getPharmacyId(auth.user.id, auth.user.parentPharmacyId);
    if (!pharmacyId) return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });

    const branch = branchId && branchId !== "ALL" ? branchId : null;
    const key = `${pharmacyId}|${branch}|${startDate}|${endDate}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return NextResponse.json(hit.data);

    const hasCustom = !!(startDate && endDate);
    const r: any = getDhakaDateRanges(hasCustom ? "custom" : "today", startDate, endDate);

    const periods: Record<string, [Date | null, Date | null]> = {
      today: [r.todayStart, null],
      yesterday: [r.yesterdayStart, r.yesterdayEnd ?? r.todayStart],
      week: [r.weekStart, null],
      month: [r.monthStart, null],
      year: [r.yearStart, null],
      total: [null, null],
    };
    if (hasCustom && r.customStart && r.customEnd) periods.custom = [r.customStart, r.customEnd];

    const cols = (pv: (v: any) => string, money: string, profit: string, cust: string, fee: string) =>
      Object.entries(periods)
        .map(([k, [gte, lt]]) => {
          let c = "TRUE";
          if (gte) c += ` AND "createdAt" >= ${pv(gte)}`;
          if (lt) c += ` AND "createdAt" ${k === "custom" ? "<=" : "<"} ${pv(lt)}`;
          return `COALESCE(SUM(${money}) FILTER (WHERE ${c}), 0) AS "${k}_rev",
            COALESCE(SUM(${profit}) FILTER (WHERE ${c}), 0) AS "${k}_profit",
            COALESCE(SUM(${fee}) FILTER (WHERE ${c}), 0) AS "${k}_fee",
            COUNT(*) FILTER (WHERE ${c}) AS "${k}_cnt",
            COUNT(DISTINCT ${cust}) FILTER (WHERE ${c}) AS "${k}_cust"`;
        })
        .join(",\n");

    const now = new Date();
    const soon = new Date(now.getTime() + 90 * 86400000);

    const [posRows, orderRows, medRows] = await Promise.all([
      run((pv) => `SELECT ${cols(pv, '"totalAmount"', '"profit"', '"customerId"', "0")},
          COALESCE(SUM("dueAmount"), 0) AS "due"
        FROM "PosSale"
        WHERE "pharmacyId" = ${pv(pharmacyId)}${branch ? ` AND "branchId" = ${pv(branch)}` : ""}`),
      run((pv) => `SELECT ${cols(pv, '"finalAmount"', '"netProfit"', '"patientId"', '"platformFee"')},
          COUNT(*) FILTER (WHERE "status" = 'PENDING') AS "pending",
          COALESCE(SUM("dueAmount"), 0) AS "due"
        FROM "Order"
        WHERE "pharmacyId" = ${pv(pharmacyId)} AND "status" <> 'CANCELLED'${branch ? ` AND "branchId" = ${pv(branch)}` : ""}`),
      run((pv) => `SELECT COUNT(*) AS "cnt",
          COALESCE(SUM("stock" * "sellingPrice"), 0) AS "stockValue",
          COALESCE(SUM("stock" * "purchasePrice"), 0) AS "stockCost",
          COUNT(*) FILTER (WHERE "expiryDate" < ${pv(now)}) AS "expired",
          COUNT(*) FILTER (WHERE "expiryDate" >= ${pv(now)} AND "expiryDate" < ${pv(soon)}) AS "soon",
          COUNT(*) FILTER (WHERE "stock" <= 10) AS "low"
        FROM "Medicine" WHERE "pharmacyId" = ${pv(pharmacyId)}`),
    ]);

    const pos = posRows[0] || {};
    const ord = orderRows[0] || {};
    const med = medRows[0] || {};
    const n = (v: any) => Number(v ?? 0);

    const shape = (k: string) => {
      const revenue = num(n(pos[`${k}_rev`]) + n(ord[`${k}_rev`]));
      const netProfit = num(n(pos[`${k}_profit`]) + n(ord[`${k}_profit`]));
      return {
        revenue,
        cost: num(revenue - netProfit),
        platformFee: num(n(ord[`${k}_fee`])),
        netProfit,
        orderCount: n(pos[`${k}_cnt`]) + n(ord[`${k}_cnt`]),
        customerCount: n(pos[`${k}_cust`]) + n(ord[`${k}_cust`]),
      };
    };

    const data: any = {};
    for (const k of Object.keys(periods)) data[k] = shape(k);
    Object.assign(data, {
      totalDue: num(n(pos.due) + n(ord.due)),
      pendingOrders: n(ord.pending),
      medicineCount: n(med.cnt),
      stockValue: num(med.stockValue),
      stockCost: num(med.stockCost),
      expired: n(med.expired),
      expiringSoon: n(med.soon),
      lowStock: n(med.low),
    });

    cache.set(key, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getDhakaDateRanges } from "@/lib/date-utils";
import { getPharmacyId } from "@/lib/pharmacy-scope";

export const dynamic = "force-dynamic";

const DAY = 86400000;
const dhakaStr = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export async function GET(req: Request) {
  const auth = await requireRole(["PHARMACY_OWNER", "PHARMACY_STAFF", "SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const branchId = url.searchParams.get("branchId");
    const period = url.searchParams.get("period") || "week";
    const sd = url.searchParams.get("startDate") || null;
    const ed = url.searchParams.get("endDate") || null;

    const pharmacyId = await getPharmacyId(auth.user.id, auth.user.parentPharmacyId);
    if (!pharmacyId) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const ranges: any = getDhakaDateRanges(period, sd, ed);
    const tomorrow = new Date(ranges.todayStart.getTime() + DAY);

    let queryStart: Date = ranges.weekStart;
    let queryEnd: Date = tomorrow;
    if (period === "today") queryStart = ranges.todayStart;
    else if (period === "yesterday") { queryStart = ranges.yesterdayStart; queryEnd = ranges.yesterdayEnd; }
    else if (period === "month") queryStart = ranges.monthStart;
    else if (period === "year") queryStart = ranges.yearStart;
    else if (period === "total") queryStart = new Date(0);
    else if (period === "custom" && ranges.customStart && ranges.customEnd) { queryStart = ranges.customStart; queryEnd = ranges.customEnd; }

    // fetch enough data so Week/Month cards are always correct, whatever tab is selected
    const fetchStart = new Date(Math.min(queryStart.getTime(), ranges.weekStart.getTime(), ranges.monthStart.getTime()));
    const fetchEnd = new Date(Math.max(queryEnd.getTime(), tomorrow.getTime()));

    const branchFilter = branchId && branchId !== "ALL" ? { branchId } : {};
    const where = { pharmacyId, createdAt: { gte: fetchStart, lt: fetchEnd }, ...branchFilter };
    const rangeWhere = { pharmacyId, createdAt: { gte: queryStart, lt: queryEnd }, ...branchFilter };

    const [pos, ord, topPos, topOrd] = await Promise.all([
      prisma.posSale.findMany({ where, select: { createdAt: true, totalAmount: true } }),
      prisma.order.findMany({ where: { ...where, status: { not: "CANCELLED" } }, select: { createdAt: true, finalAmount: true } }),
      prisma.posSale.findMany({ where: rangeWhere, orderBy: { createdAt: "desc" }, take: 300, select: { items: { select: { medicineName: true, quantity: true } } } }),
      prisma.order.findMany({ where: { ...rangeWhere, status: { not: "CANCELLED" } }, orderBy: { createdAt: "desc" }, take: 300, select: { items: { select: { medicineName: true, quantity: true } } } }),
    ]);

    const rows = [
      ...pos.map((s: any) => ({ t: new Date(s.createdAt).getTime(), a: Number(s.totalAmount || 0) })),
      ...ord.map((o: any) => ({ t: new Date(o.createdAt).getTime(), a: Number(o.finalAmount || 0) })),
    ];

    let todaySales = 0, weekSales = 0, monthSales = 0, totalOrders = 0;
    let minT = Infinity;
    const byDay = new Map<string, number>();

    for (const row of rows) {
      if (row.t >= ranges.todayStart.getTime()) todaySales += row.a;
      if (row.t >= ranges.weekStart.getTime()) weekSales += row.a;
      if (row.t >= ranges.monthStart.getTime()) monthSales += row.a;
      if (row.t >= queryStart.getTime() && row.t < queryEnd.getTime()) {
        totalOrders++;
        const k = dhakaStr(new Date(row.t));
        byDay.set(k, (byDay.get(k) || 0) + row.a);
        if (row.t < minT) minT = row.t;
      }
    }

    let chartStart: Date = queryStart;
    if (period === "total") {
      chartStart = Number.isFinite(minT) ? new Date(`${dhakaStr(new Date(minT))}T00:00:00+06:00`) : ranges.todayStart;
    }

    const days = Math.max(1, Math.ceil((queryEnd.getTime() - chartStart.getTime()) / DAY));
    const step = days > 90 ? Math.ceil(days / 30) : 1;

    const dailySales: { date: string; sales: number }[] = [];
    for (let i = 0; i < days; i += step) {
      let sum = 0;
      let label = "";
      for (let j = 0; j < step && i + j < days; j++) {
        const k = dhakaStr(new Date(chartStart.getTime() + (i + j) * DAY));
        if (j === 0) label = k;
        sum += byDay.get(k) || 0;
      }
      dailySales.push({ date: label, sales: Math.round(sum * 100) / 100 });
    }

    const topMap = new Map<string, number>();
    for (const s of [...topPos, ...topOrd] as any[]) {
      for (const i of s.items) topMap.set(i.medicineName, (topMap.get(i.medicineName) || 0) + Number(i.quantity || 0));
    }
    const topMedicines = Array.from(topMap.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return NextResponse.json(
      { summary: { todaySales, weekSales, monthSales, totalOrders }, dailySales, topMedicines },
      { status: 200 }
    );
  } catch (error) {
    console.error("Charts API error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

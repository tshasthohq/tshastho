import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBankContext, expireOldBags } from "@/lib/blood-bank";

export const dynamic = "force-dynamic";
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HOUR = 3600000;
const n = (v: any) => Number(v ?? 0);

export async function GET(req: Request) {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId } = ctx;

  const sp = new URL(req.url).searchParams;
  const dhakaToday = new Date(Date.now() + 6 * HOUR).toISOString().slice(0, 10);
  const from = ISO.test(sp.get("from") || "") ? sp.get("from")! : dhakaToday;
  const to = ISO.test(sp.get("to") || "") ? sp.get("to")! : dhakaToday;
  const start = new Date(`${from}T00:00:00.000+06:00`);
  const end = new Date(`${to}T23:59:59.999+06:00`);
  if (isNaN(+start) || isNaN(+end) || +end < +start || +end - +start > 366 * 24 * HOUR)
    return NextResponse.json({ error: "Choose a valid date range (up to one year)" }, { status: 400 });

  try {
    await expireOldBags(bankId);
    const inRange = { gte: start, lte: end };

    const [collected, issuedCount, issues, wasted, invAgg, invoices, dueAgg, stockRows] = await Promise.all([
      prisma.bloodBag.count({ where: { bloodBankId: bankId, createdAt: inRange } }),
      prisma.bloodIssue.count({ where: { bloodBankId: bankId, issuedAt: inRange } }),
      prisma.bloodIssue.findMany({
        where: { bloodBankId: bankId, issuedAt: inRange },
        select: {
          issuedAt: true, recipientName: true, hospital: true,
          bag: { select: { bagNumber: true, bloodGroup: true, component: true } },
          invoice: { select: { id: true, invoiceNumber: true, total: true, paid: true, status: true } },
        },
        orderBy: { issuedAt: "desc" },
        take: 500,
      }),
      prisma.bloodBag.findMany({
        where: { bloodBankId: bankId, status: { in: ["EXPIRED", "DISCARDED"] }, updatedAt: inRange },
        select: { status: true, discardReason: true },
        take: 1000,
      }),
      prisma.bloodInvoice.aggregate({
        where: { bloodBankId: bankId, createdAt: inRange },
        _sum: { total: true, paid: true, discount: true },
        _count: { _all: true },
      }),
      prisma.bloodInvoice.findMany({
        where: { bloodBankId: bankId, createdAt: inRange },
        select: { createdAt: true, total: true, paid: true },
        take: 5000,
      }),
      prisma.bloodInvoice.aggregate({
        where: { bloodBankId: bankId, status: { in: ["UNPAID", "PARTIAL"] } },
        _sum: { total: true, paid: true },
        _count: { _all: true },
      }),
      prisma.bloodBag.groupBy({
        by: ["bloodGroup", "component"],
        where: { bloodBankId: bankId, status: "AVAILABLE", testsClear: true },
        _count: { _all: true },
      }),
    ]);

    const daily = new Map<string, { billed: number; paid: number }>();
    for (const i of invoices) {
      const key = new Date(+i.createdAt + 6 * HOUR).toISOString().slice(0, 10);
      const d = daily.get(key) || { billed: 0, paid: 0 };
      d.billed += n(i.total);
      d.paid += n(i.paid);
      daily.set(key, d);
    }

    const reasons = new Map<string, number>();
    let expired = 0, discarded = 0, reactive = 0;
    for (const w of wasted) {
      if (w.status === "EXPIRED") { expired++; reasons.set("Expired", (reasons.get("Expired") || 0) + 1); continue; }
      discarded++;
      const r = (w.discardReason || "No reason").startsWith("Reactive") ? "Reactive screening result" : (w.discardReason || "No reason");
      if (r.startsWith("Reactive")) reactive++;
      reasons.set(r, (reasons.get(r) || 0) + 1);
    }

    return NextResponse.json({
      range: { from, to },
      summary: {
        collected, issued: issuedCount, expired, discarded, reactive,
        invoiceCount: invAgg._count._all,
        invoiced: n(invAgg._sum.total), paid: n(invAgg._sum.paid), discount: n(invAgg._sum.discount),
        dueOutstanding: n(dueAgg._sum.total) - n(dueAgg._sum.paid), dueCount: dueAgg._count._all,
      },
      stock: stockRows.map((r) => ({ bloodGroup: r.bloodGroup, component: r.component, count: r._count._all })),
      daily: [...daily.entries()].sort(([a], [b]) => (a < b ? 1 : -1)).map(([date, v]) => ({ date, ...v })),
      wasteReasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([reason, count]) => ({ reason, count })),
      issues: issues.map((i) => ({
        issuedAt: i.issuedAt, recipientName: i.recipientName, hospital: i.hospital, bag: i.bag,
        invoice: i.invoice ? { ...i.invoice, total: n(i.invoice.total), paid: n(i.invoice.paid) } : null,
      })),
    });
  } catch (e) {
    console.error("[BLOOD_BANK_REPORTS]", e);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}

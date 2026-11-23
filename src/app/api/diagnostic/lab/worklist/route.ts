import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";

const STATUSES = ["PENDING", "SAMPLE_COLLECTED", "RESULT_ENTERED", "VERIFIED", "APPROVED"];

export async function GET(req: Request) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const diagnosticId = c.diagnostic.id;
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") || "PENDING";
  const q = (sp.get("q") || "").trim();
  if (!STATUSES.includes(status)) return NextResponse.json({ message: "Invalid status" }, { status: 400 });

  const orderWhere: any = { diagnosticId, status: { not: "CANCELLED" } };
  if (q) {
    orderWhere.OR = [
      { orderNo: { contains: q, mode: "insensitive" } },
      { patient: { name: { contains: q, mode: "insensitive" } } },
      { patient: { phone: { contains: q } } },
    ];
  }

  const [items, grouped] = await Promise.all([
    prisma.diagnosticOrderItem.findMany({
      where: { status: status as any, order: orderWhere },
      orderBy: { promisedAt: "asc" },
      take: 200,
      include: {
        order: {
          select: {
            id: true, orderNo: true, createdAt: true,
            patient: { select: { name: true, patientNo: true, age: true, ageUnit: true, gender: true } },
          },
        },
        test: {
          select: { sampleType: true, fastingRequired: true, resultTemplate: true, department: { select: { name: true } } },
        },
      },
    }),
    prisma.diagnosticOrderItem.groupBy({
      by: ["status"],
      where: { order: { diagnosticId, status: { not: "CANCELLED" } } },
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const g of grouped) counts[g.status] = g._count._all;
  return NextResponse.json({ success: true, items, counts });
}

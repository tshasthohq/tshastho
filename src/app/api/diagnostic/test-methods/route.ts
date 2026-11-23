import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";

export async function GET() {
  const c: any = await diagCtx(false);
  if (c.error) return c.error;
  const tests = await (prisma as any).diagnosticTest.findMany({
    where: { diagnosticId: c.diagnostic.id, isActive: true, resultTemplate: { not: null } },
    select: { id: true, code: true, name: true, method: true },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ success: true, tests });
}

export async function PATCH(req: Request) {
  const c: any = await diagCtx(true);
  if (c.error) return c.error;
  const body: any = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ success: false, message: "id lagbe" }, { status: 400 });
  const method = String(body.method ?? "").trim().slice(0, 300) || null;
  const r = await (prisma as any).diagnosticTest.updateMany({ where: { id: body.id, diagnosticId: c.diagnostic.id }, data: { method } });
  return NextResponse.json({ success: r.count > 0 });
}

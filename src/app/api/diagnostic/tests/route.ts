import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { testSchema } from "@/lib/diagnostic/testSchema";

export async function GET(req: Request) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const departmentId = searchParams.get("departmentId") || undefined;

  const tests = await prisma.diagnosticTest.findMany({
    where: {
      diagnosticId: c.diagnostic.id,
      ...(departmentId ? { departmentId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { department: { select: { id: true, name: true } } },
    orderBy: [{ department: { sortOrder: "asc" } }, { name: "asc" }],
  });
  return NextResponse.json({ success: true, tests });
}

export async function POST(req: Request) {
  const c = await diagCtx(true);
  if (c.error) return c.error;

  const parsed = testSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Code, name ar price thik moto din" }, { status: 400 });
  }
  const d = parsed.data;
  if ((d.commissionType ?? "PERCENT") === "PERCENT" && (d.commissionValue ?? 0) > 100) {
    return NextResponse.json({ message: "Commission % 100 er beshi hote pare na" }, { status: 400 });
  }
  if (d.departmentId) {
    const dep = await prisma.diagnosticDepartment.findFirst({
      where: { id: d.departmentId, diagnosticId: c.diagnostic.id },
    });
    if (!dep) return NextResponse.json({ message: "Invalid department" }, { status: 400 });
  }

  try {
    const test = await prisma.diagnosticTest.create({
      data: {
        diagnosticId: c.diagnostic.id,
        code: d.code.trim().toUpperCase(),
        name: d.name.trim(),
        shortName: d.shortName || null,
        departmentId: d.departmentId || null,
        sampleType: d.sampleType || null,
        price: d.price,
        costPrice: d.costPrice ?? 0,
        reportingHours: d.reportingHours ?? 24,
        fastingRequired: d.fastingRequired ?? false,
        instructions: d.instructions || null,
        commissionType: d.commissionType ?? "PERCENT",
        commissionValue: d.commissionValue ?? 0,
        homeCollection: d.homeCollection ?? true,
        isActive: d.isActive ?? true,
      },
    });
    return NextResponse.json({ success: true, test }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ message: "Ei code ta already ache" }, { status: 409 });
    }
    console.error("Create test error:", e);
    return NextResponse.json({ message: "Failed to create test" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { testSchema } from "@/lib/diagnostic/testSchema";
import { diffFields, writeAudit } from "@/lib/diagnostic/audit";

const nul = (v: string | null | undefined) => (v === undefined ? undefined : v || null);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await diagCtx(true);
  if (c.error) return c.error;
  const { id } = await params;

  const existing = await prisma.diagnosticTest.findFirst({
    where: { id, diagnosticId: c.diagnostic.id },
  });
  if (!existing) return NextResponse.json({ message: "Test not found" }, { status: 404 });

  const parsed = testSchema.partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Invalid data" }, { status: 400 });
  const d = parsed.data;

  const type = d.commissionType ?? existing.commissionType;
  const val = d.commissionValue ?? Number(existing.commissionValue);
  if (type === "PERCENT" && val > 100) {
    return NextResponse.json({ message: "Commission % 100 er beshi hote pare na" }, { status: 400 });
  }
  if (d.departmentId) {
    const dep = await prisma.diagnosticDepartment.findFirst({
      where: { id: d.departmentId, diagnosticId: c.diagnostic.id },
    });
    if (!dep) return NextResponse.json({ message: "Invalid department" }, { status: 400 });
  }

  try {
    const test = await prisma.diagnosticTest.update({
      where: { id },
      data: {
        code: d.code ? d.code.trim().toUpperCase() : undefined,
        name: d.name?.trim(),
        shortName: nul(d.shortName),
        departmentId: nul(d.departmentId),
        sampleType: nul(d.sampleType),
        price: d.price,
        costPrice: d.costPrice,
        reportingHours: d.reportingHours,
        fastingRequired: d.fastingRequired,
        instructions: nul(d.instructions),
        commissionType: d.commissionType,
        commissionValue: d.commissionValue,
        homeCollection: d.homeCollection,
        isActive: d.isActive,
      },
    });
    const changes = diffFields(existing, test, { code: "Code", name: "Name", price: "Price", costPrice: "Cost", commissionType: "Commission type", commissionValue: "Commission value", reportingHours: "Reporting hours", isActive: "Active", sampleType: "Sample", departmentId: "Department" });
    if (changes.length) await writeAudit(prisma, { diagnosticId: c.diagnostic.id, entity: "TEST", entityId: id, entityLabel: test.code + " " + test.name, action: "UPDATE", changes, user: c.user });
    return NextResponse.json({ success: true, test });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ message: "Ei code ta already ache" }, { status: 409 });
    }
    console.error("Update test error:", e);
    return NextResponse.json({ message: "Failed to update test" }, { status: 500 });
  }
}

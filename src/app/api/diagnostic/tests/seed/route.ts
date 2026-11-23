import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { CATALOG } from "@/lib/diagnostic/catalog";

export async function POST() {
  const c = await diagCtx(true);
  if (c.error) return c.error;
  const diagnosticId = c.diagnostic.id;

  const existing = await prisma.diagnosticDepartment.findMany({ where: { diagnosticId } });
  const have = new Set(existing.map((d) => d.name));
  let order = existing.length;
  const missing = CATALOG.filter((s) => !have.has(s.dept));
  if (missing.length) {
    await prisma.diagnosticDepartment.createMany({
      data: missing.map((s) => ({ diagnosticId, name: s.dept, sortOrder: order++ })),
      skipDuplicates: true,
    });
  }
  const deps = await prisma.diagnosticDepartment.findMany({ where: { diagnosticId } });
  const depMap = new Map(deps.map((d) => [d.name, d.id]));

  const data = CATALOG.flatMap((sec) =>
    sec.tests.map((line) => {
      const [code, name, sample, fast] = line.split("|");
      const s = sample !== undefined ? sample : sec.sample;
      return {
        diagnosticId,
        code,
        name,
        departmentId: depMap.get(sec.dept) ?? null,
        sampleType: !s || s === "-" || s === "N/A" ? null : s,
        fastingRequired: fast === "F",
        price: 0,
        isActive: false,
      };
    })
  );

  const result = await prisma.diagnosticTest.createMany({ data, skipDuplicates: true });
  return NextResponse.json({ success: true, added: result.count, total: data.length });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";

export async function GET() {
  const c = await diagCtx();
  if (c.error) return c.error;
  const departments = await prisma.diagnosticDepartment.findMany({
    where: { diagnosticId: c.diagnostic.id, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json({ success: true, departments });
}

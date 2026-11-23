import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { getDiagnosticFor } from "@/lib/diagnostic/context";

export async function GET() {
  const auth = await requireRole(["DIAGNOSTIC_OWNER", "DIAGNOSTIC_STAFF", "SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  const d = await getDiagnosticFor(auth.user!);
  if (!d) return NextResponse.json({ message: "Diagnostic center not found" }, { status: 404 });

  const c = await prisma.diagnostic.findUnique({
    where: { id: d.id },
    select: { _count: { select: { branches: true, staff: true, tests: true, packages: true } } },
  });
  return NextResponse.json({ success: true, diagnostic: d, counts: c?._count });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";

export async function GET(req: Request) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const sp = new URL(req.url).searchParams;
  const entity = sp.get("entity");
  const entityId = sp.get("entityId");
  const logs = await prisma.diagnosticAuditLog.findMany({
    where: {
      diagnosticId: c.diagnostic.id,
      ...(entity ? { entity } : {}),
      ...(entityId ? { entityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ success: true, logs });
}

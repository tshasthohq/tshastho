import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { writeAudit } from "@/lib/diagnostic/audit";

export async function GET() {
  const c = await diagCtx();
  if (c.error) return c.error;
  const d: any = c.diagnostic;
  return NextResponse.json({
    success: true,
    center: { id: d.id, name: d.centerName, address: d.address, city: d.city, phone: d.phone, logo: d.logo || null },
  });
}

const schema = z.object({
  logo: z.string().trim().max(600).nullable(),
  reason: z.string().optional(),
});

export async function PATCH(req: Request) {
  const c = await diagCtx(true);
  if (c.error) return c.error;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Invalid data" }, { status: 400 });
  const logo = parsed.data.logo || null;
  if (logo && !/^https?:\/\//i.test(logo)) return NextResponse.json({ message: "Invalid logo URL" }, { status: 400 });

  const before: any = c.diagnostic;
  await prisma.diagnostic.update({ where: { id: before.id }, data: { logo } as any });
  const label = (v: string | null) => (v ? "set" : null);
  if (label(before.logo || null) !== label(logo) || (before.logo || null) !== logo) {
    await writeAudit(prisma, {
      diagnosticId: before.id, entity: "CENTER", entityId: before.id, entityLabel: before.centerName,
      action: "UPDATE", reason: parsed.data.reason || null, user: c.user,
      changes: [{ field: "Center logo", from: before.logo ? "uploaded" : null, to: logo ? (before.logo ? "changed" : "uploaded") : "removed" }],
    });
  }
  return NextResponse.json({ success: true, logo });
}

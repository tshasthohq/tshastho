import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { diffFields, writeAudit } from "@/lib/diagnostic/audit";

const schema = z.object({
  name: z.string().trim().min(2).optional(),
  type: z.enum(["DOCTOR", "AGENT", "PC"]).optional(),
  phone: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  commissionMode: z.enum(["TEST_DEFAULT", "PERCENT", "FIXED"]).optional(),
  commissionValue: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  reason: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await diagCtx(true);
  if (c.error) return c.error;
  const { id } = await params;
  const existing = await prisma.diagnosticReferrer.findFirst({ where: { id, diagnosticId: c.diagnostic.id } });
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Invalid data" }, { status: 400 });
  const { reason, ...d } = parsed.data;

  const mode = d.commissionMode ?? existing.commissionMode;
  const val = d.commissionValue ?? Number(existing.commissionValue);
  if (mode === "PERCENT" && val > 100) {
    return NextResponse.json({ message: "Commission % 100 er beshi hote pare na" }, { status: 400 });
  }

  const nul = (v: string | null | undefined) => (v === undefined ? undefined : v || null);
  const updated = await prisma.diagnosticReferrer.update({
    where: { id },
    data: {
      name: d.name, type: d.type, phone: nul(d.phone), degree: nul(d.degree), specialty: nul(d.specialty),
      notes: nul(d.notes), commissionMode: d.commissionMode, commissionValue: d.commissionValue, isActive: d.isActive,
    },
  });

  const changes = diffFields(existing, updated, {
    name: "Name", type: "Type", phone: "Phone", degree: "Degree", specialty: "Specialty", notes: "Notes",
    commissionMode: "Commission rule", commissionValue: "Commission value", isActive: "Active",
  });
  if (changes.length) {
    await writeAudit(prisma, {
      diagnosticId: c.diagnostic.id, entity: "REFERRER", entityId: id,
      entityLabel: `${updated.type}: ${updated.name}`, action: "UPDATE", changes, reason: reason || null, user: c.user,
    });
  }
  return NextResponse.json({ success: true, referrer: updated });
}

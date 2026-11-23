import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { diffFields, writeAudit } from "@/lib/diagnostic/audit";

const schema = z.object({
  role: z.enum(["PATHOLOGIST", "TECHNOLOGIST"]).optional(),
  name: z.string().trim().min(2).optional(),
  degree: z.string().trim().max(200).nullable().optional(),
  designation: z.string().trim().max(200).nullable().optional(),
  regNo: z.string().trim().max(100).nullable().optional(),
  signatureUrl: z.string().trim().max(600).nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  reason: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await diagCtx(true);
  if (c.error) return c.error;
  const { id } = await params;
  const diagnosticId = c.diagnostic.id;
  const existing = await prisma.diagnosticSigner.findFirst({ where: { id, diagnosticId } });
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Invalid data" }, { status: 400 });
  const { reason, ...d } = parsed.data;
  const nul = (v: string | null | undefined) => (v === undefined ? undefined : v || null);

  const updated = await prisma.$transaction(async (tx) => {
    const role = d.role ?? existing.role;
    if (d.isDefault) await tx.diagnosticSigner.updateMany({ where: { diagnosticId, role, NOT: { id } }, data: { isDefault: false } });
    const u = await tx.diagnosticSigner.update({
      where: { id },
      data: {
        role: d.role, name: d.name, degree: nul(d.degree), designation: nul(d.designation), regNo: nul(d.regNo),
        signatureUrl: nul(d.signatureUrl), isDefault: d.isDefault, isActive: d.isActive,
      },
    });
    const changes = diffFields(existing, u, {
      role: "Role", name: "Name", degree: "Degree", designation: "Designation", regNo: "Reg No",
      signatureUrl: "Signature image", isDefault: "Default", isActive: "Active",
    });
    if (changes.length) {
      await writeAudit(tx, {
        diagnosticId, entity: "SIGNER", entityId: id, entityLabel: `${u.role}: ${u.name}`,
        action: "UPDATE", changes, reason: reason || null, user: c.user,
      });
    }
    return u;
  });
  return NextResponse.json({ success: true, signer: updated });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { writeAudit } from "@/lib/diagnostic/audit";

const schema = z.object({
  role: z.enum(["PATHOLOGIST", "TECHNOLOGIST"]),
  name: z.string().trim().min(2, "Naam din"),
  degree: z.string().trim().max(200).nullable().optional(),
  designation: z.string().trim().max(200).nullable().optional(),
  regNo: z.string().trim().max(100).nullable().optional(),
  signatureUrl: z.string().trim().max(600).nullable().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(req: Request) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const all = new URL(req.url).searchParams.get("all") === "1" && c.user.role === "DIAGNOSTIC_OWNER";
  const signers = await prisma.diagnosticSigner.findMany({
    where: { diagnosticId: c.diagnostic.id, ...(all ? {} : { isActive: true }) },
    orderBy: [{ role: "asc" }, { isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ success: true, signers });
}

export async function POST(req: Request) {
  const c = await diagCtx(true);
  if (c.error) return c.error;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  const d = parsed.data;
  const diagnosticId = c.diagnostic.id;
  const signer = await prisma.$transaction(async (tx) => {
    if (d.isDefault) await tx.diagnosticSigner.updateMany({ where: { diagnosticId, role: d.role }, data: { isDefault: false } });
    const s = await tx.diagnosticSigner.create({
      data: {
        diagnosticId, role: d.role, name: d.name, degree: d.degree || null, designation: d.designation || null,
        regNo: d.regNo || null, signatureUrl: d.signatureUrl || null, isDefault: !!d.isDefault,
      },
    });
    await writeAudit(tx, { diagnosticId, entity: "SIGNER", entityId: s.id, entityLabel: `${d.role}: ${d.name}`, action: "CREATE", user: c.user });
    return s;
  });
  return NextResponse.json({ success: true, signer }, { status: 201 });
}

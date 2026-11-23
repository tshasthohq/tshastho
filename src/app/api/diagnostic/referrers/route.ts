import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { writeAudit } from "@/lib/diagnostic/audit";

const schema = z.object({
  name: z.string().trim().min(2),
  type: z.enum(["DOCTOR", "AGENT", "PC"]).default("DOCTOR"),
  phone: z.string().optional(),
  degree: z.string().optional(),
  specialty: z.string().optional(),
  notes: z.string().optional(),
  commissionMode: z.enum(["TEST_DEFAULT", "PERCENT", "FIXED"]).default("TEST_DEFAULT"),
  commissionValue: z.coerce.number().min(0).default(0),
});

export async function GET(req: Request) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const all = new URL(req.url).searchParams.get("all") === "1";
  const isOwner = c.user.role === "DIAGNOSTIC_OWNER";
  const rows = await prisma.diagnosticReferrer.findMany({
    where: { diagnosticId: c.diagnostic.id, ...(all ? {} : { isActive: true }) },
    orderBy: { name: "asc" },
  });
  const referrers = rows.map((r) =>
    isOwner ? r : { ...r, commissionMode: undefined, commissionValue: undefined, notes: undefined }
  );
  return NextResponse.json({ success: true, referrers });
}

export async function POST(req: Request) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Naam din (min 2 okkhor)" }, { status: 400 });
  const d = parsed.data;
  const isOwner = c.user.role === "DIAGNOSTIC_OWNER";
  if (isOwner && d.commissionMode === "PERCENT" && d.commissionValue > 100) {
    return NextResponse.json({ message: "Commission % 100 er beshi hote pare na" }, { status: 400 });
  }
  const referrer = await prisma.diagnosticReferrer.create({
    data: {
      diagnosticId: c.diagnostic.id,
      name: d.name,
      type: d.type,
      phone: d.phone || null,
      degree: d.degree || null,
      specialty: d.specialty || null,
      notes: isOwner ? d.notes || null : null,
      commissionMode: isOwner ? d.commissionMode : "TEST_DEFAULT",
      commissionValue: isOwner ? d.commissionValue : 0,
    },
  });
  await writeAudit(prisma, {
    diagnosticId: c.diagnostic.id, entity: "REFERRER", entityId: referrer.id,
    entityLabel: `${d.type}: ${d.name}`, action: "CREATE", user: c.user,
  });
  return NextResponse.json({ success: true, referrer }, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";

export async function GET(req: Request) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ success: true, patients: [] });

  const patients = await prisma.diagnosticPatient.findMany({
    where: {
      diagnosticId: c.diagnostic.id,
      OR: [
        { phone: { contains: q } },
        { name: { contains: q, mode: "insensitive" } },
        { patientNo: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ success: true, patients });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
const PAGE = 30;

export async function GET(req: Request) {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status") || "open";
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const where =
      status === "open" ? { status: { in: ["OPEN", "MATCHED"] as ("OPEN" | "MATCHED")[] } } : {};

    const [requests, total] = await Promise.all([
      prisma.bloodRequest.findMany({
        where,
        select: {
          id: true, bloodGroup: true, units: true, hospital: true, district: true,
          urgency: true, status: true, contactPhone: true, note: true, createdAt: true,
          requester: { select: { name: true, phone: true } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE,
        take: PAGE,
      }),
      prisma.bloodRequest.count({ where }),
    ]);
    return NextResponse.json({ requests, total, pages: Math.ceil(total / PAGE) });
  } catch (e) {
    console.error("[ADMIN_BLOOD_REQ_GET]", e);
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }
}

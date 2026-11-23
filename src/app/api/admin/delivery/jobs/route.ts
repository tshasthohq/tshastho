import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ACTIVE_STATUSES, LATE_MINUTES } from "@/lib/delivery";

export const dynamic = "force-dynamic";
const db: any = prisma;

export async function GET(req: Request) {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mode = searchParams.get("mode") || "TSHASTHO";

  const where: any = {};
  if (mode !== "ALL") where.mode = mode;
  if (status === "ACTIVE") where.status = { in: ACTIVE_STATUSES };
  else if (status && status !== "ALL") where.status = status;

  const jobs = await db.deliveryJob.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { rider: { select: { id: true, name: true, phone: true } } },
  });

  const orders = await prisma.order.findMany({
    where: { id: { in: jobs.map((j: any) => j.orderId) } },
    select: {
      id: true,
      orderNumber: true,
      deliveryAddress: true,
      deliveryPhone: true,
      finalAmount: true,
      pharmacy: { select: { shopName: true, address: true, phone: true } },
    },
  });
  const byId = new Map<string, any>(orders.map((o: any) => [o.id, o] as [string, any]));
  const lateBefore = Date.now() - LATE_MINUTES * 60000;

  const rows = jobs.map((j: any) => ({
    ...j,
    order: byId.get(j.orderId) || null,
    isLate: ACTIVE_STATUSES.includes(j.status) && new Date(j.createdAt).getTime() < lateBefore,
  }));
  return NextResponse.json({ success: true, jobs: rows });
}

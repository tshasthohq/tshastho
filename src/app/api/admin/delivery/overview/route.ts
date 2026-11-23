import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { getDhakaDateRanges } from "@/lib/date-utils";
import { ACTIVE_STATUSES, LATE_MINUTES, getDeliverySettings } from "@/lib/delivery";

export const dynamic = "force-dynamic";
const db: any = prisma;

export async function GET() {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  const todayStart: Date = (getDhakaDateRanges("today", null, null) as any).todayStart;
  const lateBefore = new Date(Date.now() - LATE_MINUTES * 60000);
  const base = { mode: "TSHASTHO" };

  const [settings, active, today, late, ridersTotal, ridersOnline, cod] = await Promise.all([
    getDeliverySettings(),
    db.deliveryJob.groupBy({ by: ["status"], where: { ...base, status: { in: ACTIVE_STATUSES } }, _count: { _all: true } }),
    db.deliveryJob.findMany({
      where: { ...base, createdAt: { gte: todayStart } },
      select: { status: true, platformEarn: true, createdAt: true, deliveredAt: true },
    }),
    db.deliveryJob.count({ where: { ...base, status: { in: ACTIVE_STATUSES }, createdAt: { lt: lateBefore } } }),
    db.deliveryRider.count({ where: { ownerType: "TSHASTHO", isActive: true } }),
    db.deliveryRider.count({ where: { ownerType: "TSHASTHO", isActive: true, isOnline: true } }),
    db.deliveryJob.aggregate({ where: { ...base, status: "DELIVERED", codSettledAt: null }, _sum: { codCollected: true } }),
  ]);

  const by: Record<string, number> = {};
  for (const r of active) by[r.status] = r._count._all;

  let deliveredToday = 0, failedToday = 0, earnToday = 0, mins = 0;
  for (const j of today) {
    if (j.status === "DELIVERED") {
      deliveredToday++;
      earnToday += Number(j.platformEarn || 0);
      if (j.deliveredAt) mins += (new Date(j.deliveredAt).getTime() - new Date(j.createdAt).getTime()) / 60000;
    }
    if (j.status === "FAILED") failedToday++;
  }

  return NextResponse.json({
    success: true,
    settings,
    stats: {
      pending: by.PENDING || 0,
      assigned: by.ASSIGNED || 0,
      onRoad: (by.PICKED_UP || 0) + (by.ON_THE_WAY || 0),
      late,
      deliveredToday,
      failedToday,
      earnToday: Math.round(earnToday * 100) / 100,
      avgMinutes: deliveredToday ? Math.round(mins / deliveredToday) : 0,
      ridersTotal,
      ridersOnline,
      codHeld: Number(cod._sum.codCollected || 0),
    },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ACTIVE_STATUSES } from "@/lib/delivery";

export const dynamic = "force-dynamic";
const db: any = prisma;

export async function GET() {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  const riders = await db.deliveryRider.findMany({
    where: { ownerType: "TSHASTHO" },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  const busy = await db.deliveryJob.groupBy({
    by: ["riderId"],
    where: { riderId: { in: riders.map((r: any) => r.id) }, status: { in: ACTIVE_STATUSES } },
    _count: { _all: true },
  });
  const map = new Map<string, number>(busy.map((b: any) => [b.riderId, b._count._all] as [string, number]));
  return NextResponse.json({
    success: true,
    riders: riders.map((r: any) => ({ ...r, activeJobs: map.get(r.id) || 0 })),
  });
}

export async function POST(req: Request) {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  if (name.length < 2 || phone.length < 6) {
    return NextResponse.json({ message: "Name and a valid phone are required" }, { status: 400 });
  }
  const rider = await db.deliveryRider.create({
    data: {
      ownerType: "TSHASTHO",
      name,
      phone,
      vehicle: b.vehicle ? String(b.vehicle) : null,
      area: b.area ? String(b.area).trim() : null,
    },
  });
  return NextResponse.json({ success: true, rider });
}

export async function PATCH(req: Request) {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ message: "id is required" }, { status: 400 });

  const rider = await db.deliveryRider.findUnique({ where: { id: String(b.id) } });
  if (!rider || rider.ownerType !== "TSHASTHO") {
    return NextResponse.json({ message: "Rider not found" }, { status: 404 });
  }

  if (b.isActive === false) {
    const open = await db.deliveryJob.count({ where: { riderId: rider.id, status: { in: ACTIVE_STATUSES } } });
    if (open > 0) return NextResponse.json({ message: "Rider has active jobs" }, { status: 400 });
  }

  const data: any = {};
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;
  if (typeof b.isOnline === "boolean") data.isOnline = b.isOnline;
  for (const k of ["name", "phone", "vehicle", "area"]) {
    if (typeof b[k] === "string") data[k] = b[k].trim();
  }
  const updated = await db.deliveryRider.update({ where: { id: rider.id }, data });
  return NextResponse.json({ success: true, rider: updated });
}

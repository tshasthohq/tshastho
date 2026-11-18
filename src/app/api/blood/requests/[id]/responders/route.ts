import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      select: { requesterId: true },
    });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (request.requesterId !== user.id && user.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });

    const rows = await prisma.bloodRequestResponse.findMany({
      where: { requestId: id, status: { in: ["ACCEPTED", "DONATED"] } },
      select: {
        status: true, createdAt: true,
        donor: {
          select: {
            showPhone: true, verified: true, totalDonations: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const responders = rows.map((r) => ({
      name: r.donor.user?.name || "Donor",
      verified: r.donor.verified,
      totalDonations: r.donor.totalDonations,
      status: r.status,
      phone: r.donor.showPhone ? r.donor.user?.phone || null : null,
    }));
    return NextResponse.json({ responders });
  } catch (e) {
    console.error("[BLOOD_RESPONDERS]", e);
    return NextResponse.json({ error: "Failed to load responders" }, { status: 500 });
  }
}

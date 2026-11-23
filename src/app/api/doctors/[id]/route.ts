import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CACHE } from "@/lib/cache";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const doctor = await prisma.doctor.findFirst({
      where: {
        id,
        OR: [
          { user: { isActive: true, role: "DOCTOR" } },
          { claimStatus: { in: ["UNCLAIMED", "PENDING"] } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        specialties: true,
        qualifications: { orderBy: { year: "desc" } },
        experiences: { orderBy: { startYear: "desc" } },
        chambers: { where: { isActive: true }, orderBy: { isPrimary: "desc" } },
        awards: { orderBy: { year: "desc" } },
        memberships: true,
      },
    });
    if (!doctor) return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    const isClaimed = doctor.claimStatus === "CLAIMED" && !!doctor.userId;
    const out: any = { ...doctor, isClaimed, displayName: doctor.user?.name || doctor.fullName || "Doctor" };
    if (!isClaimed) {
      delete out.bookingPhone;
      delete out.userId;
    }
    return NextResponse.json({ success: true, doctor: out }, { headers: PUBLIC_CACHE });
  } catch (e) {
    console.error("[DOCTOR_GET]", e);
    return NextResponse.json({ success: false, error: "Failed to load doctor" }, { status: 500 });
  }
}
